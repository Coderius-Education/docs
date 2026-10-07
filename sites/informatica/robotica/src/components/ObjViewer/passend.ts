// Hoe ver de camera van het model moet staan om het helemaal in beeld te
// hebben, los van three.js zodat het in node te testen is
// (`src/lego-tests/click-golfer-doorloop.test.ts`).
//
// Het model past in een bol met deze straal. Een PerspectiveCamera heeft een
// vaste kijkhoek in de hoogte (`fov`); de kijkhoek in de breedte hangt af van
// de verhouding breedte/hoogte van het vak. Eerst keek de camera alleen naar
// de grootste maat van het model, zonder de breedte van het vak: op een
// telefoon (375 breed, 500 hoog) viel de Golfer dan rechts buiten beeld.
export function cameraAfstand(straal: number, fovGraden: number, aspect: number): number {
  const verticaal = (fovGraden * Math.PI) / 180;
  const horizontaal = 2 * Math.atan(Math.tan(verticaal / 2) * aspect);
  const smalste = Math.min(verticaal, horizontaal);
  // Een klein randje, zodat het model niet tegen de rand van het vak plakt.
  return (straal / Math.sin(smalste / 2)) * 1.05;
}
