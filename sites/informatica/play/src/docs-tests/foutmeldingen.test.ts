import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De speeltuin draait Python 3.13 (Pyodide 0.29), dus een foutmelding in de
// lessen heeft de woorden van 3.13. Er gaat iets mis toonde bij een
// UnboundLocalError nog die van 3.10 en ouder ("local variable 'score'
// referenced before assignment"); wie de melding uit de speeltuin kopieerde
// en op die pagina zocht, vond hem niet. 4.5 en Veelgemaakte fouten hadden
// hem al goed.

const SITE = fileURLToPath(new URL('../..', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

const OUD: [RegExp, string][] = [
  [
    /referenced before assignment/,
    "cannot access local variable '…' where it is not associated with a value",
  ],
];

describe('foutmeldingen zoals Python 3.13 ze geeft', () => {
  it('geen melding in de woorden van een oudere Python', () => {
    const fout: string[] = [];
    for (const pad of [...bestanden(join(SITE, 'docs')), ...bestanden(join(SITE, 'src', 'pages'))])
      for (const [i, regel] of readFileSync(pad, 'utf8').split('\n').entries())
        for (const [oud, nieuw] of OUD)
          if (oud.test(regel))
            fout.push(`${pad.slice(SITE.length)}:${i + 1}: hoort te zijn ${nieuw}`);
    expect(fout).toEqual([]);
  });
});
