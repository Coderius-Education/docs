import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteDir } from '@coderius/shared/sites';
import { lesBestaat } from '@coderius/shared/voorkennis';
import { describe, expect, it, vi } from 'vitest';
import sidebars from '../../sidebars';

// jsLessons.ts leest de sidebar via de Docusaurus-alias @site; buiten Docusaurus
// bestaat die niet, dus hier krijgt hij dezelfde sidebar via een relatief pad.
vi.mock('@site/sidebars', () => ({ default: sidebars }));
const { jsLessons } = await import('./jsLessons');

// Bewaakt de lestabel die uit data wordt opgebouwd: het JS-overzicht op /js.
// Die wijst met losse strings naar pagina's onder docs/. Een hernoemde les
// breekt zo'n interne route pas als iemand erop klikt: de tabel is een
// React-component, geen Markdown-link, dus de linkcheck van `pnpm build`
// ziet hem niet.

// De repo-root: lesBestaat zoekt de map van een site zelf op in de registry.
const ROOT = fileURLToPath(new URL('../../../../..', import.meta.url));
const DOCS = join(ROOT, siteDir('web'), 'docs');
const JS_LESSONS_BRON = fileURLToPath(new URL('./jsLessons.ts', import.meta.url));

describe('jsLessons.ts', () => {
  const sidebarIds = (sidebars.jsSidebar as unknown[]).filter(
    (item): item is string => typeof item === 'string',
  );

  it('vindt de sidebar en bouwt er per id één rij van', () => {
    expect(jsLessons.length).toBeGreaterThan(10);
    expect(jsLessons.map((l) => l.to)).toEqual(sidebarIds.map((id) => `/docs/${id}`));
  });

  it('elke route wijst naar een bestaande les', () => {
    const kapot = jsLessons.filter((l) => !lesBestaat(ROOT, 'web', l.to)).map((l) => l.to);
    expect(kapot).toEqual([]);
  });

  it('elke les heeft een Nederlands label in plaats van de slug', () => {
    // De fallback op de slug is bedoeld als vangnet, niet als eindtoestand.
    const zonder = jsLessons
      .filter((l) => l.label === l.to.replace('/docs/js-basics/', ''))
      .map((l) => l.to);
    expect(zonder).toEqual([]);
  });

  it('elk label in de bron hoort bij een les uit de sidebar', () => {
    // Een label voor een verwijderde les blijft anders stil staan.
    const bron = readFileSync(JS_LESSONS_BRON, 'utf8');
    const labelIds = [...bron.matchAll(/^\s*'(js-basics\/[\w-]+)':/gm)].map((m) => m[1]);
    expect(labelIds.length).toBeGreaterThan(10);
    expect(new Set(labelIds).size).toBe(labelIds.length);
    expect(labelIds.filter((id) => !sidebarIds.includes(id))).toEqual([]);
  });

  it('elke les onder docs/js-basics staat in de sidebar, en dus in de tabel', () => {
    const opSchijf = readdirSync(join(DOCS, 'js-basics'))
      .filter((naam) => /\.mdx?$/.test(naam))
      .map((naam) => `js-basics/${naam.replace(/\.mdx?$/, '')}`)
      .sort();
    expect(opSchijf).toEqual([...sidebarIds].sort());
  });

  it('de lescontrole herkent een verzonnen pad wél als kapot', () => {
    expect(lesBestaat(ROOT, 'web', '/docs/js-basics/bestaat-niet')).toBe(false);
    expect(lesBestaat(ROOT, 'web', '/docs/html-css/intro-html')).toBe(true);
  });
});

describe('geen Code.org', () => {
  // De cursus verwees per les en in de docentenhandleiding naar Code.org; dat
  // is eruit. Een nieuwe verwijzing valt hier op.
  it("noemt Code.org nergens in de lessen, de pagina's of de config", () => {
    const SITE = join(ROOT, siteDir('web'));
    const bestanden = (map: string): string[] =>
      readdirSync(map, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? bestanden(join(map, e.name))
          : /\.(mdx?|tsx?)$/.test(e.name) && !e.name.endsWith('.test.ts')
            ? [join(map, e.name)]
            : [],
      );
    const alles = [
      ...bestanden(join(SITE, 'docs')),
      ...bestanden(join(SITE, 'src')),
      join(SITE, 'docusaurus.config.ts'),
    ];
    const met = alles.filter((f) => /code\.org|codeorg/i.test(readFileSync(f, 'utf8')));
    expect(met.map((f) => f.slice(SITE.length + 1))).toEqual([]);
  });
});
