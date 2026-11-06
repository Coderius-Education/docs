import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { verborgenCode } from '../components/PyRunner/verborgen';
import { ML_MAPPEN } from '../lib/mlSidebar';

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

const projecten = ML_MAPPEN.flatMap((map) =>
  readdirSync(join(DOCS, map))
    .filter((f) => /\.mdx$/.test(f))
    .map((f) => `${map}/${f}`),
);

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
