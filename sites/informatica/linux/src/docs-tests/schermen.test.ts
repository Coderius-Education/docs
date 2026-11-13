import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elk onderdeel van een les een eigen scherm: een
// tabblad, of een stap daarin. Een zin die naar een andere plek op de pagina
// wijst, klopt dan niet meer vanzelf. Bij het omzetten stond in vier lessen
// "de terminal hieronder", terwijl de oefenterminal naast de tekst staat en
// bij elk scherm hoort, en begon een scherm met "Per groepje:" over een tabel
// op het scherm ervoor. Deze test leest elke les zoals de build hem in
// schermen verdeelt.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan: schermenVanBron } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: 'tekst' | 'code' | 'veld' | 'tabel' | 'lijst' | 'antwoord'; tekst: string };
type Scherm = { les: string; tab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const lessen = ['terminal', 'wsl'].flatMap((map) =>
  readdirSync(join(DOCS, map))
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({ naam: `${map}/${f}`, bron: readFileSync(join(DOCS, map, f), 'utf8') })),
);

const parse = await mdxParser();
const schermen: Scherm[] = lessen.flatMap((les) =>
  schermenVanBron(les.bron, parse, { velden: ['LinuxTerminal'] }).map((s: Omit<Scherm, 'les'>) => ({
    les: les.naam,
    ...s,
  })),
);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';
const waar = (s: Scherm, b: Blok) => `${s.les} | ${s.naam}: ${b.tekst.trim().slice(0, 80)}`;

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(lessen).toHaveLength(24);
    expect(schermen.length).toBeGreaterThan(150);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
  });

  it('"hieronder" wijst naar iets dat in hetzelfde scherm volgt', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (b.soort !== 'tekst' || !/\b(hieronder|onderstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(i + 1).some(isTeZien)) fout.push(waar(s, b));
      });
    }
    expect(fout).toEqual([]);
  });

  it('"hierboven" wijst naar iets dat in hetzelfde scherm ervoor staat', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (!/\b(hierboven|bovenstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(0, i).some(isTeZien)) fout.push(waar(s, b));
      });
    }
    expect(fout).toEqual([]);
  });

  it('de oefenterminal heet de oefenterminal, niet "de terminal hieronder"', () => {
    // Op een breed scherm staat hij naast de tekst, op een telefoon eronder,
    // en bij een opdracht tussen de tekst en de tip.
    const fout = lessen
      .filter((les) => les.naam.startsWith('terminal/'))
      .flatMap((les) =>
        [
          ...les.bron.matchAll(
            /[^\n]*\b(terminal (hieronder|hierboven|hiernaast|rechts|links)|(onder|boven|naast) de (oefen)?terminal)\b[^\n]*/gi,
          ),
        ].map((m) => `${les.naam}: ${m[0].slice(0, 90)}`),
      );
    expect(fout).toEqual([]);
  });

  it('een scherm begint niet met een zin die op het vorige doorgaat', () => {
    // De doorloop als leerling vond er drie die de lijst niet kende: "Een
    // naam werkt ook:" (7.1), "Na het opstarten opent er" en "Je ziet nu een
    // prompt" (5.1). Een scherm noemt zelf waar het over gaat.
    const DOORGAAND =
      /^(Daaronder|Daarom|Daarna|Daarmee|Daardoor|Daarin|Daarvoor|Hierna|Erna|Eronder|Erboven|Per groepje|Hetzelfde|Ook hier|Draait het|Nu|Dan|Ook|Je ziet nu|Na het opstarten|(Een|De|Het) \S+ (werkt|kan|mag) ook)(?![\wà-ÿ])/;
    for (const zin of [
      'Een naam werkt ook: ping -c 3 one.one.one.one',
      'Na het opstarten opent er een zwart venster.',
      'Je ziet nu een prompt zoals deze:',
    ])
      expect(DOORGAAND.test(zin), zin).toBe(true);
    expect(DOORGAAND.test('Nummers zijn bij jou anders.')).toBe(false);
    const fout = schermen
      .filter((s, i) => i > 0 && schermen[i - 1].les === s.les)
      .filter((s) => s.blokken[0]?.soort === 'tekst' && DOORGAAND.test(s.blokken[0].tekst.trim()))
      .map((s) => waar(s, s.blokken[0]));
    expect(fout).toEqual([]);
  });

  it('een scherm wijst niet vooruit met "zo meteen"', () => {
    // "Die haal je zo meteen op" (6.1) wees naar de volgende stap zonder hem
    // te noemen. Wat op een ander scherm staat, heet bij zijn naam: "in de
    // volgende stap".
    const fout = schermen.flatMap((s) =>
      s.blokken
        .filter((b) => b.soort === 'tekst' && /\bzo meteen\b/i.test(b.tekst))
        .map((b) => waar(s, b)),
    );
    expect(fout).toEqual([]);
  });

  it('een stap of tabblad heeft geen nummer in zijn kop', () => {
    // De knop van een stap nummert al, en een tabblad dat "Stap 2" heet, zegt
    // niet wat erop staat: de installatie van WSL (5.1) had vier tabbladen
    // Stap 1 tot en met Stap 4. Een kop heet naar zijn inhoud; de les
    // verwijst ernaar met die naam.
    const fout = lessen.flatMap((les) =>
      [...les.bron.matchAll(/^#{2,3} Stap \d+.*$/gm)].map((m) => `${les.naam}: ${m[0]}`),
    );
    expect(fout).toEqual([]);
  });

  it('geen stap heet De basis', () => {
    // Zo heet wat in een sectie vóór de eerste `###` staat, en wat een les
    // vóór de eerste `##` uitlegt. Twintig stappen heetten zo, en in 4.1
    // ging De basis over `id`. Een les begint daarom met een `##` naar zijn
    // inhoud, met <Voorkennis> eronder, en een sectie met stappen begint met
    // een `###`.
    const fout = schermen
      .filter((s) => / › De basis$/.test(s.naam))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('geen twee koppen met dezelfde naam op een pagina', () => {
    // Een kop is ook een adres: een link naar de tweede kwam bij de eerste uit.
    const fout = lessen.flatMap((les) => {
      const koppen = [...les.bron.matchAll(/^#{2,3} (.+)$/gm)].map((m) =>
        m[1].replace(/\s*\\\{#[^}]+\}\s*$/, '').trim(),
      );
      return koppen.filter((k, i) => koppen.indexOf(k) !== i).map((k) => `${les.naam}: ${k}`);
    });
    expect(fout).toEqual([]);
  });
});

describe('de oefenterminal staat naast de les', () => {
  const terminalLessen = lessen.filter((les) => les.naam.startsWith('terminal/'));

  it('elke les in terminal/ heeft één oefenterminal voor de hele les', () => {
    // Die staat in de kolom naast de tabbladen, bij elk scherm: de leerling
    // typt de uitleg, de voorspelvraag en de fouten erin mee. Twee zouden
    // onder elkaar in de kolom staan.
    expect(terminalLessen).toHaveLength(10);
    for (const les of terminalLessen) {
      const zonderOpdracht = [...les.bron.matchAll(/<LinuxTerminal(?![^>]*opdracht=)[^>]*\/>/g)];
      expect(zonderOpdracht, les.naam).toHaveLength(1);
    }
  });

  it('de terminal van de les staat naast elk tabblad, die van een opdracht naast het zijne', () => {
    const bron = readFileSync(join(SITE, 'src/components/LinuxTerminal/index.js'), 'utf8');
    expect(bron).toMatch(/<LesNaast heleLes=\{!props\.opdracht\}>/);
  });

  it('de terminal start pas als hij te zien is', () => {
    // In een tabblad dat dicht is, heeft hij geen maten: xterm paste zich dan
    // aan op twee kolommen, en de welkomsttekst stond op een rij van twee
    // tekens breed. Of dat in de browser klopt, meet alleen een browser.
    const bron = readFileSync(join(SITE, 'src/components/LinuxTerminal/index.js'), 'utf8');
    expect(bron).toMatch(/const teZien = \(\) =>[^;]*clientWidth > 0;/);
    expect(bron).toMatch(/if \(teZien\(\)\) start\(\);/);
    expect(bron).toMatch(/if \(!teZien\(\)\) return;\s*if \(passer\) passer\.fit\(\);/);
  });

  it('de site heeft tabbladen aan, behalve waar je zoekt, print of een overzicht leest', () => {
    // De startpagina is een overzicht: met tabbladen stond "Begin bij 1.1"
    // op het vijfde, en was de link naar de eerste les tot dan weg.
    expect(readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8')).toMatch(/lesTabs: true/);
    for (const pad of [
      'index.mdx',
      'cheatsheet.mdx',
      'begrippen.mdx',
      'unplugged/boom.mdx',
      'unplugged/rechten.mdx',
    ])
      expect(readFileSync(join(DOCS, pad), 'utf8'), pad).toMatch(/^les_tabs: false$/m);
  });
});
