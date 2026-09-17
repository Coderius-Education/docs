import { describe, expect, it } from 'vitest';
import { VoorbeeldNavigatie } from './navigatie';

// Issue #88: klikte een leerling in het voorbeeld van "Pagina's koppelen" op
// de Wikipedia-link, dan was zijn pagina weg en kwam hij er niet meer terug.
// De iframe zelf verraadt niet waar hij is (andere origin); de load-events
// wel. Dit is de logica achter de knop "Terug naar je pagina".

describe('VoorbeeldNavigatie', () => {
  it('de eerste load van een srcDoc is de eigen pagina', () => {
    const nav = new VoorbeeldNavigatie();
    expect(nav.geladenMet('<p>a</p>')).toBe('eigen');
  });

  it('een tweede load bij dezelfde srcDoc betekent: een link gevolgd', () => {
    const nav = new VoorbeeldNavigatie();
    nav.geladenMet('<p>a</p>');
    expect(nav.geladenMet('<p>a</p>')).toBe('weg');
    // En nog een link verderop blijft weg.
    expect(nav.geladenMet('<p>a</p>')).toBe('weg');
  });

  it('een nieuwe srcDoc (de leerling typte) is weer de eigen pagina', () => {
    const nav = new VoorbeeldNavigatie();
    nav.geladenMet('<p>a</p>');
    nav.geladenMet('<p>a</p>');
    expect(nav.geladenMet('<p>b</p>')).toBe('eigen');
  });

  it('na reset telt de herlaad van dezelfde srcDoc als de eigen pagina', () => {
    const nav = new VoorbeeldNavigatie();
    nav.geladenMet('<p>a</p>');
    expect(nav.geladenMet('<p>a</p>')).toBe('weg');
    nav.reset();
    expect(nav.geladenMet('<p>a</p>')).toBe('eigen');
  });
});
