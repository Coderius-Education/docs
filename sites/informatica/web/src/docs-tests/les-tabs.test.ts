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
    expect(mdx).toMatch(
      /import LesTabs, \{ LesTab \} from '@coderius\/shared\/components\/LesTabs'/,
    );
    expect(mdx).toMatch(/^\s+LesTabs,$/m);
    expect(mdx).toMatch(/^\s+LesTab,$/m);
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

  it('geen les zet de tabbladen uit', () => {
    expect(lessen.filter((l) => /^les_tabs:\s*false/m.test(l.inhoud)).map((l) => l.naam)).toEqual(
      [],
    );
  });
});
