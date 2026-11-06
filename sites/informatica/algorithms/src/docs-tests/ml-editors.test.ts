import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ML_MAPPEN } from '../lib/mlSidebar';

// Bij elke opdracht en elke Bouw zelf van de route machine learning hoort
// een editor om in te werken, vóór de tip. Eerst had alleen Shopping er een;
// bij de rest moest een leerling terugscrollen naar de runner van het
// onderzoek en daar de code van het onderzoek overschrijven.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

const projecten = ML_MAPPEN.flatMap((map) =>
  readdirSync(join(DOCS, map))
    .filter((f) => /\.mdx$/.test(f))
    .map((f) => `${map}/${f}`),
);

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
