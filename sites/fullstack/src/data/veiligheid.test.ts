import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De reeks Veiligheid heeft per zwakheid een map met drie stappen: de
// zwakheid (zelf nadoen), de oplossing, en wat er in de praktijk nog gebeurt.
// Deze test houdt die vorm vast, en bewaakt dat een zelftest zich alleen op
// de eigen computer richt: een ander zijn server aanvallen is strafbaar.

const VEILIGHEID = fileURLToPath(new URL('../../docs/veiligheid', import.meta.url));
const STAPPEN = ['zwakheid', 'oplossing', 'praktijk'];

const zwakheden = readdirSync(VEILIGHEID).filter((n) =>
  statSync(join(VEILIGHEID, n)).isDirectory(),
);

const lees = (map: string, stap: string) =>
  readFileSync(join(VEILIGHEID, map, `${stap}.mdx`), 'utf8');

type Categorie = { type: string; label: string; items: string[] };
const categorieen = (sidebars.veiligheidSidebar as unknown as Categorie[]).filter(
  (c) => c.type === 'category',
);

describe('de reeks Veiligheid', () => {
  it('er is minstens één zwakheid', () => {
    expect(zwakheden.length).toBeGreaterThan(0);
  });

  for (const map of zwakheden) {
    describe(map, () => {
      it('heeft precies de drie stappen', () => {
        const bestanden = readdirSync(join(VEILIGHEID, map))
          .filter((n) => n.endsWith('.mdx'))
          .map((n) => n.replace(/\.mdx$/, ''))
          .sort();
        expect(bestanden).toEqual([...STAPPEN].sort());
      });

      it('staat in de sidebar, met de stappen in volgorde', () => {
        const categorie = categorieen.find((c) => c.items[0]?.startsWith(`veiligheid/${map}/`));
        expect(categorie, `geen categorie voor veiligheid/${map} in sidebars.ts`).toBeDefined();
        expect(categorie?.items).toEqual(STAPPEN.map((s) => `veiligheid/${map}/${s}`));
      });

      it('elke stap wijst naar de volgende', () => {
        expect(lees(map, 'zwakheid')).toContain('](./oplossing)');
        expect(lees(map, 'oplossing')).toContain('](./praktijk)');
      });

      it('een zelftest richt zich alleen op de eigen computer', () => {
        for (const stap of STAPPEN) {
          const tekst = lees(map, stap);
          for (const [, host] of tekst.matchAll(/https?:\/\/([^/:"'\s)]+)/g)) {
            expect(['127.0.0.1', 'localhost'], `${map}/${stap}: ${host}`).toContain(host);
          }
        }
        const zwakheid = lees(map, 'zwakheid');
        if (/127\.0\.0\.1/.test(zwakheid)) {
          expect(zwakheid).toContain(':::danger[Alleen je eigen server]');
        }
      });
    });
  }
});
