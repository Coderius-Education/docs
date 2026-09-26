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

      it('elke stap noemt zijn concept in de sidebar', () => {
        for (const s of stappen) {
          expect(s.tekst, s.naam).toMatch(/^sidebar_label: 'Stap \d+: .+'$/m);
        }
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

// Het overzicht is één tabel: per activiteit wat je doet, welke concepten
// erin zitten en wat je na Tien groene flessen nog nodig hebt. De rijen van
// de algoritmes zijn afgeleid van de algoritmes-cursus (algorithms.ts en de
// conceptenkaart); verandert daar iets, dan moet de tabel mee.
describe('projecten: de tabel op het overzicht', async () => {
  const { pythonConcepten, voorkennisPerAlgoritme } = await import(
    '../../../algorithms/src/data/conceptenkaart'
  );
  const { algoritmes } = await import('../../../algorithms/src/data/algorithms');
  const overzicht = readFileSync(join(PROJECTEN, 'index.mdx'), 'utf8');

  // De concepten die Tien groene flessen gebruikt, als id's van de kaart.
  const UIT_HET_PROJECT = new Set([
    'f-strings',
    'if-else',
    'and-or-elif',
    'for-loop',
    'functies',
    'parameters',
    'return',
  ]);

  const tabellen = overzicht.match(/^\|:?-+/gm) ?? [];
  const rijen = new Map(
    [
      ...overzicht.matchAll(
        /^\| <SiteLink site="algorithms" to="([^"]+)">[^<]+<\/SiteLink> \| (.*) \| (.*) \| (.*) \|$/gm,
      ),
    ].map((m) => [m[1], { wat: m[2], concepten: m[3], nog: m[4] }]),
  );

  it('het overzicht is één tabel, met het project, Pydle en Play bovenaan', () => {
    expect(tabellen).toHaveLength(1);
    const eersten = [...overzicht.matchAll(/^\| (\[[^\]]+\]|<SiteLink[^>]*>[^<]+<\/SiteLink>)/gm)]
      .slice(0, 3)
      .map((m) => m[1]);
    expect(eersten[0]).toContain('Tien groene flessen');
    expect(eersten[1]).toContain('pydle.net');
    expect(eersten[2]).toMatch(/<SiteLink site="play"/);
  });

  it('elk algoritme staat erin, met de link naar zijn eerste les en zijn samenvatting', () => {
    const lijst = algoritmes as { startPad: string; samenvatting: string }[];
    expect([...rijen.keys()]).toEqual(lijst.map((a) => a.startPad));
    for (const a of lijst) expect(rijen.get(a.startPad)?.wat).toBe(a.samenvatting);
  });

  it('per algoritme kloppen de concepten en wat je nog nodig hebt met de conceptenkaart', () => {
    for (const a of algoritmes as { slug: string; startPad: string }[]) {
      const nodig = new Set(voorkennisPerAlgoritme[a.slug]);
      const volgorde = (pythonConcepten as { id: string; label: string; to: string }[]).filter(
        (c) => nodig.has(c.id),
      );
      const nog = volgorde
        .filter((c) => !UIT_HET_PROJECT.has(c.id))
        .map((c) => `[${c.label}](${c.to})`);
      const rij = rijen.get(a.startPad);
      expect(rij?.concepten, a.slug).toBe(volgorde.map((c) => c.label).join(', '));
      expect(rij?.nog, a.slug).toBe(nog.length ? nog.join(', ') : 'niets');
    }
  });
});
