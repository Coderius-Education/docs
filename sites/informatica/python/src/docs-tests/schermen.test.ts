import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elk onderdeel van een les een eigen scherm: een
// tabblad, of een stap daarin. Een zin die naar een andere plek op de pagina
// wijst, klopt dan niet meer vanzelf. Bij het omzetten van deze cursus stond
// in 22 lessen en projecten een "hierboven" of "hieronder" dat naar een ander
// tabblad wees: een tip die zei "kijk naar de functie hierboven" terwijl die
// functie in de uitleg stond, of een voorspelvraag die beloofde dat het
// antwoord "hieronder" kwam, in de volgende stap. Deze test leest elke les
// zoals de build hem in schermen verdeelt, en houdt per scherm bij wat er te
// zien is.
//
// Wat de test niet ziet: of het ding dat in hetzelfde scherm staat ook is wat
// de zin bedoelt. Een tip met "net als hierboven" slaagt als er een veld boven
// staat, ook als hij de uitleg bedoelt. Noem een ander scherm daarom bij zijn
// naam ("uit de uitleg", "in de volgende stap"), en lees het na.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan: schermenVanBron } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: 'tekst' | 'code' | 'veld' | 'tabel' | 'lijst' | 'antwoord'; tekst: string };
type Scherm = { les: string; tab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : f.name.endsWith('.mdx')
        ? [join(map, f.name)]
        : [],
  );
}

const lessen = bestanden(DOCS).map((pad) => ({
  naam: relative(DOCS, pad),
  bron: readFileSync(pad, 'utf8'),
}));

const parse = await mdxParser();
const VELDEN = ['CodeExercise', 'PythonPlayground'];

const perLes = lessen.map((les) => ({
  ...les,
  schermen: schermenVanBron(les.bron, parse, { velden: VELDEN }).map((s: Omit<Scherm, 'les'>) => ({
    les: les.naam,
    ...s,
  })) as Scherm[],
}));
const schermen = perLes.flatMap((les) => les.schermen);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen en projecten zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(schermen.length).toBeGreaterThan(500);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
  });

  it('een hand-out heeft geen tabbladen: hij is om te printen', () => {
    const metTabs = perLes
      .filter((les) => les.naam.startsWith('projecten/unplugged/'))
      .filter((les) => les.schermen.length > 0)
      .map((les) => les.naam);
    expect(metTabs).toEqual([]);
  });

  it('"hieronder" wijst naar iets dat in hetzelfde scherm volgt', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (b.soort !== 'tekst' || !/\b(hieronder|onderstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(i + 1).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('"hierboven" wijst naar iets dat in hetzelfde scherm ervoor staat', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (b.soort !== 'tekst' || !/\b(hierboven|bovenstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(0, i).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('de rij tabbladen blijft kort genoeg voor één regel', () => {
    // Negen tabbladen passen op 1280 pixels nog op één regel
    // (scripts/meet-les-tabs.mjs meet het echt); een tiende komt op de
    // tweede, en die kost elk scherm veertig pixels.
    const teVeel = perLes
      .map((les) => ({ naam: les.naam, tabs: new Set(les.schermen.map((s) => s.tab)).size }))
      .filter((les) => les.tabs > 9)
      .map((les) => `${les.naam}: ${les.tabs}`);
    expect(teVeel).toEqual([]);
  });
});
