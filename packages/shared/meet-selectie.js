// Welke lessen moet CI meten na deze wijziging? De pure logica achter
// `scripts/meet-les-tabs.mjs --bronnen=changed.json` (de job `schermen`),
// los van de browser zodat hij te testen is (meet-selectie.test.ts).
//
// Een les past op 1280×720 tot iemand er een alinea bij schrijft. Dat zag
// alleen een meting met de hand, dus meet CI elke les die een wijziging
// raakt. Een gewijzigde lespagina wordt de les in de build met hetzelfde
// adres; al het andere aan een site (een onderdeel, de opmaak, de config,
// een deel dat een les importeert, of een package waar hij van afhangt) kan
// elke les raken, en dan meet CI de hele site.

/** Mappen van een site waar geen lessen staan. */
const GEEN_LESSEN = new Set(['src', 'static', 'scripts', 'node_modules', 'build']);

/** Zoals Docusaurus een nummer vooraan een map of bestand weglaat. */
const NUMMER = /^\d+\s*[-_.]+\s*([^-_.\s].*)$/;
const zonderNummer = (deel) => deel.match(NUMMER)?.[1] ?? deel;

/** De velden `slug` en `id` uit de front matter, als die er zijn. */
function frontMatter(bron) {
  const m = bron.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const veld = (naam) =>
    m[1]
      .match(new RegExp(`^${naam}:\\s*(.+)$`, 'm'))?.[1]
      .trim()
      .replace(/^['"]|['"]$/g, '');
  return { slug: veld('slug'), id: veld('id') };
}

/**
 * Het adres van een lespagina in de build, zonder de map van de docs-plugin
 * ervoor (`docs/terminal/jokertekens.mdx` -> `terminal/jokertekens`), of
 * null als het bestand geen lespagina is.
 */
function adresVanBron(rel, bron) {
  if (!/\.mdx?$/.test(rel)) return null;
  const delen = rel.split('/');
  // Een pagina in src/pages heeft het pad erna; een les het pad na de map
  // van zijn docs-plugin (docs/, lego_auto/, golfbot/).
  let pad;
  if (delen[0] === 'src' && delen[1] === 'pages') pad = delen.slice(2);
  else if (delen.length > 1 && !GEEN_LESSEN.has(delen[0])) pad = delen.slice(1);
  else return null;
  // Een deel (`_delen/`, `_stap.mdx`) staat in de les die het importeert.
  if (pad.some((d) => d.startsWith('_'))) return null;
  pad = pad.map((d, i) => zonderNummer(i === pad.length - 1 ? d.replace(/\.mdx?$/, '') : d));
  const laatste = pad.at(-1) ?? '';
  if (/^(index|readme)$/i.test(laatste) || laatste === pad.at(-2)) pad = pad.slice(0, -1);
  const { slug, id } = frontMatter(bron);
  if (slug) {
    if (slug.startsWith('/')) return slug.replace(/^\/+|\/+$/g, '');
    return [...pad.slice(0, -1), slug.replace(/\/+$/, '')].join('/');
  }
  if (id) return [...pad.slice(0, -1), id].join('/');
  return pad.join('/');
}

/**
 * De lessen die CI moet meten.
 *
 * @param {object} opties
 * @param {object} opties.plan changed.json van de plan-job
 * @param {string} opties.siteMap de map van de site (`sites/informatica/linux`)
 * @param {string[]} opties.lessen de lessen in de build (`docs/terminal/mappen`)
 * @param {(pad: string) => string | null} opties.leesBron de bron van een
 *   bestand in de checkout, of null als het er niet (meer) is
 * @returns {{ alles: boolean, lessen: string[], nietGevonden: string[], reden: string }}
 */
function lessenVoorMeting({ plan, siteMap, lessen, leesBron }) {
  const alles = (reden) => ({ alles: true, lessen, nietGevonden: [], reden });
  if (plan.volledig) return alles('volledige run');
  if (plan.schermen?.alles) return alles('het meetscript is veranderd');
  const prefix = `${siteMap}/`;
  const bestanden = Object.keys(plan.bestanden ?? {}).filter((p) => p.startsWith(prefix));
  if (bestanden.length === 0) return alles('een package waar de site van afhangt');
  const gekozen = new Set();
  const nietGevonden = [];
  for (const pad of bestanden) {
    const bron = leesBron(pad);
    // Een weggehaalde les valt weg; niets te meten.
    if (bron === null) continue;
    const adres = adresVanBron(pad.slice(prefix.length), bron);
    if (adres === null) return alles(`${pad} kan elke les raken`);
    const passend = lessen.filter((les) => les === adres || les.endsWith(`/${adres}`));
    // Een pagina zonder tabbladen die niet als één scherm meetelt (een
    // cheatsheet met les_tabs: false) staat niet in de lijst: niets te meten.
    if (passend.length === 0) nietGevonden.push(pad);
    for (const les of passend) gekozen.add(les);
  }
  return {
    alles: false,
    lessen: lessen.filter((les) => gekozen.has(les)),
    nietGevonden,
    reden: 'de gewijzigde lessen',
  };
}

module.exports = { adresVanBron, lessenVoorMeting, zonderNummer };
