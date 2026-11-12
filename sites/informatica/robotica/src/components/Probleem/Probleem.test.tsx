// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Een probleem onder "Er gaat iets mis". Op een gewone pagina staat de kaart
// open. In een les-tabblad is hij dicht tot je hem aanklikt: vijf kaarten
// open onder elkaar waren bij de servo 775 pixels langer dan het scherm.

let inTab = false;
vi.mock('@coderius/shared/components/LesTabs/paneel', () => ({ useInLesTab: () => inTab }));
const { default: Probleem } = await import('.');

afterEach(cleanup);

const kaart = () =>
  render(
    <Probleem titel="De servo doet niets.">
      <p>Oorzaak: de stekker zit andersom.</p>
    </Probleem>,
  );

describe('Probleem', () => {
  it('staat buiten een tabblad open, zonder knop', () => {
    inTab = false;
    kaart();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/Oorzaak/).closest('[hidden]')).toBeNull();
  });

  it('is in een tabblad dicht tot je de titel aanklikt, en staat wel in de HTML', () => {
    inTab = true;
    kaart();
    const knop = screen.getByRole('button', { name: 'De servo doet niets.' });
    expect(knop.getAttribute('aria-expanded')).toBe('false');
    // Dicht, maar aanwezig: cross-links en Ctrl+F op papier vinden de tekst.
    const inhoud = screen.getByText(/Oorzaak/).closest('div');
    expect(inhoud?.hidden).toBe(true);
    expect(knop.getAttribute('aria-controls')).toBe(inhoud?.id);
    fireEvent.click(knop);
    expect(knop.getAttribute('aria-expanded')).toBe('true');
    expect(inhoud?.hidden).toBe(false);
    fireEvent.click(knop);
    expect(inhoud?.hidden).toBe(true);
  });
});
