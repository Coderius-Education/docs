import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elk onderdeel van een les een eigen scherm: een
// tabblad, of een stap daarin. Een zin die naar een andere plek op de pagina
// wijst, klopt dan niet meer vanzelf: "het script hieronder" wees op de lange
// pagina naar de volgende alinea, en staat nu misschien op een ander scherm.
// Deze test leest elke les zoals de build hem in schermen verdeelt
// (packages/shared/plugins/les-schermen.js), en houdt per scherm bij wat er te
// zien is.
//
// Wat de test niet ziet: of het ding dat in hetzelfde scherm staat ook is wat
// de zin bedoelt. Noem een ander scherm daarom bij zijn naam ("uit de uitleg",
// "in stap 2"), en lees het na.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan, DOORGAAND } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = {
  soort: 'tekst' | 'code' | 'veld' | 'tabel' | 'lijst' | 'antwoord' | 'vraag' | 'plaatje';
  tekst: string;
};
type Scherm = { les: string; tab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : /\.mdx?$/.test(f.name)
        ? [join(map, f.name)]
        : [],
  );
}

const lessen = bestanden(DOCS).map((pad) => ({
  naam: relative(DOCS, pad),
  bron: readFileSync(pad, 'utf8'),
}));

const parse = await mdxParser();

const perLes = lessen.map((les) => ({
  ...les,
  schermen: schermenVan(les.bron, parse, { velden: [] }).map((s: Omit<Scherm, 'les'>) => ({
    les: les.naam,
    ...s,
  })) as Scherm[],
}));
const schermen = perLes.flatMap((les) => les.schermen);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(schermen.length).toBeGreaterThan(300);
  });

  it('de cursus heeft tabbladen aan staan', () => {
    expect(readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8')).toMatch(/lesTabs: true/);
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

  it('een scherm begint niet met een zin die op het vorige doorgaat', () => {
    // De gedeelde lijst (DOORGAAND in les-schermen.js): "Daarom", "Dat",
    // "Nu", "Daar is …". Op de lange pagina las het goed; in tabbladen is
    // het scherm ervoor dicht.
    const fout = perLes.flatMap((les) =>
      les.schermen
        .slice(1)
        .filter((s) => s.blokken[0]?.soort === 'tekst' && DOORGAAND.test(s.blokken[0].tekst.trim()))
        .map((s) => `${s.les} | ${s.naam}: ${s.blokken[0].tekst.trim().slice(0, 60)}`),
    );
    expect(fout).toEqual([]);
  });

  it('een les heeft hooguit tien tabbladen, en een stap heet niet De basis', () => {
    // Met meer past de rij niet op één regel, ook niet met korte nummers
    // voor de stappen. En een stap die De basis heet, zegt niet wat erin staat.
    const fout = perLes
      .map((les) => ({ naam: les.naam, tabs: new Set(les.schermen.map((s) => s.tab)).size }))
      .filter((les) => les.tabs > 10)
      .map((les) => `${les.naam}: ${les.tabs} tabbladen`);
    expect(fout).toEqual([]);
    expect(
      schermen.filter((s) => / › De basis$/.test(s.naam)).map((s) => `${s.les} | ${s.naam}`),
    ).toEqual([]);
  });

  it('geen les heeft nog een eigen regel met de vorige en de volgende les', () => {
    // "← Deel 4 · Volgende: Deel 6 →" stond onder elk deel van het
    // bewegingsscript. De knoppen Vorige en Volgende onderaan elk tabblad
    // doen dat nu, uit de sidebar.
    const fout = lessen
      .filter((les) => /^(← |\*\*Volgende:\*\*)/m.test(les.bron))
      .map((les) => les.naam);
    expect(fout).toEqual([]);
  });
});
