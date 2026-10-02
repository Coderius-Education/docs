import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bevindingen uit een leerling-doorloop van de reeksen HTML van een bezoeker
// (xss) en Wie mag wat (toegang), elk vastgepind:
//
// - De scripts in Wie mag wat maakten de namenlijst met een list
//   comprehension. De Python-cursus behandelt die niet, dus een leerling las
//   een regel die hij niet kon volgen. Een for-lus met append doet hetzelfde.
// - De Content-Security-Policy in XSS: in de praktijk zette `script-src 'self'`
//   de tip `hx-on::after-request="this.reset()"` uit het htmx-overzicht stil
//   uit (velden bleven gevuld, alleen een EvalError in de Console). De uitleg
//   moet hx-on noemen.
// - In je eigen project noemde GET /sessies uit Sessies opdracht 3 niet,
//   terwijl dat endpoint elk sessie-id weggeeft en daarmee elke 403 omzeilt.
// - De praktijk zei "In Detailpagina vraag je berichten op met een nummer";
//   dat deed alleen wie opdracht 5 maakte.

const VEILIGHEID = fileURLToPath(new URL('../../docs/veiligheid', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

// Met de witruimte samengevouwen, zodat een zin over twee regels ook telt.
const lees = (pad: string) => readFileSync(join(VEILIGHEID, pad), 'utf8').replace(/\s+/g, ' ');

// Een list comprehension die wel mag, met de reden erbij. Sleutel: het pad
// onder docs/veiligheid plus de regel zelf, zonder inspringing.
const TOEGESTAAN: Record<string, string> = {};

// Een `[` en daarna op dezelfde regel `for … in`. Niet `[^\]]`, want
// `[bericht["naam"] for …` heeft zelf een `]` vóór de `for`.
const COMPREHENSION = /\[[^\n]*\sfor\s+[\w, ]+\s+in\s/;

describe('Python-blokken in de veiligheidsroute', () => {
  const regels = bestanden(VEILIGHEID).flatMap((pad) =>
    [...readFileSync(pad, 'utf8').matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].flatMap((m) =>
      m[1].split('\n').map((regel) => ({ bestand: relative(VEILIGHEID, pad), regel })),
    ),
  );

  it('vindt de blokken', () => {
    expect(regels.length).toBeGreaterThan(500);
  });

  it('gebruiken geen list comprehension (de Python-cursus behandelt die niet)', () => {
    const fout = regels
      .filter(({ regel }) => COMPREHENSION.test(regel))
      .map(({ bestand, regel }) => `${bestand}: ${regel.trim()}`)
      .filter((sleutel) => !(sleutel in TOEGESTAAN));
    expect(fout).toEqual([]);
  });

  it('elke uitzondering bestaat nog', () => {
    const gevonden = new Set(regels.map(({ bestand, regel }) => `${bestand}: ${regel.trim()}`));
    for (const sleutel of Object.keys(TOEGESTAAN))
      expect(gevonden.has(sleutel), sleutel).toBe(true);
  });
});

describe('XSS in de praktijk: Content-Security-Policy', () => {
  it('zegt dat hx-on-attributen dan niet meer werken, en wat je dan doet', () => {
    const tekst = lees('xss/praktijk.mdx');
    const blok = tekst.slice(tekst.indexOf('Content-Security-Policy</summary>'));
    const csp = blok.slice(0, blok.indexOf('</details>'));
    expect(csp).toContain('hx-on');
    expect(csp).toMatch(/\.js/);
  });
});

describe('Wie mag wat', () => {
  it('in je eigen project noemt GET /sessies uit Sessies', () => {
    expect(lees('toegang/eigen-project.mdx')).toContain('`GET /sessies`');
  });

  it('de praktijk doet niet alsof elke leerling berichten per nummer opvraagt', () => {
    expect(lees('toegang/praktijk.mdx')).not.toContain('met een nummer');
  });
});
