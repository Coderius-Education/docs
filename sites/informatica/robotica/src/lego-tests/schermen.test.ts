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
    // op 1280 pixels 948 pixels over; een tabblad kost ongeveer 32 pixels plus
    // 7 per letter (gemeten in Chromium: "Opdracht 5.7.a" is 128 breed,
    // "5.7.b" 65, en tussen twee tabbladen zit 2 pixels). Met 30 kwam de arm
    // van de Golfbot met "Onderdelenlijst en tandwiel" op 947 uit, en stond
    // de rij in de browser op twee regels. Het echte getal meet alleen een
    // browser (`node scripts/meet-les-tabs.mjs robotica`).
    const fout = lessen.flatMap((les) => {
      const labels = [...new Set(les.schermen.map((s) => s.opTab))];
      const breedte = labels.reduce((som, label) => som + 32 + 7 * label.length, 0);
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

describe('wat een leerling moet zien of doen, is niet weggeklapt', () => {
  const bron = (pad: string) => readFileSync(pad.replace(/^deel:/, ''), 'utf8');

  it('een controlevraag staat open; alleen het antwoord is een uitklapblok', () => {
    // Vijftig vragen stonden in een dicht blok "Controlevraag" naast een dicht
    // blok "Antwoord": in een tabblad klikte je even makkelijk eerst op het
    // antwoord, en op vier schermen met de kop Controlevraag was verder niets
    // te zien.
    const fout = alle
      .filter((pad) => /<summary>\s*Controlevraag\s*<\/summary>/.test(bron(pad)))
      .map((pad) => relative(SITE, pad.replace(/^deel:/, '')));
    expect(fout).toEqual([]);
  });

  it('de uitleg van een voorspelvraag vraagt de leerling niets te doen', () => {
    // De uitleg verschijnt pas bij het goede antwoord. "Klik op Upload naar
    // robot" stond er bij de servo van de Golfbot in: wie het antwoord niet
    // raadde, zag de stap niet.
    const fout: string[] = [];
    for (const pad of alle) {
      for (const m of bron(pad).matchAll(/<Uitleg>([\s\S]*?)<\/Uitleg>/g)) {
        // Een antwoord in de gebiedende wijs ("Sluit A0 aan op …") mag: dat
        // herhaalt wat de leerling al deed. Een knop in de editor niet.
        if (/\b(Klik op|Upload naar|Druk op)\b/.test(m[1]))
          fout.push(`${relative(SITE, pad.replace(/^deel:/, ''))}: ${m[1].trim().slice(0, 70)}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de naslagpagina Er gaat iets mis heeft geen tabbladen', () => {
    // Wie daar komt, zoekt met Ctrl+F op een foutmelding, en die vindt geen
    // tekst in een tabblad dat dicht staat.
    const pagina = bron(join(SITE, 'docs', 'onderdelen', 'er-gaat-iets-mis.mdx'));
    expect(pagina).toMatch(/^les_tabs: false$/m);
  });
});

describe('elke kop op een pagina heeft een eigen adres', () => {
  // Een kop is ook een adres: een `###` is een stap met het id van zijn kop.
  // Docusaurus nummert dubbele koppen binnen één bestand, maar een deel is een
  // eigen bestand: `### Controlevraag` op de TOF-pagina en in het deel over
  // SDA en SCL gaven twee stappen met het id "controlevraag".
  const slug = (kop: string) =>
    kop
      .toLowerCase()
      .replace(/`/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-');
  const ids = (tekst: string) => {
    const gezien = new Map<string, number>();
    return [...tekst.matchAll(/^#{2,4} (.+?)(?: \\\{#([\w-]+)\})?$/gm)].map(([, kop, vast]) => {
      if (vast) return vast;
      const basis = slug(kop);
      const n = gezien.get(basis) ?? 0;
      gezien.set(basis, n + 1);
      return n ? `${basis}-${n}` : basis;
    });
  };
  const paginas = alle.filter((pad) => !pad.startsWith('deel:'));

  it('ook met de koppen van de delen die de pagina importeert', () => {
    const fout: string[] = [];
    for (const pad of paginas) {
      const tekst = readFileSync(pad, 'utf8');
      const delenVan = [...tekst.matchAll(/from '@site\/(docs\/[^']*_delen\/[^']+)'/g)].map(
        ([, deel]) => join(SITE, deel),
      );
      const alles = [tekst, ...delenVan.map((deel) => readFileSync(deel, 'utf8'))].flatMap(ids);
      const dubbel = [...new Set(alles.filter((id, i) => alles.indexOf(id) !== i))];
      if (dubbel.length) fout.push(`${relative(SITE, pad)}: ${dubbel.join(', ')}`);
    }
    expect(fout).toEqual([]);
  });

  it('de test ziet een dubbele kop in een deel', () => {
    // Zonder dit slaagt de test hierboven ook als hij niets leest.
    expect(ids('## Code\n\n### Uitleg\n\n### Uitleg\n')).toEqual(['code', 'uitleg', 'uitleg-1']);
    expect(ids('### Controlevraag \\{#i2c-controlevraag}\n')).toEqual(['i2c-controlevraag']);
    expect(paginas.some((pad) => /_delen\//.test(readFileSync(pad, 'utf8')))).toBe(true);
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

describe('wat de tweede doorloop als leerling vond', () => {
  const bron = (pad: string) => readFileSync(join(SITE, pad), 'utf8');
  const allePaden = alle.map((pad) => pad.replace(/^deel:/, ''));

  it('geen stap heeft een nummer in zijn kop: de knop nummert al', () => {
    // "Stap 1: kies de juiste interpreter" stond onder knop 2, want er stond
    // een stap Vooraf voor, en de tekst verwees dan naar "(Stap 1)". Op negen
    // pagina's, 23 schermen.
    const fout: string[] = [];
    for (const pad of allePaden) {
      for (const m of bron(relative(SITE, pad)).matchAll(/^###+ (Stap \d+\b.*)$/gm))
        fout.push(`${relative(SITE, pad)}: ${m[1]}`);
    }
    expect(fout).toEqual([]);
  });

  it('in de Golfbot heet geen tabblad "Stap 1"', () => {
    // De IR-sensor had tabbladen Stap 1 en Stap 2 met eigen genummerde
    // stappen. "Kies in stap 2 een grens" las je in stap 2 van Een grens
    // kiezen. De Lego-auto houdt zijn `## Stap N`: dat is daar het lesformat.
    const fout = lessen
      .filter((les) => les.naam.startsWith('golfbot/'))
      .flatMap((les) => les.schermen.filter((s) => /^Stap \d/.test(s.tab)).map((s) => s.naam));
    expect(fout).toEqual([]);
    for (const pad of ['bal-slaan.md', 'hout.md', 'uitbreiding.md', 'ir-sensor.md'])
      expect(bron(`golfbot/${pad}`), pad).not.toMatch(
        /stap [12] van \[de IR-sensor\]|in stap [12]\b/,
      );
  });

  it('het antwoord op een controlevraag noemt geen pin die de pagina nog niet noemde', () => {
    // Materiaal van de lijnsensor vroeg "op welke pinnen sluit je hem aan?"
    // voordat er één pin genoemd was, en het antwoord bij het scherm zei
    // "SDA (A4)", terwijl de cursus overal elders "SDA" schrijft. Een vraag
    // over wat op een eerdere stap stond, mag: daarom telt de hele pagina
    // tot aan de vraag, niet alleen het scherm.
    const PIN = /\b(A[0-7]|D\d{1,2}|SDA|SCL)\b/g;
    const fout: string[] = [];
    for (const pad of allePaden) {
      const tekst = bron(relative(SITE, pad));
      const vraag =
        /\*\*Controlevraag:\*\*([^\n]*)\n+<details>\s*<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/g;
      for (const m of tekst.matchAll(vraag)) {
        const ervoor = tekst.slice(0, m.index) + m[1];
        const nieuw = [...new Set([...m[2].matchAll(PIN)].map((p) => p[1]))].filter(
          (pin) => !ervoor.includes(pin),
        );
        if (nieuw.length) fout.push(`${relative(SITE, pad)}: ${nieuw.join(', ')}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('het lampje dat je in Deel 1 aanzet is oranje; het groene is het stroomlampje', () => {
    // Volgens de datasheet van de Nano RP2040 Connect is DL1 (groen) het
    // stroomlampje en DL2 (oranje) het lampje op pin 13. De les zei "het
    // groene lampje brandt", en dat brandde al voordat je iets deed.
    const les = bron('lego_auto/eerste_programma/deel1_lampje.md');
    const test = les.slice(les.indexOf('## Test het'), les.indexOf('## Voorspel'));
    expect(test).toMatch(/oranje lampje op het bord brandt/);
    expect(test).toMatch(/groene lampje brandde al/);
  });

  it('wie in de Lego-auto de TOF aansluit, leest op welke pin elke draad komt', () => {
    // Er stond alleen "steek de TOF in channel 0". Op channel 0 tot en met 3
    // staan de pinnen andersom dan op de TOF.
    const les = bron('lego_auto/afstand/uitlezen.md');
    const aansluiten = les.slice(les.indexOf('## Aansluiten'), les.indexOf('## Stap 1'));
    expect(aansluiten).toMatch(/pin met dezelfde naam/);
    expect(aansluiten).toMatch(/kruisen de draden/);
    expect(aansluiten).toContain('site:robotica/docs/onderdelen/tof#twee-met-mux');
    // Het anker bestaat.
    expect(bron('docs/onderdelen/tof.mdx')).toMatch(/^## .*\\\{#twee-met-mux\}$/m);
  });

  it('de tip bij Opdracht 10.4.a staat bij de opdracht, niet op een tabblad erna', () => {
    const les = bron('lego_auto/lijnvolgen/nu_jij.md');
    expect(les).not.toMatch(/^## Denk na$/m);
    const opdracht = les.slice(les.indexOf('## Opdracht 10.4.a'), les.indexOf('## Test het'));
    expect(opdracht).toMatch(/^### De opdracht$/m);
    expect(opdracht).toMatch(/^### Aan de slag$/m);
    // De vragen "voordat je typt" staan voor de code, de tip erna.
    expect(opdracht.indexOf('voordat je typt')).toBeLessThan(opdracht.indexOf('```python'));
    expect(opdracht.indexOf('<summary>Tip')).toBeGreaterThan(opdracht.indexOf('```python'));
  });

  it('de site is Nederlandstalig gebouwd', () => {
    // Met `defaultLocale: 'en'` stond er `lang="en"` op elke pagina, en onder
    // elke les "Previous" en "Next". createConfig zet nl; de site zet er
    // niets overheen.
    expect(bron('docusaurus.config.ts')).not.toMatch(/defaultLocale/);
  });
});
