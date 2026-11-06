import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
        if (kop.startsWith('## Opdracht') && !pad.endsWith('04-shopping.mdx')) {
          const stappen = voor.match(/Begin klein[^\n]*\n\n((?:\d+\. .*\n)+)/);
          if (!stappen || stappen[1].trim().split('\n').length < 2)
            fouten.push(`${kop}: geen genummerde stappen "Begin klein"`);
        }
      }
      expect(fouten).toEqual([]);
    });
  }
});
