// Docusaurus client-module lifecycle hook. Zonder dit telt een cookieloze
// Matomo-tracker alleen de allereerste harde page load: Docusaurus is een SPA,
// interne navigatie ververst de pagina niet. Bij elke routewissel pushen we
// dus zelf een nieuwe pageview.
//
// Altijd geregistreerd door plugins/matomo.js — dit is een no-op zolang
// window._paq niet bestaat (dev-omgeving, of nog geen siteId ingevuld).
//
// CommonJS (niet ESM export): @coderius/shared staat op "type": "commonjs" en
// Docusaurus' webpack-pipeline verwacht dit bestand niet als ES-module aan te
// treffen — ESM export-syntax hier gaf een harde webpack parse-fout.
const { matomoPagePath } = require('../matomo');
const { startDetailsTracking } = require('./matomo-details');

// Meteen aanhaken en niet per routewissel: de listener hangt aan document en
// overleeft navigatie binnen de site, dus één keer is genoeg. De guard is nodig
// omdat client-modules tijdens het bouwen ook in Node geëvalueerd worden.
if (typeof document !== 'undefined') startDetailsTracking();

// Volgnummer van de laatste routewissel. Nodig omdat we de pageview uitgesteld
// versturen: is er intussen alweer genavigeerd, dan hoort de titel die we dan
// uitlezen bij een andere pagina. Een volgnummer en géén padvergelijking — het
// pad van de router is onbewerkt ("…/5-seriële-communicatie") terwijl dat van
// de browser percent-gecodeerd is ("…/5-seri%C3%ABle-communicatie"), zodat een
// vergelijking op zulke pagina's nooit klopt en elke pageview zou wegvallen.
let laatsteNavigatie = 0;

module.exports.onRouteDidUpdate = function onRouteDidUpdate({ location, previousLocation }) {
  if (typeof window === 'undefined' || !window._paq) return;
  if (!previousLocation || location.pathname === previousLocation.pathname) return;

  // Zelfde normalisatie als de events gebruiken, anders zijn het Pagina's-
  // rapport en het Gebeurtenissen-rapport niet op pad te koppelen en werkt een
  // verhouding als "runs per pageview" niet. En dezelfde vorm als het snippet
  // bij een harde load stuurt: volledige URL, querystring en hash intact. Een
  // kaal pad zou de tracker zelf absoluut maken, maar dan hangt het rapport af
  // van hoe hij dat doet.
  // Via new URL() zodat het pad net zo gecodeerd wordt als de browser het doet.
  // De router levert het onbewerkt aan ("…/5-seriële-communicatie"), en dan zou
  // dezelfde pagina na een harde load ("…/5-seri%C3%ABle-communicatie") toch
  // weer twee regels in het rapport opleveren.
  const pad = matomoPagePath(location.pathname);
  const url = new URL(pad + location.search + location.hash, window.location.origin).href;
  const dezeNavigatie = ++laatsteNavigatie;
  let verstuurd = false;

  function stuurPageview() {
    if (verstuurd || !window._paq) return;
    if (dezeNavigatie !== laatsteNavigatie) return;
    verstuurd = true;
    window._paq.push(['setCustomUrl', url]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
  }

  // De nieuwe <title> staat er op dit moment nog niet: react-helmet-async zet
  // hem in een requestAnimationFrame (`defer` staat standaard aan). Hier direct
  // document.title uitlezen levert dus de titel van de vórige pagina op, en het
  // titel-rapport in Matomo loopt dan één pagina achter.
  //
  // Helmet plant die frame in tijdens de commit, vóór deze hook; rAF-callbacks
  // lopen op volgorde van inplannen, dus de onze komt daarna. In een verborgen
  // tabblad staat rAF stil — daar vangt de timer het op, zodat de pageview niet
  // verloren gaat. Wie het eerst is wint, de rest is een no-op.
  window.requestAnimationFrame(stuurPageview);
  setTimeout(stuurPageview, 1000);
};
