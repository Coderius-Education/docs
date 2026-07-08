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
module.exports.onRouteDidUpdate = function onRouteDidUpdate({ location, previousLocation }) {
  if (typeof window === 'undefined' || !window._paq) return;
  if (!previousLocation || location.pathname === previousLocation.pathname) return;
  window._paq.push(['setCustomUrl', location.pathname]);
  window._paq.push(['setDocumentTitle', document.title]);
  window._paq.push(['trackPageView']);
};
