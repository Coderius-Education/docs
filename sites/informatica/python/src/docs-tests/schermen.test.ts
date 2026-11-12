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

type Blok = {
  soort: 'tekst' | 'code' | 'veld' | 'tabel' | 'lijst' | 'antwoord' | 'vraag';
  tekst: string;
  inVraag?: boolean;
};
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

  it('"Kopieer je programma" staat op het scherm met het oefenveld', () => {
    // Het veld bewaart niets. In veertig projectstappen stond de zin op het
    // laatste tabblad, Er gaat iets mis, waar geen veld staat: wie daar las
    // dat hij moest kopiëren, moest eerst terug naar zijn programma.
    const fout = schermen
      .filter((s) =>
        s.blokken.some((b) => b.soort === 'tekst' && /Kopieer je programma voordat/.test(b.tekst)),
      )
      .filter((s) => !s.blokken.some((b) => b.soort === 'veld'))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('gegevens om te kopiëren komen na het plakken van je eigen programma', () => {
    // Een leerling heeft één klembord. Stond de lijst om te kopiëren op het
    // scherm vóór "Plak je programma uit stap 3", dan was zijn programma weg
    // op het moment dat hij het wilde plakken (zes projectstappen).
    const KOPIEER = /Kopieer (daarna )?(dit|deze)\b/;
    const PLAK = /Plak je programma/;
    const fout: string[] = [];
    for (const les of perLes) {
      // Alleen in een stap waar de leerling een eerder programma plakt.
      if (!les.schermen.some((s) => s.blokken.some((b) => PLAK.test(b.tekst)))) continue;
      for (const s of les.schermen) {
        const i = s.blokken.findIndex((b) => b.soort === 'tekst' && KOPIEER.test(b.tekst));
        if (i < 0) continue;
        const zin = s.blokken[i].tekst;
        const eerst =
          PLAK.test(zin.slice(0, zin.search(KOPIEER))) ||
          s.blokken.slice(0, i).some((b) => b.soort === 'tekst' && PLAK.test(b.tekst));
        if (!eerst) fout.push(`${s.les} | ${s.naam}`);
      }
    }
    expect(fout).toEqual([]);
    // De regel is niet leeg: zes stappen laten gegevens kopiëren.
    expect(
      schermen.filter((s) => s.blokken.some((b) => b.soort === 'tekst' && KOPIEER.test(b.tekst)))
        .length,
    ).toBeGreaterThanOrEqual(6);
  });

  it('geen zin wijst naar een plek op "de pagina"', () => {
    // Een les is geen pagina meer waar iets bovenaan of onderaan staat.
    const fout: string[] = [];
    for (const s of schermen) {
      for (const b of s.blokken) {
        if (
          b.soort === 'tekst' &&
          /\b(bovenaan|onderaan|verderop op) (deze|de) pagina\b/i.test(b.tekst)
        )
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de tip "Eerst op papier" staat niet tussen de fouten', () => {
    // Hij stond vlak voor de eerste opdracht, en dat was in zes lessen de
    // laatste stap van Er gaat iets mis: een werkvorm om mee te beginnen
    // onder een foutmelding.
    const fout = schermen
      .filter((s) => s.tab === 'Er gaat iets mis')
      .filter((s) => s.blokken.some((b) => b.soort === 'tekst' && b.tekst === 'Eerst op papier'))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('onder een voorspelvraag staat geen code die het antwoord laat zien', () => {
    // In De rekenmachine en Sets stond direct onder de vraag het voorbeeld
    // dat het antwoord gaf: wie het scherm overzag, hoefde niet te
    // voorspellen. Wat na de vraag komt, staat in zijn Uitleg of in een
    // volgende stap.
    const fout: string[] = [];
    for (const s of schermen) {
      const vraag = s.blokken.map((b) => Boolean(b.inVraag)).lastIndexOf(true);
      if (vraag < 0) continue;
      const na = s.blokken.slice(vraag + 1);
      const dicht = na.findIndex((b) => b.soort === 'antwoord');
      if ((dicht < 0 ? na : na.slice(0, dicht)).some((b) => b.soort === 'code'))
        fout.push(`${s.les} | ${s.naam}`);
    }
    expect(fout).toEqual([]);
  });

  it('een les die met de vraag opent, heeft de stap Voorspel', () => {
    // In 33 lessen heet de stap met de vraag Voorspel. Acht lessen openen
    // ermee, en daar heette hij De basis.
    const fout = schermen
      .filter((s) => s.blokken.some((b) => b.soort === 'vraag'))
      .filter((s) => s.naam.endsWith(' › De basis'))
      .map((s) => `${s.les} | ${s.naam}`);
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
