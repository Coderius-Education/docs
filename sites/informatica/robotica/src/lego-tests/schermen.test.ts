import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een les van robotica is in tabbladen verdeeld, en een tabblad met
// `###`-koppen in stappen (zie de root-CLAUDE.md, Les-tabbladen). Een tabblad
// of stap is alles wat de leerling op dat moment ziet. Bij het omzetten wees
// "hierboven" of "hieronder" op elf plekken naar een ander scherm (de grens
// uit "het programma hierboven" stond twee tabbladen terug), had een les twee
// tabbladen Voorspel, en heette een rij stappen "1 Stap 1, 2 Stap 2".
//
// Deze test leest elke les met dezelfde stap als de build
// (packages/shared/plugins/les-schermen.js). Faalt hij, wijs dan naar wat in
// hetzelfde scherm staat, of noem het andere scherm bij zijn naam ("zoals bij
// Welke kant op?", "in stap 1").

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan: schermenVanBron, blokken } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: string; tekst: string; inVraag?: boolean };
type Scherm = { les: string; tab: string; opTab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
// De vier ingangen: de naslag en RoboCup in docs/, de Lego-auto, de Golfbot.
const MAPPEN = ['docs', 'lego_auto', 'golfbot'];
// Onderdelen die iets laten zien zonder dat er een alinea of codeblok staat.
const ZICHTBAAR = [
  'Blokken',
  'ObjViewer',
  'SensorSimulator',
  'ServoSchijf',
  'Onderdelenlijst',
  'Keuzekaarten',
];

function bestanden(map: string, delen: boolean): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) => {
    const isDeel = f.name.startsWith('_');
    if (f.isDirectory()) return bestanden(join(map, f.name), delen || isDeel);
    if (!/\.mdx?$/.test(f.name)) return [];
    return delen || isDeel ? [`deel:${join(map, f.name)}`] : [join(map, f.name)];
  });
}

const alle = MAPPEN.flatMap((map) => bestanden(join(SITE, map), false));
const parse = await mdxParser();

const lessen = alle
  .filter((pad) => !pad.startsWith('deel:'))
  .map((pad) => {
    const naam = relative(SITE, pad);
    const schermen: Scherm[] = schermenVanBron(readFileSync(pad, 'utf8'), parse, {
      velden: ZICHTBAAR,
    }).map((s: Omit<Scherm, 'les'>) => ({ les: naam, ...s }));
    return { naam, schermen };
  });

// Een deel (`_delen/…`) staat in een tabblad van de pagina die het importeert,
// of op een pagina zonder tabbladen. Hier telt het als één scherm: wat een
// zin aanwijst, staat dan minstens in hetzelfde deel.
const delen: Scherm[] = alle
  .filter((pad) => pad.startsWith('deel:'))
  .map((pad) => pad.slice('deel:'.length))
  .map((pad) => ({
    les: relative(SITE, pad),
    tab: '',
    opTab: '',
    naam: 'deel',
    blokken: blokken(parse(readFileSync(pad, 'utf8')).children, ZICHTBAAR),
  }));

const schermen = [...lessen.flatMap((les) => les.schermen), ...delen];
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(lessen.filter((les) => les.schermen.length > 0).length).toBeGreaterThan(55);
    expect(schermen.length).toBeGreaterThan(350);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
    expect(delen.length).toBeGreaterThan(10);
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

  it('elk scherm van een les heeft een eigen naam', () => {
    // Deel 2 van de Lego-auto had twee tabbladen Voorspel: in de rij zijn die
    // niet uit elkaar te houden, en een link opent het eerste.
    const fout = lessen.flatMap((les) => {
      const namen = les.schermen.map((s) => s.naam);
      return [...new Set(namen.filter((n, i) => namen.indexOf(n) !== i))].map(
        (n) => `${les.naam}: ${n}`,
      );
    });
    expect(fout).toEqual([]);
  });

  it('geen stap in een tabblad heet "Stap 1"', () => {
    // De stappen hebben al een nummer. De stap van de build geeft "Stap 2:
    // Kies een pin" het label "Kies een pin"; een `### Stap 2` zonder titel
    // erachter zegt niet wat erin staat. Een tabblad mag wel "Stap 1" heten:
    // de rij tabbladen heeft geen nummers.
    const fout = schermen
      .filter((s) => /› Stap \d/.test(s.naam))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('de rij tabbladen past op één regel', () => {
    // Een tweede regel kost elk paneel veertig pixels. Naast de lessenlijst is
    // op 1280 pixels 948 pixels over; een tabblad kost ongeveer 30 pixels plus
    // 7 per letter (gemeten in Chromium: "Opdracht 5.7.a" is 128 breed,
    // "5.7.b" 65). Het echte getal meet alleen een browser
    // (`node scripts/meet-les-tabs.mjs robotica`).
    const fout = lessen.flatMap((les) => {
      const labels = [...new Set(les.schermen.map((s) => s.opTab))];
      const breedte = labels.reduce((som, label) => som + 30 + 7 * label.length, 0);
      return breedte > 948
        ? [`${les.naam}: ${labels.length} tabbladen, ongeveer ${breedte} px`]
        : [];
    });
    expect(fout).toEqual([]);
  });

  it('een lange rij opdrachten toont na de eerste alleen het nummer', () => {
    // Code beter begrijpen: acht opdrachten, een uitleg en een afsluiter.
    const les = lessen.find((l) => l.naam === join('lego_auto', 'analoog_ir', 'while_loop.md'));
    const opTab = [...new Set(les?.schermen.map((s) => s.opTab))];
    expect(opTab.slice(1, 4)).toEqual(['Opdracht 5.7.a', '5.7.b', '5.7.c']);
  });
});

describe('de docentenhandleiding', () => {
  it('gaat over de literatuur, en is verder kort', () => {
    // Wij gaan niet over hoe iemand lesgeeft (schrijfgids §15). De oude
    // handleiding had secties Didactische aanpak en Klassikaal gebruik, met
    // lesadvies; wat nodig is om het materiaal te gebruiken, staat in het
    // materiaal zelf. De handleiding laat zien waar de opbouw op steunt.
    const mdx = readFileSync(join(SITE, 'src/theme/MDXComponents.tsx'), 'utf8');
    expect(mdx).toMatch(/^\s+Werkvormen,$/m);
    const handleiding = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    expect(handleiding).toMatch(/^<Werkvormen \/>$/m);
    expect(handleiding).toContain('site:didactiek/');
    expect(handleiding.split('\n').length).toBeLessThanOrEqual(50);
    expect(handleiding).not.toMatch(/^## .*(Klassikaal|Didactische aanpak|Leerlijn)/m);
    // De nakijker en de leerdoelen blijven vindbaar.
    expect(handleiding).toContain('site:robotica/robot-checken');
    expect(handleiding).toContain('site:robotica/leerdoelen');
  });
});
