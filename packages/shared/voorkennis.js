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
 * Onder welk URL-segment serveert deze site zijn docs? Gelezen uit de
 * `routeBasePath` in het `docs:`-blok van de preset in docusaurus.config;
 * zonder die regel geldt de Docusaurus-standaard 'docs'. De editor-cursus
 * serveert op de root ('/'), didactiek onder 'bronnen'. Losse docs-plugins
 * (robotica's lego_auto en click_golfer) staan onder `plugins` en tellen niet
 * mee: lesBestaat kijkt alleen in de map `docs/`.
 *
 * Een pad naar een bestaand bestand kan zo toch een 404 zijn, en dat is
 * precies wat een guard die alleen naar bestanden kijkt niet ziet.
 *
 * @returns '' voor de root, anders het segment zonder slashes ('docs', 'bronnen')
 */
const prefixCache = new Map();
function docsPrefix(sitesRoot, site) {
  const sleutel = `${sitesRoot}|${site}`;
  if (prefixCache.has(sleutel)) return prefixCache.get(sleutel);
  let prefix = 'docs';
  for (const naam of ['docusaurus.config.ts', 'docusaurus.config.js']) {
    const pad = join(sitesRoot, site, naam);
    if (!existsSync(pad)) continue;
    const m = readFileSync(pad, 'utf8').match(/docs:\s*\{[^}]*routeBasePath:\s*['"]([^'"]*)['"]/);
    if (m) prefix = m[1].replace(/^\/+|\/+$/g, '');
    break;
  }
  prefixCache.set(sleutel, prefix);
  return prefix;
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

  // Het pad moet passen bij hoe de doelsite zijn docs serveert. De
  // fullstack-installatiepagina wees met /docs/python/… naar de editor-cursus:
  // het bestand bestond, de URL niet. Op de root (prefix '') mag het pad niet
  // met /docs beginnen; elders moet het eerste segment het prefix zijn.
  const prefix = docsPrefix(sitesRoot, site);
  const alleSegmenten = to.split('/').filter(Boolean);
  if (prefix === '' ? alleSegmenten[0] === 'docs' : alleSegmenten[0] !== prefix) return false;

  const segmenten = prefix === '' ? alleSegmenten : alleSegmenten.slice(1);
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
  const naDocs = `/${segmenten.join('/')}`;
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

module.exports = { ITEM_RE, parseItems, alleLesbestanden, lesBestaat, docsPrefix };
