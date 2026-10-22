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
            // werkt, en een import (een turtle-project begint met import turtle).
            const code = (startcode ?? '')
              .split('\n')
              .filter((r) => r.trim() !== '' && !r.trim().startsWith('#'));
            if (i === 0) {
              expect(
                code.every((r) => /^\w+ = [{["\d]/.test(r) || /^import \w+$/.test(r)),
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
