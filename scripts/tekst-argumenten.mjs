/**
 * De argumenten van controleer-tekst.mjs, los van het script zodat een test
 * ze kan nalopen zonder het script over een hele site te laten draaien.
 *
 * Een los argument is een site-id of een lesbestand. Twee fouten gaven een
 * vals beeld: zonder --regels sloeg `i !== regelsVlag + 1` het eerste
 * argument over (regelsVlag is dan -1), dus `controleer-tekst.mjs fullstack`
 * controleerde elke site; en een bestandsnaam gaf stil "0 fouten", omdat
 * geen site zo heette.
 *
 * @param {string[]} argumenten process.argv zonder node en het script
 * @param {Set<string>} siteIds de id's uit de registry
 */
export function leesArgumenten(argumenten, siteIds) {
  const regelsVlag = argumenten.indexOf('--regels');
  const losse = argumenten.filter(
    (a, i) => !a.startsWith('--') && (regelsVlag === -1 || i !== regelsVlag + 1),
  );
  return {
    streng: argumenten.includes('--streng'),
    regelsPad: regelsVlag === -1 ? undefined : argumenten[regelsVlag + 1],
    sites: losse.filter((a) => siteIds.has(a)),
    bestanden: losse.filter((a) => !siteIds.has(a)),
  };
}

/**
 * Welke sites en bestanden de controle doet. Een site-id neemt de hele site,
 * een bestand alleen zichzelf (en dus zijn site). Samen tellen ze op: eerst
 * hielden ze elkaar tegen, en dan gaf `python fullstack/…/a.mdx` "Geen
 * lestekst" voor een bestand dat wel lestekst is.
 *
 * @param {{ id: string, dir: string }[]} alleSites
 * @param {string[]} sites site-id's uit de argumenten
 * @param {Set<string>} bestanden paden vanaf de root
 */
export function kies(alleSites, sites, bestanden) {
  const geen = !sites.length && !bestanden.size;
  const heel = (id) => geen || sites.includes(id);
  return {
    sites: alleSites.filter(
      ({ id, dir }) => heel(id) || [...bestanden].some((b) => b.startsWith(`${dir}/`)),
    ),
    /** Hoort dit bestand van deze site bij de controle? */
    telt: (id, pad) => heel(id) || bestanden.has(pad),
  };
}
