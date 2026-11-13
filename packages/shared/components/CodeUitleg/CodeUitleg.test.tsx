// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Code met uitleg per regel. In een les-tabblad staat de uitleg naast de code
// (onder elkaar was een stap met een programma en vier regels uitleg hoger dan
// het scherm), en schuift een lang programma in zijn eigen vak. De regel die
// oplicht moet dan in dat vak te zien zijn: bij Deel 10 van de Lego-auto ging
// de uitleg over regel 34 en 41 van een vak met zeventien regels in beeld.

let inTab = false;
let inBeeld = true;
vi.mock('../LesTabs/paneel', () => ({ useInLesTab: () => inTab, useInBeeld: () => inBeeld }));
const { default: CodeUitleg, Regel } = await import('.');

afterEach(cleanup);

const REGELS = 40;
const HOOGTE = 20;

function blok(eerste = 3) {
  return (
    <CodeUitleg>
      <pre>
        {Array.from({ length: REGELS }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: vaste regels in een test.
          <span key={i} className="token-line">
            regel {i + 1}
          </span>
        ))}
      </pre>
      <Regel n={eerste}>De eerste regel met uitleg.</Regel>
      <Regel n={34} tot={35}>
        Verderop.
      </Regel>
    </CodeUitleg>
  );
}

/** Een vak van 200 pixels hoog met veertig regels van 20: jsdom meet zelf niets. */
function meetbaar(container: HTMLElement) {
  const vak = container.querySelector('pre') as HTMLPreElement;
  Object.defineProperty(vak, 'scrollHeight', { value: REGELS * HOOGTE });
  Object.defineProperty(vak, 'clientHeight', { value: 200 });
  vak.getBoundingClientRect = () => ({ top: 0, height: 200 }) as DOMRect;
  container.querySelectorAll<HTMLElement>('.token-line').forEach((lijn, i) => {
    lijn.getBoundingClientRect = () =>
      ({ top: i * HOOGTE - vak.scrollTop, height: HOOGTE }) as DOMRect;
  });
  return vak;
}

describe('CodeUitleg', () => {
  it('zet de uitleg in een tabblad naast de code, en daarbuiten eronder', () => {
    inTab = false;
    const buiten = render(blok()).container.firstElementChild?.className ?? '';
    cleanup();
    inTab = true;
    const binnen = render(blok()).container.firstElementChild?.className ?? '';
    expect(binnen).toContain(buiten);
    expect(binnen).not.toBe(buiten);
  });

  it('geeft in een tabblad elke regel zijn inspringing mee, voor het vervolg van een regel die afbreekt', () => {
    // Fullstack: een functiekop van 97 tekens paste niet in de kolom naast de
    // uitleg en was afgesneden. Hij breekt nu af, en het vervolg springt
    // verder in dan de regel zelf. Of dat er goed uitziet, meet alleen een
    // browser (scripts/meet-les-tabs.mjs telt afgesneden code).
    const code = (
      <CodeUitleg>
        <pre>
          <span className="token-line">{'def f():'}</span>
          <span className="token-line">{'        raise Fout("lang")'}</span>
        </pre>
        <Regel n={1}>Uitleg.</Regel>
      </CodeUitleg>
    );
    inTab = true;
    const lijnen = render(code).container.querySelectorAll<HTMLElement>('.token-line');
    expect(Array.from(lijnen).map((l) => l.style.getPropertyValue('--inspringing'))).toEqual([
      '0',
      '8',
    ]);
    cleanup();
    inTab = false;
    const buiten = render(code).container.querySelectorAll<HTMLElement>('.token-line');
    expect(Array.from(buiten).map((l) => l.style.getPropertyValue('--inspringing'))).toEqual([
      '',
      '',
    ]);
  });

  it('licht de regels van een uitleg op', () => {
    inTab = true;
    const { container } = render(blok());
    fireEvent.click(screen.getByRole('button', { name: 'Licht regel 34-35 op in de code' }));
    const aan = Array.from(container.querySelectorAll('.token-line'))
      .map((lijn, i) => (lijn.className.split(' ').length > 1 ? i + 1 : 0))
      .filter(Boolean);
    expect(aan).toEqual([34, 35]);
  });

  it('schuift het vak naar een regel die buiten beeld staat, en laat een regel in beeld staan', () => {
    inTab = true;
    const { container } = render(blok());
    const vak = meetbaar(container);
    // Regel 3 staat in beeld: het vak blijft staan.
    fireEvent.click(screen.getByRole('button', { name: 'Licht regel 3 op in de code' }));
    expect(vak.scrollTop).toBe(0);
    // Regel 34 staat op 660 pixels, ver onder de rand van 200.
    fireEvent.click(screen.getByRole('button', { name: 'Licht regel 34-35 op in de code' }));
    expect(vak.scrollTop).toBeGreaterThan(660 - 200);
    expect(vak.scrollTop).toBeLessThan(660);
  });

  it('opent een lang programma op de eerste regel met uitleg, zodra het paneel open is', () => {
    // Deel 7 van de Lego-auto: "twee wijzigingen in je loop", en te zien waren
    // regel 1 tot en met 15 van 35. De nieuwe regels stonden vanaf 31.
    inTab = true;
    inBeeld = false;
    const { container, rerender } = render(blok(31));
    const vak = meetbaar(container);
    expect(vak.scrollTop).toBe(0);
    inBeeld = true;
    rerender(blok(31));
    // Regel 31 staat op 600 pixels; hij komt op een derde van het vak.
    expect(vak.scrollTop).toBeCloseTo(600 - 200 / 3, 0);
    // Eén keer: wie daarna zelf schuift en terugkomt, blijft waar hij was.
    vak.scrollTop = 0;
    inBeeld = false;
    rerender(blok(31));
    inBeeld = true;
    rerender(blok(31));
    expect(vak.scrollTop).toBe(0);
  });

  it('laat een programma staan waarvan de eerste regel met uitleg al te zien is', () => {
    inTab = true;
    inBeeld = false;
    const { container, rerender } = render(blok(3));
    const vak = meetbaar(container);
    inBeeld = true;
    rerender(blok(3));
    expect(vak.scrollTop).toBe(0);
  });
});
