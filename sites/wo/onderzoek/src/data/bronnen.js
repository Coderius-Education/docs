// De bronnen waarop pagina's van deze site gebaseerd zijn. Eén plek voor de
// bibliografische gegevens: <Bron id="…" hoofdstuk="…" over="…" /> haalt ze
// hier op, en de docentenhandleiding noemt dezelfde bronnen. Wat we
// overnemen zijn begrippen en indelingen, in eigen woorden en vorm
// uitgewerkt; tekst, figuren en opdrachten van een bron nemen we niet over
// (src/data/bronnen.test.ts).

export const BRONNEN = {
  eureka: {
    auteurs: [
      { achternaam: 'Wientjes', voorletters: 'H.' },
      { achternaam: 'Veenhoven', voorletters: 'J.' },
    ],
    jaar: 2023,
    titel: 'Eureka! Didactiek voor het leren onderzoeken in vwo én havo',
    uitgever: 'Universiteit Utrecht',
    url: 'https://www.uu.nl/onderwijs/onderwijsadvies-training/kennisdossiers/publicaties/eureka-didactiek-voor-het-leren-onderzoeken-in-vwo-en-havo',
  },
  // Geen url: er is geen pagina van de uitgever, en een winkel linken we niet.
  ikdenk: {
    auteurs: [{ achternaam: 'Le Coultre', voorletters: 'E.-A.' }],
    jaar: 2007,
    titel: 'Ik denk: Cogito. Inleiding in de filosofie',
    uitgever: 'Veen Magazines',
  },
};

/**
 * De auteurs en het jaar in APA-stijl, zoals de site leerlingen leert
 * verwijzen: "Wientjes, H., & Veenhoven, J. (2023)".
 * @param {{auteurs: {achternaam: string, voorletters: string}[], jaar: number}} bron
 */
export function auteursEnJaar(bron) {
  const namen = bron.auteurs.map((a) => `${a.achternaam}, ${a.voorletters}`);
  const lijst =
    namen.length === 1
      ? namen[0]
      : `${namen.slice(0, -1).join(', ')}, & ${namen[namen.length - 1]}`;
  return `${lijst} (${bron.jaar})`;
}
