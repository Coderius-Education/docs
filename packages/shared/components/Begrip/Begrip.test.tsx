// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Het kadertje van een begrip in de lestekst. Wat hier staat, is wat een
// leerling doet: klikken, Escape, ernaast klikken, met Tab verder, twee
// begrippen na elkaar. Hoe het kadertje op het scherm staat (binnen beeld op
// een telefoon) meet jsdom niet; dat is in Chromium nagelopen.

vi.mock('@docusaurus/useGlobalData', () => ({
  usePluginData: () => ({
    begrippen: [
      {
        id: 'pipe',
        term: 'pipe',
        kort: 'Het teken `|`.',
        les: { titel: '3.1 Zoeken', pad: '/docs/zoeken#de-pipe' },
      },
      { id: 'shell', term: 'shell', kort: 'Het programma dat leest wat je typt.' },
    ],
    woordenlijst: '/docs/begrippen',
  }),
}));
vi.mock('@docusaurus/Link', () => ({
  default: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// jsdom heeft geen PointerEvent; zonder dit komt pointerType niet mee.
if (!('PointerEvent' in window)) {
  class PointerEvent extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? '';
    }
  }
  Object.assign(window, { PointerEvent });
}

const { default: Begrip } = await import('.');

function zin() {
  return render(
    <p>
      Een <Begrip id="pipe">pipe</Begrip> en de <Begrip id="shell">shell</Begrip>.{' '}
      <a href="#verder">verder</a>
    </p>,
  );
}

const knop = (naam: string) => screen.getByRole('button', { name: naam });
const kader = (naam: string) =>
  document.getElementById(knop(naam).getAttribute('aria-controls') ?? '') as HTMLElement;

afterEach(cleanup);

describe('Begrip', () => {
  it('een klik opent het kadertje met de uitleg, de les en de woordenlijst', () => {
    zin();
    expect(kader('pipe').hidden).toBe(true);
    fireEvent.click(knop('pipe'));
    expect(knop('pipe').getAttribute('aria-expanded')).toBe('true');
    expect(kader('pipe').hidden).toBe(false);
    expect(kader('pipe').textContent).toContain('Het teken |.');
    expect(kader('pipe').querySelector('code')?.textContent).toBe('|');
    const links = Array.from(kader('pipe').querySelectorAll('a'), (a) => a.getAttribute('href'));
    expect(links).toEqual(['/docs/zoeken#de-pipe', '/docs/begrippen#pipe']);
    // Zonder les alleen de woordenlijst.
    fireEvent.click(knop('shell'));
    expect(Array.from(kader('shell').querySelectorAll('a'), (a) => a.textContent)).toEqual([
      'Alle begrippen',
    ]);
  });

  it('er staat er steeds één open', () => {
    zin();
    fireEvent.click(knop('pipe'));
    fireEvent.click(knop('shell'));
    expect(kader('pipe').hidden).toBe(true);
    expect(kader('shell').hidden).toBe(false);
  });

  it('Escape sluit en zet de focus terug op het woord', () => {
    zin();
    fireEvent.click(knop('pipe'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(kader('pipe').hidden).toBe(true);
    expect(document.activeElement).toBe(knop('pipe'));
  });

  it('een klik ernaast sluit, een klik in het kadertje niet', () => {
    zin();
    fireEvent.click(knop('pipe'));
    fireEvent.pointerDown(kader('pipe'));
    expect(kader('pipe').hidden).toBe(false);
    fireEvent.pointerDown(document.body);
    expect(kader('pipe').hidden).toBe(true);
  });

  it('met Tab naar iets erbuiten sluit hij, naar een link in het kadertje niet', () => {
    // Het kadertje bleef eerst open hangen over de tekst eronder.
    zin();
    fireEvent.click(knop('pipe'));
    const lesLink = kader('pipe').querySelector('a') as HTMLElement;
    fireEvent.blur(knop('pipe'), { relatedTarget: lesLink });
    expect(kader('pipe').hidden).toBe(false);
    fireEvent.blur(lesLink, { relatedTarget: screen.getByText('verder') });
    expect(kader('pipe').hidden).toBe(true);
    // Klikken op de tekst in het kadertje geeft geen nieuw doel: open blijven.
    fireEvent.click(knop('pipe'));
    fireEvent.blur(knop('pipe'), { relatedTarget: null });
    expect(kader('pipe').hidden).toBe(false);
  });

  it('met een muis opent hij bij erboven hangen en gaat hij dicht als je weggaat', () => {
    vi.useFakeTimers();
    zin();
    const begrip = knop('pipe').parentElement as HTMLElement;
    fireEvent.pointerEnter(begrip, { pointerType: 'mouse' });
    expect(kader('pipe').hidden).toBe(false);
    fireEvent.pointerLeave(begrip, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(300));
    expect(kader('pipe').hidden).toBe(true);
    // Een vinger opent niet bij aanraken: dat doet de tik zelf.
    fireEvent.pointerEnter(begrip, { pointerType: 'touch' });
    expect(kader('pipe').hidden).toBe(true);
    vi.useRealTimers();
  });

  it('staat in een alinea zonder blok-elementen, en een onbekend begrip is gewone tekst', () => {
    // Een <div> in een <p> breekt de HTML: de browser sluit de alinea dan zelf.
    const html = render(
      <p>
        Een <Begrip id="pipe">pipe</Begrip> en <Begrip id="weg">weg</Begrip>.
      </p>,
    ).container.innerHTML;
    expect(html.match(/<(div|p|dl|ul|ol|table)\b/g)).toEqual(['<p']);
    expect(html).toMatch(/hidden=""/);
    expect(html).toContain('en weg.');
  });
});
