import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een les van fullstack is in tabbladen verdeeld, en een tabblad met
// `###`-koppen in stappen (zie de root-CLAUDE.md, Les-tabbladen). Een tabblad
// of stap is alles wat de leerling op dat moment ziet. Bij het omzetten wees
// "hierboven" of "hieronder" op 26 plekken naar een ander scherm ("zet de
// parameter erbij, zoals in regel 2 hierboven" stond bij Er gaat iets mis,
// en regel 2 in de uitleg), stond de rij tabbladen in vijf lessen op twee
// regels, en was een controlelijst over zeven tabbladen verdeeld.
//
// Deze test leest elke les met dezelfde stap als de build
// (packages/shared/plugins/les-schermen.js). Faalt hij, wijs dan naar wat in
// hetzelfde scherm staat, of noem het andere scherm bij zijn naam ("zoals bij
// De controle in het endpoint", "uit de volgende stap").

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: string; tekst: string; inVraag?: boolean };
type Scherm = { les: string; tab: string; opTab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
// Onderdelen die iets laten zien zonder dat er een alinea of codeblok staat.
const ZICHTBAAR = [
  'VerzoekCyclus',
  'DevtoolsPaneel',
  'NetwerkTabel',
  'ConsoleRegels',
  'Routekaart',
  'Gastenboek',
  'Gelukt',
];

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) => {
    if (f.isDirectory()) return bestanden(join(map, f.name));
    return /\.mdx?$/.test(f.name) ? [join(map, f.name)] : [];
  });
}

const parse = await mdxParser();
const paginas = bestanden(join(SITE, 'docs')).map((pad) => ({
  naam: relative(SITE, pad),
  bron: readFileSync(pad, 'utf8'),
}));
const lessen = paginas.map(({ naam, bron }) => ({
  naam,
  bron,
  schermen: (schermenVan(bron, parse, { velden: ZICHTBAAR }) as Omit<Scherm, 'les'>[]).map((s) => ({
    les: naam,
    ...s,
  })),
}));
const schermen = lessen.flatMap((les) => les.schermen);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';
const zonderTabs = (bron: string) => /^les_tabs:\s*false\s*$/m.test(bron.split('\n---\n')[0]);

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(lessen.filter((les) => les.schermen.length > 0).length).toBeGreaterThan(140);
    expect(schermen.length).toBeGreaterThan(1200);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
  });

  it('"hieronder" wijst naar iets dat in hetzelfde scherm volgt', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (!['tekst', 'lijst'].includes(b.soort)) return;
        if (!/\b(hieronder|onderstaande?)\b/i.test(b.tekst)) return;
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
        if (!['tekst', 'lijst'].includes(b.soort)) return;
        if (!/\b(hierboven|bovenstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(0, i).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('Er gaat iets mis wijst niet naar "hierboven": de uitleg staat op een ander tabblad', () => {
    // Bij een fout staat de melding en de oorzaak in het scherm, en "zoals
    // hierboven" bedoelde in tien lessen de code uit de uitleg. De test
    // hierboven ziet dat niet: de foutmelding zelf staat er ook boven.
    const fout = schermen
      .filter((s) => s.tab === 'Er gaat iets mis')
      .flatMap((s) =>
        s.blokken
          .filter((b) => b.soort === 'tekst' && /\b(hierboven|hieronder)\b/i.test(b.tekst))
          .map((b) => `${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`),
      );
    expect(fout).toEqual([]);
  });

  it('elk scherm van een les heeft een eigen naam', () => {
    const fout = lessen.flatMap((les) => {
      const namen = les.schermen.map((s) => s.naam);
      return [...new Set(namen.filter((n, i) => namen.indexOf(n) !== i))].map(
        (n) => `${les.naam}: ${n}`,
      );
    });
    expect(fout).toEqual([]);
  });

  it('geen stap heeft een nummer in zijn naam', () => {
    // De knop van een stap nummert al, en een stap Vooraf of De basis ervoor
    // schuift de telling op.
    const fout = schermen
      .filter((s) => /› Stap \d/.test(s.naam))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('de rij tabbladen past op één regel', () => {
    // Een tweede regel kost elk paneel veertig pixels. Naast de lessenlijst is
    // op 1280 pixels 948 pixels over; een tabblad kost ongeveer 32 pixels plus
    // 7 per letter (gemeten in Chromium: "Testen" is 76 breed, "Waarom de
    // naam niet in de cookie hoort" 296; dezelfde schatting als bij robotica). Vijf lessen stonden zo op twee regels, met koppen als "Als
    // je wijziging niet doorkomt"; die heet nu De cache. Het echte getal meet
    // alleen een browser (`node scripts/meet-les-tabs.mjs fullstack`).
    const fout = lessen.flatMap((les) => {
      const labels = [...new Set(les.schermen.map((s) => s.opTab))];
      const breedte = labels.reduce((som, label) => som + 32 + 7 * label.length, 0);
      return breedte > 948
        ? [`${les.naam}: ${labels.length} tabbladen, ongeveer ${breedte} px`]
        : [];
    });
    expect(fout).toEqual([]);
  });
});

describe("pagina's waar je zoekt of afvinkt, hebben geen tabbladen", () => {
  it('de cheatsheet, Er gaat iets mis, de overzichten en de hand-outs', () => {
    // Zoeken met Ctrl+F vindt geen tekst in een tabblad dat dicht staat, en
    // een hand-out print je in zijn geheel.
    const vast = [
      'docs/cheatsheet.md',
      'docs/troubleshooting.md',
      'docs/FastAPI/index.mdx',
      'docs/veiligheid/index.mdx',
      'docs/online/index.mdx',
      'docs/FastAPI/projectstructuur.mdx',
      'docs/FastAPI/sqlitedict/op-een-rij.mdx',
      'docs/voor-de-docent/schoolserver.mdx',
    ];
    const handouts = paginas.filter((p) => p.naam.startsWith(join('docs', 'unplugged')));
    expect(handouts.length).toBeGreaterThan(5);
    const fout = [...vast.map((naam) => paginas.find((p) => p.naam === naam)), ...handouts]
      .filter((p) => !p || !zonderTabs(p.bron))
      .map((p) => p?.naam ?? 'pagina ontbreekt');
    expect(fout).toEqual([]);
  });

  it('een controlelijst met vakjes staat op één pagina', () => {
    // Beveilig je eigen project is één lijst om af te lopen, per reeks een
    // kop. In tabbladen stond hij over acht schermen, en de rij paste niet.
    const fout = paginas
      .filter((p) => (p.bron.match(/^- \[ \] /gm) ?? []).length >= 10 && !zonderTabs(p.bron))
      .map((p) => p.naam);
    expect(fout).toEqual([]);
    expect(
      zonderTabs(paginas.find((p) => p.naam.endsWith('veiligheid/eigen-project.mdx'))?.bron ?? ''),
    ).toBe(true);
  });
});

describe('de docentenhandleiding', () => {
  it('gaat over de literatuur, en is verder kort', () => {
    // Wij gaan niet over hoe iemand lesgeeft (schrijfgids §15). De
    // handleiding was 209 regels: lesadvies, een tabel met alle lessen en
    // een beschrijving van elke route. Wat een docent nodig heeft en niet
    // over lesgeven gaat (één server voor de klas), staat in voor-de-docent.
    const mdx = readFileSync(join(SITE, 'src/theme/MDXComponents.tsx'), 'utf8');
    expect(mdx).toMatch(/^\s+Werkvormen,$/m);
    const handleiding = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    expect(handleiding).toMatch(/^<Werkvormen \/>$/m);
    expect(handleiding).toContain('site:didactiek/');
    expect(handleiding.split('\n').length).toBeLessThanOrEqual(50);
    expect(handleiding).not.toMatch(/^## .*(Klassikaal|Didactische aanpak|Leerlijn)/m);
    expect(handleiding).toContain('(site:fullstack/docs/voor-de-docent/schoolserver)');
  });
});
