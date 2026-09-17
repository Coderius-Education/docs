// Het voorbeeld is een gesandboxte iframe met een eigen origin, dus de les
// kan niet zien waar hij naartoe is gegaan als de leerling een link volgt.
// Wat de les wél ziet is elk load-event van de iframe: de eerste load na een
// nieuwe srcDoc is de eigen pagina, een tweede load bij dezelfde srcDoc
// betekent dat de leerling ergens anders is beland. Dan hoort er een knop te
// staan om terug te komen, want de editor staat nog vol met zijn eigen code
// en de browser-knop Terug werkt niet in een srcdoc-iframe.

export type Laadstand = 'eigen' | 'weg';

export class VoorbeeldNavigatie {
  private geladen: string | null = null;

  /** Meld een load-event van de iframe; zegt of het voorbeeld nog de eigen pagina toont. */
  geladenMet(srcDoc: string): Laadstand {
    if (this.geladen === srcDoc) return 'weg';
    this.geladen = srcDoc;
    return 'eigen';
  }

  /** Vóór het opnieuw laden van de eigen pagina: de volgende load is dan weer de eigen. */
  reset(): void {
    this.geladen = null;
  }
}
