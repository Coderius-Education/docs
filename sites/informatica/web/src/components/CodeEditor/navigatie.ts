// Het voorbeeld is een gesandboxte iframe met een eigen origin, dus de les
// kan niet zien waar hij naartoe is gegaan als de leerling een link volgt.
// Wat de les wél krijgt zijn de berichten van het script dat buildDoc in de
// eigen pagina zet: 'eigen' zodra die pagina laadt, 'verlaten' zodra hij
// verlaten wordt (pagehide). Een gevolgde link draagt dat script niet.
//
// 'verlaten' komt ook als de les zelf een nieuwe srcDoc zet (de leerling
// typte): dan gaat de oude eigen pagina weg. Het verschil zit in de srcDoc
// die op dat moment geldt: is die nog dezelfde als waarvoor 'eigen' kwam, dan
// heeft de leerling een link gevolgd; is hij al vernieuwd, dan is het de les.

export type Bericht = 'eigen' | 'verlaten';
export type Laadstand = 'eigen' | 'weg' | 'ongewijzigd';

export class VoorbeeldNavigatie {
  private eigenVan: string | null = null;

  /** Verwerk een bericht uit de iframe, met de srcDoc die de les op dat moment toont. */
  bericht(type: Bericht, srcDoc: string): Laadstand {
    if (type === 'eigen') {
      this.eigenVan = srcDoc;
      return 'eigen';
    }
    return this.eigenVan === srcDoc ? 'weg' : 'ongewijzigd';
  }
}
