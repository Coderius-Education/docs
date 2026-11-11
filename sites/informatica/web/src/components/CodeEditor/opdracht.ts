// De opdracht bij een oefenveld staat in de les, boven het veld. Op Groter
// en op volledig scherm vult het veld het scherm, en dan was die tekst weg:
// de leerling moest sluiten om te lezen wat hij moest maken. Het veld toont
// de tekst daarom zelf, in een balk boven de code.
//
// De tekst komt uit de pagina, niet uit een eigenschap: zo staat hij in de
// les maar één keer, en doet elk veld mee zonder dat een auteur iets hoeft.

export interface Opdracht {
  /** De kop van het onderdeel waarin het veld staat ("Opdracht 2: Klik-teller"). */
  titel: string;
  /** Kopieën van wat tussen die kop en het veld staat, klaar om te tonen. */
  inhoud: Node[];
}

const KOP = /^H[1-3]$/;
const HOUDER = '[data-les-stap], [data-les-tab], .markdown, article';

/** Een kopie zonder wat in de balk niet werkt of dubbel zou zijn. */
function kopie(el: Element): Node {
  const uit = el.cloneNode(true) as Element;
  // Een id mag maar één keer op de pagina staan, en de knop "Kopieer" van een
  // codeblok is zijn klik-afhandeling kwijt.
  for (const kind of Array.from(uit.querySelectorAll('button, .hash-link'))) kind.remove();
  for (const kind of [uit, ...Array.from(uit.querySelectorAll('[id]'))]) kind.removeAttribute('id');
  return uit;
}

/**
 * Wat in de les boven dit veld staat: de kop van het onderdeel en de tekst
 * tussen die kop en het veld. Null als daar niets staat.
 */
export function opdrachtBoven(veld: Element): Opdracht | null {
  const houder = veld.parentElement?.closest(HOUDER);
  if (!houder) return null;
  // Het blok van het veld op het niveau van de tekst.
  let blok: Element = veld;
  while (blok.parentElement && blok.parentElement !== houder) blok = blok.parentElement;
  const inhoud: Node[] = [];
  let titel = '';
  for (let el = blok.previousElementSibling; el; el = el.previousElementSibling) {
    if (KOP.test(el.tagName)) {
      // De link naast een kop is een teken zonder breedte.
      titel = (el.textContent ?? '').replace(/[\u200B#]/g, '').trim();
      break;
    }
    // Een eerder veld met zijn tip en antwoord hoort bij een andere opdracht.
    if (el.matches('details') || el.matches('[data-zaad]') || el.querySelector('[data-zaad]')) {
      break;
    }
    inhoud.unshift(kopie(el));
  }
  return inhoud.length > 0 ? { titel, inhoud } : null;
}
