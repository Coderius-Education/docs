import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elk onderdeel van een les een eigen scherm: een
// tabblad, of een stap daarin. Een zin die naar een andere plek op de pagina
// wijst, klopt dan niet meer vanzelf: "de code hieronder" wees op de lange
// pagina naar de volgende alinea, en staat nu misschien op een ander scherm.
// Deze test leest elke les zoals de build hem in schermen verdeelt
// (packages/shared/plugins/les-schermen.js), en houdt per scherm bij wat er te
// zien is.
//
// Wat de test niet ziet: of het ding dat in hetzelfde scherm staat ook is wat
// de zin bedoelt. Noem een ander scherm daarom bij zijn naam ("uit de uitleg",
// "in de vorige stap"), en lees het na.

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

const paginas = bestanden(DOCS).map((pad) => ({
  naam: relative(DOCS, pad),
  bron: readFileSync(pad, 'utf8'),
}));
const ZONDER_TABS = /^les_tabs: false$/m;
const lessen = paginas.filter((p) => !ZONDER_TABS.test(p.bron));

const parse = await mdxParser();

const perLes = lessen.map((les) => ({
  ...les,
  schermen: schermenVan(les.bron, parse, { velden: ['PygbagRunner'] }).map(
    (s: Omit<Scherm, 'les'>) => ({ les: les.naam, ...s }),
  ) as Scherm[],
}));
const schermen = perLes.flatMap((les) => les.schermen);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';
// Waar een zin in staat die ergens naar wijst: ook in een lijst ("1. Voer de
// code hieronder uit").
const LEEST = ['tekst', 'lijst'];
// De tabbladen van een les, in volgorde: de schermen van één tabblad staan
// achter elkaar.
const tabsVan = (rij: Scherm[]) => rij.map((s) => s.tab).filter((tab, i, a) => tab !== a[i - 1]);
/** Wat de leerling ziet zonder iets open te klappen. */
const open = (s: Scherm) => {
  const tot = s.blokken.findIndex((b) => b.soort === 'antwoord');
  return tot < 0 ? s.blokken : s.blokken.slice(0, tot);
};

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(schermen.length).toBeGreaterThan(250);
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
    // scherm ervoor dicht.
    const fout = perLes.flatMap((les) =>
      les.schermen
        .slice(1)
        .filter((s) => {
          const eerste = s.blokken[0];
          if (!eerste || !LEEST.includes(eerste.soort)) return false;
          return DOORGAAND.test(eerste.tekst.trim().replace(/^(\d+\.|[-*])\s+/, ''));
        })
        .map((s) => `${s.les} | ${s.naam}: ${s.blokken[0].tekst.trim().slice(0, 60)}`),
    );
    expect(fout).toEqual([]);
  });

  it('een les heeft hooguit acht tabbladen, en geen twee met dezelfde naam', () => {
    // Met meer past de rij niet op één regel. En bij twee tabbladen met
    // dezelfde naam zegt de knop "Volgende: Opdracht" voor een andere
    // opdracht, en is een link naar het tabblad dubbelzinnig.
    const fout = perLes.flatMap((les) => {
      const tabs = tabsVan(les.schermen);
      const dubbel = tabs.filter((tab, i) => tabs.indexOf(tab) !== i);
      return [
        ...(tabs.length > 8 ? [`${les.naam}: ${tabs.length} tabbladen`] : []),
        ...dubbel.map((tab) => `${les.naam}: twee keer ${tab}`),
      ];
    });
    expect(fout).toEqual([]);
  });

  it('een stap heet naar zijn inhoud, niet De basis', () => {
    // Wat in een sectie vóór de eerste ### staat, wordt een stap die De
    // basis heet. Dat zegt niet wat erin staat: begin een sectie met een ###
    // die het wel zegt.
    expect(
      schermen.filter((s) => / › De basis$/.test(s.naam)).map((s) => `${s.les} | ${s.naam}`),
    ).toEqual([]);
  });

  it('een scherm is geen losse zin', () => {
    // Een sectie van één regel is geen scherm (schrijfgids §2): de leerling
    // klikt dan door voor een zin. Het laatste tabblad met uitbreidingen is
    // een lijst en telt niet.
    const fout = schermen
      .filter((s) => s.blokken.length === 1 && s.blokken[0].soort === 'tekst')
      .map((s) => `${s.les} | ${s.naam}: ${s.blokken[0].tekst.slice(0, 60)}`);
    expect(fout).toEqual([]);
  });

  it('de speeltuin staat op het scherm waar de tekst hem noemt', () => {
    // "Klik op de knop Speel in browser", "voer de code uit": dat kan alleen
    // als er op dat scherm een speeltuin staat, niet in een uitklapblok. In
    // hoofdstuk 10 (pygame-ce) is er geen speeltuin: daar draait de leerling
    // de code in zijn eigen editor.
    const NOEMT = /\b(Speel in browser|▶|de speeltuin hier|in de speeltuin)\b|▶/;
    const fout = schermen
      .filter((s) => !s.les.startsWith('pygame-ce/'))
      .filter((s) => open(s).some((b) => LEEST.includes(b.soort) && NOEMT.test(b.tekst)))
      .filter((s) => !open(s).some((b) => b.soort === 'veld'))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('geen les heeft nog een eigen regel met de volgende les', () => {
    // De knoppen Vorige en Volgende onderaan elk tabblad doen dat, uit de
    // sidebar (links-in-lestekst.test.ts bewaakt "Door naar …").
    const NAVIGATIE = /^(\[?←|\*\*Volgende:\*\*|Volgende( les)?:)|→\]\([^)]*\)\s*$/m;
    expect(lessen.filter((les) => NAVIGATIE.test(les.bron)).map((les) => les.naam)).toEqual([]);
  });

  it('naslag heeft geen tabbladen', () => {
    // In de cheatsheet en de veelgemaakte fouten zoek je met Ctrl+F, en dat
    // vindt geen tekst in een tabblad dat dicht staat. De pagina's voor de
    // docent zijn naslag die je in één keer leest.
    const naslag = paginas.filter(
      (p) =>
        p.naam === 'cheatsheet.md' ||
        p.naam === 'veelgemaakte-fouten.mdx' ||
        p.naam.startsWith('voor-de-docent/'),
    );
    expect(naslag.length).toBeGreaterThan(5);
    expect(naslag.filter((p) => !ZONDER_TABS.test(p.bron)).map((p) => p.naam)).toEqual([]);
  });
});
