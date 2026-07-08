// Voegt op elke site één route /cursussen toe die het gedeelde Leerlijnen-
// overzicht rendert. Zo hoeft geen enkele site een eigen pagina-bestand te
// hebben; de factory zet deze plugin standaard aan.
//
// De component wordt als package-subpad opgegeven en door webpack geresolved
// vanuit de site (de transpile-shared plugin transpileert de TSX-bron).

module.exports = function cursussenRoutePlugin() {
  return {
    name: 'coderius-cursussen-route',
    contentLoaded({ actions }) {
      actions.addRoute({
        path: '/cursussen',
        component: '@coderius/shared/components/Leerlijnen/CursussenPage',
        exact: true,
      });
    },
  };
};
