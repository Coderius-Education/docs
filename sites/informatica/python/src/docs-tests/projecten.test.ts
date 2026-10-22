import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { activiteiten } from '../data/projecten';

// Een project is een reeks stappen die op elkaar voortbouwen. Deze test
// bewaakt de opbouw die een leerling nodig heeft om de reeks te volgen:
// doorlopende stappen, bij elke stap een opdracht met tip én oplossing,
// een link naar de volgende stap, en een link Projecten in de navbar.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const PROJECTEN = join(SITE, 'docs', 'projecten');

// Een project is een map met stap-bestanden; een map zonder stappen (zoals
// turtle) groepeert kleinere projecten, met een eigen overzicht (index.mdx).
function projectmappen(map: string): string[] {
  return readdirSync(map)
    .map((n) => join(map, n))
    .filter((pad) => statSync(pad).isDirectory())
    .flatMap((pad) =>
      readdirSync(pad).some((n) => /^stap-\d+-.*\.mdx$/.test(n)) ? [pad] : projectmappen(pad),
    );
}

const projecten = projectmappen(PROJECTEN).map((pad) => relative(PROJECTEN, pad));

// In deze projecten schrijft de leerling elke stap zelf. De startcode is
// leeg (stap 1: alleen de gegevens), stap 2 en verder beginnen met zijn eigen
// programma uit de stap ervoor, en de tip wijst de weg zonder de regels voor
// te zeggen. Eerst stond de oplossing van de vorige stap in het veld en de
// nieuwe regels in de tip, en dan typte de leerling alleen over.
const ZELF_SCHRIJVEN = [
  'tien-groene-flessen',
  'raad-het-getal',
  'woordjes-overhoren',
  'bloemenveld',
  'spirograaf',
  'schildpaddenrace',
  'pixel-art',
  'staafdiagram',
];

// De turtle-commando's die de lessen tekenen; namen van de module die niet
// tekenen (mainloop, Screen) laten we buiten beschouwing.
const TEKENCOMMANDOS = new Set(
  (
    'forward fd back bk backward left lt right rt goto setpos setposition setx sety ' +
    'setheading seth home circle dot stamp write penup pu up pendown pd down pensize ' +
    'width pencolor fillcolor color begin_fill end_fill bgcolor speed tracer hideturtle ' +
    'ht showturtle st shape clear reset xcor ycor pos position heading distance towards ' +
    'Turtle textinput numinput'
  ).split(' '),
);

/** De code van een pagina: de python-blokken en de velden van de speeltuin. */
function codeVan(tekst: string): string {
  const blokken = [...tekst.matchAll(/```python\n([\s\S]*?)```/g)].map((m) => m[1]);
  const velden = [...tekst.matchAll(/<CodeExercise[^>]*>\{`([\s\S]*?)`\}/g)].map((m) => m[1]);
  return [...blokken, ...velden].join('\n');
}

/** De tekencommando's in een stuk code: turtle.forward, rood.forward(…). */
function commandos(code: string): string[] {
  return [...code.matchAll(/\.(\w+)\b/g)].map((m) => m[1]).filter((n) => TEKENCOMMANDOS.has(n));
}

const LIJN = join(PROJECTEN, 'turtle');

/** De projecten van de turtle-lijn in de volgorde van de "Door naar"-links. */
function lijnVolgorde(): string[] {
  const mappen = readdirSync(LIJN).filter((n) => statSync(join(LIJN, n)).isDirectory());
  const volgende = new Map<string, string>();
  for (const map of mappen) {
    for (const n of readdirSync(join(LIJN, map)).filter((x) => x.endsWith('.mdx'))) {
      const m = readFileSync(join(LIJN, map, n), 'utf8').match(
        /Door naar het volgende project: \[[^\]]+\]\(site:python\/docs\/projecten\/turtle\/([\w-]+)\//,
      );
      if (m) volgende.set(map, m[1]);
    }
  }
  const doelen = new Set(volgende.values());
  let huidig = mappen.find((m) => !doelen.has(m));
  const volgorde: string[] = [];
  while (huidig && !volgorde.includes(huidig)) {
    volgorde.push(huidig);
    huidig = volgende.get(huidig);
  }
  return volgorde;
}

function stappenVan(map: string): string[] {
  return readdirSync(map)
    .filter((n) => /^stap-\d+-.*\.mdx$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]))
    .map((n) => readFileSync(join(map, n), 'utf8'));
}

/** Een pagina zonder het blok Maak het je eigen: ideeën leren niets aan. */
function zonderEigen(tekst: string): string {
  return tekst.replace(
    /^## Maak het je eigen[\s\S]*?(?=^## |^Door naar|^Terug naar|(?![\s\S]))/m,
    '',
  );
}

function commandosVanDeLijn(tot?: string): string[] {
  const volgorde = lijnVolgorde();
  const eind = tot ? volgorde.indexOf(tot) + 1 : volgorde.length;
  return volgorde
    .slice(0, eind)
    .flatMap((map) =>
      stappenVan(join(LIJN, map)).flatMap((t) => commandos(codeVan(zonderEigen(t)))),
    );
}

describe('de turtle-lijn', () => {
  const volgorde = lijnVolgorde();

  it('is één ketting van "Door naar"-links langs alle projecten', () => {
    const mappen = readdirSync(LIJN).filter((n) => statSync(join(LIJN, n)).isDirectory());
    expect([...volgorde].sort()).toEqual([...mappen].sort());
  });

  // Elk project eindigt met open ideeën; eerst stonden er bij twee projecten
  // ideeën met commando's die de lijn nog niet had (write met een font).
  for (const map of volgorde) {
    it(`${map}: de laatste stap eindigt met Maak het je eigen, met wat de leerling al kent`, () => {
      const laatste = stappenVan(join(LIJN, map)).at(-1) ?? '';
      const blok = laatste.match(
        /^## Maak het je eigen\n([\s\S]*?)(?=^## |^Door naar|^Terug naar|(?![\s\S]))/m,
      )?.[1];
      expect(blok, `${map}: geen ## Maak het je eigen`).toBeDefined();
      const bullets = (blok ?? '').split('\n').filter((r) => /^- /.test(r));
      expect(bullets.length, map).toBeGreaterThanOrEqual(2);
      expect(bullets.length, map).toBeLessThanOrEqual(4);
      expect(blok, map).not.toMatch(/```|<details>/);
      const bekend = new Set(commandosVanDeLijn(map));
      const genoemd = [...(blok ?? '').matchAll(/`([^`]+)`/g)].flatMap((m) =>
        [...m[1].matchAll(/(?:^|\.)(\w+)\s*\(/g)].map((n) => n[1]),
      );
      for (const c of genoemd.filter((n) => TEKENCOMMANDOS.has(n))) {
        expect(bekend.has(c), `${map}: \`${c}\` komt in de lijn nog niet voor`).toBe(true);
      }
    });
  }
});

describe('projecten in de python-cursus', () => {
  it('er is minstens één project, en de navbar heeft een link Projecten', () => {
    expect(projecten.length).toBeGreaterThan(0);
    const config = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');
    expect(config).toMatch(/sidebarId: 'projectenSidebar'[^}]*label: 'Projecten'/);
    // De projecten zijn geen les: ze staan niet in de Tutorial-sidebar.
    expect(config).toContain('zonderProjecten(items)');
  });

  for (const project of projecten) {
    describe(project, () => {
      const map = join(PROJECTEN, project);
      const stappen = readdirSync(map)
        .filter((n) => /^stap-\d+-.*\.mdx$/.test(n))
        .map((n) => ({
          naam: n,
          nr: Number(n.match(/^stap-(\d+)-/)?.[1]),
          tekst: readFileSync(join(map, n), 'utf8'),
        }))
        .sort((a, b) => a.nr - b.nr);

      it('de stappen lopen door vanaf 1, met sidebar_position gelijk aan het nummer', () => {
        expect(stappen.map((s) => s.nr)).toEqual(stappen.map((_, i) => i + 1));
        for (const s of stappen) {
          expect(s.tekst, s.naam).toMatch(new RegExp(`^sidebar_position: ${s.nr}$`, 'm'));
          expect(s.tekst, s.naam).toMatch(new RegExp(`^# Stap ${s.nr}: `, 'm'));
        }
      });

      it('elke stap heeft een opdracht met een tip en een oplossing', () => {
        for (const s of stappen) {
          expect(s.tekst, s.naam).toMatch(/^## Opdracht/m);
          expect(s.tekst, s.naam).toContain('<summary>Klik hier voor een tip.</summary>');
          expect(s.tekst, s.naam).toContain('<summary>Klik hier voor de oplossing.</summary>');
        }
      });

      it('elke stap wijst naar de volgende, de laatste terug naar het overzicht', () => {
        stappen.forEach((s, i) => {
          const volgende = stappen[i + 1];
          if (volgende) {
            const route = `/docs/projecten/${project}/${volgende.naam.replace(/\.mdx$/, '')}`;
            expect(s.tekst, s.naam).toContain(`](site:python${route})`);
          } else {
            // Door naar het volgende project, of terug naar een overzicht: de
            // laatste link van de pagina, niet een verwijzing ergens halverwege.
            const links = [...s.tekst.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
            expect(links.at(-1), s.naam).toMatch(/^site:python\/docs\/projecten([/#]|$)/);
          }
        });
      });

      it('elke stap noemt zijn concept in de sidebar', () => {
        for (const s of stappen) {
          expect(s.tekst, s.naam).toMatch(/^sidebar_label: 'Stap \d+: .+'$/m);
        }
      });

      if (ZELF_SCHRIJVEN.includes(project)) {
        it('de leerling schrijft de code zelf: geen code in de startcode of de tip', () => {
          stappen.forEach((s, i) => {
            const opdracht = s.tekst.slice(s.tekst.search(/^## Opdracht/m));
            const startcode = opdracht.match(/<CodeExercise>\{`([\s\S]*?)`\}<\/CodeExercise>/)?.[1];
            expect(startcode, s.naam).toBeDefined();
            // Alleen commentaar, en in stap 1 de gegevens waar het programma mee
            // werkt, en de import van turtle of random waar het project mee begint.
            const code = (startcode ?? '')
              .split('\n')
              .filter((r) => r.trim() !== '' && !r.trim().startsWith('#'));
            if (i === 0) {
              expect(
                code.every((r) => /^\w+ = [{["\d]/.test(r) || /^import (turtle|random)$/.test(r)),
                s.naam,
              ).toBe(true);
            } else {
              expect(code, s.naam).toEqual([]);
              expect(startcode, s.naam).toContain(`# Plak hier je programma uit stap ${i}`);
            }
            const tip = s.tekst.match(
              /<summary>Klik hier voor een tip\.<\/summary>([\s\S]*?)<\/details>/,
            )?.[1];
            expect(tip, s.naam).not.toMatch(/```/);
            // Een tip noemt hooguit een naam (`len()`), geen regel code.
            for (const stuk of tip?.match(/`[^`]+`/g) ?? []) {
              expect(stuk, `${s.naam}: ${stuk}`).not.toMatch(/[=:]|\w\(.+\)/);
            }
          });
        });

        it('de editor bewaart niets, dus elke stap zegt: kopieer je programma', () => {
          for (const s of stappen.slice(0, -1)) {
            expect(s.tekst, s.naam).toContain('Kopieer je programma');
          }
        });
      }

      // Een groot turtle-project bouwt op de commando's van de turtle-lijn.
      // Eerst stond het in de sidebar vóór de lijn, en zei de kiezer alleen
      // "vanaf les 10a": wie alleen de lessen deed, kende fillcolor en dot niet.
      if (!project.startsWith('turtle/') && stappen.some((s) => /^import turtle$/m.test(s.tekst))) {
        it('komt na de turtle-lijn: in de sidebar, in de kiezer en in stap 1', () => {
          const positie = (map: string) =>
            JSON.parse(readFileSync(join(PROJECTEN, map, '_category_.json'), 'utf8')).position;
          expect(positie(project)).toBeGreaterThan(positie('turtle'));
          const eerste = `/docs/projecten/${project}/${stappen[0].naam.replace(/\.mdx$/, '')}`;
          const kaart = activiteiten.find((a) => 'to' in a.link && a.link.to === eerste);
          expect(kaart?.naTurtleLijn, `${project}: naTurtleLijn in projecten.ts`).toBe(true);
          expect(stappen[0].tekst).toContain('](site:python/docs/projecten/turtle)');
        });

        it('een nieuw turtle-commando legt de stap uit vóór de opdracht', () => {
          const bekend = new Set(commandosVanDeLijn());
          for (const s of stappen) {
            const uitleg = s.tekst.slice(0, s.tekst.search(/^## Opdracht/m));
            for (const c of commandos(codeVan(s.tekst))) {
              if (bekend.has(c)) continue;
              expect(uitleg, `${s.naam}: \`${c}\` is nieuw en wordt niet uitgelegd`).toMatch(
                new RegExp(`\`[^\`]*\\b${c}\\b[^\`]*\``),
              );
              bekend.add(c);
            }
          }
        });
      }

      it('de projectkiezer kent het project, met de eerste stap en het aantal stappen', () => {
        const eerste = `/docs/projecten/${project}/${stappen[0].naam.replace(/\.mdx$/, '')}`;
        const kaart = activiteiten.find((a) => 'to' in a.link && a.link.to === eerste);
        expect(kaart, `geen activiteit in src/data/projecten.ts met link ${eerste}`).toBeDefined();
        expect(kaart?.stappen).toBe(stappen.length);
        expect(kaart?.soort).toBe(project.startsWith('turtle/') ? 'turtle' : 'project');
      });
    });
  }

  it('elke link in de projectkiezer naar deze cursus bestaat als pagina', () => {
    const DOCS = join(SITE, 'docs');
    const bestaat = (pad: string) => {
      const rest = pad.replace(/^\/docs\//, '').replace(/\/$/, '');
      const kandidaten = [`${rest}.mdx`, `${rest}.md`, `${rest}/index.mdx`, `${rest}/index.md`];
      return kandidaten.some((k) => {
        try {
          return statSync(join(DOCS, k)).isFile();
        } catch {
          return false;
        }
      });
    };
    for (const a of activiteiten) {
      if (!('to' in a.link) || 'site' in a.link) continue;
      expect(bestaat(a.link.to), `${a.id}: ${a.link.to}`).toBe(true);
    }
  });
});
