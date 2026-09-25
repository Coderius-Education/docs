import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Kleine vormregels die pnpm stijl niet ziet, omdat hij naar zinnen kijkt en
// niet naar koppen, codeblok-talen of frontmatter. Bij de audit stonden er
// 38 koppen met een punt erachter ("## Probeer het zelf."), twaalf
// codeblokken met ```javascript naast 113 met ```js, en één titel "Let op!".

const ROOT = join(__dirname, '..', '..');
const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', 'static']);

function lessen(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    if (OVERSLAAN.has(e.name)) return [];
    const pad = join(map, e.name);
    if (e.isDirectory()) return lessen(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

const bestanden = readdirSync(join(ROOT, 'sites')).flatMap((site) =>
  ['docs', 'src/pages', 'lego_auto'].flatMap((sub) => {
    try {
      return lessen(join(ROOT, 'sites', site, sub));
    } catch {
      return [];
    }
  }),
);

/** Regels buiten codeblokken, met hun nummer. */
function proza(tekst: string): [number, string][] {
  let inCode = false;
  return tekst.split('\n').flatMap((regel, i): [number, string][] => {
    if (/^\s*```/.test(regel)) {
      inCode = !inCode;
      return [];
    }
    return inCode ? [] : [[i + 1, regel]];
  });
}

describe('vorm van koppen, codeblokken en titels', () => {
  // Vanaf H2: een regel "# …" kan ook Python-commentaar in een
  // initialCode-template zijn, en dat is geen kop.
  it('geen kop eindigt op een punt', () => {
    const fout = bestanden.flatMap((p) =>
      proza(readFileSync(p, 'utf8'))
        .filter(([, r]) => /^#{2,6} .*[^.]\.$/.test(r))
        .map(([n, r]) => `${relative(ROOT, p)}:${n} ${r}`),
    );
    expect(fout).toEqual([]);
  });

  it('JavaScript-codeblokken heten ```js', () => {
    const fout = bestanden.filter((p) => /^\s*```javascript\b/m.test(readFileSync(p, 'utf8')));
    expect(fout.map((p) => relative(ROOT, p))).toEqual([]);
  });

  it('geen titel in de frontmatter eindigt op een uitroepteken', () => {
    const fout = bestanden.filter((p) =>
      /^---\n[\s\S]*?^(title|sidebar_label): .*!['"]?$[\s\S]*?^---$/m.test(readFileSync(p, 'utf8')),
    );
    expect(fout.map((p) => relative(ROOT, p))).toEqual([]);
  });
});
