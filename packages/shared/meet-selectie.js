// Welke lessen moet CI meten na deze wijziging? De pure logica achter
// `scripts/meet-les-tabs.mjs --bronnen=changed.json` (de job `schermen`),
// los van de browser zodat hij te testen is (meet-selectie.test.ts).
//
// Een les past op 1280×720 tot iemand er een alinea bij schrijft. Dat zag
// alleen een meting met de hand, dus meet CI elke les die een wijziging
// raakt. Een gewijzigde lespagina wordt de les in de build met hetzelfde
// adres; al het andere aan een site (een onderdeel, de opmaak, de config,
// een deel dat een les importeert, of een package waar hij van afhangt) kan
// elke les raken, en dan meet CI de hele site. Ook als er daarnaast een les
// veranderde: eerst mat CI dan alleen die les, en een wijziging in
// speling.ts bleef in de rest van de cursus ongemeten.
//
// Een gewijzigde les die CI in de build niet vindt, meet hij niet. Dat mag
// alleen bij een pagina zonder tabbladen (`les_tabs: false`); een les in een
// docs-map die er niet is, is een fout in deze selectie (of een les die de
// build kwijtraakte), en dan faalt `--streng` (`ontbreekt`).

/** Mappen van een site waar geen lessen staan. */
const GEEN_LESSEN = new Set(['src', 'static', 'scripts', 'node_modules', 'build']);

/** Zoals Docusaurus een nummer vooraan een map of bestand weglaat. */
const NUMMER = /^\d+\s*[-_.]+\s*([^-_.\s].*)$/;
const zonderNummer = (deel) => deel.match(NUMMER)?.[1] ?? deel;

/** De velden `slug`, `id`, `les_tabs` en `draft` uit de front matter, als die er zijn. */
function frontMatter(bron) {
  const m = bron.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const veld = (naam) =>
    m[1]
      .match(new RegExp(`^${naam}:\\s*(.+)$`, 'm'))?.[1]
      .trim()
      .replace(/^['"]|['"]$/g, '');
  return { slug: veld('slug'), id: veld('id'), lesTabs: veld('les_tabs'), draft: veld('draft') };
}

/**
 * De mappen met lessen van een site: `docs` en het `path` van elke andere
 * docs-plugin in de config (`lego_auto`, `golfbot` bij robotica). Een
 * `blog/` of een README naast de lessen hoort er niet bij.
 *
 * @param {string} config de bron van docusaurus.config.ts
 * @returns {string[]}
 */
function docsMappen(config) {
  const uit = new Set(['docs']);
  for (const m of config.matchAll(/\bpath:\s*['"]([\w-]+)['"]/g)) uit.add(m[1]);
  return [...uit];
}

/**
 * Hoort deze gewijzigde bron een les in de build te hebben (met tabbladen of
 * als één scherm)? Ja voor een pagina in een docs-map, behalve een deel, een
 * pagina met `les_tabs: false` (een cheatsheet, een hand-out) en een draft.
 *
 * @param {string} rel het pad binnen de site (`docs/terminal/mappen.mdx`)
 * @param {string} bron
 * @param {string[]} mappen de docs-mappen van de site (docsMappen)
 */
function moetGemetenWorden(rel, bron, mappen) {
  const delen = rel.split('/');
  if (!/\.mdx?$/.test(rel) || delen.length < 2 || !mappen.includes(delen[0])) return false;
  if (delen.some((d) => d.startsWith('_'))) return false;
  const { lesTabs, draft } = frontMatter(bron);
  return lesTabs !== 'false' && draft !== 'true';
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
 * @param {string} opties.site het id van de site (`linux`)
 * @param {string} opties.siteMap de map van de site (`sites/informatica/linux`)
 * @param {string[]} opties.lessen de lessen in de build (`docs/terminal/mappen`)
 * @param {(pad: string) => string | null} opties.leesBron de bron van een
 *   bestand in de checkout, of null als het er niet (meer) is
 * @param {string[]} [opties.mappen] de docs-mappen van de site (docsMappen)
 * @returns {{ alles: boolean, lessen: string[], nietGevonden: string[],
 *   ontbreekt: string[], reden: string }} `nietGevonden`: gewijzigde
 *   lespagina's zonder les in de build; `ontbreekt`: wie daarvan er wel een
 *   had moeten hebben (moetGemetenWorden)
 */
function lessenVoorMeting({ plan, site, siteMap, lessen, leesBron, mappen = ['docs'] }) {
  const alles = (reden) => ({ alles: true, lessen, nietGevonden: [], ontbreekt: [], reden });
  if (plan.volledig) return alles('volledige run');
  if (plan.schermen?.alles) return alles('het meetscript is veranderd');
  const via = plan.schermen?.viaPakket?.[site];
  if (via) return alles(`${via} staat in een package waar de site van afhangt`);
  const prefix = `${siteMap}/`;
  const bestanden = Object.keys(plan.bestanden ?? {}).filter((p) => p.startsWith(prefix));
  if (bestanden.length === 0) return alles('een package waar de site van afhangt');
  const gekozen = new Set();
  const nietGevonden = [];
  const ontbreekt = [];
  for (const pad of bestanden) {
    const bron = leesBron(pad);
    // Een weggehaalde les valt weg; niets te meten.
    if (bron === null) continue;
    const adres = adresVanBron(pad.slice(prefix.length), bron);
    if (adres === null) return alles(`${pad} kan elke les raken`);
    const passend = lessen.filter((les) => les === adres || les.endsWith(`/${adres}`));
    // Een pagina zonder tabbladen die niet als één scherm meetelt (een
    // cheatsheet met les_tabs: false) staat niet in de lijst: niets te meten.
    if (passend.length === 0) {
      nietGevonden.push(pad);
      if (moetGemetenWorden(pad.slice(prefix.length), bron, mappen)) ontbreekt.push(pad);
    }
    for (const les of passend) gekozen.add(les);
  }
  return {
    alles: false,
    lessen: lessen.filter((les) => gekozen.has(les)),
    nietGevonden,
    ontbreekt,
    reden: 'de gewijzigde lessen',
  };
}

module.exports = {
  adresVanBron,
  docsMappen,
  lessenVoorMeting,
  moetGemetenWorden,
  zonderNummer,
};
