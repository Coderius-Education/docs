// Werkvormen: wat een leerling in een onderdeel van een les doet (voorspellen,
// onderzoeken, aanpassen, zelf maken, fouten herkennen, …). Elke werkvorm
// heeft een icoon en wijst naar minstens één tip van vakdidactiek
// (didactiek.coderius.nl). Zo hangt een les aan zijn onderbouwing:
//
//  - een les-tabblad (plugins/les-tabs.js) krijgt de werkvorm van zijn kop,
//    en toont het icoon;
//  - de docentenhandleiding legt elk icoon uit, met links naar de tips
//    (components/Werkvorm), en toont per les welke werkvormen hij heeft.
//
// Alles staat in werkvormen.json; werkvormen.test.ts eist dat elke werkvorm
// een icoon en een tip heeft, en dat elke tip bij vakdidactiek bestaat onder
// dezelfde naam.

const WERKVORMEN = require('./werkvormen.json');

const STANDAARD = WERKVORMEN.find((w) => w.standaard);
const patronen = (w) => w.koppen.map((k) => new RegExp(k));

/**
 * De werkvorm bij één kop. Een kop die bij geen werkvorm hoort, is uitleg:
 * in een les heet die sectie naar zijn onderwerp ("De for-loop").
 *
 * @param {string} titel de tekst van de `##`-kop
 * @returns {string} het id van de werkvorm
 */
function werkvormVan(titel) {
  const gevonden = WERKVORMEN.find((w) => patronen(w).some((p) => p.test(titel)));
  return (gevonden ?? STANDAARD).id;
}

/**
 * De werkvormen bij de koppen van één les, in volgorde. Dat kan niet per kop:
 * van een rij genummerde opdrachten is de laatste de vrije opdracht (Make),
 * de eerdere zijn aanpassen (`laatsteVan` in werkvormen.json).
 *
 * @param {string[]} titels
 * @returns {string[]}
 */
function werkvormenVan(titels) {
  const uit = titels.map(werkvormVan);
  for (const w of WERKVORMEN) {
    if (!w.laatsteVan) continue;
    const patroon = new RegExp(w.laatsteVan);
    const plekken = titels.flatMap((t, i) => (patroon.test(t) ? [i] : []));
    if (plekken.length > 1) uit[plekken.at(-1)] = w.id;
  }
  return uit;
}

/** De werkvorm met dit id, of undefined. */
const werkvorm = (id) => WERKVORMEN.find((w) => w.id === id);

module.exports = { WERKVORMEN, werkvorm, werkvormVan, werkvormenVan };
