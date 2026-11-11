// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PreviewPane } from './PreviewPane';

afterEach(cleanup);

// In een les over JavaScript draait de code pas na een klik op Run, en tot
// die klik is het voorbeeld leeg. In de eerste les stond de knop nergens in
// de tekst: de leerling zag een wit vlak en wist niet dat hij iets moest doen.
describe('een voorbeeld dat op Run wacht', () => {
  it('zegt dat je op Run klikt', () => {
    render(<PreviewPane srcDoc="" wachtOpRun />);
    const melding = screen.getByText(/om je code te draaien/);
    expect(melding.textContent).toMatch(/Klik op Run om je code/);
    // De zin is één element in het vak: als losse stukken tekst in een
    // flex-vak vielen de spaties rond Run weg ("Klik opRunom").
    expect(melding.tagName).toBe('SPAN');
    expect(melding.parentElement?.children).toHaveLength(1);
  });

  it('zegt niets zodra er een pagina staat, en ook niet in een veld zonder Run-knop', () => {
    render(<PreviewPane srcDoc="<p>Hoi</p>" />);
    expect(screen.queryByText(/om je code te draaien/)).toBeNull();
  });
});
