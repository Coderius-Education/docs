// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
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

// Een gemarkeerde regel (```python {2-3}) krijgt de tint van de markeerstift
// achter de code. Geel maakt een donkere regel lichter: met 20% tint stond
// een getal in donker op 3,0:1 en een sleutelwoord op 3,4:1, terwijl ze op een
// gewone regel boven 4,5:1 staan. Niemand zag dat, want tot de proef in het
// hoofdstuk Herhalen van python gebruikte geen les een markering. Wat op een
// gewone regel goed leesbaar is, moet dat op een gemarkeerde regel ook zijn;
// de markering zelf draagt de balk links.
describe('code op een gemarkeerde regel blijft leesbaar', () => {
  // De test draait in jsdom, waar import.meta.url geen bestand is.
  const css = (naam: string) =>
    readFileSync(join(dirname(require.resolve('./prism-thema')), 'css', naam), 'utf8');
  const huisstijl = css('huisstijl.css');
  const opmaak = css('custom.css');
  const tinten = [
    ...huisstijl.matchAll(
      /--docusaurus-highlighted-code-line-bg: color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, transparent\)/g,
    ),
  ].map((m) => ({ kleur: m[1], deel: Number(m[2]) / 100 }));
  const randen = [...huisstijl.matchAll(/--coderius-markeer-rand: (#[0-9a-f]{6})/g)].map(
    (m) => m[1],
  );

  /** De kleur van een regel met de tint eroverheen. */
  const gemarkeerd = (grond: string, tint: { kleur: string; deel: number }) =>
    `#${[1, 3, 5]
      .map((i) => {
        const van = (h: string) => Number.parseInt(h.slice(i, i + 2), 16);
        return Math.round(tint.deel * van(tint.kleur) + (1 - tint.deel) * van(grond))
          .toString(16)
          .padStart(2, '0');
      })
      .join('')}`;

  const standen = [
    { naam: 'licht', thema: licht },
    { naam: 'donker', thema: donker },
  ];

  it('de huisstijl heeft een tint en een balk voor licht en voor donker', () => {
    expect(tinten.length).toBe(2);
    expect(randen.length).toBe(2);
  });

  it.each(standen.map((s, i) => ({ ...s, tint: tinten[i] })))(
    '$naam: Python die op een gewone regel 4,5:1 haalt, haalt dat ook op een gemarkeerde',
    ({ thema, tint }) => {
      const grond = hex(thema.plain.backgroundColor as string);
      const regel = gemarkeerd(grond, tint);
      const code = 'for i in range(3):\n    print("hoi", 5, True)';
      const kleuren = ['for', 'in', 'range', 'print', '3', '"hoi"', 'True', 'i']
        .map((stuk) => kleurVan(thema, code, stuk) ?? (thema.plain.color as string))
        .map(hex);
      const leesbaar = [...new Set(kleuren)].filter((k) => contrast(k, grond) >= 4.5);
      expect(leesbaar.length).toBeGreaterThanOrEqual(2);
      expect(leesbaar.filter((k) => contrast(k, regel) < 4.5)).toEqual([]);
    },
  );

  it.each(standen.map((s, i) => ({ ...s, tint: tinten[i] })))(
    '$naam: geen kleur van het thema verliest op een gemarkeerde regel meer dan een tiende',
    ({ thema, tint }) => {
      // Een paar kleuren staan op een gewone regel al op de grens (4,5 tot
      // 4,6:1); elke tint kost die iets. Met 20% tint verloor in donker elke
      // kleur ruim veertig procent.
      const grond = hex(thema.plain.backgroundColor as string);
      const regel = gemarkeerd(grond, tint);
      const kleuren = [thema.plain.color, ...thema.styles.map((s) => s.style.color)]
        .filter((k): k is string => typeof k === 'string')
        .map(hex);
      expect(kleuren.length).toBeGreaterThan(5);
      expect(
        [...new Set(kleuren)].filter((k) => contrast(k, regel) < 0.9 * contrast(k, grond)),
      ).toEqual([]);
    },
  );

  it.each(standen.map((s, i) => ({ ...s, tint: tinten[i], rand: randen[i] })))(
    '$naam: de balk links is te zien op de gemarkeerde regel (3:1)',
    ({ thema, tint, rand }) => {
      const regel = gemarkeerd(hex(thema.plain.backgroundColor as string), tint);
      expect(contrast(rand, regel)).toBeGreaterThanOrEqual(3);
    },
  );

  it('de balk is een rand en geen schaduw: een rand komt ook op papier', () => {
    const blok = /\.theme-code-block-highlighted-line \{([^}]*)\}/.exec(opmaak)?.[1] ?? '';
    expect(blok).toMatch(/border-left: 4px solid var\(--coderius-markeer-rand\)/);
    expect(blok).toMatch(/padding-left: calc\(var\(--ifm-pre-padding\) - 4px\)/);
  });

  it('met regelnummers draagt het vak met het nummer de balk', () => {
    // Een regel met nummers is een rij van een tabel (theme-classic,
    // CodeBlock/Line: `display: table-row`), en een rij tekent geen rand. In
    // algoritmes had zo geen enkele gemarkeerde regel een balk. Dat de balk
    // nu te zien is, is in Chromium nagemeten; node rendert geen tabel.
    const blok =
      /\.theme-code-block-highlighted-line > \[class\*="codeLineNumber"\] \{([^}]*)\}/.exec(
        opmaak,
      )?.[1] ?? '';
    expect(blok).toMatch(/border-left: 4px solid var\(--coderius-markeer-rand\)/);
    expect(blok).toMatch(/padding-left: calc\(var\(--ifm-pre-padding\) - 4px\)/);
    // Het vak plakt links en heeft een eigen achtergrond: de tint moet erover.
    expect(blok).toMatch(
      /var\(--docusaurus-highlighted-code-line-bg\)[\s\S]*var\(--ifm-pre-background\)/,
    );
  });
});
