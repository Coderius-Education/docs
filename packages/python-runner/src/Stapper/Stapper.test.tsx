// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HighlightedEditor } from '../HighlightedEditor';
import type { Opname } from '../PyodideProvider';
import Stapper from './index';

// Stap voor stap in een les-tabblad. Onder het veld was het scherm 126 tot
// 1634 pixels te lang: de code stond er twee keer, en een tekening nog onder
// de variabelen. In een tabblad krijgt de stapper daarom de hoogte van het
// veld mee. Wat hier vastligt is de vorm; of het past, meet
// scripts/meet-les-tabs.mjs met --klik in een browser.

const stap = (regel: number) => ({
  regel,
  gebeurtenis: 'line',
  frames: [{ naam: '<module>', variabelen: [] }],
  uitvoerTot: 0,
  tekenTot: 1,
});

const opname = (metTekening: boolean) =>
  ({
    stappen: [stap(1), stap(2)],
    uitvoer: '',
    afgekapt: false,
    fout: null,
    tekening: metTekening
      ? {
          direct: true,
          gebeurtenissen: [
            { t: 'nieuw', id: 0, vorm: 'classic', zichtbaar: true },
            { t: 'ga', id: 0, x: 100, y: 0, pen: true, kleur: 'black', dikte: 1 },
          ],
        }
      : null,
  }) as unknown as Opname;

const CODE = 'import turtle\nturtle.forward(100)';

afterEach(cleanup);

describe('Stapper', () => {
  it('zonder hoogte staat de tekening onder de code en de variabelen', () => {
    const { container } = render(
      <Stapper code={CODE} opname={opname(true)} onSluiten={() => {}} />,
    );
    const inhoud = container.querySelector('[class*="inhoud"]') as HTMLElement;
    const svg = container.querySelector('svg') as SVGElement;
    expect(inhoud.contains(svg)).toBe(false);
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--stap-hoogte'),
    ).toBe('');
  });

  it('met een hoogte staat de tekening in een eigen kolom naast de code', () => {
    const { container } = render(
      <Stapper code={CODE} opname={opname(true)} onSluiten={() => {}} hoogte={300} />,
    );
    const inhoud = container.querySelector('[class*="inhoud"]') as HTMLElement;
    expect(inhoud.className).toMatch(/metTekening/);
    // Drie kolommen: de code, de variabelen met de uitvoer, de tekening.
    expect(inhoud.children).toHaveLength(3);
    expect(inhoud.children[2].querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('met een hoogte is de code niet hoger dan wat er naast de knoppen overblijft', () => {
    const { container } = render(
      <Stapper code={CODE} opname={opname(false)} onSluiten={() => {}} hoogte={300} />,
    );
    const wortel = container.firstElementChild as HTMLElement;
    const hoogte = Number.parseInt(wortel.style.getPropertyValue('--stap-hoogte'), 10);
    expect(hoogte).toBeGreaterThan(92);
    expect(hoogte).toBeLessThan(300);
    // Zonder tekening twee kolommen, zoals buiten een tabblad.
    const inhoud = container.querySelector('[class*="inhoud"]') as HTMLElement;
    expect(inhoud.className).not.toMatch(/metTekening/);
    expect(inhoud.children).toHaveLength(2);
    screen.getByText(/Stap 1 van 2/);
  });

  it('met een hoogte staan de teller en Sluiten in de rij knoppen, zonder losse balken', () => {
    // Een balk boven, een rij knoppen en een regel met de tip waren samen
    // 118 pixels: bij een laag veld was de stapper tot 75 pixels hoger dan
    // het veld (48 schermen in de meting met --klik).
    const buiten = render(<Stapper code={CODE} opname={opname(false)} onSluiten={() => {}} />);
    screen.getByText(/klik de schuifbalk aan/);
    expect(buiten.container.firstElementChild?.children).toHaveLength(4);
    cleanup();
    const { container } = render(
      <Stapper code={CODE} opname={opname(false)} onSluiten={() => {}} hoogte={300} />,
    );
    // Alleen de code met de variabelen, en de rij knoppen.
    expect(container.firstElementChild?.children).toHaveLength(2);
    const rij = container.querySelector('[class*="knoppen"]') as HTMLElement;
    expect(rij.textContent).toMatch(/Stap 1 van 2/);
    expect(screen.getAllByRole('button', { name: 'Sluiten' })).toHaveLength(1);
    expect(rij.contains(screen.getByRole('button', { name: 'Sluiten' }))).toBe(true);
    // De tip is er nog, bij de schuifbalk.
    expect(screen.queryByText(/klik de schuifbalk aan/)).toBeNull();
    expect(screen.getByRole('slider').getAttribute('title')).toMatch(/pijltjestoetsen/);
  });

  it('met een hoogte staat de melding van een fout bij de variabelen, niet eronder', () => {
    const metFout = {
      ...opname(false),
      fout: { soort: 'NameError', regel: 2, bericht: "name 'x' is not defined" },
    } as unknown as Opname;
    const { container } = render(
      <Stapper code={CODE} opname={metFout} onSluiten={() => {}} hoogte={300} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Volgende/ }));
    const melding = screen.getByText(/Hier ging het mis/);
    expect(container.querySelector('[class*="zijkant"]')?.contains(melding)).toBe(true);
  });

  it('een veld dat heel laag is, houdt een paar regels code over', () => {
    // Vier regels, en met de rij knoppen samen niet hoger dan het laagste
    // veld: 180 pixels, waarvan 40 voor de werkbalk.
    const { container } = render(
      <Stapper code={CODE} opname={opname(false)} onSluiten={() => {}} hoogte={120} />,
    );
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--stap-hoogte'),
    ).toBe('92px');
  });
});

describe('de regel die aan de beurt is, blijft in beeld', () => {
  const code = Array.from({ length: 40 }, (_, i) => `print(${i})`).join('\n');
  const editor = (regel: number, maxHeight?: number) => (
    <HighlightedEditor
      code={code}
      onChange={() => {}}
      onKeyDown={() => {}}
      disabled={false}
      readOnly
      highlightLine={regel}
      maxHeight={maxHeight}
    />
  );

  it('schuift de code in zijn vak, dan schuift het vak mee naar de regel', () => {
    // De stapper bladert door een programma dat langer is dan het vak. Bleef
    // het vak bovenaan staan, dan was regel 30 gemarkeerd en niet te zien.
    const { rerender } = render(editor(1, 120));
    const veld = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(veld.scrollTop).toBe(0);
    rerender(editor(30, 120));
    expect(veld.scrollTop).toBeGreaterThan(400);
    rerender(editor(1, 120));
    expect(veld.scrollTop).toBe(0);
  });

  it('zonder vaste hoogte schuift er niets', () => {
    const { rerender } = render(editor(1));
    rerender(editor(30));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).scrollTop).toBe(0);
  });
});

// In de route machine learning brak een regel van 45 tekens af in de smalle
// codekolom van de stapper. De nummers in de kantlijn tellen per echte regel,
// de code per schermregel: bij stap 7 stond 9 naast `}`, en de variabelen
// hoorden bij een regel buiten beeld. De stapper breekt een regel dus niet af;
// hij schuift. Of het er goed uitziet, ziet alleen een browser.
describe('de stapper breekt een regel niet af', () => {
  const lang = `print("${'x'.repeat(80)}")\nprint(1)`;

  it('de code van de stapper schuift zijwaarts', () => {
    const { container } = render(
      <Stapper code={lang} opname={opname(false)} onSluiten={() => {}} hoogte={300} />,
    );
    const veld = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(veld.getAttribute('wrap')).toBe('off');
    expect(veld.parentElement?.className).toMatch(/nietAfbreken/);
  });

  it('een gewone editor breekt wel af', () => {
    const { container } = render(
      <HighlightedEditor code={lang} onChange={() => {}} disabled={false} />,
    );
    const veld = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(veld.getAttribute('wrap')).toBe('soft');
    expect(veld.parentElement?.className).not.toMatch(/nietAfbreken/);
  });
});
