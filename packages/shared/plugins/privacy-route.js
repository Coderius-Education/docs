// Voegt op elke site één route /privacy toe die de gedeelde privacyverklaring
// rendert. Zelfde patroon als cursussen-route.js: geen enkele site heeft een
// eigen paginabestand nodig, de factory zet deze plugin standaard aan.

module.exports = function privacyRoutePlugin() {
  return {
    name: 'coderius-privacy-route',
    contentLoaded({ actions }) {
      actions.addRoute({
        path: '/privacy',
        component: '@coderius/shared/components/Privacy/PrivacyPage',
        exact: true,
      });
    },
  };
};
