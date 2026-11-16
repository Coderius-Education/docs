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
// Waar een zin in staat die ergens naar wijst. Een vijfde van de lestekst van
// deze cursus staat in een lijst ("1. Vergelijk met het script hieronder"):
// met alleen alinea's raakten de tests hieronder niets.
const LEEST = ['tekst', 'lijst'];
// De tabbladen van een les, in volgorde: de schermen van één tabblad staan
// achter elkaar. Een Set van de namen telt twee tabbladen Voorspel als één.
const tabsVan = (rij: Scherm[]) => rij.map((s) => s.tab).filter((tab, i, a) => tab !== a[i - 1]);

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
        if (!LEEST.includes(b.soort) || !/\b(hieronder|onderstaande?)\b/i.test(b.tekst)) return;
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
        if (!LEEST.includes(b.soort) || !/\b(hierboven|bovenstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(0, i).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('een scherm begint niet met een zin die op het vorige doorgaat', () => {
    // De gedeelde lijst (DOORGAAND in les-schermen.js): "Daarom", "Nu",
    // "Daar is …". Op de lange pagina las het goed; in tabbladen is het
    // scherm ervoor dicht. Ook als het scherm met een lijst begint, en ook
    // een telling die op een ander scherm begon: in Fouten zoeken openden
    // twee stappen met "De tweede is …" en "Het derde geval".
    const TELT_DOOR = /^(De (tweede|derde|vierde)|Het (tweede|derde|vierde)|In plaats van)\b/;
    const fout = perLes.flatMap((les) =>
      les.schermen
        .slice(1)
        .filter((s) => {
          const eerste = s.blokken[0];
          if (!eerste || !LEEST.includes(eerste.soort)) return false;
          const tekst = eerste.tekst.trim().replace(/^(\d+\.|[-*])\s+/, '');
          return DOORGAAND.test(tekst) || TELT_DOOR.test(tekst);
        })
        .map((s) => `${s.les} | ${s.naam}: ${s.blokken[0].tekst.trim().slice(0, 60)}`),
    );
    expect(fout).toEqual([]);
  });

  it('een les heeft hooguit tien tabbladen, en een stap heet niet De basis', () => {
    // Met meer past de rij niet op één regel, ook niet met korte nummers
    // voor de stappen. En een stap die De basis heet, zegt niet wat erin staat.
    const fout = perLes
      .map((les) => ({ naam: les.naam, tabs: tabsVan(les.schermen).length }))
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
    // doen dat nu, uit de sidebar. Elke vorm telt: een regel die met een pijl
    // terug begint, op een pijl vooruit eindigt of "Volgende les:" zegt. Een
    // pijl midden in een zin is een menupad (Editor → Editor Layout).
    const NAVIGATIE =
      /^(\[?←|\*\*Volgende:\*\*|Volgende( les)?:)|→\]\([^)]*\)\s*$|→\s*$|\*\*Volgende:\*\*/m;
    const fout = lessen.filter((les) => NAVIGATIE.test(les.bron)).map((les) => les.naam);
    expect(fout).toEqual([]);
    for (const regel of [
      '← [Deel 4](site:godot/docs/x) · **Volgende:** [Deel 6](site:godot/docs/y) →',
      'Volgende les: [Deel 6](site:godot/docs/y)',
      '[← Deel 4](site:godot/docs/x) | [Deel 6 →](site:godot/docs/y)',
    ])
      expect(regel, regel).toMatch(NAVIGATIE);
    expect('Ga naar **Editor** → **Editor Layout** → **Default**.').not.toMatch(NAVIGATIE);
  });

  it('geen twee tabbladen van een les heten hetzelfde', () => {
    // Power-up en Score in je karakter hadden elk twee tabbladen Voorspel.
    // De knop zegt dan "Volgende: Voorspel" voor een andere vraag, en een
    // link naar het tabblad is dubbelzinnig.
    const fout = perLes.flatMap((les) => {
      const tabs = tabsVan(les.schermen);
      const dubbel = tabs.filter((tab, i) => tabs.indexOf(tab) !== i);
      return dubbel.map((tab) => `${les.naam}: ${tab}`);
    });
    expect(fout).toEqual([]);
  });

  it('een stap waar de tekst naar verwijst, bestaat', () => {
    // Bij het omzetten zijn stappen samengevoegd en opgeschoven: "Stap 6
    // hierboven" werd Stap 4. Een nummer in de lestekst hoort bij een
    // `## Stap N` van de les zelf, of van de les waar de regel naar linkt.
    const stappenVan = (bron: string) =>
      new Set([...bron.matchAll(/^## Stap (\d+)\b/gm)].map((m) => Number(m[1])));
    const perSlug = new Map(
      lessen.map((les) => [/^slug:\s*\/?(\S+)/m.exec(les.bron)?.[1] ?? '', stappenVan(les.bron)]),
    );
    const fout: string[] = [];
    for (const les of lessen) {
      const eigen = stappenVan(les.bron);
      let inCode = false;
      for (const regel of les.bron.split('\n')) {
        if (regel.startsWith('```')) inCode = !inCode;
        if (inCode || regel.startsWith('#')) continue;
        const doel = /\]\(site:godot\/docs\/([\w-]+)/.exec(regel)?.[1];
        const stappen = doel && doel !== '' ? (perSlug.get(doel) ?? eigen) : eigen;
        for (const m of regel.matchAll(/\bStap (\d+)\b/g)) {
          const n = Number(m[1]);
          if (!stappen.has(n) && !eigen.has(n))
            fout.push(`${les.naam}: Stap ${n} in "${regel.trim().slice(0, 70)}"`);
        }
      }
    }
    expect(fout).toEqual([]);
  });

  it('naslag en de keuzelijst Wat nu? hebben geen tabbladen', () => {
    // Godot-versies is naslag waarin je zoekt, Wat nu? een lijst om uit te
    // kiezen: als tabbladen liep de knop Volgende ze alle zeven langs.
    for (const pagina of ['godot-versies.md', 'meer-leren.md'])
      expect(readFileSync(join(SITE, 'docs', pagina), 'utf8'), pagina).toMatch(
        /^les_tabs: false$/m,
      );
  });

  it('het script tot nu toe staat er direct, niet in een uitklapblok', () => {
    // Het tabblad is zelf al de klik: met "Klik hier om te vergelijken"
    // erin was het scherm leeg tot de tweede klik. Gelezen zoals de build het
    // tabblad maakt, dus ook met een vast id achter de kop of een zin ervoor:
    // het eerste dat er te zien is, is code.
    const SCRIPT = /^Je (script tot nu toe|complete script)$/;
    const tabs = schermen.filter((s) => SCRIPT.test(s.tab));
    expect(tabs.length).toBeGreaterThan(5);
    const fout = tabs
      .filter((s, i) => s.tab !== tabs[i - 1]?.tab || s.les !== tabs[i - 1]?.les)
      .filter((s) => s.blokken.find((b) => b.soort !== 'tekst')?.soort !== 'code')
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });
});
