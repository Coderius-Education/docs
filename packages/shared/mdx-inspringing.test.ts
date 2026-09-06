import { compile } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';
import { bewaarInspringing } from './plugins/mdx-inspringing';

// Elke PyRunner, CodeExercise en PygbagRunner in de monorepo toonde code met
// twee spaties inspringing terwijl de les vier heeft: MDX eet tot twee spaties
// van elke vervolgregel in een {`…`}-expressie. De eerste test pint dat
// gedrag van MDX zelf vast, zodat we merken als een upgrade het verandert;
// de rest bewaakt dat de pre-loader het precies omkeert en verder niets
// aanraakt.

const LES = '<PyRunner initialCode={`for x in lijst:\n    print(x)\n\nif x:\n        diep()`} />\n';

async function literal(mdx: string): Promise<string> {
  const js = String(await compile(mdx));
  const m = js.match(/initialCode: `([\s\S]*?)`/) ?? js.match(/children: `([\s\S]*?)`/);
  if (!m) throw new Error(`geen literal in:\n${js}`);
  return m[1];
}

describe('MDX en inspringing in een template-literal', () => {
  it('MDX zelf haalt van elke vervolgregel tot twee spaties af (het gedrag dat we omkeren)', async () => {
    expect(await literal(LES)).toBe('for x in lijst:\n  print(x)\n\nif x:\n      diep()');
  });

  it('na de pre-loader houdt MDX de vier spaties van de les over', async () => {
    expect(await literal(bewaarInspringing(LES))).toBe(
      'for x in lijst:\n    print(x)\n\nif x:\n        diep()',
    );
  });

  it('werkt ook voor een literal als kind-element, zoals CodeExercise', async () => {
    const mdx = '<CodeExercise>{`def f():\n    return 1`}</CodeExercise>\n';
    expect(await literal(bewaarInspringing(mdx))).toBe('def f():\n    return 1');
  });
});

describe('bewaarInspringing', () => {
  it('voegt twee spaties toe aan niet-lege vervolgregels van een literal', () => {
    expect(bewaarInspringing('<P a={`x\n    y\n\nz`} />')).toBe('<P a={`x\n      y\n\n  z`} />');
  });

  it('laat een literal op één regel met rust', () => {
    const bron = '<P a={`x = 1`} /> en {`y`}\n';
    expect(bewaarInspringing(bron)).toBe(bron);
  });

  it('laat fenced codeblokken met rust, ook als daar {` in staat', () => {
    const bron = '```js\nconst t = {`a\n    b`};\n    x\n```\n\n```python\nif x:\n    y\n```\n';
    expect(bewaarInspringing(bron)).toBe(bron);
  });

  it('laat gewone tekst, export const en JSX zonder literal met rust', () => {
    const bron =
      'export const c = `x\n    y`;\n\n<Voorkennis\n  items={[{to: "/a"}]}\n/>\n\n- punt\n  vervolg\n';
    expect(bewaarInspringing(bron)).toBe(bron);
  });

  it('sluit de literal op de regel met `} en raakt de regels erna niet', () => {
    const bron = '<P a={`x\n    y`} />\n    tekst met vier spaties\n';
    expect(bewaarInspringing(bron)).toBe('<P a={`x\n      y`} />\n    tekst met vier spaties\n');
  });
});
