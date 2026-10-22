import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De print-CSS van de hand-outs (components/Handout/handout.css) komt in de
// algemene stylesheet van elke site die een hand-out heeft. Een regel die aan
// body.handout-page hangt, doet alleen iets op een hand-out; een @page-regel
// niet, want die kun je niet met een selector beperken. Zo kreeg elke les van
// de python-cursus de A4-marges van de hand-outs als iemand hem printte. Nu
// zet de Handout-component @page zelf neer, zolang hij open staat.

const map = new URL('./components/Handout/', import.meta.url);
const css = readFileSync(fileURLToPath(new URL('handout.css', map)), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);
const component = readFileSync(fileURLToPath(new URL('index.tsx', map)), 'utf8');

describe('de print-CSS van de hand-outs', () => {
  it('handout.css heeft geen @page: die zou voor elke pagina van de site gelden', () => {
    expect(css).not.toMatch(/@page/);
  });

  it('elke printregel hangt aan een hand-out', () => {
    const selectors = [...css.matchAll(/^\s*([^@/{}\s][^{}]*?)\s*\{/gm)].map((m) => m[1]);
    for (const s of selectors) {
      for (const deel of s.split(','))
        expect(deel.trim(), s).toMatch(/^body\.handout-(page|compact)\b/);
    }
  });

  it('de component zet @page neer bij het openen en haalt hem weg bij het sluiten', () => {
    expect(component).toMatch(/PAGINA = '@page \{ size: A4; margin: 10mm 12mm; \}'/);
    expect(component).toMatch(/document\.head\.appendChild\(pagina\)/);
    expect(component).toMatch(/pagina\.remove\(\)/);
  });
});
