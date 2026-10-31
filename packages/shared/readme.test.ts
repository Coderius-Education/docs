import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DOCENTEN_SITES, SITES, siteDir } from './sites.js';

// De README van de repo heeft een tabel met alle cursussen: map, adres en
// omschrijving. Die gegevens staan in de registry, en een tabel ernaast loopt
// stil uit de pas zodra een cursus erbij komt of verhuist. Deze test legt elke
// rij naast de registry, in beide richtingen.

const readme = readFileSync(fileURLToPath(new URL('../../README.md', import.meta.url)), 'utf8');

/** De rijen van de cursustabel: | Cursus | Map | Online | Waarover |. */
const rijen = readme
  .split('\n')
  .filter((regel) => /^\| .+ \| `sites\//.test(regel))
  .map((regel) => {
    const [, map, online, waarover] = regel
      .split('|')
      .slice(1, -1)
      .map((cel) => cel.trim());
    return { map: map.replace(/`/g, ''), online, waarover };
  });

describe('de cursustabel in de README', () => {
  const cursussen = [...SITES, ...DOCENTEN_SITES];

  it('heeft een rij voor elke cursus en docentensite, en geen andere', () => {
    expect(rijen.map((r) => r.map).sort()).toEqual(cursussen.map((s) => siteDir(s.id)).sort());
  });

  it.each(cursussen.map((s) => [s.id, s]))(
    '%s: map, adres en omschrijving uit de registry',
    (_, site) => {
      const rij = rijen.find((r) => r.map === siteDir(site.id));
      expect(rij?.online).toBe(site.url);
      // De registry laat soms de punt weg; de tabel eindigt elke zin met een punt.
      expect(rij?.waarover.replace(/\.$/, '')).toBe(site.description.replace(/\.$/, ''));
    },
  );
});
