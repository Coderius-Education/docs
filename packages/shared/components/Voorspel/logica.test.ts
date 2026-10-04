import { type ReactElement, createElement } from 'react';
import { describe, expect, it } from 'vitest';
import Voorspel, { Keuze, Uitleg } from './index';
import {
  BEGIN,
  type KeuzeInfo,
  TEKST,
  kies,
  kop,
  markering,
  oordeel,
  problemen,
  toonUitleg,
} from './logica';

const keuzes: KeuzeInfo[] = [
  { goed: false, uitleg: 'Het Leaphy-blok loopt één keer.' },
  { goed: true, uitleg: 'Alles staat in herhaal voor altijd.' },
  { goed: false, uitleg: 'De servo wacht op 90°.' },
];

describe('kiezen', () => {
  it('begint zonder keuze, zonder oordeel en zonder uitleg', () => {
    expect(oordeel(BEGIN, keuzes)).toBe('open');
    expect(toonUitleg(BEGIN, keuzes)).toBe(false);
    expect(kop(BEGIN, keuzes)).toBe('');
    expect(keuzes.map((_, i) => markering(BEGIN, keuzes, i))).toEqual(['open', 'open', 'open']);
  });

  it('een foute keuze is fout, en verklapt de algemene uitleg nog niet', () => {
    // De algemene uitleg noemt het goede antwoord. Verscheen hij na de
    // eerste foute gok, dan las de leerling het antwoord voor hij opnieuw
    // kon kiezen.
    const t = kies(BEGIN, keuzes, 0);
    expect(oordeel(t, keuzes)).toBe('fout');
    expect(kop(t, keuzes)).toBe(TEKST.fout);
    expect(toonUitleg(t, keuzes)).toBe(false);
  });

  it('de algemene uitleg komt na de goede keuze, of als elke foute geprobeerd is', () => {
    expect(toonUitleg(kies(BEGIN, keuzes, 1), keuzes)).toBe(true);
    expect(toonUitleg(kies(kies(BEGIN, keuzes, 0), keuzes, 2), keuzes)).toBe(true);
    // Na een goede keuze blijft hij staan, ook als je daarna iets anders kiest.
    expect(toonUitleg(kies(kies(BEGIN, keuzes, 1), keuzes, 2), keuzes)).toBe(true);
  });

  it('een foute gok verklapt de goede keuze niet', () => {
    const t = kies(BEGIN, keuzes, 0);
    expect(keuzes.map((_, i) => markering(t, keuzes, i))).toEqual(['fout', 'open', 'open']);
  });

  it('na een foute keuze kun je opnieuw kiezen, en de foute blijft gemarkeerd', () => {
    const t = kies(kies(BEGIN, keuzes, 0), keuzes, 1);
    expect(oordeel(t, keuzes)).toBe('goed');
    expect(kop(t, keuzes)).toBe(TEKST.goed);
    expect(t.gekozen).toBe(1);
    expect(keuzes.map((_, i) => markering(t, keuzes, i))).toEqual(['fout', 'goed', 'open']);
  });

  it('ook na een goede keuze kun je nog iets anders kiezen', () => {
    const t = kies(kies(BEGIN, keuzes, 1), keuzes, 2);
    expect(oordeel(t, keuzes)).toBe('fout');
    expect(t.geprobeerd).toEqual([1, 2]);
  });

  it('dezelfde keuze nog een keer telt niet dubbel', () => {
    const t = kies(kies(BEGIN, keuzes, 2), keuzes, 2);
    expect(t.geprobeerd).toEqual([2]);
  });

  it('een keuze die niet bestaat verandert niets', () => {
    expect(kies(BEGIN, keuzes, 3)).toBe(BEGIN);
    expect(kies(BEGIN, keuzes, -1)).toBe(BEGIN);
  });

  it('de vaste teksten hebben geen uitroepteken en geen u', () => {
    for (const zin of Object.values(TEKST)) {
      expect(zin).not.toMatch(/!/);
      expect(zin).not.toMatch(/\bu\b/i);
    }
  });
});

describe('problemen', () => {
  it('een goede rij keuzes heeft er geen', () => {
    expect(problemen(keuzes)).toEqual([]);
  });

  it('nul of twee goede keuzes, één keuze, of een keuze zonder uitleg', () => {
    expect(problemen(keuzes.map((k) => ({ ...k, goed: false })))).toHaveLength(1);
    expect(problemen(keuzes.map((k) => ({ ...k, goed: true })))).toHaveLength(1);
    expect(problemen([{ goed: true, uitleg: 'x' }])).toHaveLength(1);
    expect(problemen([...keuzes, { goed: false, uitleg: '  ' }])).toEqual([
      'keuze 4 heeft geen uitleg',
    ]);
  });
});

// react-dom heeft in deze monorepo geen typen; met de specifier als string
// zoekt tsc ze niet, en vitest laadt gewoon de server-render van React.
const { renderToStaticMarkup } = (await import('react-dom/server' as string)) as {
  renderToStaticMarkup: (element: ReactElement) => string;
};

describe('de server-render', () => {
  // Zolang JavaScript nog niet geladen is, ziet de leerling de HTML van de
  // server. Daarin staan de keuzes, maar mag de uitleg niet staan: anders
  // leest hij het antwoord voordat hij kiest.
  const html = renderToStaticMarkup(
    createElement(
      Voorspel,
      { vraag: 'Wat doet het asje?' },
      createElement(Keuze, { goed: true, uitleg: 'GOEDE-UITLEG' }, 'Heen en weer'),
      createElement(Keuze, { uitleg: 'FOUTE-UITLEG' }, 'Een keer'),
      createElement(Uitleg, null, 'ALGEMENE-UITLEG'),
    ),
  );

  it('toont de vraag en de keuzes als knoppen', () => {
    expect(html).toContain('Wat doet het asje?');
    expect(html).toContain('Heen en weer');
    expect(html).toContain('Een keer');
    expect(html.match(/<button type="button"/g)).toHaveLength(2);
    expect(html).toContain('aria-pressed="false"');
  });

  it('verbergt elke uitleg tot er gekozen is', () => {
    expect(html).not.toMatch(/GOEDE-UITLEG|FOUTE-UITLEG|ALGEMENE-UITLEG/);
  });

  it('heeft de live-regio al klaarstaan', () => {
    expect(html).toContain('aria-live="polite"');
  });
});
