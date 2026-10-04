import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lesBestaat } from '@coderius/shared/voorkennis';
import { describe, expect, it, vi } from 'vitest';
import sidebars from '../../sidebars';
import { CODEORG_COURSE, codeorgBySlug, codeorgProjects, codeorgUnit1, lessonUrl } from './codeorg';

// jsLessons.ts leest de sidebar via de Docusaurus-alias @site; buiten Docusaurus
// bestaat die niet, dus hier krijgt hij dezelfde sidebar via een relatief pad.
vi.mock('@site/sidebars', () => ({ default: sidebars }));
const { jsLessons } = await import('./jsLessons');

// Bewaakt de twee lestabellen die uit data worden opgebouwd: de Code.org-
// koppeling (per-les callout én de hub-tabel) en het JS-overzicht op /js.
// Beide wijzen met losse strings naar pagina's onder docs/. Een hernoemde
// les breekt zo'n interne route pas als iemand erop klikt: de tabel is een
// React-component, geen Markdown-link, dus de linkcheck van `pnpm build`
// ziet hem niet. De Code.org-URL's zijn extern en worden nergens gecheckt.

const SITES_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const DOCS = join(SITES_ROOT, 'web', 'docs');
const JS_LESSONS_BRON = fileURLToPath(new URL('./jsLessons.ts', import.meta.url));

describe('codeorg.ts', () => {
  it('slug, route en lesnummer zijn elk uniek', () => {
    for (const veld of ['slug', 'to', 'lesson'] as const) {
      const waarden = codeorgUnit1.map((l) => l[veld]);
      expect(new Set(waarden).size, `dubbel in '${veld}'`).toBe(waarden.length);
    }
  });

  it('elke route wijst naar een bestaande les onder docs/html-css', () => {
    const kapot = codeorgUnit1
      .filter((l) => !lesBestaat(SITES_ROOT, 'web', l.to))
      .map((l) => `${l.slug} -> ${l.to}`);
    expect(kapot).toEqual([]);
  });

  it('elke Code.org-URL is een https-link naar de cursus van dit jaar', () => {
    const vorm = new RegExp(
      `^https://studio\\.code\\.org/courses/${CODEORG_COURSE}/units/1/lessons/\\d+/levels/1$`,
    );
    const kapot = [...codeorgUnit1, ...codeorgProjects]
      .filter((l) => !vorm.test(l.url) || l.url !== lessonUrl(l.lesson))
      .map((l) => l.url);
    expect(kapot).toEqual([]);
    expect(CODEORG_COURSE).toMatch(/^web-development-\d{4}$/);
  });

  it('een les is óf oefenles óf projectles, nooit allebei', () => {
    const oefen = new Set(codeorgUnit1.map((l) => l.lesson));
    const projecten = codeorgProjects.map((p) => p.lesson);
    expect(new Set(projecten).size).toBe(projecten.length);
    expect(projecten.filter((n) => oefen.has(n))).toEqual([]);
  });

  it('titels zijn nergens leeg en de lookup kent precies de slugs', () => {
    const leeg = codeorgUnit1
      .filter((l) => l.title.trim() === '' || l.nl.trim() === '')
      .map((l) => l.slug);
    expect(leeg).toEqual([]);
    expect(Object.keys(codeorgBySlug).sort()).toEqual(codeorgUnit1.map((l) => l.slug).sort());
  });
});

describe('jsLessons.ts', () => {
  const sidebarIds = (sidebars.jsSidebar as unknown[]).filter(
    (item): item is string => typeof item === 'string',
  );

  it('vindt de sidebar en bouwt er per id één rij van', () => {
    expect(jsLessons.length).toBeGreaterThan(10);
    expect(jsLessons.map((l) => l.to)).toEqual(sidebarIds.map((id) => `/docs/${id}`));
  });

  it('elke route wijst naar een bestaande les', () => {
    const kapot = jsLessons.filter((l) => !lesBestaat(SITES_ROOT, 'web', l.to)).map((l) => l.to);
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
    expect(lesBestaat(SITES_ROOT, 'web', '/docs/js-basics/bestaat-niet')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'web', '/docs/html-css/intro-html')).toBe(true);
  });
});
