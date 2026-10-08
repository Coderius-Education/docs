import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hoofdstukSleutel, leesKlasCookie, pasKlasToe } from '@coderius/shared/klas';
import { DOCENTEN_SITES, SITES } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import sidebarManifest from './plugins/sidebar-manifest';

// Klassen: build (sidebar-manifest.json) en browser (de sidebar-props) moeten
// dezelfde sleutel per hoofdstuk berekenen, anders verbergt een klas niets.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const les = (docId: string, label = docId) => ({
  type: 'link',
  docId,
  label,
  href: `/python/docs/${docId}`,
});
const categorie = (label: string, items: unknown[]) => ({ type: 'category', label, items });

describe('hoofdstukSleutel', () => {
  it('noemt een categorie naar de gedeelde map van de lessen erin', () => {
    expect(hoofdstukSleutel(categorie('Basis', [les('basis/intro'), les('basis/lussen')]))).toBe(
      'cat:basis',
    );
    // Geneste categorie: de gedeelde map van alles eronder.
    const genest = categorie('Tekst', [
      les('tekst/intro'),
      categorie('Strings', [les('tekst/strings/a'), les('tekst/strings/b')]),
    ]);
    expect(hoofdstukSleutel(genest)).toBe('cat:tekst');
  });

  it('valt terug op het label als de lessen geen map delen', () => {
    expect(hoofdstukSleutel(categorie('Losse Één', [les('a'), les('b')]))).toBe('cat:~losse-een');
  });

  it('rekent in de build-vorm (doc met id) hetzelfde als in de browser-vorm', () => {
    const build = categorie('Basis', [
      { type: 'doc', id: 'basis/intro' },
      { type: 'doc', id: 'basis/lussen' },
    ]);
    expect(hoofdstukSleutel(build)).toBe('cat:basis');
    expect(hoofdstukSleutel({ type: 'doc', id: 'intro' })).toBe('doc:intro');
    expect(hoofdstukSleutel(les('intro'))).toBe('doc:intro');
    expect(hoofdstukSleutel({ type: 'link', href: 'https://x.nl', label: 'x' })).toBe(
      'link:https://x.nl',
    );
    expect(hoofdstukSleutel({ type: 'html', value: '<hr>' })).toBeNull();
  });
});

describe('pasKlasToe', () => {
  const items = [
    les('intro'),
    categorie('Basis', [les('basis/a')]),
    categorie('Tekst', [les('tekst/a')]),
    categorie('Klassen', [les('klassen/a')]),
  ];
  const labels = (lijst: { label: string }[]) => lijst.map((i) => i.label);

  it('verbergt en ordent, en zet onbekende hoofdstukken erachter', () => {
    const uit = pasKlasToe(items, {
      volgorde: ['cat:tekst', 'cat:basis', 'cat:bestaat-niet'],
      verborgen: ['cat:klassen'],
    });
    expect(labels(uit)).toEqual(['Tekst', 'Basis', 'intro']);
  });

  it('laat alles staan zonder instelling', () => {
    expect(pasKlasToe(items, undefined)).toBe(items);
    expect(labels(pasKlasToe(items, {}))).toEqual(['intro', 'Basis', 'Tekst', 'Klassen']);
  });

  it('raakt diepere lagen niet aan', () => {
    const uit = pasKlasToe(items, { verborgen: ['doc:basis/a'] });
    expect(uit[1]).toBe(items[1]);
  });
});

describe('leesKlasCookie', () => {
  it('leest alleen een geldige code', () => {
    expect(leesKlasCookie('theme=dark; cdx_klas=abcdef2345; x=1')).toBe('abcdef2345');
    expect(leesKlasCookie('cdx_klas=<script>')).toBeNull();
    expect(leesKlasCookie('')).toBeNull();
    expect(leesKlasCookie('mijn_cdx_klas=abcdef2345')).toBeNull();
  });
});

describe('sidebar-manifest', () => {
  it('zet de verwerkte sidebars om met dezelfde sleutels als de browser', () => {
    const manifest = sidebarManifest.maakManifest({
      docs: [
        { id: 'intro', title: 'Introductie', permalink: '/python/docs/intro' },
        { id: 'basis/intro', title: 'Begin', permalink: '/python/docs/basis/intro' },
        { id: 'projecten/spel', title: 'Spel', permalink: '/python/docs/projecten/spel' },
      ],
      // python haalt de projecten uit de hoofd-sidebar (zonderProjecten).
      sidebars: {
        tutorialSidebar: [
          { type: 'doc', id: 'intro' },
          {
            type: 'category',
            label: 'Basis',
            link: { type: 'generated-index', permalink: '/python/docs/category/basis' },
            items: [{ type: 'doc', id: 'basis/intro', label: 'Eerste les' }],
          },
        ],
        projectenSidebar: [{ type: 'doc', id: 'projecten/spel' }],
      },
    });
    expect(manifest.sidebars.tutorialSidebar).toEqual([
      {
        key: 'doc:intro',
        type: 'doc',
        docId: 'intro',
        label: 'Introductie',
        href: '/python/docs/intro',
      },
      {
        key: 'cat:basis',
        type: 'category',
        label: 'Basis',
        href: '/python/docs/category/basis',
        items: [
          {
            key: 'doc:basis/intro',
            type: 'doc',
            docId: 'basis/intro',
            label: 'Eerste les',
            href: '/python/docs/basis/intro',
          },
        ],
      },
    ]);
    expect(manifest.sidebars.projectenSidebar[0].key).toBe('doc:projecten/spel');
  });
});

describe('klassen en de rest van de repo', () => {
  it('geen site swizzlet DocSidebarItems (dat schaduwt de klas-wikkel)', () => {
    const fout: string[] = [];
    for (const vak of readdirSync(join(ROOT, 'sites'))) {
      const vakMap = join(ROOT, 'sites', vak);
      const mappen = existsSync(join(vakMap, 'src'))
        ? [vakMap]
        : readdirSync(vakMap).map((s) => join(vakMap, s));
      for (const site of mappen) {
        if (existsSync(join(site, 'src', 'theme', 'DocSidebarItems'))) fout.push(site);
      }
    }
    expect(fout).toEqual([]);
  });

  it('geen cursuspad botst met een route van home', () => {
    // De delivery stuurt het eerste padsegment naar een site vóór home.
    const GERESERVEERD = new Set(['klas', 'vak', 'docent', 'privacy', '_app', '_cdx']);
    const botsend = [...SITES, ...DOCENTEN_SITES]
      .map((site) => site.path)
      .filter((pad) => GERESERVEERD.has(pad));
    expect(botsend).toEqual([]);
  });
});
