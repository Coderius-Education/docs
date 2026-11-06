// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { render } from '@testing-library/react';
import { Highlight, type PrismTheme, themes } from 'prism-react-renderer';
import { describe, expect, it } from 'vitest';

// In donker werden getallen wit, terwijl ze in licht blauwgroen zijn (issue
// #158): dracula geeft `number` en `boolean` geen kleur.
// Deze test kleurt een stukje Python zoals een codeblok en de editor van de
// python-runner dat doen, en eist in beide standen dezelfde kleur voor getallen.
// Dat createConfig en de editor deze thema's gebruiken, staat in config.test.ts.

const require = createRequire(import.meta.url);
const { GETAL_KLEUR, licht, donker } = require('./prism-thema') as {
  GETAL_KLEUR: string;
  licht: PrismTheme;
  donker: PrismTheme;
};

/** De kleur van elk stukje code met de tekst `stuk`, zoals Prism het tekent. */
function kleurVan(thema: PrismTheme, code: string, stuk: string): string | undefined {
  const { container } = render(
    <Highlight theme={thema} code={code} language="python">
      {({ tokens, getTokenProps }) => (
        <pre>
          {tokens.map((regel, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: regels van een vast stukje code
            <div key={i}>
              {regel.map((token, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens van een vaste regel
                <span key={j} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>,
  );
  const span = [...container.querySelectorAll('span')].find((s) => s.textContent === stuk);
  return span?.style.color || undefined;
}

const hex = (kleur: string) => {
  const m = kleur.match(/\d+/g);
  return kleur.startsWith('#')
    ? kleur.toLowerCase()
    : `#${m
        ?.slice(0, 3)
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')}`;
};

/** Contrast volgens WCAG tussen twee hex-kleuren. */
function contrast(a: string, b: string): number {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const CODE = 'score = 5\nklaar = True\nprint("tekst")';

describe('de kleuren van Python-code in licht en donker', () => {
  it('een getal en True hebben in licht en donker dezelfde kleur', () => {
    for (const thema of [licht, donker]) {
      expect(hex(kleurVan(thema, CODE, '5') ?? ''), thema === licht ? 'licht' : 'donker').toBe(
        GETAL_KLEUR,
      );
      expect(hex(kleurVan(thema, CODE, 'True') ?? '')).toBe(GETAL_KLEUR);
    }
  });

  it('dracula zelf kleurde getallen niet: daar kwam het issue vandaan', () => {
    expect(kleurVan(themes.dracula, CODE, '5')).toBeUndefined();
  });

  it('de rest van donker blijft dracula', () => {
    expect(kleurVan(donker, CODE, '"tekst"')).toBe(kleurVan(themes.dracula, CODE, '"tekst"'));
    expect(kleurVan(donker, CODE, 'print')).toBe(kleurVan(themes.dracula, CODE, 'print'));
  });

  it('een getal is goed leesbaar op de donkere achtergrond', () => {
    expect(
      contrast(GETAL_KLEUR, hex(donker.plain.backgroundColor as string)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
