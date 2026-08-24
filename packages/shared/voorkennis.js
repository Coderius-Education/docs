// Gedeelde controle op <Voorkennis>-blokken.
//
// Cross-site links vallen buiten de linkcheck van `pnpm build`: een hernoemde
// les in de python- of web-cursus breekt ze pas in productie. Elke site die
// zulke blokken gebruikt heeft daarom een guard-test, en die tests deelden
// eerst allemaal hun eigen kopie van deze twee functies. Dat liep uit elkaar —
// zo bleef een label tussen dubbele quotes in één kopie stil buiten de
// controle. Vandaar één plek.

const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

// Items staan letterlijk in deze vorm in de bron, dus een regex volstaat.
// Het label mag tussen enkele of dubbele quotes staan: een label met een
// apostrof ("Pagina's koppelen") kan niet anders.
const ITEM_RE = /\{site: '(\w+)', to: '([^']+)', label: ('[^']*'|"[^"]*")\}/g;

/** Alle Voorkennis-items in één bronbestand. */
function parseItems(inhoud) {
  return [...inhoud.matchAll(ITEM_RE)].map((m) => ({
    site: m[1],
    to: m[2],
    label: m[3].slice(1, -1),
  }));
}

/** Alle .md/.mdx-bestanden onder een map, recursief. */
function alleLesbestanden(map) {
  const paden = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) paden.push(...alleLesbestanden(volledig));
    else if (/\.mdx?$/.test(entry.name)) paden.push(volledig);
  }
  return paden;
}

/**
 * Vertaalt een docs-URL van een andere site terug naar een bronbestand.
 *
 * Docusaurus stript alleen een puur numeriek prefix ("06-data" -> "data",
 * maar "10a-lijsten-basis" blijft staan). De python-cursus nummert zijn
 * mappen, de web- en editor-cursus niet, dus beide vormen moeten matchen.
 * Een slug in de frontmatter wint van de bestandsnaam; die is relatief aan
 * de routeBasePath, dus vergelijken we hem met het pad ná /docs.
 *
 * @param sitesRoot map met alle sites (de `sites/`-map)
 * @param site site-id, bijvoorbeeld 'python' of 'web'
 * @param to pad zoals het in het Voorkennis-item staat, met /docs-prefix
 */
function lesBestaat(sitesRoot, site, to) {
  const docsMap = join(sitesRoot, site, 'docs');
  if (!existsSync(docsMap)) return false;

  const segmenten = to
    .replace(/^\/docs\/?/, '')
    .split('/')
    .filter(Boolean);
  if (segmenten.length === 0) return false;

  // Alle segmenten op één na zijn mappen; het laatste is de pagina.
  let huidig = docsMap;
  for (const segment of segmenten.slice(0, -1)) {
    const mapNaam = readdirSync(huidig, { withFileTypes: true }).find(
      (e) => e.isDirectory() && (e.name === segment || e.name.replace(/^\d+-/, '') === segment),
    )?.name;
    if (!mapNaam) return false;
    huidig = join(huidig, mapNaam);
  }

  const paginaSegment = segmenten[segmenten.length - 1];
  const naDocs = to.replace(/^\/docs/, '');
  for (const bestand of readdirSync(huidig)) {
    if (!/\.mdx?$/.test(bestand)) continue;
    const inhoud = readFileSync(join(huidig, bestand), 'utf8');
    const slug = inhoud.match(/^slug:\s*(\S+)/m)?.[1];
    if (slug) {
      if (slug === to || slug === naDocs) return true;
      continue;
    }
    const kaal = bestand.replace(/\.mdx?$/, '');
    if (kaal === paginaSegment || kaal.replace(/^\d+-/, '') === paginaSegment) return true;
  }
  return false;
}

module.exports = { ITEM_RE, parseItems, alleLesbestanden, lesBestaat };
