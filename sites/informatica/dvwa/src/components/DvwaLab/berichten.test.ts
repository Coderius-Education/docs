import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isEigenLabBericht } from './berichten';

// Het lab-iframe post zijn formulier met `postMessage(..., '*')` naar de
// parent, die op `window` luistert. Staan er twee labs op één pagina, dan
// ontvangen ze allebei elk bericht en draaien ze elkaars formulieren. De
// filter in berichten.js laat alleen berichten uit het eigen iframe door;
// deze test pint dat gedrag en bewaakt dat index.js de filter ook echt
// aansluit op het eigen iframe-window.

/** Een namaak-iframe-window: alleen de identiteit telt, niet de inhoud. */
function venster(): Window {
  return {} as Window;
}

function bericht(source: Window | null, data: unknown): MessageEvent {
  return { source, data } as unknown as MessageEvent;
}

describe('isEigenLabBericht', () => {
  it('accepteert een dvwa-form-bericht uit het eigen iframe', () => {
    const eigen = venster();
    expect(isEigenLabBericht(bericht(eigen, { type: 'dvwa-form', data: {} }), eigen)).toBe(true);
  });

  it('weigert een bericht uit een ander iframe, ook al is het type goed', () => {
    const eigen = venster();
    const ander = venster();
    expect(isEigenLabBericht(bericht(ander, { type: 'dvwa-form', data: {} }), eigen)).toBe(false);
  });

  it('weigert een bericht uit het eigen iframe met een ander type', () => {
    const eigen = venster();
    expect(isEigenLabBericht(bericht(eigen, { type: 'iets-anders' }), eigen)).toBe(false);
  });

  it('weigert alles zolang het iframe nog geen window heeft', () => {
    // Voor de eerste render is iframeRef.current null; een bericht met
    // source null mag dan niet per ongeluk als "eigen" doorgaan.
    expect(isEigenLabBericht(bericht(null, { type: 'dvwa-form' }), null)).toBe(false);
  });

  it('weigert een bericht zonder data', () => {
    const eigen = venster();
    expect(isEigenLabBericht(bericht(eigen, undefined), eigen)).toBe(false);
  });
});

describe('index.js sluit de filter aan op het eigen iframe', () => {
  it('geeft iframeRef.current?.contentWindow door aan isEigenLabBericht', () => {
    const bron = readFileSync(fileURLToPath(new URL('./index.js', import.meta.url)), 'utf8');
    expect(bron).toContain("import { isEigenLabBericht } from './berichten'");
    expect(bron).toContain('isEigenLabBericht(event, iframeRef.current?.contentWindow)');
  });
});
