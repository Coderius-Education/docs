import { describe, expect, it } from 'vitest';
import { VoorbeeldNavigatie } from './navigatie';

// Issue #88: klikte een leerling in het voorbeeld van "Pagina's koppelen" op
// de Wikipedia-link, dan was zijn pagina weg en kwam hij er niet meer terug.
// De iframe zelf verraadt niet waar hij is (andere origin); de berichten van
// het script in de eigen pagina wel. Dit is de logica achter de knop
// "Terug naar je pagina".

describe('VoorbeeldNavigatie', () => {
  it('de eigen pagina meldt zich', () => {
    const nav = new VoorbeeldNavigatie();
    expect(nav.bericht('eigen', 'A')).toBe('eigen');
  });

  it('verlaten bij een ongewijzigde srcDoc betekent: een link gevolgd', () => {
    const nav = new VoorbeeldNavigatie();
    nav.bericht('eigen', 'A');
    expect(nav.bericht('verlaten', 'A')).toBe('weg');
  });

  it('verlaten omdat de les een nieuwe srcDoc zette, is geen navigatie', () => {
    // De leerling typte: de oude eigen pagina gaat weg en de nieuwe komt.
    const nav = new VoorbeeldNavigatie();
    nav.bericht('eigen', 'A');
    expect(nav.bericht('verlaten', 'B')).toBe('ongewijzigd');
    expect(nav.bericht('eigen', 'B')).toBe('eigen');
  });

  it('na een gevolgde link brengt een nieuwe eigen pagina hem terug', () => {
    const nav = new VoorbeeldNavigatie();
    nav.bericht('eigen', 'A');
    nav.bericht('verlaten', 'A');
    // Terug-knop of Reset laadt dezelfde srcDoc opnieuw; typen een andere.
    expect(nav.bericht('eigen', 'A')).toBe('eigen');
    expect(nav.bericht('verlaten', 'A')).toBe('weg');
    expect(nav.bericht('eigen', 'B')).toBe('eigen');
  });

  it('A naar B naar A terwijl B nog laadt geeft geen valse melding', () => {
    // Bij het tellen van load-events ging dit mis: de afgebroken B gaf nooit
    // een load, en de volgende load van A leek dan een gevolgde link.
    const nav = new VoorbeeldNavigatie();
    nav.bericht('eigen', 'A');
    expect(nav.bericht('verlaten', 'B')).toBe('ongewijzigd');
    // B laadt nooit af; de les zet A terug en A meldt zich weer.
    expect(nav.bericht('eigen', 'A')).toBe('eigen');
  });
});
