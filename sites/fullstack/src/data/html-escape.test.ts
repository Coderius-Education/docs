import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een f-string in een HTMLResponse zet wat de bezoeker invulde letterlijk in de
// HTML. Een template escapet vanzelf; een f-string niet. Het recept "Een
// formulier versturen" deed dat een tijd met de naam uit het formulier. Deze
// test eist dat een parameter van het endpoint in zo'n f-string door
// escape() gaat. Een blok dat de fout bewust laat zien, krijgt erboven
// {/* onveilig-voorbeeld: reden */}.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

type Blok = { bestand: string; code: string; gemarkeerd: boolean };

function pythonBlokken(bestand: string): Blok[] {
  const tekst = readFileSync(bestand, 'utf8');
  const blokken: Blok[] = [];
  for (const m of tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)) {
    const ervoor = tekst.slice(Math.max(0, (m.index ?? 0) - 300), m.index);
    blokken.push({
      bestand: relative(DOCS, bestand),
      code: m[1],
      gemarkeerd: /\{\/\* onveilig-voorbeeld: \S[^*]*\*\/\}\s*$/.test(ervoor),
    });
  }
  return blokken;
}

// Geeft per HTMLResponse(f"…") de placeholders terug die een parameter van
// het omliggende endpoint gebruiken zonder escape().
export function onveiligePlaatsen(code: string): string[] {
  const fouten: string[] = [];
  const functies = code.split(/^(?=\s*async def |\s*def )/m);
  for (const functie of functies) {
    const kop = functie.match(/def \w+\(([\s\S]*?)\):/);
    const parameters = kop
      ? [...kop[1].matchAll(/(\w+)\s*:/g)].map((p) => p[1])
      : ['naam', 'bericht'];
    for (const r of functie.matchAll(/HTMLResponse\(f(["'])([\s\S]*?)\1/g)) {
      for (const [, inhoud] of r[2].matchAll(/\{([^{}]+)\}/g)) {
        if (inhoud.trim().startsWith('escape(')) continue;
        const naam = inhoud.match(/^\s*(\w+)/)?.[1];
        if (naam && parameters.includes(naam)) fouten.push(`{${inhoud}}`);
      }
    }
  }
  return fouten;
}

describe('invoer van een bezoeker in een HTMLResponse', () => {
  it('de controle herkent de fout en laat escape() en eigen waarden door', () => {
    const fout = 'async def x(naam: str = Form(...)):\n    return HTMLResponse(f"Hoi {naam}")';
    const goed =
      'async def x(naam: str = Form(...)):\n    return HTMLResponse(f"Hoi {escape(naam)}")';
    const eigen = 'async def x():\n    aantal = 3\n    return HTMLResponse(f"Er zijn {aantal}")';
    expect(onveiligePlaatsen(fout)).toEqual(['{naam}']);
    expect(onveiligePlaatsen(goed)).toEqual([]);
    expect(onveiligePlaatsen(eigen)).toEqual([]);
  });

  for (const blok of bestanden(DOCS).flatMap(pythonBlokken)) {
    if (blok.gemarkeerd || !blok.code.includes('HTMLResponse(f')) continue;
    it(`${blok.bestand}: ${blok.code.split('\n')[0]}`, () => {
      expect(onveiligePlaatsen(blok.code), blok.bestand).toEqual([]);
    });
  }
});
