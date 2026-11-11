import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Proef: elke ##-sectie van een les is een tabblad (plugins/les-tabs.js in
// shared, aangezet met `lesTabs: true`). De remark-stap zet <LesTabs> en
// <LesTab> in elke les; staan die niet in MDXComponents, dan faalt de build.
// De bron van een les verandert niet: de andere tests in deze map knippen
// hem nog steeds langs zijn ##-koppen.

const require = createRequire(import.meta.url);
const { tabLabel } = require('../../../../../packages/shared/plugins/les-tabs.js');

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');

const lessen = readdirSync(DOCS, { withFileTypes: true })
  .filter((map) => map.isDirectory())
  .flatMap((map) =>
    readdirSync(join(DOCS, map.name))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => ({
        naam: `${map.name}/${f}`,
        inhoud: readFileSync(join(DOCS, map.name, f), 'utf8'),
      })),
  );

/** De ##-koppen van een les, buiten codeblokken en de startcode. */
function koppen(inhoud: string): string[] {
  const zonderCode = inhoud.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, (m) => m);
  return [...zonderCode.matchAll(/^## (.+)$/gm)].map((m) => m[1].replace(/`/g, '').trim());
}

describe('les-tabbladen in de web-cursus', () => {
  it('staat aan, en de twee onderdelen zijn in elke les beschikbaar', () => {
    expect(readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8')).toMatch(/\blesTabs: true/);
    const mdx = readFileSync(join(SITE, 'src/theme/MDXComponents.tsx'), 'utf8');
    // De formatter zet een lange import over meer regels: de vorm doet er niet toe.
    expect(mdx).toMatch(/import LesTabs, \{[^}]*\} from '@coderius\/shared\/components\/LesTabs'/);
    // De remark-stap zet vijf onderdelen in een les; mist er een in
    // MDXComponents, dan faalt de build op de eerste les die hem gebruikt.
    for (const naam of ['LesTabs', 'LesTab', 'LesStappen', 'LesStap', 'LesLeerdoel'])
      expect(mdx).toMatch(new RegExp(`^\\s+${naam},$`, 'm'));
  });

  it('elke les heeft tabbladen, elk met een eigen label', () => {
    // Twee tabbladen met hetzelfde label zijn niet uit elkaar te houden:
    // "Opdracht 1: …" en "Opdracht 1: …" zouden allebei "Opdracht 1" heten.
    const fout: string[] = [];
    for (const les of lessen) {
      const labels = koppen(les.inhoud).map(tabLabel);
      if (labels.length < 2) fout.push(`${les.naam}: ${labels.length} tabblad`);
      const dubbel = labels.filter((l, i) => labels.indexOf(l) !== i);
      if (dubbel.length) fout.push(`${les.naam}: dubbel label ${dubbel.join(', ')}`);
      if (labels.includes('Uitleg')) fout.push(`${les.naam}: een kop Uitleg botst met het tabblad`);
    }
    expect(fout).toEqual([]);
  });

  it('de stappen in een tabblad hebben elk een eigen label, en geen heet De basis', () => {
    // De uitleg vóór de eerste ### wordt de stap "De basis"; een ### die zo
    // heet, gaf twee stappen met dezelfde naam.
    const fout: string[] = [];
    for (const les of lessen) {
      const zonderCode = les.inhoud.replace(/```[\s\S]*?```/g, '');
      for (const sectie of zonderCode.split(/^## /m).slice(1)) {
        const labels = [...sectie.matchAll(/^### (.+)$/gm)].map((m) =>
          tabLabel(m[1].replace(/`/g, '').trim()),
        );
        const dubbel = labels.filter((l, i) => labels.indexOf(l) !== i);
        const kop = sectie.split('\n')[0];
        if (dubbel.length) fout.push(`${les.naam}, ${kop}: dubbele stap ${dubbel.join(', ')}`);
        if (labels.includes('De basis')) fout.push(`${les.naam}, ${kop}: een ### De basis`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de docentenhandleiding gaat over de literatuur, en is verder kort', () => {
    // Wij gaan niet over hoe iemand lesgeeft. Wat een leerling of docent
    // nodig heeft om de lessen te gebruiken, staat in de lessen en het
    // oefenveld zelf. De handleiding laat zien waar de opbouw op steunt: de
    // onderdelen van een les, elk met zijn tip bij vakdidactiek en de paper.
    // Daarvóór was hij 185 regels, met een beschrijving van elke knop van
    // het veld, lesadvies en een tabel met alle 34 lessen.
    const mdx = readFileSync(join(SITE, 'src/theme/MDXComponents.tsx'), 'utf8');
    expect(mdx).toMatch(/^\s+Werkvormen,$/m);
    const handleiding = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    expect(handleiding).toMatch(/^<Werkvormen \/>$/m);
    expect(handleiding).toContain('site:didactiek/');
    expect(handleiding.split('\n').length).toBeLessThanOrEqual(50);
    expect(handleiding).not.toMatch(/^## .*(Klassikaal|Didactische aanpak|De editor)/m);
    // Het aantal lessen dat hij noemt, klopt.
    for (const map of ['html-css', 'js-basics']) {
      const aantal = lessen.filter((l) => l.naam.startsWith(`${map}/`)).length;
      expect(handleiding, map).toMatch(new RegExp(`\\b${aantal} over \\[`));
    }
  });

  it('geen les zet de tabbladen uit', () => {
    expect(lessen.filter((l) => /^les_tabs:\s*false/m.test(l.inhoud)).map((l) => l.naam)).toEqual(
      [],
    );
  });
});
