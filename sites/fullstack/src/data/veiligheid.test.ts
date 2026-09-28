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

  const route = sidebars.veiligheidSidebar as unknown as (string | Categorie)[];
  const eersteMap = (c: Categorie) => c.items[0].split('/')[1];

  it('de route begint met de startpagina en het gereedschap, en eindigt met je eigen project', () => {
    // Zonder startpagina opende de navbar midden in een reeks, zonder te zeggen
    // waar de route over gaat of wat de spelregel is. De afsluiter bundelt wat
    // de leerling op zijn eigen project moet toepassen.
    expect(route.slice(0, 2)).toEqual(['veiligheid/index', 'veiligheid/gereedschap']);
    expect(route.at(-1)).toBe('veiligheid/eigen-project');
  });

  it('de reeksen staan van dichtbij het eigen gastenboek naar ver weg', () => {
    // Invoer bouwt direct op Server of browser?; DoS gaat over infrastructuur en
    // komt daarom als laatste. Cookies bouwt op de server uit Wie mag wat.
    expect(categorieen.map(eersteMap)).toEqual([
      'invoer',
      'xss',
      'toegang',
      'cookies',
      'wachtwoorden',
      'dos',
    ]);
  });

  it('elke reeks wijst aan het eind naar de volgende, de laatste naar de afsluiter', () => {
    categorieen.forEach((categorie, i) => {
      const map = eersteMap(categorie);
      const volgende = categorieen[i + 1];
      const doel = volgende
        ? `](../${volgende.items[0].slice('veiligheid/'.length)})`
        : '](../eigen-project)';
      expect(lees(map, 'praktijk'), `${map}/praktijk`).toContain(doel);
    });
  });

  it("de losse pagina's richten zich alleen op de eigen computer", () => {
    for (const pagina of ['index', 'gereedschap', 'eigen-project']) {
      const tekst = readFileSync(join(VEILIGHEID, `${pagina}.mdx`), 'utf8');
      for (const [, host] of tekst.matchAll(/https?:\/\/([^/:"'\s)]+)/g)) {
        expect(['127.0.0.1', 'localhost'], `${pagina}: ${host}`).toContain(host);
      }
      expect(tekst, pagina).toMatch(/:::danger\[Alleen je eigen [a-z]+\]/);
    }
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

      it('de eerste les zegt waar je werkt en geeft het hele startbestand', () => {
        // Elke reeks begon een nieuwe server, met steeds "gooi de database weg"
        // of "maak een nieuwe map". Nu weet de leerling vooraf waar hij werkt,
        // en heeft hij de hele server bij de hand.
        const tekst = lees(map, stappen[0]);
        expect(tekst, `${map}/${stappen[0]}`).toContain(':::note[Waar je werkt]');
        expect(tekst, `${map}/${stappen[0]}`).toContain(`\`veiligheid-${map}\``);
        const blokken = [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
        expect(
          blokken.some((b) => b.includes('app = FastAPI()')),
          `${map}/${stappen[0]}`,
        ).toBe(true);
      });

      it('de leerling past het toe op zijn eigen project, vlak voor de praktijk', () => {
        const voorPraktijk = stappen.at(-2) ?? '';
        expect(lees(map, voorPraktijk), `${map}/${voorPraktijk}`).toMatch(
          /### Opdracht \d+: Make - In je eigen project/,
        );
      });

      it('de praktijk begint bij wat je zelf doet, en houdt de rest in uitklapblokken', () => {
        // De praktijkpagina's waren tot 900 woorden met tien nieuwe termen. Nu
        // staat bovenaan wat de leerling zelf doet, en klapt hij open wat hij
        // over grote sites wil lezen.
        const tekst = lees(map, 'praktijk');
        expect(tekst, `${map}/praktijk`).toContain('## Wat jij zelf doet');
        expect(tekst, `${map}/praktijk`).toContain('## Wat grote sites nog meer doen');
        let diepte = 0;
        let inCode = false;
        const zichtbaar: string[] = [];
        for (const regel of tekst.replace(/^---[\s\S]*?---/, '').split('\n')) {
          if (regel.startsWith('```')) inCode = !inCode;
          if (inCode) continue;
          if (regel.startsWith('<details>')) diepte++;
          if (diepte === 0) zichtbaar.push(regel);
          if (regel.startsWith('</details>')) diepte--;
        }
        const woorden = zichtbaar.join(' ').split(/\s+/).filter(Boolean).length;
        expect(woorden, `${map}/praktijk: woorden buiten de uitklapblokken`).toBeLessThan(500);
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
