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
const { GETAL_KLEUR, INGEBOUWD_LICHT, licht, donker } = require('./prism-thema') as {
  GETAL_KLEUR: string;
  INGEBOUWD_LICHT: string;
  licht: PrismTheme;
  donker: PrismTheme;
};

/** Het stukje code met de tekst `stuk`, zoals Prism het tekent. */
function spanVan(thema: PrismTheme, code: string, stuk: string): HTMLElement | undefined {
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
  return [...container.querySelectorAll('span')].find((s) => s.textContent === stuk);
}

/** De kleur van het stukje code met de tekst `stuk`. */
const kleurVan = (thema: PrismTheme, code: string, stuk: string) =>
  spanVan(thema, code, stuk)?.style.color || undefined;

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

  it('elke soort code heeft in beide standen een kleur, of in geen van beide', () => {
    // range was in donker paars en in licht zwart (issue #223): github
    // kleurde `builtin` niet. Zo ook de waarde van een HTML-attribuut, een
    // CSS-eigenschap en de doctype, in de andere richting.
    const stijl = (thema: PrismTheme, soort: string) =>
      thema.styles
        .filter((r) => r.types.includes(soort))
        .reduce<Record<string, unknown>>((s, r) => Object.assign(s, r.style), {});
    const gekleurd = (thema: PrismTheme, soort: string) => {
      const s = stijl(thema, soort);
      const kleur = s.color as string | undefined;
      return (
        (!!kleur && hex(kleur) !== hex(thema.plain.color as string)) || s.opacity !== undefined
      );
    };
    const soorten = [...new Set([...licht.styles, ...donker.styles].flatMap((r) => r.types))];
    expect(soorten.length).toBeGreaterThan(20);
    const anders = soorten.filter((s) => gekleurd(licht, s) !== gekleurd(donker, s));
    expect(anders).toEqual([]);
  });

  it('alleen commentaar is cursief, in beide standen', () => {
    // for, in en print waren in donker cursief en in licht recht (issue
    // #224): dracula zet keyword en variable cursief.
    const cursief = (thema: PrismTheme) =>
      [...new Set(thema.styles.flatMap((r) => r.types))]
        .filter((soort) => {
          const regels = thema.styles.filter((r) => r.types.includes(soort));
          return (
            regels.reduce<string | undefined>((f, r) => r.style.fontStyle ?? f, undefined) ===
            'italic'
          );
        })
        .sort();
    expect(cursief(licht)).toEqual(['cdata', 'comment', 'doctype', 'prolog']);
    expect(cursief(donker)).toEqual(['cdata', 'comment', 'doctype', 'prolog']);
    const code = 'for i in range(3):\n    print(i)  # tel';
    for (const thema of [licht, donker]) {
      for (const stuk of ['for', 'in', 'print'])
        expect(spanVan(thema, code, stuk)?.style.fontStyle ?? '', stuk).not.toBe('italic');
      expect(spanVan(thema, code, '# tel')?.style.fontStyle).toBe('italic');
    }
  });

  it('range heeft in licht een kleur, net als in donker', () => {
    const code = 'for i in range(3):\n    print(len(i))';
    expect(hex(kleurVan(licht, code, 'range') ?? '')).toBe(INGEBOUWD_LICHT);
    expect(hex(kleurVan(licht, code, 'len') ?? '')).toBe(INGEBOUWD_LICHT);
    expect(kleurVan(donker, code, 'range')).toBe(kleurVan(themes.dracula, code, 'range'));
    expect(kleurVan(themes.github, code, 'range')).toBeUndefined();
  });

  it('een ingebouwde functie is goed leesbaar op de lichte achtergrond', () => {
    expect(
      contrast(INGEBOUWD_LICHT, hex(licht.plain.backgroundColor as string)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('een getal is goed leesbaar op de donkere achtergrond', () => {
    expect(
      contrast(GETAL_KLEUR, hex(donker.plain.backgroundColor as string)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
