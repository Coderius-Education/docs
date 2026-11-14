import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { verborgenCode } from '../components/PyRunner/verborgen';
import { routeBestand, routePaginas } from './ml-route';

// Bij elke opdracht en elke Bouw zelf van de route machine learning hoort
// een editor om in te werken, vóór de tip. Eerst had alleen Shopping er een;
// bij de rest moest een leerling terugscrollen naar de runner van het
// onderzoek en daar de code van het onderzoek overschrijven.
//
// Daarna stond in die editors de hele code van het onderzoek, of de functie
// die de opdracht vroeg al half af. Een opdracht begint nu klein (één `if`,
// één worp, een functie die nog niets doet), met genummerde stappen om de
// code uit te breiden. De editor van een opdracht of een Bouw zelf is dus
// nooit de runner van het onderzoek, en bevat het antwoord niet.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

const projecten = routePaginas().map((id) => relative(DOCS, routeBestand(id)));

const startcode = (stuk: string) =>
  stuk.match(/<PyRunner\b[^>]*?initialCode=\{`([\s\S]*?)`\}/)?.[1] ?? null;

const regels = (code: string) =>
  code
    .split('\n')
    .map((r) => r.trimEnd())
    .filter((r) => r.trim() !== '' && !r.trim().startsWith('#'));

describe('elke opdracht van de route heeft een eigen editor', () => {
  for (const pad of projecten) {
    it(pad, () => {
      const delen = readFileSync(join(DOCS, pad), 'utf8').split(/^(## .*)$/m);
      const zonder: string[] = [];
      for (let i = 1; i < delen.length; i += 2) {
        if (!/^## (Opdracht|Bouw zelf)\b/.test(delen[i])) continue;
        const body = delen[i + 1];
        const tip = body.indexOf('<details>');
        if (!body.slice(0, tip < 0 ? body.length : tip).includes('<PyRunner'))
          zonder.push(delen[i]);
      }
      expect(zonder).toEqual([]);
    });
  }
});

describe('een opdracht begint klein', () => {
  for (const pad of projecten) {
    it(pad, () => {
      const delen = readFileSync(join(DOCS, pad), 'utf8').split(/^(## .*)$/m);
      const onderzoek = delen.findIndex((d) => d === '## Onderzoek');
      const vanOnderzoek = onderzoek < 0 ? null : startcode(delen[onderzoek + 1]);
      const fouten: string[] = [];
      for (let i = 1; i < delen.length; i += 2) {
        const kop = delen[i];
        if (!/^## (Opdracht|Bouw zelf)\b/.test(kop)) continue;
        const body = delen[i + 1];
        const tip = body.indexOf('<details>');
        const voor = body.slice(0, tip < 0 ? body.length : tip);
        const code = startcode(voor);
        if (code === null) continue;
        if (vanOnderzoek !== null && code.trim() === vanOnderzoek.trim())
          fouten.push(`${kop}: de editor is de runner van het onderzoek`);
        // Het antwoord mag niet al in de editor staan: elke regel van het
        // antwoord in de startcode betekent dat er niets te bouwen is.
        const antwoord = body.match(
          /<summary>Antwoord<\/summary>[\s\S]*?```python\n([\s\S]*?)```/,
        )?.[1];
        if (antwoord) {
          const start = new Set(regels(code));
          const eigen = regels(antwoord);
          if (eigen.length > 0 && eigen.every((r) => start.has(r)))
            fouten.push(`${kop}: het antwoord staat al in de editor`);
        }
        // Ook een Bouw zelf: daar zit de grootste sprong (de Méré, slim tegen
        // slim, het paard), en zonder stappen stond de leerling er alleen voor.
        const stappen = voor.match(/Begin klein[^\n]*\n\n((?:\d+\. .*\n)+)/);
        if (!stappen || stappen[1].trim().split('\n').length < 2)
          fouten.push(`${kop}: geen genummerde stappen "Begin klein"`);
      }
      expect(fouten).toEqual([]);
    });
  }
});

// Een stap noemt soms een naam die de leerling gebruikt: `web[pagina]`,
// `vorige[vakje]`, `beste_zet(score, stapel)`. Bij de surfer stond `pagina`
// nergens in de editor, en gaf de stap in de meeste runs een NameError. Elke
// naam die een stap als variabele of functie gebruikt, moet in de editor of
// de verborgen code staan, of in dezelfde of een eerdere stap gemaakt worden.

const INGEBOUWD = new Set(
  'print len range int str list abs min max sorted sum tuple dict random import'.split(' '),
);

function gebruikteNamen(ruw: string): { gebruikt: string[]; gemaakt: string[]; zelf: string[] } {
  const gebruikt: string[] = [];
  const gemaakt: string[] = [];
  // `pagina = random.choice(web[pagina])` gebruikt pagina voordat hij hem maakt:
  // die naam moet er dus al zijn.
  const zelf: string[] = [];
  // "in plaats van `slim(stapel)`" noemt een naam die je juist niet gebruikt.
  const stap = ruw.replace(/in plaats van `[^`]+`/g, '');
  // "een functie `leer(spellen)`" maakt de functie en zijn parameters.
  for (const m of stap.matchAll(/functie `([a-z_]\w*)\(([^)]*)\)`/g)) {
    gemaakt.push(
      m[1],
      ...m[2]
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    );
  }
  for (const m of stap.matchAll(/`([^`]+)`/g)) {
    if (/^[a-z_]\w*$/.test(m[1])) gemaakt.push(m[1]);
    for (const t of m[1].matchAll(/\bfor\s+([a-z_]\w*)(?:\s*,\s*([a-z_]\w*))?\s+in\b/g))
      gemaakt.push(t[1], ...(t[2] ? [t[2]] : []));
    const toekenning = m[1].match(/^([a-z_]\w*)\s*=(?!=)(.*)$/);
    if (toekenning && new RegExp(`\\b${toekenning[1]}\\b`).test(toekenning[2]))
      zelf.push(toekenning[1]);
  }
  for (const m of stap.matchAll(/`([^`]+)`/g)) {
    const code = m[1];
    for (const t of code.matchAll(/(?:def\s+)?\b([a-z_][a-z_0-9]*)\s*=(?!=)|def\s+([a-z_]\w*)/g))
      gemaakt.push(t[1] ?? t[2]);
    for (const t of code.matchAll(/(?<![.\w])([a-z_][a-z_0-9]*)\s*[[(]/g)) gebruikt.push(t[1]);
    for (const t of code.matchAll(/[[(,]\s*([a-z_][a-z_0-9]*)\s*(?=[\]),])/g)) gebruikt.push(t[1]);
  }
  return { gebruikt, gemaakt, zelf };
}

describe('een stap gebruikt alleen namen die er zijn', () => {
  for (const pad of projecten) {
    it(pad, () => {
      const delen = readFileSync(join(DOCS, pad), 'utf8').split(/^(## .*)$/m);
      const fouten: string[] = [];
      for (let i = 1; i < delen.length; i += 2) {
        const kop = delen[i];
        if (!/^## (Opdracht|Bouw zelf)\b/.test(kop)) continue;
        const body = delen[i + 1];
        const tip = body.indexOf('<details>');
        const voor = body.slice(0, tip < 0 ? body.length : tip);
        const runner = voor.match(
          /<PyRunner\s+(?:verborgen="([^"]+)"\s+)?initialCode=\{`([\s\S]*?)`\}/,
        );
        if (!runner) continue;
        // Een Bouw zelf bouwt voort op de opdracht erboven ("zet het zoeken
        // uit de opdracht eronder"): wat daar staat, mag een stap noemen.
        const k = delen.findIndex((d, j) => j < i && d.startsWith('## Opdracht'));
        const opdracht = kop.startsWith('## Bouw zelf') && k > 0 ? delen[k + 1] : '';
        const bekend = `${runner[2]}\n${runner[1] ? (verborgenCode(runner[1]) ?? '') : ''}\n${opdracht}`;
        const stappen = voor.match(/Begin klein[^\n]*\n\n((?:\d+\. .*\n)+)/)?.[1] ?? '';
        const gemaakt = new Set<string>();
        for (const stap of stappen.trim().split('\n')) {
          const namen = gebruikteNamen(stap);
          for (const n of namen.zelf) {
            if (!gemaakt.has(n) && !new RegExp(`\\b${n}\\b`).test(bekend))
              fouten.push(`${kop}: \`${n}\` wordt gebruikt voordat hij bestaat`);
          }
          for (const n of namen.gemaakt) gemaakt.add(n);
          for (const n of namen.gebruikt) {
            if (INGEBOUWD.has(n) || gemaakt.has(n)) continue;
            if (!new RegExp(`\\b${n}\\b`).test(bekend))
              fouten.push(`${kop}: \`${n}\` uit "${stap.slice(0, 50)}…"`);
          }
        }
      }
      expect(fouten).toEqual([]);
    });
  }
});

// Een eindeloze while-loop laat het tabblad vastlopen: de speeltuin heeft geen
// stopknop. Bij het paard gebeurde dat met elke sprong van het bord af, en de
// pagina waarschuwde nergens. Elke pagina waar de leerling een while schrijft,
// heeft een :::caution die het zegt.

describe('een pagina met een while waarschuwt voor een tabblad dat vastloopt', () => {
  for (const pad of projecten) {
    it(pad, () => {
      const tekst = readFileSync(join(DOCS, pad), 'utf8');
      const antwoorden = [...tekst.matchAll(/<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/g)]
        .map((m) => m[1])
        .join('\n');
      if (!/^\s*while /m.test(antwoorden)) return;
      const waarschuwingen = [...tekst.matchAll(/^:::caution\n([\s\S]*?)\n:::/gm)].map((m) => m[1]);
      expect(waarschuwingen.some((w) => /tabblad/.test(w) && /vast/.test(w))).toBe(true);
    });
  }
});

// Een antwoord dat op de editor voortbouwt (draaien-met: blok-erboven), zegt
// waar het komt: "Dit vervangt …" of "Dit komt onder …". Zonder die zin moest
// de leerling raden of hij het onder zijn code plakt of erover.

describe('een antwoord dat op de editor voortbouwt, zegt waar het komt', () => {
  for (const pad of projecten) {
    it(pad, () => {
      const delen = readFileSync(join(DOCS, pad), 'utf8').split(/^(## .*)$/m);
      const fouten: string[] = [];
      for (let i = 1; i < delen.length; i += 2) {
        if (!/^## (Opdracht|Bouw zelf)\b/.test(delen[i])) continue;
        const antwoord = delen[i + 1].match(
          /<summary>Antwoord<\/summary>\n\n([\s\S]*?)\{\/\* draaien-met: blok-erboven \*\/\}/,
        );
        if (antwoord && !/Dit (vervangt|komt onder)/.test(antwoord[1])) fouten.push(delen[i]);
      }
      expect(fouten).toEqual([]);
    });
  }
});

// De opdracht en de editor op één scherm. Eerst stonden de stappen van
// "Begin klein" en de verwachte uitvoer op De opdracht, en de editor op Aan
// de slag: de leerling klikte per stap heen en weer, en elf keer zei De
// opdracht "in de editor staat …" op een scherm zonder editor. De stappen
// staan nu op het scherm met de editor, en De opdracht noemt de editor niet.
// De test leest de schermen zoals de build ze maakt (les-schermen.js).

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);
const parse = await mdxParser();

type Blok = { soort: string; tekst: string };
type Scherm = { tab: string; naam: string; blokken: Blok[] };

/** De fases waarvoor dit al geldt; D tot en met F volgen in dezelfde ronde. */
const FASES_OP_EEN_SCHERM = ['ml-regels', 'ml-afstand', 'ml-kans'];
const opEenScherm = projecten.filter((pad) => FASES_OP_EEN_SCHERM.includes(pad.split('/')[0]));

const schermen = (pad: string): Scherm[] =>
  schermenVan(readFileSync(join(DOCS, pad), 'utf8'), parse, { velden: ['PyRunner'] });

/** Wat de leerling ziet voordat hij een uitklapblok opent. */
const zichtbaar = (s: Scherm) => {
  const i = s.blokken.findIndex((b) => b.soort === 'antwoord');
  return i < 0 ? s.blokken : s.blokken.slice(0, i);
};

const isOpdracht = (s: Scherm) => /^(Opdracht|Bouw zelf)/.test(s.tab);

describe('de opdracht en de editor staan op één scherm', () => {
  it('de route heeft pagina’s om te lezen', () => {
    expect(opEenScherm.length).toBeGreaterThan(40);
  });

  for (const pad of opEenScherm) {
    it(pad, () => {
      const fouten: string[] = [];
      const lijst = schermen(pad);
      for (const s of lijst.filter(isOpdracht)) {
        const tekst = zichtbaar(s).filter((b) => b.soort !== 'veld');
        if (s.naam.endsWith('› De opdracht')) {
          if (tekst.some((b) => /\beditor\b/i.test(b.tekst)))
            fouten.push(`${s.naam}: noemt de editor, die op een ander scherm staat`);
          if (tekst.some((b) => /^Verwachte uitvoer/.test(b.tekst.trim())))
            fouten.push(`${s.naam}: de verwachte uitvoer hoort bij de editor`);
        }
        const begin = s.blokken.findIndex((b) => /Begin klein/.test(b.tekst));
        if (begin >= 0 && !s.blokken.slice(begin).some((b) => b.soort === 'veld'))
          fouten.push(`${s.naam}: de stappen van "Begin klein" staan niet bij de editor`);
      }
      // Elke opdracht en Bouw zelf heeft zijn stappen: anders controleert de
      // lus hierboven niets.
      for (const tab of new Set(lijst.filter(isOpdracht).map((s) => s.tab))) {
        const metStappen = lijst.some(
          (s) => s.tab === tab && s.blokken.some((b) => /Begin klein/.test(b.tekst)),
        );
        if (!metStappen) fouten.push(`${tab}: geen "Begin klein"`);
      }
      expect(fouten).toEqual([]);
    });
  }
});

describe('de waarschuwing voor een while staat bij de editor', () => {
  // Bij tot het stilstaat stond de waarschuwing op Zo werkt het, twee
  // tabbladen van het veld waar de leerling de while schrijft.
  for (const pad of opEenScherm) {
    it(pad, () => {
      const lijst = schermen(pad);
      const metWhile = lijst.filter(
        (s) =>
          isOpdracht(s) && s.blokken.some((b) => b.soort === 'code' && /^\s*while /m.test(b.tekst)),
      );
      for (const s of metWhile) {
        const veld = lijst.find(
          (v) => v.tab === s.tab && v.blokken.some((b) => b.soort === 'veld'),
        ) as Scherm;
        expect(veld, s.tab).toBeDefined();
        const tekst = zichtbaar(veld).map((b) => b.tekst);
        expect(
          tekst.some((t) => /tabblad/.test(t) && /vast/.test(t)),
          `${veld.naam}: geen waarschuwing`,
        ).toBe(true);
      }
    });
  }
});

// Een regel van de startcode is hooguit 66 tekens. Een langere regel zet de
// uitvoer onder de code in plaats van ernaast, en dan zie je maar een paar
// regels. Voorbeelden uit de review: `spam = {…}` op één regel van 95
// tekens, de .split()-regels van zo'n 90 tekens, het fruit van eerlijk testen
// in regels van 90 tekens.

const MAX_REGEL = 66;

/**
 * Pagina's van fase D tot en met F die in dezelfde ronde worden ingekort.
 * Haal een pagina weg zodra zijn startcode past.
 */
const NOG_TE_LANG = new Set([
  'ml-neuronen/01-neuron/01-gewichten.mdx',
  'ml-neuronen/01-neuron/02-een-bias.mdx',
  'ml-neuronen/01-neuron/03-ja-of-nee.mdx',
  'ml-neuronen/03-op-weg-naar-traffic/07-aan-de-slag-met-traffic.mdx',
  'ml-spellen/01-nim-strategie/03-de-truc.mdx',
  'ml-spellen/03-op-weg-naar-nim/05-de-beste-toekomst.mdx',
  'ml-spellen/03-op-weg-naar-nim/06-ontdekken.mdx',
  'ml-zoeken/01-buren/02-de-buren.mdx',
  'ml-zoeken/01-buren/03-muren.mdx',
  'ml-zoeken/01-buren/05-je-eigen-doolhof.mdx',
  'ml-zoeken/02-kortste-weg/04-de-weg-tekenen.mdx',
]);

describe('een regel van de startcode is hooguit 66 tekens', () => {
  for (const pad of projecten) {
    it.skipIf(NOG_TE_LANG.has(pad))(pad, () => {
      const tekst = readFileSync(join(DOCS, pad), 'utf8');
      const lang = [...tekst.matchAll(/<PyRunner\b[^>]*?initialCode=\{`([\s\S]*?)`\}/g)]
        .flatMap((m) => m[1].split('\n'))
        .filter((r) => r.length > MAX_REGEL);
      expect(lang).toEqual([]);
    });
  }
});

// Het antwoord van verslaan en verbeteren liet de if en else weg die
// "spam" of "geen spam" printen, terwijl de opdracht eindigt met "tot het
// filter het wel als spam ziet". Beslist het filter in de editor, dan beslist
// het ook in het antwoord.

describe('een antwoord houdt de beslissing van het filter', () => {
  for (const pad of projecten) {
    it(pad, () => {
      const delen = readFileSync(join(DOCS, pad), 'utf8').split(/^(## .*)$/m);
      const fouten: string[] = [];
      for (let i = 1; i < delen.length; i += 2) {
        if (!/^## (Opdracht|Bouw zelf)\b/.test(delen[i])) continue;
        const code = startcode(delen[i + 1]);
        if (code === null || !code.includes('print("spam")')) continue;
        const antwoord = delen[i + 1].match(
          /<summary>Antwoord<\/summary>([\s\S]*?)```python\n([\s\S]*?)```/,
        );
        // Een antwoord dat zegt wat het vervangt, is een stuk van het programma.
        if (!antwoord || /Dit (vervangt|komt onder)/.test(antwoord[1])) continue;
        if (!antwoord[2].includes('print("spam")')) fouten.push(delen[i]);
      }
      expect(fouten).toEqual([]);
    });
  }
});
