import { describe, expect, it } from 'vitest';
import { routeerBericht } from './routeer';

// Eén iframe bedient alle runners op een pagina. Klikt een leerling op ▶ bij
// een tweede voorbeeld terwijl het eerste nog draait, dan stuurt de
// SharedRunner een 'stop' en meteen daarna de nieuwe 'run'. De stdout van de
// eerste run (en zijn 'stopped') druppelde daarna nog na — en die berichten
// hadden geen requestId, dus index.js gaf ze aan de nieuwe eigenaar. Gevolg:
// print-regels van voorbeeld A in de console van voorbeeld B, en een 'stopped'
// die B's stopknop meteen weer uitzette. Deze test legt de regel vast: alleen
// berichten met het id van de lopende run komen door.

describe('routeerBericht', () => {
  it('levert een bericht met het huidige requestId af', () => {
    expect(routeerBericht({ type: 'stdout', text: 'hoi\n', requestId: 7 }, 7)).toEqual({
      type: 'stdout',
      tekst: 'hoi\n',
    });
    expect(routeerBericht({ type: 'stderr', text: 'oei\n', requestId: 7 }, 7)).toEqual({
      type: 'stderr',
      tekst: 'oei\n',
    });
    expect(routeerBericht({ type: 'run-done', requestId: 7 }, 7)).toEqual({ type: 'done' });
    expect(routeerBericht({ type: 'stopped', requestId: 7 }, 7)).toEqual({ type: 'stopped' });
    expect(
      routeerBericht({ type: 'error', message: 'NameError', fatal: true, requestId: 7 }, 7),
    ).toEqual({ type: 'error', tekst: 'NameError', fataal: true });
  });

  it('negeert een bericht van een eerdere run', () => {
    expect(routeerBericht({ type: 'stdout', text: 'oud\n', requestId: 6 }, 7)).toEqual({
      negeer: true,
    });
    expect(routeerBericht({ type: 'stopped', requestId: 6 }, 7)).toEqual({ negeer: true });
  });

  it('negeert een bericht zonder requestId', () => {
    // De engine hangt aan elk bericht het id van de lopende run; een bericht
    // zonder id komt van vóór de eerste run (de boot-fout) en heeft geen
    // eigenaar. De engine herhaalt die fout bij de eerstvolgende run, mét id.
    expect(routeerBericht({ type: 'stdout', text: 'x' }, 7)).toEqual({ negeer: true });
    expect(routeerBericht({ type: 'error', message: 'boot', fatal: true }, 7)).toEqual({
      negeer: true,
    });
    expect(routeerBericht({ type: 'stdout', text: 'x', requestId: null }, 7)).toEqual({
      negeer: true,
    });
  });

  it('negeert alles zolang er geen lopende run is', () => {
    expect(routeerBericht({ type: 'stdout', text: 'x', requestId: 1 }, null)).toEqual({
      negeer: true,
    });
  });

  it('negeert een onbekend type en rommel', () => {
    expect(routeerBericht({ type: 'pyodide-ready', requestId: 7 }, 7)).toEqual({ negeer: true });
    expect(routeerBericht({ requestId: 7 }, 7)).toEqual({ negeer: true });
    expect(routeerBericht(null, 7)).toEqual({ negeer: true });
    expect(routeerBericht('stdout', 7)).toEqual({ negeer: true });
  });

  it('geeft altijd een string als tekst, ook zonder text of message', () => {
    expect(routeerBericht({ type: 'stdout', requestId: 7 }, 7)).toEqual({
      type: 'stdout',
      tekst: '',
    });
    expect(routeerBericht({ type: 'error', requestId: 7 }, 7)).toEqual({
      type: 'error',
      tekst: '',
      fataal: false,
    });
  });
});
