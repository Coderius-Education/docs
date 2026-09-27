import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De reeks Veiligheid heeft per zwakheid een map met stappen: eerst de
// zwakheid (zelf nadoen), dan de oplossing, en als laatste wat er in de
// praktijk nog gebeurt. Een kleine zwakheid past in drie stappen (dos/); een
// grotere wordt een reeks kleine lessen met elk één idee (wachtwoorden/).
// Deze test houdt die vorm vast, en bewaakt dat een zelftest zich alleen op
// de eigen computer richt: een ander zijn server aanvallen is strafbaar.

const VEILIGHEID = fileURLToPath(new URL('../../docs/veiligheid', import.meta.url));

const zwakheden = readdirSync(VEILIGHEID).filter((n) =>
  statSync(join(VEILIGHEID, n)).isDirectory(),
);

const lees = (map: string, stap: string) =>
  readFileSync(join(VEILIGHEID, map, `${stap}.mdx`), 'utf8');

type Categorie = { type: string; label: string; items: string[] };
const categorieen = (sidebars.veiligheidSidebar as unknown as Categorie[]).filter(
  (c) => c.type === 'category',
);

function stappenVan(map: string): string[] {
  const categorie = categorieen.find((c) => c.items[0]?.startsWith(`veiligheid/${map}/`));
  return (categorie?.items ?? []).map((id) => id.slice(`veiligheid/${map}/`.length));
}

describe('de reeks Veiligheid', () => {
  it('er is minstens één zwakheid', () => {
    expect(zwakheden.length).toBeGreaterThan(0);
  });

  it('DoS blijft drie stappen: zwakheid, oplossing, praktijk', () => {
    expect(stappenVan('dos')).toEqual(['zwakheid', 'oplossing', 'praktijk']);
  });

  for (const map of zwakheden) {
    describe(map, () => {
      const stappen = stappenVan(map);

      it('staat als eigen categorie in de sidebar, met precies de bestanden uit de map', () => {
        expect(
          stappen.length,
          `geen categorie voor veiligheid/${map} in sidebars.ts`,
        ).toBeGreaterThan(2);
        const bestanden = readdirSync(join(VEILIGHEID, map))
          .filter((n) => n.endsWith('.mdx'))
          .map((n) => n.replace(/\.mdx$/, ''))
          .sort();
        expect(bestanden).toEqual([...stappen].sort());
      });

      it('eindigt met de praktijk', () => {
        expect(stappen.at(-1)).toBe('praktijk');
      });

      it('elke stap wijst naar de volgende', () => {
        stappen.slice(0, -1).forEach((stap, i) => {
          expect(lees(map, stap), `${map}/${stap}`).toContain(`](./${stappen[i + 1]})`);
        });
      });

      it('een zelftest richt zich alleen op de eigen computer', () => {
        for (const stap of stappen) {
          const tekst = lees(map, stap);
          for (const [, host] of tekst.matchAll(/https?:\/\/([^/:"'\s)]+)/g)) {
            expect(['127.0.0.1', 'localhost'], `${map}/${stap}: ${host}`).toContain(host);
          }
        }
        // De eerste stap met een zelftest waarschuwt ervoor. "Alleen je eigen
        // server", "Alleen je eigen database": wat er eigen moet zijn, hangt
        // af van de zwakheid.
        const eerste = stappen.find((stap) => /127\.0\.0\.1/.test(lees(map, stap)));
        if (eerste) {
          expect(lees(map, eerste), `${map}/${eerste}`).toMatch(
            /:::danger\[Alleen je eigen [a-z]+\]/,
          );
        }
      });
    });
  }
});
