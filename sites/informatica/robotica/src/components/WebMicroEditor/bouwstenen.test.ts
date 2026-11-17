import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lesBestaat } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { BOUWSTENEN, GROEPEN, STARTCODE, bouwsteenMetId, kernRegels } from './bouwstenen';

// De bouwstenen van het palet: per onderdeel en per Python-stap een voorbeeld,
// een zin uitleg en links naar de lessen. Een leerling neemt het voorbeeld
// over, dus het moet kloppen met de lessen: dezelfde namen, dezelfde pinnen.
// Dat elk voorbeeld compileert en op het bord draait, toetsen
// leaphy-api.test.ts en de job blokken in CI (src/lego-tests/schrijf.ts).

const SITE = fileURLToPath(new URL('../../..', import.meta.url));
const REPO = fileURLToPath(new URL('../../../../../..', import.meta.url));

function lesbestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lesbestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const lessen = [
  ...lesbestanden(join(SITE, 'docs', 'onderdelen')),
  ...lesbestanden(join(SITE, 'lego_auto')),
].map((pad) => ({ pad, tekst: readFileSync(pad, 'utf8') }));

/** De regels van elk python-blok in de lessen. */
const lesregels = new Set(
  lessen.flatMap(({ tekst }) =>
    [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].flatMap((m) => m[1].split('\n')),
  ),
);

/** De adressen van de Lego-auto: elke pagina heeft een bevroren slug. */
const legoSlugs = new Set(
  lessen
    .filter(({ pad }) => pad.includes('/lego_auto/'))
    .flatMap(({ tekst }) => {
      const slug = /^slug:\s*(\S+)/m.exec(tekst)?.[1];
      return slug ? [`/lego_auto${slug === '/' ? '' : slug}`] : [];
    }),
);

describe('de groepen en de labels', () => {
  it('heeft de drie groepen van het palet', () => {
    expect(GROEPEN.map((g) => g.label)).toEqual(['Sensoren', 'Actuatoren', 'Python']);
  });

  it('heeft unieke ids en labels', () => {
    expect(new Set(BOUWSTENEN.map((b) => b.id)).size).toBe(BOUWSTENEN.length);
    expect(new Set(BOUWSTENEN.map((b) => b.label)).size).toBe(BOUWSTENEN.length);
    expect(bouwsteenMetId('onthoud')?.label).toBe('Onthoud iets');
    expect(bouwsteenMetId('bestaat-niet')).toBeUndefined();
  });

  it('een label zegt wat de bouwsteen doet, niet hoe het in Python heet', () => {
    // De opdrachtgever: "meer om de functie dan het technische concept".
    const labels = BOUWSTENEN.map((b) => b.label).join('\n');
    expect(labels).not.toMatch(/variabele|functie|while|print|\bif\b/i);
    // "Herhaal als" las als één keer.
    expect(bouwsteenMetId('herhaal-zolang')?.label).toBe('Herhaal zolang');
  });

  it('een groep past zonder schuiven in het paneel', () => {
    // 380 pixels hoog; in Chromium gemeten passen er tien bouwstenen in.
    for (const g of GROEPEN) expect(g.bouwstenen.length, g.id).toBeLessThanOrEqual(10);
  });
});

describe('het voorbeeld van een bouwsteen', () => {
  it('is een heel programma, kort genoeg om naast de code te lezen', () => {
    for (const b of BOUWSTENEN) {
      expect(b.voorbeeld.endsWith('\n') && !b.voorbeeld.endsWith('\n\n'), b.id).toBe(true);
      const regels = b.voorbeeld.trimEnd().split('\n');
      // Het venster is 426 pixels hoog; langer schuift de uitleg uit beeld.
      expect(regels.length, b.id).toBeLessThanOrEqual(17);
      // 62 tekens passen op één regel naast de code (de langste import).
      for (const regel of regels) expect(regel.length, `${b.id}: ${regel}`).toBeLessThanOrEqual(62);
      expect(b.voorbeeld, b.id).not.toMatch(/\t|[ \t]+$/m);
    }
  });

  it('de sensoren en actuatoren beginnen met hun import', () => {
    for (const g of GROEPEN.filter((x) => x.id !== 'python'))
      for (const b of g.bouwstenen) expect(b.voorbeeld, b.id).toMatch(/^from \S+ import /);
  });

  it('elke regel die een onderdeel aanmaakt, staat letterlijk in een les', () => {
    // Dezelfde naam en dezelfde pin als het aansluitschema: wie lescode in de
    // editor heeft en een regel uit een voorbeeld overneemt, krijgt geen
    // tweede onderdeel op dezelfde pin. Een afwijkende pin ving eerst niets.
    for (const b of BOUWSTENEN) {
      const regels = b.voorbeeld.split('\n');
      regels.forEach((regel, i) => {
        const maakt =
          /^[a-z_]\w* = [A-Z]\w*\(/.test(regel) || /^[a-z_]\w* = [a-z_]\w*\.[a-z_]\w*$/.test(regel);
        if (!maakt) return;
        expect(lesregels.has(regel), `${b.id}: ${regel}`).toBe(true);
        // Loopt de aanroep over meer regels, dan ook die regels.
        for (let j = i + 1; regel.endsWith('(') && regels[j] !== ')'; j++)
          expect(lesregels.has(regels[j]), `${b.id}: ${regels[j]}`).toBe(true);
      });
    }
  });

  it('een import staat ook zo in een les', () => {
    for (const b of BOUWSTENEN)
      for (const regel of b.voorbeeld.split('\n'))
        if (regel.startsWith('from ')) expect(lesregels.has(regel), `${b.id}: ${regel}`).toBe(true);
  });

  it('de TOF staat op kanaal 0 van de multiplexer, zoals op de Lego-auto', () => {
    expect(bouwsteenMetId('afstand-tof')?.voorbeeld).toContain('    channel=0,\n');
    // De twee afstandssensoren meten in een andere eenheid.
    expect(bouwsteenMetId('afstand-tof')?.label).toContain('mm');
    expect(bouwsteenMetId('afstand-ultrasoon')?.label).toContain('cm');
    expect(bouwsteenMetId('afstand-ultrasoon')?.voorbeeld).toContain('afstand_cm = ');
  });
});

describe('de kern: de regels waar het om gaat', () => {
  it('elke kernregel staat letterlijk in het voorbeeld', () => {
    for (const b of BOUWSTENEN) {
      expect(b.kern.length, b.id).toBeGreaterThan(0);
      const regels = b.voorbeeld.split('\n');
      for (const regel of b.kern) expect(regels, `${b.id}: ${regel}`).toContain(regel);
      expect(new Set(b.kern).size, b.id).toBe(b.kern.length);
    }
  });

  it('kernRegels geeft de regelnummers, vanaf 1', () => {
    expect(kernRegels(bouwsteenMetId('herhaal-altijd') as never)).toEqual([3]);
    expect(kernRegels(bouwsteenMetId('herhaal-keer') as never)).toEqual([1, 2, 4]);
    // De kern is een deel van het voorbeeld, niet het hele voorbeeld.
    for (const b of BOUWSTENEN)
      expect(kernRegels(b).length, b.id).toBeLessThan(
        b.voorbeeld.split('\n').filter((r) => r.trim() !== '').length,
      );
  });
});

describe('de uitleg en de links', () => {
  it('de uitleg is kort en noemt geen code die niet in het voorbeeld staat', () => {
    for (const b of BOUWSTENEN) {
      expect(b.uitleg.length, b.id).toBeGreaterThan(30);
      expect(b.uitleg.length, b.id).toBeLessThanOrEqual(190);
      expect(b.uitleg, b.id).not.toMatch(/!|\bu\b|hierboven|hieronder/i);
      // Backticks in paren.
      expect((b.uitleg.match(/`/g) ?? []).length % 2, b.id).toBe(0);
    }
  });

  it('elke bouwsteen heeft een tot drie links, elk met een eigen adres', () => {
    for (const b of BOUWSTENEN) {
      expect(b.links.length, b.id).toBeGreaterThanOrEqual(1);
      expect(b.links.length, b.id).toBeLessThanOrEqual(3);
      expect(new Set(b.links.map((l) => `${l.site ?? ''}${l.naar}`)).size, b.id).toBe(
        b.links.length,
      );
    }
  });

  it('elke sensor en actuator linkt naar zijn onderdeelpagina', () => {
    for (const g of GROEPEN.filter((x) => x.id !== 'python'))
      for (const b of g.bouwstenen)
        expect(
          b.links.some((l) => !l.site && l.naar.startsWith('/docs/onderdelen/')),
          b.id,
        ).toBe(true);
  });

  it('elke link wijst naar een pagina die bestaat', () => {
    // De editor staat in BrowserOnly: de job cross-links ziet deze links niet.
    for (const b of BOUWSTENEN) {
      for (const link of b.links) {
        const waar = `${b.id}: ${link.site ?? 'robotica'}${link.naar}`;
        if (link.site) {
          expect(lesBestaat(REPO, link.site, link.naar), waar).toBe(true);
        } else if (link.naar.startsWith('/lego_auto/')) {
          expect(legoSlugs.has(link.naar), waar).toBe(true);
        } else {
          const m = /^\/docs\/onderdelen\/([a-z-]+)$/.exec(link.naar);
          expect(m, waar).not.toBeNull();
          expect(
            () => statSync(join(SITE, 'docs', 'onderdelen', `${m?.[1]}.mdx`)),
            waar,
          ).not.toThrow();
        }
      }
    }
  });

  it('een link naar een deel van de Lego-auto noemt dat deel zoals de les heet', () => {
    const titels = new Map(
      lessen
        .filter(({ pad }) => pad.includes('/lego_auto/'))
        .flatMap(({ tekst }) => {
          const slug = /^slug:\s*(\S+)/m.exec(tekst)?.[1];
          const titel = /^title:\s*"?(.*?)"?\s*$/m.exec(tekst)?.[1];
          return slug && titel ? [[`/lego_auto${slug}`, titel] as [string, string]] : [];
        }),
    );
    for (const b of BOUWSTENEN)
      for (const link of b.links.filter((l) => /^Deel \d+/.test(l.label)))
        expect(link.label, `${b.id}: ${link.naar}`).toBe(titels.get(link.naar));
  });
});

describe('de startcode', () => {
  it('is een programma dat meteen iets laat zien', () => {
    expect(STARTCODE).toBe("# Schrijf hier je code.\nprint('Hallo Lego-auto!')\n");
  });
});
