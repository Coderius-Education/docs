import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DOCENTEN_SITES, SITES } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import {
  HULPMIDDELEN,
  NOG_VERBORGEN,
  docentenCursussen,
  docentenUrl,
  hostVan,
  inKlas4,
  inKlas5,
} from './docenten';

// De docentenpagina linkt per cursus naar /docenten op het subdomein. Die
// pagina bestaat op elke cursussite als src/pages/docenten.mdx; verdwijnt hij
// ergens, dan wijst de homepage naar een 404. Dit is de snelle controle vóór
// de build; de CI-job cross-links doet dezelfde controle daarna tegen de
// gebouwde sites.

const SITES_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

describe('docentenUrl', () => {
  it('plakt /docenten achter de site-URL, zonder dubbele slash', () => {
    expect(docentenUrl('https://python.coderius.nl')).toBe('https://python.coderius.nl/docenten');
    expect(docentenUrl('https://python.coderius.nl/')).toBe('https://python.coderius.nl/docenten');
  });

  it('elke cursussite heeft de docentenhandleiding waar de link naartoe wijst', () => {
    const zonder = SITES.filter(
      (s) => !existsSync(`${SITES_ROOT}${s.id}/src/pages/docenten.mdx`),
    ).map((s) => s.id);
    expect(zonder).toEqual([]);
  });
});

describe('de tabel op de docentenpagina', () => {
  it('toont elke cursus uit de registry behalve de online editor', () => {
    const ids = docentenCursussen.map((c) => c.id);
    expect(ids).not.toContain('ide');
    expect(ids.sort()).toEqual(
      SITES.map((s) => s.id)
        .filter((id) => id !== 'ide')
        .sort(),
    );
  });

  it('zet de online editor bij de hulpmiddelen, en geen docentensite die nog verborgen is', () => {
    // Didactiek staat in de registry (de map bestaat en wordt gebouwd) maar
    // is nog niet volwassen genoeg om vanaf de homepage naartoe te linken.
    const ids = HULPMIDDELEN.map((s) => s.id);
    expect(ids).toEqual([
      'ide',
      ...DOCENTEN_SITES.map((s) => s.id).filter((id) => !NOG_VERBORGEN.includes(id)),
    ]);
    for (const id of NOG_VERBORGEN) expect(ids).not.toContain(id);
  });

  it('elke verborgen docentensite bestaat wel in de registry', () => {
    // Anders blijft een id hier hangen nadat de site is hernoemd of verwijderd.
    for (const id of NOG_VERBORGEN) expect(DOCENTEN_SITES.some((s) => s.id === id)).toBe(true);
  });

  it('de editor-cursus hoort alleen bij klas 5+', () => {
    // Klas is een eigen veld, niet afgeleid uit het niveau; deze test pint
    // de plek van VS Code & Git in de verdieping vast.
    const editor = docentenCursussen.find((c) => c.id === 'editor');
    expect(editor && inKlas4(editor)).toBe(false);
    expect(editor && inKlas5(editor)).toBe(true);
  });

  it('een gedeelde cursus telt in beide klassen mee', () => {
    const robotica = docentenCursussen.find((c) => c.id === 'robotica');
    expect(robotica?.klas).toBe('4 en 5+');
    expect(robotica && inKlas4(robotica)).toBe(true);
    expect(robotica && inKlas5(robotica)).toBe(true);
  });

  it('elke cursus staat in minstens één klas', () => {
    const nergens = docentenCursussen.filter((c) => !inKlas4(c) && !inKlas5(c)).map((c) => c.id);
    expect(nergens).toEqual([]);
  });

  it('hostVan geeft alleen de hostnaam', () => {
    expect(hostVan('https://editor.coderius.nl')).toBe('editor.coderius.nl');
  });
});
