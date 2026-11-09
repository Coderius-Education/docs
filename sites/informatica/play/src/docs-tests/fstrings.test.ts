import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Tekst en een waarde gaan in play samen in een f-string, net als in de
// python-cursus en robotica. Tot november 2026 deden 66 regels het anders,
// met "Score: " + str(score) of "Welkom, " + naam, en maar één (in 4.4) met
// een f-string. Een leerling zag dan twee manieren en wist niet welke de
// cursus wil, en de leerdoelen noemen de f-string. Een losse str(score), die
// alleen een getal als tekst toont, mag wel.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const UITLEG = '/docs/tekst/04a-f-strings';

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

/** Elk stuk Python op een pagina, met wat er tussen het vorige stuk en dit staat. */
function blokken(tekst: string): { code: string; ervoor: string }[] {
  const uit: { code: string; ervoor: string; index: number }[] = [];
  for (const m of tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g))
    uit.push({ code: m[1], ervoor: '', index: m.index ?? 0 });
  for (const m of tekst.matchAll(/code=\{`([\s\S]*?)`\}/g))
    uit.push({ code: m[1], ervoor: '', index: m.index ?? 0 });
  uit.sort((a, b) => a.index - b.index);
  return uit.map((b, i) => ({
    code: b.code,
    ervoor: tekst.slice(i === 0 ? 0 : uit[i - 1].index, b.index),
  }));
}

/** Code zonder de inhoud van strings, zodat een + in een tekst niet telt. */
const zonderStrings = (code: string) =>
  code.replace(/[fFrRbB]?(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');

const PAGINAS = [...bestanden(join(SITE, 'docs')), ...bestanden(join(SITE, 'src', 'pages'))].filter(
  (p) => !p.includes('voor-de-docent'),
);

describe('f-strings in play', () => {
  it('tekst en een waarde gaan samen in een f-string, niet met +', () => {
    const PLAKKEN = /""\s*\+(?!=)|\+\s*""|\bstr\([^\n]*\)\s*\+|\+\s*str\(/;
    const fout: string[] = [];
    for (const pad of PAGINAS)
      for (const { code, ervoor } of blokken(readFileSync(pad, 'utf8'))) {
        // Een blok dat bewust de TypeError laat zien, slaat de blokrunner over.
        if (ervoor.includes('{/* niet-draaien:')) continue;
        for (const regel of code.split('\n'))
          if (PLAKKEN.test(zonderStrings(regel).replace(/#.*/, '')))
            fout.push(`${pad.slice(SITE.length)}: ${regel.trim()}`);
      }
    expect(fout).toEqual([]);
  });

  it('de f-string komt binnen in 3.1, met een voorkennislink naar de uitleg', () => {
    // De hoofdstukken vóór Acties (installatie, vormen, fysica) gebruiken er
    // geen; 3.1 is de eerste pagina met een f-string en noemt de les van
    // python in zijn <Voorkennis>.
    const positie = (map: string) => {
      const cat = join(SITE, 'docs', map, '_category_.json');
      return existsSync(cat) ? Number(JSON.parse(readFileSync(cat, 'utf8')).position) : 0;
    };
    const acties = positie('acties');
    const ervoor = readdirSync(join(SITE, 'docs'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && positie(e.name) > 0 && positie(e.name) < acties)
      .flatMap((e) => bestanden(join(SITE, 'docs', e.name)))
      .filter((p) =>
        blokken(readFileSync(p, 'utf8')).some(({ code }) => /\bf["'][^"'\n]*\{/.test(code)),
      )
      .map((p) => p.slice(SITE.length));
    expect(ervoor).toEqual([]);
    expect(readFileSync(join(SITE, 'docs', 'acties', 'acties.mdx'), 'utf8')).toContain(
      `to: '${UITLEG}'`,
    );
  });
});
