import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elk onderdeel van een les een eigen scherm: een
// tabblad, of een stap daarin. Een zin die naar een andere plek op de pagina
// wijst, klopt dan niet meer vanzelf. Bij de eerste review stond in 14 van de
// 33 lessen een Predict die vroeg naar "de startcode in de editor hieronder",
// terwijl de editor in het volgende tabblad stond: de leerling kon niet
// voorspellen. Deze test leest elke les zoals de build hem in schermen
// verdeelt, en houdt per scherm bij wat er te zien is.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan: schermenVanBron } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

// 'antwoord' is het begin van een uitklapblok: wat erna komt, ziet de leerling
// pas als hij het opent.
type Blok = { soort: 'tekst' | 'code' | 'veld' | 'tabel' | 'lijst' | 'antwoord'; tekst: string };
type Scherm = { les: string; tab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const lessen = readdirSync(DOCS, { withFileTypes: true })
  .filter((map) => map.isDirectory())
  .flatMap((map) =>
    readdirSync(join(DOCS, map.name))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => ({
        naam: `${map.name}/${f}`,
        bron: readFileSync(join(DOCS, map.name, f), 'utf8'),
      })),
  );

const parse = await mdxParser();

/** De schermen van één les (packages/shared/plugins/les-schermen.js). */
function schermenVan(les: { naam: string; bron: string }): Scherm[] {
  return schermenVanBron(les.bron, parse).map((s: Omit<Scherm, 'les'>) => ({
    les: les.naam,
    ...s,
  }));
}

const schermen = lessen.flatMap(schermenVan);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';

/** De startcode van de oefenvelden van een les, regel voor regel. */
function startRegels(bron: string): string[] {
  return (
    [...bron.matchAll(/export const start\w* = `([\s\S]*?)`;/g)]
      // In de bron staat de code in een template literal: `\\n` is daar `\n`.
      .flatMap((m) => m[1].replace(/\\([\\`$])/g, '$1').split('\n'))
      .map((regel) => regel.trim())
  );
}

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(schermen.length).toBeGreaterThan(250);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
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
        if (i === 0) fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('wie de startcode noemt, heeft hem in beeld: in een oefenveld, of in Predict', () => {
    // Een willekeurig codeblok is niet genoeg: loops noemde "de CSS-regel in
    // de startcode" naast een fragment zonder CSS.
    const fout = schermen
      .filter((s) => s.blokken.some((b) => b.soort === 'tekst' && /\bstartcode\b/i.test(b.tekst)))
      .filter((s) => s.tab !== 'Predict' && !s.blokken.some((b) => b.soort === 'veld'))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('Predict gaat over de startcode van het oefenveld', () => {
    // De leerling voorspelt, en draait daarna in het veld dezelfde code om te
    // zien of het klopte. In twaalf lessen ging Predict over een los
    // fragment (een loop met "Ronde 0, 1, 2") en stond in het veld iets
    // anders (de tafel van 5): er viel niets na te kijken. De code staat er
    // nu twee keer; verandert de startcode, dan moet Predict mee.
    const fout: string[] = [];
    const predicts = schermen.filter((s) => s.tab === 'Predict');
    for (const s of predicts) {
      const les = lessen.find((l) => l.naam === s.les);
      const start = startRegels(les?.bron ?? '');
      // Alleen wat vóór het antwoord staat: dat is wat de leerling voorspelt.
      const einde = s.blokken.findIndex((b) => b.soort === 'antwoord');
      const regels = s.blokken
        .slice(0, einde < 0 ? undefined : einde)
        .filter((b) => b.soort === 'code')
        .flatMap((b) => b.tekst.split('\n'))
        .map((regel) => regel.trim())
        .filter(Boolean);
      if (regels.length === 0) fout.push(`${s.les}: Predict toont geen code`);
      for (const regel of regels)
        if (!start.includes(regel)) fout.push(`${s.les}: niet in de startcode: ${regel}`);
    }
    expect(fout).toEqual([]);
    expect(predicts.length).toBeGreaterThanOrEqual(30);
  });

  it('noemt het oefenveld en zijn onderdelen overal hetzelfde', () => {
    // In het veld staat "Voorbeeld" en "Console". De lessen zeiden ook
    // "preview", "de editor" en "het consolepanel".
    const anders = /\b(preview|consolepanel|de editor)\b/i;
    const fout = schermen.flatMap((s) =>
      s.blokken
        .filter((b) => b.soort === 'tekst' && anders.test(b.tekst))
        .map((b) => `${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`),
    );
    expect(fout).toEqual([]);
  });

  it('elk scherm van een les heeft een eigen naam', () => {
    // Het tabblad Uitleg heeft de secties van de les als stappen; twee
    // stappen met hetzelfde label zijn in de rij niet uit elkaar te houden.
    const fout = lessen.flatMap((les) => {
      const namen = schermenVan(les).map((s) => s.naam);
      return namen.filter((n, i) => namen.indexOf(n) !== i).map((n) => `${les.naam}: ${n}`);
    });
    expect(fout).toEqual([]);
  });

  it('geen tabblad of stap heet "Stap 1"', () => {
    // De stappen in een tabblad hebben al een nummer. In events heetten twee
    // tabbladen "Stap 1" en "Stap 2": dat zegt niet wat erin staat.
    const fout = schermen
      .filter((s) => /\bStap \d/.test(s.naam))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('de rij tabbladen past op één regel', () => {
    // Een tweede regel kost elk paneel veertig pixels. In acht lessen over
    // JavaScript stond hij er, tot de uitleg één tabblad werd. Naast de
    // lessenlijst is op 1280 pixels 948 pixels over; een tabblad kost er
    // ongeveer 36 plus 7 per letter. Het echte getal meet alleen een browser
    // (`node scripts/meet-les-tabs.mjs web`).
    const fout = lessen.flatMap((les) => {
      const labels = [...new Set(schermenVan(les).map((s) => s.tab))];
      const breedte = labels.reduce((som, label) => som + 36 + 7 * label.length, 0);
      return breedte > 948
        ? [`${les.naam}: ${labels.length} tabbladen, ongeveer ${breedte} px`]
        : [];
    });
    expect(fout).toEqual([]);
  });

  it('een bestand in het oefenveld heet geen tab of tabblad', () => {
    // De onderdelen van de les zijn nu tabbladen. "Bekijk de startcode in
    // beide tabbladen" kon de tabbladen van de les betekenen, of index.html
    // en script.js in het veld.
    const bestand = '(?:index\\.html|style\\.css|script\\.js)';
    const patroon = new RegExp(
      `${bestand}\\*{0,2}[- ]\\*{0,2}tab(?:blad)?\\b|tab(?:blad)? \\*{0,2}${bestand}|beide tabbladen`,
      'i',
    );
    const fout = lessen.flatMap((les) =>
      les.bron
        .split('\n')
        .filter((regel) => patroon.test(regel))
        .map((regel) => `${les.naam}: ${regel.slice(0, 90)}`),
    );
    expect(fout).toEqual([]);
  });
});
