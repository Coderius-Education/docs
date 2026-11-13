import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elke ##-sectie van een pagina een scherm. Deze cursus
// bestaat uit korte stappen: een pagina die in haar geheel op één scherm
// past, heeft daarom geen tabbladen (`lesTabs: { eenScherm: true }`), en
// Wat je nu ziet staat onder de stap waar het bij hoort. Bij het omzetten
// was een stap van tien regels drie schermen, en wezen vijf zinnen met
// "hierboven" naar een ander tabblad. Deze test leest elke pagina zoals de
// build hem in schermen verdeelt.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: string; tekst: string };
type Scherm = { tab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const bestanden = (map: string): string[] =>
  readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : /\.mdx?$/.test(f.name)
        ? [join(map, f.name)]
        : [],
  );
const paginas = bestanden(DOCS).map((pad) => ({
  naam: relative(DOCS, pad),
  bron: readFileSync(pad, 'utf8'),
}));
const parse = await mdxParser();
const schermen = (bron: string): Scherm[] =>
  schermenVan(bron, parse, { velden: ['GitSimulator'], eenScherm: true });
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';

describe('de schermen van de editor-cursus', () => {
  it('de cursus kiest voor één scherm waar een pagina past', () => {
    expect(readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8')).toMatch(
      /lesTabs: \{ eenScherm: true \}/,
    );
  });

  it('een deel van de pagina’s heeft tabbladen, een deel is één scherm', () => {
    const met = paginas.filter((p) => schermen(p.bron).length > 0);
    expect(paginas.length).toBeGreaterThan(70);
    expect(met.length).toBeGreaterThan(20);
    expect(met.length).toBeLessThan(paginas.length - 30);
  });

  it('een korte stap is één scherm, met Wat je nu ziet onder de tekst', () => {
    // Drie stappen van een paar regels: als ze weer tabbladen krijgen, is de
    // schatting in plugins/les-tabs.js (pastOpEenScherm) verschoven.
    for (const naam of [
      'git/vscode/stap-5-stagen.md',
      'git/vscode/stap-7-tweede-commit.md',
      'python/stap-1-projectmap.md',
    ]) {
      const pagina = paginas.find((p) => p.naam === naam);
      expect(pagina?.bron, naam).toMatch(/^## Wat je nu ziet$/m);
      expect(schermen(pagina?.bron ?? ''), naam).toEqual([]);
    }
  });

  it('waar je zoekt of iets opzoekt, zijn geen tabbladen', () => {
    // Zoeken met Ctrl+F vindt geen tekst in een tabblad dat dicht is.
    const naslag = paginas.filter((p) => /(^|\/)(problemen|welke-knop)\.md$/.test(p.naam));
    expect(naslag.length).toBe(11);
    for (const p of naslag) expect(p.bron, p.naam).toMatch(/^les_tabs: false$/m);
  });

  it('"hieronder" en "hierboven" wijzen naar iets in hetzelfde scherm', () => {
    const fout: string[] = [];
    for (const p of paginas) {
      for (const s of schermen(p.bron)) {
        s.blokken.forEach((b, i) => {
          if (b.soort !== 'tekst') return;
          if (
            /\b(hieronder|onderstaande?)\b/i.test(b.tekst) &&
            !s.blokken.slice(i + 1).some(isTeZien)
          )
            fout.push(`${p.naam} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
          if (
            /\b(hierboven|bovenstaande?)\b/i.test(b.tekst) &&
            !s.blokken.slice(0, i).some(isTeZien)
          )
            fout.push(`${p.naam} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
        });
      }
    }
    expect(fout).toEqual([]);
  });

  it('elke stap van Git basis heeft één simulator, en die past zich aan het scherm aan', () => {
    const stappen = paginas.filter((p) => /^git\/basis\/stap-\d/.test(p.naam));
    expect(stappen).toHaveLength(7);
    for (const p of stappen) expect(p.bron.match(/<GitSimulator /g) ?? [], p.naam).toHaveLength(1);
    // De uitvoer van de terminal krijgt de hoogte die op het scherm
    // overblijft; of de stap dan past, meet scripts/meet-les-tabs.mjs.
    const bron = readFileSync(join(SITE, 'src/components/GitSimulator/index.tsx'), 'utf8');
    expect(bron).toMatch(/pasHoogte\(/);
    // Een vaste hoogte, geen grootste: de stap is dan na het typen even
    // lang als bij het openen.
    expect(bron).toMatch(
      /style=\{maxUitvoer \? \{ height: `\$\{maxUitvoer\}px`, flex: 'none' \} : undefined\}/,
    );
  });

  it('de tabbladen van GitHub heten de tabbladen van GitHub', () => {
    // De les heeft nu zelf tabbladen: "ga naar het tabblad Code bovenaan"
    // wees daardoor naar twee dingen.
    const pr = paginas.filter((p) => p.naam.startsWith('git/pull-request/stap-'));
    for (const p of pr) {
      for (const regel of p.bron.split('\n').filter((r) => /\btabblad(en)?\b/.test(r)))
        expect(regel, p.naam).toMatch(/GitHub|github\.com|Pull requests|belangrijkste tabblad/);
    }
  });
});
