// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Puzzel from './index';
import { hussel, regelsVan, zaadVan } from './logica';

afterEach(cleanup);

const CODE = `<ul>
  <li>Appels</li>
  <li>Peren</li>
</ul>`;

const teksten = () =>
  Array.from(document.querySelectorAll('[data-regel] code')).map((c) => c.textContent ?? '');
const pijl = (naam: RegExp) => screen.getByRole('button', { name: naam });

/** Zet de regels met de knop omhoog in de goede volgorde, zoals een leerling. */
function losOp() {
  const doel = regelsVan(CODE).map((r) => r.tekst);
  for (let plek = 0; plek < doel.length; plek++) {
    let nu = teksten().indexOf(doel[plek], plek);
    while (nu > plek) {
      fireEvent.click(pijl(new RegExp(`^Regel ${nu + 1} omhoog`)));
      nu--;
    }
  }
}

describe('Puzzel', () => {
  it('toont de regels door elkaar, in dezelfde volgorde als de server', () => {
    render(<Puzzel code={CODE} />);
    const door = hussel(regelsVan(CODE), zaadVan(CODE)).map((r) => r.tekst);
    expect(teksten()).toEqual(door);
    expect(teksten()).not.toEqual(regelsVan(CODE).map((r) => r.tekst));
  });

  it('verplaatst een regel met de knoppen, en houdt de focus bij die regel', () => {
    render(<Puzzel code={CODE} />);
    const voor = teksten();
    fireEvent.click(pijl(/^Regel 2 omhoog/));
    expect(teksten()).toEqual([voor[1], voor[0], voor[2], voor[3]]);
    // Bovenaan is omhoog uit; de focus staat op omlaag van dezelfde regel.
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^Regel 1 omlaag/);
    expect((pijl(/^Regel 1 omhoog/) as HTMLButtonElement).disabled).toBe(true);
    expect((pijl(/^Regel 4 omlaag/) as HTMLButtonElement).disabled).toBe(true);
  });

  it('zegt na Controleer per regel of hij goed staat, met een woord erbij', () => {
    render(<Puzzel code={CODE}>De uitleg.</Puzzel>);
    fireEvent.click(screen.getByRole('button', { name: 'Controleer' }));
    expect(screen.getByRole('status').textContent).toMatch(/op (zijn|hun) plek/);
    expect(screen.getAllByText('niet hier').length).toBeGreaterThan(0);
    // De uitleg komt pas als alles klopt.
    expect(screen.queryByText('De uitleg.')).toBeNull();
  });

  it('haalt het teken weg bij een regel die daarna verschoven is', () => {
    render(<Puzzel code={CODE} />);
    fireEvent.click(screen.getByRole('button', { name: 'Controleer' }));
    const tekens = () => document.querySelectorAll('[data-regel] [class*="teken"]').length;
    expect(tekens()).toBe(4);
    fireEvent.click(pijl(/^Regel 2 omhoog/));
    expect(tekens()).toBe(2);
  });

  it('is klaar als alles op zijn plek staat: uitleg erbij, knoppen weg, en Opnieuw husselt', () => {
    render(<Puzzel code={CODE}>De uitleg.</Puzzel>);
    const begin = teksten();
    losOp();
    fireEvent.click(screen.getByRole('button', { name: 'Controleer' }));
    expect(screen.getByRole('status').textContent).toBe('Goed: alle 4 regels staan op hun plek.');
    expect(screen.queryByText('De uitleg.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /omhoog/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw' }));
    expect(teksten()).toEqual(begin);
    expect(screen.queryByText('De uitleg.')).toBeNull();
  });

  it('sleept een regel naar de plek onder de aanwijzer', () => {
    render(<Puzzel code={CODE} />);
    const voor = teksten();
    const rijen = Array.from(document.querySelectorAll<HTMLElement>('[data-regel]'));
    // jsdom meet niets: geef elke regel een vak van 30 pixels hoog.
    rijen.forEach((rij, i) => {
      rij.getBoundingClientRect = () =>
        ({ top: i * 30, bottom: i * 30 + 30, left: 0, right: 300 }) as DOMRect;
    });
    const lijst = rijen[0].parentElement as HTMLElement;
    // jsdom kent geen PointerEvent met een plek: een muis-event met de naam
    // van het aanwijzer-event draagt clientY wel.
    const event = (naam: string, clientY: number) =>
      new MouseEvent(naam, { bubbles: true, button: 0, clientY });
    fireEvent(rijen[0], event('pointerdown', 10));
    fireEvent(lijst, event('pointermove', 75));
    fireEvent(lijst, event('pointerup', 75));
    expect(teksten()).toEqual([voor[1], voor[2], voor[0], voor[3]]);
  });
});
