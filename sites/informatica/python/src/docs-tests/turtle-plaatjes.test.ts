import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { naarSvg } from '../../../../../packages/python-runner/src/Tekening/tekening';
import { draaiTurtle } from '../../../../../packages/python-runner/src/turtle/draai';

// Een turtle-project laat bij elke opdracht zien wat er moet komen: een
// plaatje naast de opdracht. Dat plaatje is gemaakt door de oplossing te
// draaien met de turtle van de speeltuin, en door dezelfde naarSvg als de
// speeltuin. Zo ziet een leerling in de les precies wat zijn eigen goede code
// straks tekent. De marker {/* turtle-plaatje: img/naam.svg */} staat boven
// het codeblok van de oplossing; deze test draait dat blok en legt het
// resultaat naast het bestand.
//
// Een tekening met random: {/* turtle-plaatje met zaad 7: img/naam.svg */}
// zet random.seed(7) voordat de oplossing draait. Zo blijft het plaatje vast,
// zonder dat er een seed in de oplossing van de leerling staat; de les zegt
// erbij dat zijn tekening anders mag zijn. Het zaad gaat via draaiTurtle en
// niet als regels vóór de code: een vergeten `import random` valt zo om, en
// een regelnummer in een fout klopt.
//
// Een oplossing die om invoer vraagt, krijgt de invoer-marker van het
// blokkenscript erboven: {/* invoer: 4 | 10 */} op de regel boven de
// plaatje-marker. Beide controles typen dan dezelfde antwoorden in.
//
// Stap voor stap neemt hoogstens 1000 stappen op (trace/recorder.ts). Raadt
// een pagina die knop aan terwijl een oplossing op die pagina meer stappen
// kost, dan zegt de pagina dat hij na 1000 stappen stopt: anders denkt de
// leerling dat zijn programma halverwege ophoudt.
//
// Een plaatje bijwerken: SCHRIJF_PLAATJES=1 pnpm exec vitest run turtle-plaatjes

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const SCHRIJF = process.env.SCHRIJF_PLAATJES === '1';
const MARKER =
  /(?:\{\/\*\s*invoer:\s*([^*]*?)\s*\*\/\}\s*\n)?\{\/\*\s*turtle-plaatje(?: met zaad (\d+))?:\s*(\S+)\s*\*\/\}\s*\n+```python\n([\s\S]*?)\n```/g;
const MAX_STAPPEN = 1000;

function mdxBestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return mdxBestanden(pad);
    return naam.endsWith('.mdx') ? [pad] : [];
  });
}

function svgBestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return svgBestanden(pad);
    return naam.endsWith('.svg') ? [pad] : [];
  });
}

const plaatjes = mdxBestanden(DOCS).flatMap((bestand) => {
  const tekst = readFileSync(bestand, 'utf8');
  return [...tekst.matchAll(MARKER)].map((m) => ({
    bestand,
    tekst,
    pad: join(dirname(bestand), m[3]),
    verwijzing: m[3],
    code: m[4],
    opties: {
      zaad: m[2] ? Number(m[2]) : undefined,
      invoer: m[1] ? m[1].split('|').map((a) => a.trim()) : undefined,
    },
  }));
});

describe('de doelplaatjes van de turtle-projecten', () => {
  it('er zijn plaatjes, en elk svg-bestand in docs hoort bij een marker', () => {
    expect(plaatjes.length).toBeGreaterThan(0);
    const bekend = new Set(plaatjes.map((p) => p.pad));
    const los = svgBestanden(DOCS).filter((pad) => !bekend.has(pad));
    expect(los.map((pad) => relative(DOCS, pad))).toEqual([]);
  });

  for (const p of plaatjes) {
    const naam = relative(DOCS, p.pad);
    it(naam, () => {
      // Het plaatje staat ook echt op de pagina, met een beschrijvende alt-tekst.
      const afbeelding = p.tekst.match(
        new RegExp(`!\\[([^\\]]+)\\]\\(\\./${p.verwijzing.replace(/[.]/g, '\\.')}\\)`),
      );
      expect(
        afbeelding,
        `${naam} staat niet als ![…](./${p.verwijzing}) op de pagina`,
      ).not.toBeNull();
      const alt = afbeelding?.[1] ?? '';

      const { tekening, stappen } = draaiTurtle(p.code, p.opties);
      if (stappen > MAX_STAPPEN && /Stap voor stap/.test(p.tekst)) {
        expect(
          p.tekst,
          `${relative(DOCS, p.bestand)} raadt Stap voor stap aan, maar deze oplossing kost ${stappen} stappen; zeg dat de knop na 1000 stappen stopt`,
        ).toMatch(/1000 stappen/);
      }
      const svg = naarSvg(tekening, undefined, alt);
      if (SCHRIJF) writeFileSync(p.pad, svg);
      expect(existsSync(p.pad), `${naam} ontbreekt; maak hem met SCHRIJF_PLAATJES=1`).toBe(true);
      expect(readFileSync(p.pad, 'utf8'), `${naam} past niet meer bij de oplossing`).toBe(svg);
    });
  }
});
