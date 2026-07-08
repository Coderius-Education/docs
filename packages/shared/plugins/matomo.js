// Injecteert cookieloze Matomo-tracking in <head>, alleen in productiebuilds.
// De siteId komt per site uit createConfig({matomoSiteId}); zonder siteId (nog
// niet aangemaakt in de Matomo-admin) injecteert deze plugin niets, zodat hij
// veilig standaard aan kan staan voordat de handmatige Matomo-stap is gedaan.
//
// injectHtmlTags i.p.v. het headTags-veld van de site-config: die laatste
// "wint" volledig in createConfig (geen merge met site-eigen headTags), dus
// is niet geschikt om hier onvoorwaardelijk iets aan toe te voegen.

const { buildMatomoSnippet } = require('../matomo');

module.exports = function matomoPlugin(_context, options = {}) {
  return {
    name: 'coderius-matomo',
    injectHtmlTags() {
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd || !options.siteId) return {};
      return {
        headTags: [
          {
            tagName: 'script',
            attributes: {},
            innerHTML: buildMatomoSnippet({ siteId: options.siteId, matomoUrl: options.matomoUrl }),
          },
        ],
      };
    },
    getClientModules() {
      // Altijd geregistreerd; de client-module zelf is een no-op zonder
      // actieve tracker (window._paq bestaat dan niet, want in dev/zonder
      // siteId injecteert injectHtmlTags() hierboven niets).
      return [require.resolve('./matomo-client-module.js')];
    },
  };
};
