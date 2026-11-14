// Een regel code staat heel op één regel. Past de langste regel van een
// codeblok niet in zijn vak, dan worden de letters van dat blok kleiner, tot
// een ondergrens. In fullstack was het eind van vijftig functiekoppen
// (`async def …(naam: str = Form(…), …):`) eerst afgesneden en brak het
// daarna af naar een volgende regel; de opdrachtgever wil geen van beide.
//
// Past een regel ook met de kleinste letters niet, dan krijgt het blok
// `data-code-breekt`. Een blok zonder taal (een foutmelding, uitvoer van de
// terminal) breekt dan af, zoals in een terminal; code schuift zijwaarts,
// en hoort in de les korter (scripts/meet-les-tabs.mjs meldt beide).

/** Kleiner dan dit worden de letters niet: 80% van 14,7 pixels is 11,8. */
export const KLEINSTE_SCHAAL = 0.8;

/** De ruimte links en rechts in een codeblok: die krimpt niet mee met de letters. */
const VAST = 32;

/**
 * De schaal van de letters waarbij een blok dat `nodig` pixels breed wil
 * zijn in `heeft` pixels past: 1 als het past, anders naar beneden afgerond
 * op hele procenten (een regel die op een pixel na past, breekt anders toch).
 */
export function codeSchaal(heeft: number, nodig: number): number {
  if (nodig <= heeft + 1 || heeft <= VAST) return 1;
  const schaal = Math.floor(((heeft - VAST) / (nodig - VAST)) * 100) / 100;
  return Math.max(KLEINSTE_SCHAAL, schaal);
}

const zichtbaar = (el: HTMLElement) =>
  el.clientWidth > 0 && !el.closest('[hidden], details:not([open])');

/**
 * Een blok dat zelf afbreekt: de verwachte uitvoer in een python-oefenveld
 * (`.doel pre code` in python-runner), of een blok waarop de leerling de knop
 * om af te breken aanzette. Dat breekt zoals uitvoer in een terminal, dus
 * kleinere letters maken het alleen slechter leesbaar: de verwachte uitvoer
 * werd eerst tot 80% verkleind en brak daarna toch af. Zoals de uitvoer van
 * een oefenveld blijft het zoals het is. `data-code-breekt` is er dan al af:
 * een blok dat pasCode zelf liet afbreken, telt hier niet.
 */
const breektZelf = (code: HTMLElement) =>
  /^(pre-wrap|break-spaces|pre-line)$/.test(window.getComputedStyle(code).whiteSpace);

/**
 * Maak de letters van één blok zo klein als nodig is, en zeg of de langste
 * regel dan past.
 */
function pasBlok(pre: HTMLElement, code: HTMLElement): boolean {
  pre.style.removeProperty('font-size');
  // Meten zonder afbreken: het blok wil dan zo breed zijn als zijn langste regel.
  code.style.whiteSpace = 'pre';
  let schaal = codeSchaal(pre.clientWidth, pre.scrollWidth);
  if (schaal < 1) {
    const basis = Number.parseFloat(window.getComputedStyle(pre).fontSize) || 16;
    pre.style.fontSize = `${(basis * schaal).toFixed(2)}px`;
    // De regelnummers en de kolom eromheen schalen mee: meet nog een keer.
    const rest = codeSchaal(pre.clientWidth, pre.scrollWidth);
    if (rest < 1 && schaal > KLEINSTE_SCHAAL) {
      schaal = Math.max(KLEINSTE_SCHAAL, Math.floor(schaal * rest * 100) / 100);
      pre.style.fontSize = `${(basis * schaal).toFixed(2)}px`;
    }
  }
  const past = pre.scrollWidth <= pre.clientWidth + 1;
  code.style.removeProperty('white-space');
  return past;
}

/**
 * Maak de letters van elk zichtbaar codeblok onder `wortel` zo klein als
 * nodig is om de langste regel te tonen. Roep dit aan na alles wat een blok
 * in beeld brengt of zijn breedte verandert: een ander tabblad of een andere
 * stap, een uitklapblok dat opengaat, een andere maat van het venster.
 * Alleen de codeblokken van de les (`.theme-code-block`): de uitvoer van een
 * oefenveld is ook een <pre>, en die blijft zoals hij is, net als een blok
 * dat zelf afbreekt (de verwachte uitvoer in het oefenveld, `breektZelf`).
 *
 * Code met de uitleg ernaast (<CodeUitleg>) krijgt eerst kleinere letters. Is
 * dat niet genoeg, dan krijgt de code ook een bredere kolom
 * (`data-code-breed` op de rij): de uitleg is dan smaller, en dat is alleen
 * de moeite waard als de code anders niet past.
 */
export function pasCode(wortel: ParentNode): void {
  for (const pre of Array.from(wortel.querySelectorAll<HTMLElement>('.theme-code-block pre'))) {
    const code = pre.querySelector<HTMLElement>('code');
    if (!code || !zichtbaar(pre)) continue;
    const rij = pre.closest<HTMLElement>('[data-code-uitleg]');
    rij?.removeAttribute('data-code-breed');
    pre.removeAttribute('data-code-breekt');
    if (breektZelf(code)) {
      pre.style.removeProperty('font-size');
      continue;
    }
    let past = pasBlok(pre, code);
    if (!past && rij) {
      rij.setAttribute('data-code-breed', '');
      past = pasBlok(pre, code);
    }
    if (!past) pre.setAttribute('data-code-breekt', '');
  }
}
