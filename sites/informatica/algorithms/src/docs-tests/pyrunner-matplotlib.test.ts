import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { heeftMatplotlibNodig } from '../components/PyRunner/matplotlib';
import { VERBORGEN } from '../components/PyRunner/verborgen';

// De runner laadt matplotlib (~39 MB) alleen als de code erom vraagt. Eerst
// keek hij alleen naar de code in de editor; de tekenfuncties van de route
// machine learning staan in verborgen code, en dan viel die om op een
// ontbrekende module.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const IMPL = fileURLToPath(new URL('../components/PyRunner/PyRunnerImpl.tsx', import.meta.url));

function lessen(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lessen(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

describe('wanneer de runner matplotlib laadt', () => {
  it('niet voor code zonder matplotlib', () => {
    expect(heeftMatplotlibNodig('print(1)', null)).toBe(false);
    expect(heeftMatplotlibNodig('print(1)', VERBORGEN.knn)).toBe(false);
  });

  it('wel als de editor of de verborgen code het gebruikt', () => {
    expect(heeftMatplotlibNodig('import matplotlib.pyplot as plt', null)).toBe(true);
    expect(
      heeftMatplotlibNodig('teken_buren(voorbeelden, nieuw, 3)', VERBORGEN['fruit-tekenen']),
    ).toBe(true);
  });

  it('alleen een echte import telt, geen woord in commentaar of een string', () => {
    expect(heeftMatplotlibNodig('# zonder matplotlib\nprint(1)', null)).toBe(false);
    expect(heeftMatplotlibNodig('print("pyplot en plt.show")', null)).toBe(false);
    expect(heeftMatplotlibNodig('from matplotlib import pyplot', null)).toBe(true);
    expect(heeftMatplotlibNodig('    import matplotlib.pyplot as p', null)).toBe(true);
    expect(heeftMatplotlibNodig('import pylab', null)).toBe(true);
  });

  it('de runner geeft de verborgen code mee, ook bij het voorladen', () => {
    // De warmup had een eigen regex die alleen naar de editor keek: de
    // plaatjes van k-buren en het perceptron haalden matplotlib pas bij de
    // eerste klik op.
    const impl = readFileSync(IMPL, 'utf8');
    expect(impl).toContain('heeftMatplotlibNodig(code, verborgenCode)');
    expect(impl).toContain('heeftMatplotlibNodig(source, verborgenCode)');
    expect(impl).not.toMatch(/\/\\b\(matplotlib/);
  });

  it('elke runner die een tekenfunctie aanroept, heeft de verborgen code die hem tekent', () => {
    const fout: string[] = [];
    for (const pad of lessen(DOCS)) {
      const tekst = readFileSync(pad, 'utf8');
      for (const tag of tekst.matchAll(/<PyRunner\b[\s\S]*?\/>/g)) {
        if (!/\bteken_(buren|grens)\(/.test(tag[0])) continue;
        if (!tag[0].includes('verborgen="fruit-tekenen"')) fout.push(relative(DOCS, pad));
      }
    }
    expect(fout).toEqual([]);
  });
});
