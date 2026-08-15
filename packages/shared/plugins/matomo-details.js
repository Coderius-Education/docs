// Telt welk uitklapblok bij welke opdracht geopend wordt. Op paginaniveau meten
// zegt namelijk niets over hoe ver leerlingen in een les komen: elke lespagina
// heeft één gedeelde code-editor maar meerdere opdrachten (Predict, Modify,
// Make), elk met een eigen tip- en antwoordblok. Door per blok de kop erboven
// mee te sturen wordt "hoe vaak wordt het antwoord bij Make op deze les
// bekeken" een beantwoordbare vraag.
//
// CommonJS, net als de rest van deze map — zie de toelichting in
// matomo-client-module.js over waarom ESM hier een webpack parse-fout gaf.

const { matomoPagePath, matomoTrackEvent } = require('../matomo');

// Eén event per blok per paginabezoek. Een WeakSet en geen data-attribuut op
// het element: de DOM van een <details> is van React (dat beheert daar `open`
// en `data-collapsed`), dus we schrijven er niets in. Bij navigatie binnen de
// site hangt React nieuwe elementen op, die niet in de set zitten en dus weer
// meetellen — precies de bedoeling, een nieuw paginabezoek telt opnieuw.
const geteld = new WeakSet();

// Een sectienaam mag nooit onbegrensd lang worden: op andere cursussen kan een
// kop een hele zin zijn. Afkappen gebeurt op de sectie en niet op de hele
// actie, want het volgnummer staat achteraan en is juist het enige dat de tip
// van het antwoord onderscheidt.
const MAX_SECTIE = 90;

// De kop waar een blok onder valt, bepaald op documentvolgorde. Niet via
// previousElementSibling omhoog lopen: een <details> hoeft geen broer van de
// kop te zijn, het thema kan er een admonition of een tabblad-wrapper omheen
// zetten. En niet op klassenaam matchen, want CSS Modules hasht die bij elke
// build opnieuw (details_XW1X, runButton_yISF). De id's die Docusaurus zelf
// voor koppen genereert zijn wel stabiel, en zijn meteen de anchor in de URL.
//
// Geïndexeerde lussen en geen for...of: Babel vertaalt for...of naar een helper
// die het als ES-module importeert, en die import in dit CommonJS-bestand geeft
// een harde webpack-fout (zelfde reden als de ESM-export in
// matomo-client-module.js).
function sectieVan(koppen, blok) {
  let sectie = '';
  for (let i = 0; i < koppen.length; i++) {
    // Een kop binnen het blok zelf levert CONTAINS op zonder FOLLOWING, en
    // telt dus terecht niet mee als voorafgaande kop.
    if (koppen[i].compareDocumentPosition(blok) & Node.DOCUMENT_POSITION_FOLLOWING) {
      sectie = koppen[i].id;
    }
  }
  return sectie;
}

// Onder één kop staan meerdere blokken: Modify heeft zowel een tip als een
// antwoord. Het volgnummer telt alleen blokken uit dezelfde sectie, zodat
// "modify #2" het antwoord blijft aanwijzen, ook als de summary-tekst bij een
// stijl-pass herschreven wordt.
// De koppen komen als argument binnen en worden niet per blok opnieuw
// opgezocht: cheatsheet-achtige pagina's hebben tientallen uitklapblokken, en
// een querySelectorAll per blok maakt hier een merkbare hapering van bij het
// openklappen.
function volgnummerIn(blokken, koppen, blok, sectie) {
  let nummer = 0;
  for (let i = 0; i < blokken.length; i++) {
    if (sectieVan(koppen, blokken[i]) !== sectie) continue;
    nummer++;
    if (blokken[i] === blok) break;
  }
  return nummer;
}

function opToggle(event) {
  const blok = event.target;
  // <dialog> en popover-elementen vuren ook 'toggle'; filter op tagnaam.
  if (!blok || blok.tagName !== 'DETAILS' || !blok.open) return;
  // Dichtklappen telt niet: we meten dat een leerling het blok bekeken heeft.
  const root = blok.closest('article, main');
  // Alleen lesinhoud. De zijbalk en de navbar staan buiten <main>, dus hun
  // uitklappers komen nooit in de statistieken terecht.
  if (!root || geteld.has(blok)) return;
  geteld.add(blok);

  const koppen = root.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
  const sectie = sectieVan(koppen, blok);
  const nummer = volgnummerIn(root.querySelectorAll('details'), koppen, blok, sectie);
  matomoTrackEvent(
    'Uitklapblok',
    `${(sectie || 'pagina').slice(0, MAX_SECTIE)} #${nummer}`,
    matomoPagePath(),
  );
}

function startDetailsTracking() {
  // 'toggle' bubbelt niet, dus een gewone listener op document mist elk blok.
  // In de capture-fase loopt het event wel van document naar het <details> toe
  // — vandaar de derde parameter. Luisteren op 'click' is geen alternatief:
  // het Details-component van Docusaurus roept in zijn eigen onClick
  // stopPropagation() aan, waardoor een klik document nooit bereikt.
  //
  // Eén listener op document volstaat voor de hele sessie: hij overleeft
  // navigatie binnen de site, want document blijft dezelfde.
  document.addEventListener('toggle', opToggle, true);
}

module.exports = { startDetailsTracking };
