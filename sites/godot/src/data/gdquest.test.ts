import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GDQUEST_LESSEN, GDQUEST_URL, gdquestLes } from './gdquest';

// Bewaakt de <GDQuestLes>-verwijzingen. Het component haalt de lestitel uit de
// datafile, dus een verkeerd nummer levert geen zichtbare fout op: het rendert
// dan stilletjes niets. Deze test maakt dat geval hard.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const PAGES = fileURLToPath(new URL('../pages', import.meta.url));

const GEBRUIK_RE = /<GDQuestLes\s+nummer=\{(\d+)\}/g;

function alleTeksten(map: string): { pad: string; inhoud: string }[] {
  const gevonden: { pad: string; inhoud: string }[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) {
      gevonden.push(...alleTeksten(volledig));
    } else if (/\.mdx?$/.test(entry.name)) {
      gevonden.push({ pad: volledig, inhoud: readFileSync(volledig, 'utf8') });
    }
  }
  return gevonden;
}

function gebruikteNummers(): { nummer: number; pad: string }[] {
  return [...alleTeksten(DOCS), ...alleTeksten(PAGES)].flatMap(({ pad, inhoud }) =>
    [...inhoud.matchAll(GEBRUIK_RE)].map((m) => ({ nummer: Number(m[1]), pad })),
  );
}

describe('GDQuest-lessenlijst', () => {
  it('heeft oplopende, unieke nummers en een titel per les', () => {
    const nummers = GDQUEST_LESSEN.map((l) => l.nummer);
    expect(new Set(nummers).size).toBe(nummers.length);
    expect(nummers).toEqual([...nummers].sort((a, b) => a - b));
    expect(GDQUEST_LESSEN.filter((l) => l.titel.trim() === '')).toEqual([]);
  });

  it('wijst naar de cursus zelf, niet naar een losse les-URL', () => {
    // We kunnen losse les-URL's niet controleren, dus verwijzen we op nummer.
    // Zie de toelichting in gdquest.ts.
    expect(GDQUEST_URL).toBe('https://gdquest.github.io/learn-gdscript/');
  });

  it('geeft undefined voor een nummer dat niet bestaat', () => {
    // Zonder deze check zou het component stil niets renderen bij een typefout.
    expect(gdquestLes(999)).toBeUndefined();
    expect(gdquestLes(5)?.titel).toBe('Coding Your First Function');
  });
});

describe('GDQuest-verwijzingen in de lessen', () => {
  it('verwijst alleen naar lessen die in de lijst staan', () => {
    const bekend = new Set(GDQUEST_LESSEN.map((l) => l.nummer));
    const kapot = gebruikteNummers()
      .filter(({ nummer }) => !bekend.has(nummer))
      .map(({ nummer, pad }) => `les ${nummer} in ${pad.slice(DOCS.length + 1)}`);

    expect(kapot).toEqual([]);
  });
});
