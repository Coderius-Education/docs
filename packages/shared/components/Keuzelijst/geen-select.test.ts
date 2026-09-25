import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De uitgeklapte lijst van een <select> tekent de browser zelf: systeemgrijs,
// niet op te maken, en in sommige browsers licht op een donkere pagina.
// Overal in de interface van de sites staat daarom <Keuzelijst>. Deze guard
// houdt <select> uit de componenten; lesinhoud (HTML die de leerling ziet of
// schrijft) staat in .md/.mdx en telt niet mee.

const ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  '.svelte-kit',
  'static',
  '__fixtures__',
  'docs',
]);

const UITZONDERINGEN: Record<string, string> = {
  // De Keuzelijst zelf noemt <select> in zijn uitleg.
  'packages/shared/components/Keuzelijst/index.tsx': 'uitleg',
  'packages/shared/components/Keuzelijst/logica.ts': 'uitleg',
  // De nagebouwde kwetsbare webapp van DVWA draait in een eigen iframe en
  // hoort er als een oude website uit te zien.
  'sites/dvwa/src/components/DvwaLab/modules/authorization_bypass.js': 'lab-inhoud',
  'sites/dvwa/src/components/DvwaLab/modules/file_upload.js': 'lab-inhoud',
  'sites/dvwa/src/components/DvwaLab/modules/sql_injection.js': 'lab-inhoud',
  'sites/dvwa/src/components/DvwaLab/modules/sql_injection_blind.js': 'lab-inhoud',
  'sites/dvwa/src/components/DvwaLab/modules/xss_dom.js': 'lab-inhoud',
  // De nakijker herkent <select> in het werk van de leerling.
  'sites/web/src/checker/curriculum.ts': 'herkenpatroon van de nakijker',
};

function bronbestanden(map: string, uit: string[] = []): string[] {
  for (const e of readdirSync(map, { withFileTypes: true })) {
    if (OVERSLAAN.has(e.name)) continue;
    const pad = join(map, e.name);
    if (e.isDirectory()) bronbestanden(pad, uit);
    else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) uit.push(pad);
  }
  return uit;
}

describe('geen <select> in de interface', () => {
  const bestanden = [
    ...bronbestanden(join(ROOT, 'packages')),
    ...bronbestanden(join(ROOT, 'sites')),
  ].map((pad) => relative(ROOT, pad).split('\\').join('/'));

  it('gebruikt overal <Keuzelijst>', () => {
    const vondsten = bestanden.filter(
      (rel) => !(rel in UITZONDERINGEN) && /<select\b/.test(readFileSync(join(ROOT, rel), 'utf8')),
    );

    expect(vondsten).toEqual([]);
  });

  it('elke uitzondering heeft er nog een nodig', () => {
    for (const rel of Object.keys(UITZONDERINGEN)) {
      expect(/<select\b/.test(readFileSync(join(ROOT, rel), 'utf8')), rel).toBe(true);
    }
  });
});
