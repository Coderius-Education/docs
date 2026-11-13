// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GitSimulator from './index';

// De simulator zoals een leerling hem bedient: met de muis, een vinger of
// alleen het toetsenbord. Of hij op het scherm past en de uitvoer goed
// schuift, ziet alleen een browser (scripts/meet-les-tabs.mjs).

vi.mock('@docusaurus/BrowserOnly', () => ({
  default: ({ children }: { children: () => ReactNode }) => children(),
}));

// jsdom kent PointerEvent niet, en dan heeft een pointerdown geen pointerType.
class NepPointerEvent extends MouseEvent {
  pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? '';
  }
}

// jsdom kent showModal en close niet.
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});

beforeEach(() => {
  showModal.mockClear();
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  if (!('PointerEvent' in window)) vi.stubGlobal('PointerEvent', NepPointerEvent);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const terminal = () => screen.getByRole('textbox', { name: /Git terminal/ });

function typ(commando: string) {
  fireEvent.change(terminal(), { target: { value: commando } });
  fireEvent.keyDown(terminal(), { key: 'Enter' });
}

function maakBestand(naam: string, inhoud: string) {
  fireEvent.click(screen.getByRole('button', { name: '+ nieuw bestand' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Naam van het bestand' }), {
    target: { value: naam },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Inhoud van het bestand' }), {
    target: { value: inhoud },
  });
  fireEvent.click(screen.getByRole('button', { name: 'opslaan' }));
}

describe('het venster voor een bestand', () => {
  it('is een dialoog met een naam, en de focus gaat erin', () => {
    render(<GitSimulator scenarioId="stap-7-gitignore" />);
    const knop = screen.getByRole('button', { name: '+ nieuw bestand' });
    knop.focus();
    fireEvent.click(knop);
    const venster = screen.getByRole('dialog', { name: 'Nieuw bestand' });
    // Modaal: de pagina erachter doet niet mee zolang hij open is.
    expect(showModal).toHaveBeenCalledOnce();
    expect(venster.tagName).toBe('DIALOG');
    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'Naam van het bestand' }),
    );
  });

  it('sluit met Escape, ook als de focus op een knop staat, en geeft de focus terug', () => {
    // Escape werkte alleen in de velden.
    render(<GitSimulator scenarioId="stap-7-gitignore" />);
    const knop = screen.getByRole('button', { name: 'bewerk hello.txt' });
    knop.focus();
    fireEvent.click(knop);
    const annuleren = screen.getByRole('button', { name: 'annuleren' });
    annuleren.focus();
    fireEvent.keyDown(annuleren, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'bewerk hello.txt' }));
  });

  it('Tab blijft in het venster', () => {
    render(<GitSimulator scenarioId="stap-7-gitignore" />);
    fireEvent.click(screen.getByRole('button', { name: '+ nieuw bestand' }));
    const opslaan = screen.getByRole('button', { name: 'opslaan' });
    opslaan.focus();
    fireEvent.keyDown(opslaan, { key: 'Tab' });
    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'Naam van het bestand' }),
    );
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(opslaan);
  });
});

describe('een klik in de uitvoer', () => {
  const uitvoer = () => screen.getByRole('log', { name: 'Uitvoer van de terminal' });

  it('zet de cursor in de invoer na een klik met muis of trackpad', () => {
    render(<GitSimulator scenarioId="stap-6-log" />);
    fireEvent.pointerDown(uitvoer(), { pointerType: 'mouse' });
    fireEvent.click(uitvoer());
    expect(document.activeElement).toBe(terminal());
  });

  it('niet na een tik met een vinger: dan springt het toetsenbord open', () => {
    render(<GitSimulator scenarioId="stap-6-log" />);
    fireEvent.pointerDown(uitvoer(), { pointerType: 'touch' });
    fireEvent.click(uitvoer());
    expect(document.activeElement).not.toBe(terminal());
  });
});

describe('wat de leerling ziet', () => {
  it('een weggegooid bestand is in git status en in staging te zien', () => {
    render(<GitSimulator scenarioId="stap-7-gitignore" />);
    fireEvent.click(screen.getByRole('button', { name: 'x' }));
    typ('git status');
    expect(screen.getByRole('log').textContent).toContain('deleted:    hello.txt');
    typ('git add hello.txt');
    expect(screen.getByText('verwijderd')).toBeTruthy();
  });

  it('stap 7: na git add . zegt de balk hoe het eruit gaat, niet "begin opnieuw"', () => {
    render(<GitSimulator scenarioId="stap-7-gitignore" />);
    maakBestand('geheim.txt', 'wachtwoord123\n');
    typ('git add .');
    maakBestand('.gitignore', 'geheim.txt\n');
    expect(screen.getByText('Nog niet:')).toBeTruthy();
    expect(screen.getByText(/git restore --staged geheim\.txt/)).toBeTruthy();
    typ('git restore --staged geheim.txt');
    expect(screen.getByText('Gelukt:')).toBeTruthy();
  });
});
