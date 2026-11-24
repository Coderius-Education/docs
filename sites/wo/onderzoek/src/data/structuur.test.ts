import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import begrippen from './begrippen.js';

// De vorm van de site, die geen build en geen andere test bewaakt. Een
// review van het hoofdstuk Wetenschapsfilosofie (november 2026) vond dat een
// onbekend begrip in <B t="…"/> stil als vette tekst verschijnt, zonder
// tooltip, en dat een link in een component-prop (linkUrl) buiten de
// linkcontrole van Docusaurus valt. Deze test pint de afspraken uit de
// CLAUDE.md van de site vast.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function paginas(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return paginas(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const rel = (pad: string) => relative(DOCS, pad).split('\\').join('/');
const alle = paginas(DOCS).map((pad) => ({ pad: rel(pad), tekst: readFileSync(pad, 'utf8') }));

/** Bestaat er een pagina op deze route (zonder baseUrl, zonder anker)? */
function bestaat(route: string): boolean {
  const pad = route.split('#')[0].replace(/^\//, '');
  return ['.md', '.mdx', '/index.md', '/index.mdx'].some((ext) =>
    existsSync(join(DOCS, `${pad}${ext}`)),
  );
}

describe('structuur van de onderzoek-site', () => {
  it('elk begrip in <B t="…"/> staat in begrippen.js', () => {
    const onbekend = alle.flatMap(({ pad, tekst }) =>
      [...tekst.matchAll(/<B\s+t="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((id) => !(id in begrippen))
        .map((id) => `${pad}: ${id}`),
    );
    expect(onbekend).toEqual([]);
  });

  it('de url van elk begrip is een bestaande pagina', () => {
    const kapot = Object.entries(begrippen as Record<string, { url: string }>)
      .filter(([, b]) => !bestaat(b.url))
      .map(([id, b]) => `${id}: ${b.url}`);
    expect(kapot).toEqual([]);
  });

  it('een interne linkUrl van een <Denker> is absoluut en wijst naar een bestaande pagina', () => {
    const kapot = alle.flatMap(({ pad, tekst }) =>
      [...tekst.matchAll(/<Denker[^>]*\slinkUrl="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((url) => !url.startsWith('/') || !bestaat(url))
        .map((url) => `${pad}: ${url}`),
    );
    expect(kapot).toEqual([]);
  });

  it('een verbandpagina opent met "Het verband in één zin"', () => {
    // Een verbandpagina herken je aan haar titel: "… vs. …", "… naast
    // elkaar" of "… combineren" (CLAUDE.md van de site).
    const verband = alle.filter(({ tekst }) =>
      /^title: .*( vs\. |naast elkaar|combineren)/m.test(tekst),
    );
    expect(verband.length).toBeGreaterThanOrEqual(7);
    const zonder = verband
      .filter(({ tekst }) => {
        const na = tekst
          .replace(/^---[\s\S]*?---\s*/, '')
          .replace(/^# [^\n]+\n\n(<Bron [^\n]+\n\n)?/, '');
        return !na.startsWith('**Het verband in één zin:**');
      })
      .map(({ pad }) => pad);
    expect(zonder).toEqual([]);
  });
});
