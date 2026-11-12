// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Code met uitleg per regel. In een les-tabblad staat de uitleg naast de code
// (onder elkaar was een stap met een programma en vier regels uitleg hoger dan
// het scherm), en schuift een lang programma in zijn eigen vak. De regel die
// oplicht moet dan in dat vak te zien zijn: bij Deel 10 van de Lego-auto ging
// de uitleg over regel 34 en 41 van een vak met zeventien regels in beeld.

let inTab = false;
vi.mock('../LesTabs/paneel', () => ({ useInLesTab: () => inTab }));
const { default: CodeUitleg, Regel } = await import('.');

afterEach(cleanup);

const REGELS = 40;
const HOOGTE = 20;

function blok() {
  return render(
    <CodeUitleg>
      <pre>
        {Array.from({ length: REGELS }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: vaste regels in een test.
          <span key={i} className="token-line">
            regel {i + 1}
          </span>
        ))}
      </pre>
      <Regel n={3}>De derde regel.</Regel>
      <Regel n={34} tot={35}>
        Verderop.
      </Regel>
    </CodeUitleg>,
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
    const buiten = blok().container.firstElementChild?.className ?? '';
    cleanup();
    inTab = true;
    const binnen = blok().container.firstElementChild?.className ?? '';
    expect(binnen).toContain(buiten);
    expect(binnen).not.toBe(buiten);
  });

  it('licht de regels van een uitleg op', () => {
    inTab = true;
    const { container } = blok();
    fireEvent.click(screen.getByRole('button', { name: 'Licht regel 34-35 op in de code' }));
    const aan = Array.from(container.querySelectorAll('.token-line'))
      .map((lijn, i) => (lijn.className.split(' ').length > 1 ? i + 1 : 0))
      .filter(Boolean);
    expect(aan).toEqual([34, 35]);
  });

  it('schuift het vak naar een regel die buiten beeld staat, en laat een regel in beeld staan', () => {
    inTab = true;
    const { container } = blok();
    const vak = meetbaar(container);
    // Regel 3 staat in beeld: het vak blijft staan.
    fireEvent.click(screen.getByRole('button', { name: 'Licht regel 3 op in de code' }));
    expect(vak.scrollTop).toBe(0);
    // Regel 34 staat op 660 pixels, ver onder de rand van 200.
    fireEvent.click(screen.getByRole('button', { name: 'Licht regel 34-35 op in de code' }));
    expect(vak.scrollTop).toBeGreaterThan(660 - 200);
    expect(vak.scrollTop).toBeLessThan(660);
  });
});
