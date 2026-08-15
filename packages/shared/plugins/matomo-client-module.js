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
const { startDetailsTracking } = require('./matomo-details');

// Meteen aanhaken en niet per routewissel: de listener hangt aan document en
// overleeft navigatie binnen de site, dus één keer is genoeg. De guard is nodig
// omdat client-modules tijdens het bouwen ook in Node geëvalueerd worden.
if (typeof document !== 'undefined') startDetailsTracking();

module.exports.onRouteDidUpdate = function onRouteDidUpdate({ location, previousLocation }) {
  if (typeof window === 'undefined' || !window._paq) return;
  if (!previousLocation || location.pathname === previousLocation.pathname) return;

  // De nieuwe <title> staat er op dit moment nog niet: Docusaurus werkt hem
  // via react-helmet-async pas ná deze hook bij. document.title hier direct
  // uitlezen levert de titel van de vórige pagina op, waardoor het
  // titel-rapport in Matomo structureel één pagina achterloopt (de URL klopt
  // wel). Daarom lezen we de titel een tick later, als de DOM bij is.
  const { pathname } = location;
  setTimeout(() => {
    if (!window._paq) return;
    window._paq.push(['setCustomUrl', pathname]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
  }, 0);
};
