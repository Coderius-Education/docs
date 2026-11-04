import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Fouten zoeken heeft een index: "Waar staan de veelgemaakte fouten?". Daar
// ontbraken Deel 1, 3 en 6 van het bewegingsscript, en alles wat er later
// bijkwam (Groups, Power-up, heel hoofdstuk 10). Een leerling die daar zoekt,
// denkt dan dat er bij die les niets mis kan gaan. Elke les met een blok
// "Er gaat iets mis" staat in de index.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function lessen(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? lessen(join(map, e.name)) : /\.mdx?$/.test(e.name) ? [join(map, e.name)] : [],
  );
}

describe('de foutenindex in Fouten zoeken', () => {
  const index = readFileSync(join(DOCS, '05-bewegingsscript/fouten-zoeken.md'), 'utf8');
  const tabel = index.slice(index.indexOf('{#foutenindex}'));
  const gelinkt = new Set([...tabel.matchAll(/site:godot\/docs\/([\w-]+)/g)].map((m) => m[1]));

  it('noemt elke les met een blok Er gaat iets mis', () => {
    const mist: string[] = [];
    for (const pad of lessen(DOCS)) {
      const tekst = readFileSync(pad, 'utf8');
      if (!/^## Er gaat iets mis/m.test(tekst) || pad.endsWith('fouten-zoeken.md')) continue;
      const slug = tekst.match(/^slug:\s*\/?(\S+)/m)?.[1] ?? basename(pad).replace(/\.mdx?$/, '');
      if (!gelinkt.has(slug)) mist.push(slug);
    }
    expect(gelinkt.size).toBeGreaterThan(20);
    expect(mist).toEqual([]);
  });
});
