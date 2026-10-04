// Voegt op elke site één route /privacy toe die de gedeelde privacyverklaring
// rendert. Zelfde patroon als cursussen-route.js: geen enkele site heeft een
// eigen paginabestand nodig, de factory zet deze plugin standaard aan.

module.exports = function privacyRoutePlugin(context) {
  return {
    name: 'coderius-privacy-route',
    contentLoaded({ actions }) {
      actions.addRoute({
        // Een route van een plugin krijgt de baseUrl niet vanzelf: zonder dit
        // prefix landt hij op de vak-host naast de cursus in plaats van erin.
        path: `${context.baseUrl}privacy`,
        component: '@coderius/shared/components/Privacy/PrivacyPage',
        exact: true,
      });
    },
  };
};
