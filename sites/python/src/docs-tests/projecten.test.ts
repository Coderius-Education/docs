import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een project is een reeks stappen die op elkaar voortbouwen. Deze test
// bewaakt de opbouw die een leerling nodig heeft om de reeks te volgen:
// doorlopende stappen, bij elke stap een opdracht met tip én oplossing,
// een link naar de volgende stap, en een link Projecten in de navbar.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const PROJECTEN = join(SITE, 'docs', 'projecten');

const projecten = readdirSync(PROJECTEN).filter((n) => statSync(join(PROJECTEN, n)).isDirectory());

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
            expect(s.tekst, s.naam).toContain('](/docs/projecten/)');
          }
        });
      });

      it('het overzicht wijst naar de eerste stap', () => {
        const overzicht = readFileSync(join(PROJECTEN, 'index.mdx'), 'utf8');
        expect(overzicht).toContain(
          `/docs/projecten/${project}/${stappen[0].naam.replace(/\.mdx$/, '')}`,
        );
      });
    });
  }
});
