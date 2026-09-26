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
            expect(s.tekst, s.naam).toContain(`](./${volgende.naam.replace(/\.mdx$/, '')})`);
          } else {
            // Door naar het volgende project, of terug naar een overzicht.
            expect(s.tekst, s.naam).toMatch(/\]\(\/docs\/projecten\//);
          }
        });
      });

      it('elke stap noemt zijn concept in de sidebar', () => {
        for (const s of stappen) {
          expect(s.tekst, s.naam).toMatch(/^sidebar_label: 'Stap \d+: .+'$/m);
        }
      });

      it('de projectkiezer kent het project, met de eerste stap en het aantal stappen', () => {
        const eerste = `/docs/projecten/${project}/${stappen[0].naam.replace(/\.mdx$/, '')}`;
        const kaart = activiteiten.find((a) => 'to' in a.link && a.link.to === eerste);
        expect(kaart, `geen activiteit in src/data/projecten.ts met link ${eerste}`).toBeDefined();
        expect(kaart?.stappen).toBe(stappen.length);
        expect(kaart?.soort).toBe(project.startsWith('turtle/') ? 'turtle' : 'project');
      });
    });
  }
});
