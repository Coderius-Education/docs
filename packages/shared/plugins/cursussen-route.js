// Voegt op elke site één route /cursussen toe die het gedeelde Leerlijnen-
// overzicht rendert. Zo hoeft geen enkele site een eigen pagina-bestand te
// hebben; de factory zet deze plugin standaard aan.
//
// De component wordt als package-subpad opgegeven en door webpack geresolved
// vanuit de site (de transpile-shared plugin transpileert de TSX-bron).

module.exports = function cursussenRoutePlugin(context) {
  return {
    name: 'coderius-cursussen-route',
    contentLoaded({ actions }) {
      actions.addRoute({
        // Een route van een plugin krijgt de baseUrl niet vanzelf: zonder dit
        // prefix landt hij op de vak-host naast de cursus in plaats van erin.
        path: `${context.baseUrl}cursussen`,
        component: '@coderius/shared/components/Leerlijnen/CursussenPage',
        exact: true,
      });
    },
  };
};
