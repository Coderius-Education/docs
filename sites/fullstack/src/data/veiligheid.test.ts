import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De reeks Veiligheid heeft per zwakheid een map met stappen: eerst de
// zwakheid (zelf nadoen), dan de oplossing, en als laatste wat er in de
// praktijk nog gebeurt. Elke zwakheid is een reeks kleine lessen met in elke
// les één idee; drie stappen per zwakheid ging te snel.
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

  it('elke zwakheid is opgesplitst in kleine lessen, met in elke les één idee', () => {
    // Drie stappen per zwakheid ging te snel: elke les behandelde te veel.
    // Wie mag wat, XSS en Cookies houden voorlopig drie stappen; zie de
    // beschrijving van PR #111.
    for (const map of ['dos', 'wachtwoorden', 'invoer']) {
      expect(stappenVan(map).length, `veiligheid/${map}`).toBeGreaterThanOrEqual(6);
    }
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

      it('elke opdracht heeft een antwoord', () => {
        for (const stap of stappen.filter((s) => s !== 'praktijk')) {
          const opdrachten = lees(map, stap)
            .split(/^### /m)
            .slice(1)
            .filter((d) => d.startsWith('Opdracht'));
          expect(opdrachten.length, `${map}/${stap} heeft geen opdracht`).toBeGreaterThan(0);
          for (const opdracht of opdrachten) {
            const deel = opdracht.split(/^## /m)[0];
            expect(deel, `${map}/${stap}: ${opdracht.split('\n')[0]}`).toContain(
              '<summary>Antwoord',
            );
          }
        }
      });

      // In een lange reeks verandert elke les één stuk van main.py. Onderaan
      // staat dan het hele bestand, zodat een leerling die de draad kwijt is
      // weer bij kan komen.
      if (stappen.length > 3) {
        it('elke les die main.py verandert, toont het hele bestand', () => {
          for (const stap of stappen.filter((s) => s !== 'praktijk')) {
            const tekst = lees(map, stap);
            if (!tekst.includes('@app.')) continue;
            expect(tekst, `${map}/${stap}`).toContain(
              '<summary>Zo ziet je `main.py` er nu uit</summary>',
            );
          }
        });
      }

      it('elke les met een endpoint heeft ergens het hele main.py', () => {
        // Losse stukken (een endpoint hier, een import daar) laten de leerling
        // zelf een server in elkaar zetten, en daar ging het mis: in XSS en
        // Invoer ontbraken de imports.
        for (const stap of stappen.filter((s) => s !== 'praktijk')) {
          const tekst = lees(map, stap);
          if (!tekst.includes('@app.')) continue;
          const blokken = [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
          expect(
            blokken.some((b) => b.includes('app = FastAPI()') && b.includes('@app.')),
            `${map}/${stap}`,
          ).toBe(true);
        }
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
