import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { beantwoordWielen, isToegestaanWiel } from './wielen';

// De runner-iframes van play draaien leerlingcode. Alle informatica-cursussen
// delen één origin, dus de iframes krijgen geen allow-same-origin: anders kan
// leerlingcode bij de opslag van elke cursus. De wheels komen daarom via de
// pagina, en die geeft alleen wheels uit /play/whl/ van deze site.

const BASIS = 'https://informatica.coderius.nl/play';

describe('isToegestaanWiel', () => {
  it('laat alleen een wheel uit /whl/ van deze site door', () => {
    expect(isToegestaanWiel(`${BASIS}/whl/coderius_play-3.4.0-py3-none-any.whl`, BASIS)).toBe(true);
    expect(isToegestaanWiel(`${BASIS}/whl/../geheim.whl`, BASIS)).toBe(false);
    expect(isToegestaanWiel(`${BASIS}/whl/x.json`, BASIS)).toBe(false);
    expect(isToegestaanWiel('https://informatica.coderius.nl/ide/whl/x.whl', BASIS)).toBe(false);
    expect(isToegestaanWiel('https://kwaad.nl/whl/x.whl', BASIS)).toBe(false);
  });
});

describe('beantwoordWielen', () => {
  it('negeert een bericht van een ander venster dan de eigen iframe', () => {
    const iframe = { postMessage: vi.fn() } as unknown as Window;
    const e = { source: {}, data: { type: 'wielen-nodig', id: 'x', urls: [] } } as MessageEvent;
    expect(beantwoordWielen(e, iframe)).toBe(false);
  });

  it('weigert een wheel buiten /whl/ zonder iets op te halen', () => {
    const postMessage = vi.fn();
    const iframe = { postMessage } as unknown as Window;
    const fetch = vi.spyOn(globalThis, 'fetch');
    const e = {
      source: iframe,
      data: { type: 'wielen-nodig', id: 'x', urls: ['https://kwaad.nl/x.whl'] },
    } as unknown as MessageEvent;
    expect(beantwoordWielen(e, iframe)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expect(postMessage.mock.calls[0][0]).toMatchObject({ type: 'wielen', id: 'x' });
    expect(postMessage.mock.calls[0][0].fout).toBeTruthy();
    fetch.mockRestore();
  });
});

describe('de runner-iframes van play', () => {
  it.each(['./Sidebar.js', '../SharedRunner/index.js'])(
    '%s geeft de iframe geen allow-same-origin',
    (bestand) => {
      const bron = readFileSync(fileURLToPath(new URL(bestand, import.meta.url)), 'utf8');
      const waarden = [
        ...bron.matchAll(/sandbox=["']([^"']*)["']|setAttribute\(\s*'sandbox',\s*'([^']*)'/g),
      ].map((m) => m[1] ?? m[2]);
      expect(waarden.length).toBeGreaterThan(0);
      for (const w of waarden) expect(w).not.toContain('allow-same-origin');
    },
  );
});
