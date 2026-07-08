// Enige bron van waarheid voor de zelf-gehoste Matomo-installatie op de VPS.
// CommonJS zodat zowel Docusaurus-plugins (require) als de SvelteKit-homepage
// (import, via het CJS-subpad) hem kunnen gebruiken.

const MATOMO_URL = 'https://stats.coderius.nl';

// Bewaartermijn van ruwe bezoekerslogs, ingesteld in Matomo onder
// Beheer > Privacy > "Verwijder oude bezoekerslogs". Ook de bron voor de
// bewaartermijn-tekst in privacy-content.js — bij wijziging dus op beide
// plekken (hier én in de Matomo-adminUI) aanpassen.
const MATOMO_RETENTION_DAYS = 100;

// Kale JS-body (geen <script>-tags eromheen, dat is aan de caller) voor
// cookieloze Matomo-tracking. `disableCookies` moet vóór `trackPageView`
// staan, zodat de tracker nooit een cookie zet.
function buildMatomoSnippet({ siteId, matomoUrl = MATOMO_URL }) {
  const url = `${matomoUrl.replace(/\/+$/, '')}/`;
  return `
var _paq = window._paq = window._paq || [];
_paq.push(['disableCookies']);
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u = ${JSON.stringify(url)};
  _paq.push(['setTrackerUrl', u + 'matomo.php']);
  _paq.push(['setSiteId', ${JSON.stringify(String(siteId))}]);
  var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
  g.async = true;
  g.src = u + 'matomo.js';
  s.parentNode.insertBefore(g, s);
})();
`.trim();
}

// Onderstaande drie functies zijn de enige plek die window._paq aanraakt voor
// opt-out — MatomoOptOut.tsx/.svelte bevatten zelf geen _paq-logica. Elk is
// een no-op guard zodat ze nooit crashen als tracking niet actief is (dev,
// adblocker, of siteId nog niet ingevuld).

function matomoOptOut() {
  if (typeof window === 'undefined' || !window._paq) return;
  window._paq.push(['optUserOut']);
}

function matomoForgetOptOut() {
  if (typeof window === 'undefined' || !window._paq) return;
  window._paq.push(['forgetUserOptOut']);
}

// callback(status): status is 'active' | 'opted-out' | 'unavailable'.
// Let op: een kale functie naar _paq.push() sturen (het patroon uit de
// Matomo-documentatie voor "custom code") crasht in deze tracker-build —
// de queue-verwerking doet intern `arg.shift()` op elk item, en een
// functie heeft geen .shift (TypeError: shift is not a function, gezien
// in productie). Lees de tracker-instantie daarom rechtstreeks via de
// eveneens door Matomo gedocumenteerde Matomo.getAsyncTracker().
function matomoIsOptedOut(callback) {
  if (typeof window === 'undefined' || typeof window.Matomo?.getAsyncTracker !== 'function') {
    callback('unavailable');
    return;
  }
  const tracker = window.Matomo.getAsyncTracker();
  if (!tracker) {
    callback('unavailable');
    return;
  }
  callback(tracker.isUserOptedOut() ? 'opted-out' : 'active');
}

module.exports = {
  MATOMO_URL,
  MATOMO_RETENTION_DAYS,
  buildMatomoSnippet,
  matomoOptOut,
  matomoForgetOptOut,
  matomoIsOptedOut,
};
