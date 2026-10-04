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

// Een les "heeft een endpoint" als een python-blok er een bevat. Een tip die
// "zoek naar `@app.post`" zegt, telt niet.
const heeftEndpoint = (tekst: string) =>
  [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].some((m) => m[1].includes('@app.'));

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

  it('de reeksen staan van makkelijk naar moeilijk', () => {
    // Invoer bouwt direct op Server of browser?. DoS stond een tijd als laatste,
    // "want het gaat over infrastructuur", maar het is één decorator en een
    // for-loop: lichter dan Wie mag wat met twee bezoekers en sessies. Nu staat
    // het als derde, en kan Wachtwoorden achteraan de limiet op /inloggen uit
    // DoS gebruiken. Cookies bouwt op de server uit Wie mag wat.
    expect(categorieen.map(eersteMap)).toEqual([
      'invoer',
      'xss',
      'dos',
      'toegang',
      'cookies',
      'wachtwoorden',
    ]);
  });

  it('"de laatste reeks" is ook echt de laatste', () => {
    // Toen DoS naar voren schoof, zeiden Invoer en Wachtwoorden nog "de
    // laatste reeks, Te veel verzoeken". Een zin met "laatste reeks" linkt naar
    // de laatste reeks; een praktijk die zegt dat het de laatste reeks was,
    // staat ook in de laatste.
    const mappen = categorieen.map(eersteMap);
    const laatste = mappen.at(-1);
    const fout: string[] = [];
    for (const map of zwakheden) {
      for (const stap of stappenVan(map)) {
        const tekst = lees(map, stap).replace(/\s+/g, ' ');
        for (const m of tekst.matchAll(
          /laatste reeks[^.]{0,80}?\]\((?:\.\.\/|\/docs\/veiligheid\/)([a-z-]+)\//g,
        )) {
          if (m[1] !== laatste) fout.push(`${map}/${stap}: laatste reeks -> ${m[1]}`);
        }
        if (/Dit was de laatste reeks/.test(tekst) && map !== laatste) {
          fout.push(`${map}/${stap}: zegt dat het de laatste reeks was`);
        }
      }
    }
    expect(fout).toEqual([]);
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
    for (const map of zwakheden) {
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
            if (!heeftEndpoint(tekst)) continue;
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
          if (!heeftEndpoint(tekst)) continue;
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

// Wat een leerling-doorloop van de route vond, vastgepind. Elk blok hieronder
// faalde op de tekst van daarvoor.
describe('de route Veiligheid sluit aan op het eigen project', () => {
  const route = sidebars.veiligheidSidebar as unknown as (string | Categorie)[];
  const reeksen = route
    .filter((c): c is Categorie => typeof c !== 'string' && c.type === 'category')
    .map((c) => c.items[0].split('/')[1]);
  const pythonBlokken = (tekst: string) =>
    [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const alleLessen = (): string[] => {
    const uit: string[] = [];
    const loop = (map: string) => {
      for (const naam of readdirSync(map)) {
        const pad = join(map, naam);
        if (statSync(pad).isDirectory()) loop(pad);
        else if (naam.endsWith('.mdx')) uit.push(pad);
      }
    };
    loop(VEILIGHEID);
    return uit;
  };
  const relatief = (pad: string) => pad.slice(VEILIGHEID.length + 1);

  it('gereedschap heeft een sectie die zegt hoe je een map voor een reeks klaarzet', () => {
    // Elke reeks zei "maak een nieuwe map", maar nergens stond dat daar een
    // virtual environment en fastapi, sqlitedict en httpx in moeten.
    const tekst = readFileSync(join(VEILIGHEID, 'gereedschap.mdx'), 'utf8');
    expect(tekst).toContain('## Een map per reeks \\{#een-map-per-reeks}');
    expect(tekst).toContain('python -m pip install "fastapi[standard]" sqlitedict httpx');
  });

  for (const map of reeksen) {
    it(`${map}: de eerste les zegt in Waar je werkt hoe je de map klaarzet`, () => {
      const eerste = stappenVan(map)[0];
      const tekst = lees(map, eerste);
      const note = tekst.match(/:::note\[Waar je werkt\]([\s\S]*?)\n:::/)?.[1] ?? '';
      expect(note, `${map}/${eerste}`).toContain(
        '(/docs/veiligheid/gereedschap#een-map-per-reeks)',
      );
    });
  }

  it('een antwoord bij "In je eigen project" geeft geen nieuwe app', () => {
    // Het antwoord van Te veel verzoeken was een compleet main.py met een
    // eigen app = FastAPI() en een oud POST /gastenboek zonder sessie. Wie
    // dat overnam, gooide zijn project weg.
    const fout: string[] = [];
    for (const pad of alleLessen()) {
      const delen = readFileSync(pad, 'utf8').split(/^### /m).slice(1);
      for (const deel of delen.filter((d) => /^Opdracht \d+: Make - In je eigen project/.test(d))) {
        const antwoorden = [...deel.matchAll(/<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/g)];
        const code = antwoorden.flatMap((a) => pythonBlokken(a[1]));
        if (code.some((b) => b.includes('app = FastAPI()'))) fout.push(relatief(pad));
      }
    }
    expect(fout).toEqual([]);
  });

  it('een POST /gastenboek van het eigen gastenboek houdt zijn sessie_id', () => {
    // Het eigen gastenboek heeft sinds Onthouden op de server een sessie_id.
    // Een antwoord dat de kop zonder die parameter liet zien, gaf na overnemen
    // een 500 (UnboundLocalError: sessie_id). Een reeks met een eigen
    // gastenboek in het startbestand (XSS) telt niet mee, behalve in zijn
    // eigen-project-les.
    const eigenServer = new Set(
      reeksen.filter((map) =>
        pythonBlokken(lees(map, stappenVan(map)[0])).some((b) =>
          b.includes('@app.post("/gastenboek")'),
        ),
      ),
    );
    const fout: string[] = [];
    for (const pad of alleLessen()) {
      const rel = relatief(pad);
      const [map, bestand] = rel.split('/');
      if (bestand && eigenServer.has(map) && bestand !== 'eigen-project.mdx') continue;
      for (const blok of pythonBlokken(readFileSync(pad, 'utf8'))) {
        if (blok.includes('@app.post("/gastenboek")') && !blok.includes('sessie_id')) {
          fout.push(rel);
        }
      }
    }
    expect(fout).toEqual([]);
  });

  it('elke term in de controlelijst staat in de les waar het punt naar linkt', () => {
    // De lijst noemde ge en le bij de les over Form, terwijl die pas in
    // Getallen en keuzes komen. Een term mag ook in een van de andere links
    // van hetzelfde punt staan.
    const ALLOWLIST: Record<string, string> = {};
    const tekst = readFileSync(join(VEILIGHEID, 'eigen-project.mdx'), 'utf8');
    const punten = tekst
      .split(/^- \[ \] /m)
      .slice(1)
      .map((p) => p.split(/\n\n/)[0]);
    expect(punten.length).toBeGreaterThan(10);
    const fout: string[] = [];
    for (const punt of punten) {
      const doelen = [...punt.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map((m) => {
        const doel = m[1];
        if (doel.startsWith('./')) return join(VEILIGHEID, `${doel.slice(2)}.mdx`);
        return fileURLToPath(new URL(`../..${doel}.mdx`, import.meta.url));
      });
      expect(doelen.length, punt).toBeGreaterThan(0);
      const lessen = doelen.map((d) => readFileSync(d, 'utf8')).join('\n');
      for (const [, term] of punt.matchAll(/`([^`]+)`/g)) {
        if (term in ALLOWLIST) continue;
        if (!lessen.includes(term)) fout.push(`${term} (${punt.split('\n')[0]})`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de controlelijst in Beveilig je eigen project volgt de route', () => {
    // De lijst noemde Te veel verzoeken nog als laatste nadat DoS naar voren
    // was geschoven. Elke sectie hoort bij de reeks van zijn eerste link.
    const tekst = readFileSync(join(VEILIGHEID, 'eigen-project.mdx'), 'utf8');
    const volgorde = tekst
      .split(/^## /m)
      .slice(1)
      .map((sectie) => sectie.match(/\]\(\.\/([a-z-]+)\//)?.[1])
      .filter((map): map is string => map !== undefined)
      .map((map) => reeksen.indexOf(map));
    expect(volgorde.length).toBe(reeksen.length);
    expect(volgorde).toEqual([...volgorde].sort((a, b) => a - b));
  });

  it('de Veiligheid-items in de cheatsheet staan in de volgorde van de route', () => {
    const cheatsheet = readFileSync(
      fileURLToPath(new URL('../../docs/cheatsheet.md', import.meta.url)),
      'utf8',
    );
    const sectie = cheatsheet.split(/^## Veiligheid$/m)[1].split(/^## /m)[0];
    const volgorde = [...sectie.matchAll(/<details>[\s\S]*?<\/details>/g)].map((m) => {
      const reeks = m[0].match(/\(\/docs\/veiligheid\/([a-z]+)\//)?.[1] ?? '';
      expect(reeks, m[0].split('\n')[1]).not.toBe('');
      return reeksen.indexOf(reeks);
    });
    expect(volgorde.length).toBeGreaterThan(0);
    expect(volgorde).toEqual([...volgorde].sort((a, b) => a - b));
  });
});
