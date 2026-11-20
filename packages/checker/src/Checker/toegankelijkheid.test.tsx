// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Beoordeling } from '../beoordelingen';
import type { CheckerConfig } from '../types';
import { Beoordelingen } from './Beoordelingen';
import { Waarschuwingen } from './ReportView';
import { TeacherGate } from './TeacherGate';
import { UploadZone } from './UploadZone';

// Wat de review van de upload tool (november 2026) met het toetsenbord en een
// schermlezer vond, en de waarschuwingen die de leerling niet zag.

afterEach(cleanup);

describe('de upload tool met het toetsenbord', () => {
  it('heeft twee knoppen en geen onzichtbare tabstops', () => {
    const config = {
      accept: '.py,.zip',
      textKinds: ['py'],
      classify: () => 'py',
    } as unknown as CheckerConfig;
    const { container } = render(
      <UploadZone
        config={config}
        onLoaded={() => {}}
        onError={() => {}}
        busy={false}
        setBusy={() => {}}
      />,
    );
    // Eerst kwam Tab twee keer op een onzichtbaar bestandsveld uit, en hoorde
    // een schermlezer vier knoppen.
    expect(screen.getAllByRole('button')).toHaveLength(2);
    for (const input of Array.from(container.querySelectorAll('input[type=file]'))) {
      expect(input.getAttribute('tabindex')).toBe('-1');
      expect(input.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('zet na het ontgrendelen de focus op het eerste veld', () => {
    sessionStorage.clear();
    render(
      <TeacherGate password="geheim" storageKey="coderius:test:docent">
        <label>
          Naam van de leerling
          <input type="text" />
        </label>
      </TeacherGate>,
    );
    fireEvent.change(screen.getByLabelText('Docentwachtwoord'), { target: { value: 'geheim' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ontgrendel' }));
    // Het formulier verdwijnt; eerst stond de focus daarna op de pagina zelf.
    expect(document.activeElement).toBe(screen.getByLabelText('Naam van de leerling'));
  });

  it('zet na het verwijderen van een beoordeling de focus op de lijst', () => {
    const b = (id: string, naam: string) =>
      ({ id, naam, bijgewerkt: Date.now() }) as unknown as Beoordeling;
    const props = {
      actiefId: null,
      onOpen: () => {},
      onVerwijder: () => {},
      onVerwijderAlles: () => {},
      opslagFout: null,
    };
    const { rerender } = render(
      <Beoordelingen {...props} lijst={[b('1', 'Sam'), b('2', 'Noor')]} />,
    );
    screen.getByRole('button', { name: 'Beoordeling van Sam verwijderen' }).focus();
    rerender(<Beoordelingen {...props} lijst={[b('2', 'Noor')]} />);
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Mijn beoordelingen' }),
    );
  });
});

describe('waarschuwingen bij het inlezen', () => {
  it('toont ze in een statusregio, en niets als er geen zijn', () => {
    const { container, rerender } = render(<Waarschuwingen warnings={[]} />);
    expect(container.innerHTML).toBe('');
    rerender(
      <Waarschuwingen warnings={['Niet meegeteld, want het lijkt een reservekopie: kopie.']} />,
    );
    expect(screen.getByRole('status').textContent).toContain('reservekopie');
  });

  it('ook de leerling ziet ze', () => {
    // Eerst stonden ze alleen in de docentweergave (ReportView): een leerling
    // die een reservekopie of alleen plaatjes uploadde, zag alleen tellers.
    const bron = readFileSync(join(__dirname, 'CheckerInner.tsx'), 'utf8');
    const leerling = bron.slice(bron.indexOf('{report && !isDocent && ('));
    expect(leerling.slice(0, 300)).toContain('<Waarschuwingen warnings={report.warnings} />');
  });

  it('de docentpagina zegt dat de bestanden niet naar een server gaan', () => {
    // Met privacyNote verdween de zin ook van de vijf docentpagina's, die hem
    // niet in hun eigen tekst hebben.
    const bron = readFileSync(join(__dirname, 'CheckerInner.tsx'), 'utf8');
    const docent = bron.slice(
      bron.indexOf('{isDocent && (\n          <p className={styles.privacy}>'),
    );
    expect(docent.slice(0, 200)).toMatch(/nooit naar een server/);
  });
});
