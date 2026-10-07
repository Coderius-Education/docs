import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteMappenOpSchijf } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Elke cursus staat onder een pad van de host van zijn vak:
// https://informatica.coderius.nl/python/. Docusaurus zet die baseUrl vanzelf
// voor markdown-links, markdown-plaatjes, <Link to> en navbar-items, maar niet
// voor een kale <a href="/…"> of <img src="/…"> in JSX of MDX. Zo'n pad wijst
// naar de root van de vak-host, waar de homepage staat: een kapot plaatje of
// een link die stil op de verkeerde site uitkomt. Gebruik <Link to>,
// useBaseUrl('/…') of een markdown-link.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', 'static', '__fixtures__']);
const KAAL =
  /<(?:a|img|source|video|audio|iframe|script|link)\b[^>]*?\s(?:href|src|poster)="\/(?!\/)/;

function bestanden(map: string, ext: RegExp): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    if (OVERSLAAN.has(e.name) || e.name.startsWith('.')) return [];
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad, ext);
    return ext.test(e.name) && !e.name.includes('.test.') ? [pad] : [];
  });
}

/** Proza van een md/mdx-bestand: codeblokken en inline code eruit. */
function proza(tekst: string): string[] {
  let hek: string | null = null;
  return tekst.split('\n').map((regel) => {
    const m = regel.match(/^\s*(`{3,}|~{3,})/);
    if (hek) {
      if (m && m[1][0] === hek[0] && m[1].length >= hek.length) hek = null;
      return '';
    }
    if (m) {
      hek = m[1];
      return '';
    }
    return regel.replace(/`[^`\n]*`/g, '``');
  });
}

function overtredingen(): string[] {
  const fout: string[] = [];
  const mappen = [
    ...siteMappenOpSchijf(ROOT)
      .filter((s) => s.id !== 'home')
      .map((s) => s.map),
    join(ROOT, 'packages'),
  ];
  for (const map of mappen) {
    for (const pad of bestanden(map, /\.(mdx?|tsx|jsx)$/)) {
      const tekst = readFileSync(pad, 'utf8');
      const regels = /\.mdx?$/.test(pad) ? proza(tekst) : tekst.split('\n');
      regels.forEach((regel, i) => {
        if (KAAL.test(regel)) fout.push(`${relative(ROOT, pad)}:${i + 1}`);
      });
    }
  }
  return fout;
}

describe('geen kaal absoluut pad in JSX', () => {
  it('elke <a href> en <img src> naar de eigen site gaat via de baseUrl', () => {
    expect(overtredingen()).toEqual([]);
  });

  it('herkent een kale <img src="/…"> en laat code en <Link> met rust', () => {
    expect(KAAL.test('<img src="/img/x.png" alt="x" />')).toBe(true);
    expect(KAAL.test('<a href="/docs/x" download>x</a>')).toBe(true);
    expect(KAAL.test('<a href="//cdn.example.org/x">x</a>')).toBe(false);
    expect(KAAL.test("<img src={useBaseUrl('/img/x.png')} />")).toBe(false);
    expect(KAAL.test('<Link to="/docs/x">x</Link>')).toBe(false);
    expect(proza('```html\n<a href="/about">x</a>\n```\ntekst').join('\n')).not.toMatch(KAAL);
  });
});
