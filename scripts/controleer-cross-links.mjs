/**
 * Controleert elke link tussen twee cursussites tegen de gebouwde sites.
 *
 *     node scripts/controleer-cross-links.mjs               sites/<vak>/<site>/build
 *     node scripts/controleer-cross-links.mjs builds        map met artifacts
 *     node scripts/controleer-cross-links.mjs --annotaties  GitHub-annotaties
 *
 * Waarom dit naast de guard-tests bestaat: elke cursus is een eigen
 * Docusaurus-site, en `onBrokenLinks: 'throw'` controleert alleen links
 * binnen de eigen site. Een <SiteLink> of <Voorkennis>-item naar een andere
 * cursus wordt een gewone externe URL, en niets kijkt bij het bouwen of dat
 * pad op de andere site bestaat. De guard-tests (voorkennis.test.ts,
 * sitelink.test.ts) vertalen zo'n pad met de hand terug naar een bronbestand;
 * dat is een benadering van de routing van Docusaurus, en die liep uit de pas
 * (/docs/ weggestript terwijl de editor-site op de root serveert). Dit script
 * kijkt naar wat de browser krijgt: de href in de gebouwde HTML, en of het
 * bestand achter die URL in de build van de doelsite bestaat.
 *
 * Alleen registry-domeinen (packages/shared/sites.js) tellen mee; externe
 * sites en stats.coderius.nl niet. Ankers en query's worden afgeknipt.
 *
 * Een cursus staat onder een pad van de host van zijn vak:
 * https://informatica.coderius.nl/python/docs/x is `docs/x` in de build van
 * python (de build bevat de baseUrl niet). Een ander pad op de vak-host, of
 * de vak-host zelf, hoort bij de homepage. Een link naar een oud subdomein
 * (https://python.coderius.nl/...) is altijd een fout: die stuurt alleen nog
 * door, en hoort in de bron vervangen te zijn.
 */

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { SITES, DOCENTEN_SITES, SUBJECTS, SUBJECTS_BY_ID, HOME } = createRequire(import.meta.url)(
  '../packages/shared/sites.js',
);

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ALLE_SITES = [...SITES, ...DOCENTEN_SITES];

/** host van een vak -> vak-id. */
const HOST_NAAR_VAK = new Map(SUBJECTS.map((v) => [new URL(v.url).host, v.id]));
const HOME_HOST = new URL(HOME.url).host;
/** oud subdomein -> site-id (python.coderius.nl -> python). */
export const OUDE_HOSTS = new Map(
  ALLE_SITES.filter((s) => s.legacyUrl).map((s) => [new URL(s.legacyUrl).host, s.id]),
);
/** Elke host die bij Coderius hoort: vakken, apex en de oude subdomeinen. */
const BEKENDE_HOSTS = [...HOST_NAAR_VAK.keys(), HOME_HOST, ...OUDE_HOSTS.keys()];

/**
 * Bij welke site en welk pad in diens build hoort deze URL? null voor een
 * URL buiten de registry-domeinen.
 * @param {URL} url
 * @returns {{ site: string, pad: string, oudDomein?: true } | null}
 */
export function doelVan(url) {
  if (url.host === HOME_HOST) return { site: HOME.id, pad: url.pathname };
  const oud = OUDE_HOSTS.get(url.host);
  if (oud) return { site: oud, pad: url.pathname, oudDomein: true };
  const vak = HOST_NAAR_VAK.get(url.host);
  if (!vak) return null;
  const [, eerste = '', ...rest] = url.pathname.split('/');
  const site = ALLE_SITES.find((s) => s.subject === vak && s.path === eerste);
  // Alles op de vak-host buiten een cursus serveert de homepage.
  if (!site) return { site: HOME.id, pad: url.pathname };
  return { site: site.id, pad: `/${rest.join('/')}` };
}

/** @param {string} host */
export function siteVanHost(host) {
  if (host === HOME_HOST) return HOME.id;
  return OUDE_HOSTS.get(host) ?? null;
}

/**
 * Alle absolute hrefs naar een registry-domein in één HTML-bestand. Een host
 * die met een registry-domein begínt maar er niet aan gelijk is
 * (`informatica.coderius.nlpython/...`, het gevolg van een pad zonder slash)
 * telt als misvormd: die hoort gemeld te worden, niet stil genegeerd.
 * @param {string} html
 * @returns {{ href: string, site: string, pad: string, misvormd?: true, oudDomein?: true }[]}
 */
export function hrefsUit(html) {
  const uit = [];
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    let url;
    try {
      url = new URL(m[1]);
    } catch {
      continue;
    }
    const doel = doelVan(url);
    if (doel) {
      uit.push({ href: m[1], ...doel });
      continue;
    }
    const aangeplakt = BEKENDE_HOSTS.find((host) => url.host.startsWith(host));
    if (aangeplakt)
      uit.push({
        href: m[1],
        site: OUDE_HOSTS.get(aangeplakt) ?? HOME.id,
        pad: url.pathname,
        misvormd: true,
      });
  }
  return uit;
}

/**
 * Bestaat dit pad in een gebouwde site? Precies wat statische hosting doet:
 * `<pad>/index.html`, `<pad>.html` of het bestand zelf; de root is index.html.
 * @param {string} buildMap
 * @param {string} pad
 */
export function doelBestaat(buildMap, pad) {
  let schoon;
  try {
    schoon = decodeURIComponent(pad);
  } catch {
    return false;
  }
  const rel = schoon.replace(/^\/+|\/+$/g, '');
  if (rel === '') return existsSync(join(buildMap, 'index.html'));
  if (existsSync(join(buildMap, rel, 'index.html'))) return true;
  if (existsSync(join(buildMap, `${rel}.html`))) return true;
  const los = join(buildMap, rel);
  return existsSync(los) && statSync(los).isFile();
}

/** @param {string} map */
export function htmlBestanden(map) {
  const uit = [];
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) uit.push(...htmlBestanden(pad));
    else if (naam.endsWith('.html')) uit.push(pad);
  }
  return uit;
}

/**
 * Vindt de builds in een map. Twee indelingen: `sites/<vak>/<site>/build` en
 * `sites/home/build` (lokaal; een map die naar een vak heet wordt één niveau
 * dieper doorzocht) en `<site>-static/` (de artifacts uit CI, één map per
 * artifact).
 * @param {string} map
 * @returns {Map<string, string>} site-id -> build-map
 */
export function buildsIn(map) {
  const builds = new Map();
  if (!existsSync(map)) return builds;
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (!statSync(pad).isDirectory()) continue;
    if (naam.endsWith('-static')) builds.set(naam.slice(0, -'-static'.length), pad);
    else if (existsSync(join(pad, 'build', 'index.html'))) builds.set(naam, join(pad, 'build'));
    else if (existsSync(join(pad, 'index.html'))) builds.set(naam, pad);
    else if (SUBJECTS_BY_ID[naam]) for (const [id, b] of buildsIn(pad)) builds.set(id, b);
  }
  return builds;
}

/**
 * Loopt alle cross-site links in alle builds na. Een link naar een site
 * waarvan geen build aanwezig is, telt als overgeslagen, niet als kapot.
 * @param {Map<string, string>} builds
 */
export function controleer(builds) {
  const kapot = [];
  let gecontroleerd = 0;
  let overgeslagen = 0;
  for (const [site, buildMap] of builds) {
    for (const bestand of htmlBestanden(buildMap)) {
      for (const link of hrefsUit(readFileSync(bestand, 'utf8'))) {
        // Een oud subdomein of een aangeplakte host is kapot, of de doelsite
        // nu gebouwd is of niet.
        if (link.oudDomein || link.misvormd) {
          gecontroleerd += 1;
          kapot.push({
            site,
            bron: relative(buildMap, bestand),
            href: link.href,
            doelSite: link.site,
            ...(link.oudDomein ? { reden: 'oud domein' } : {}),
          });
          continue;
        }
        const doelBuild = builds.get(link.site);
        if (!doelBuild) {
          overgeslagen += 1;
          continue;
        }
        gecontroleerd += 1;
        if (!doelBestaat(doelBuild, link.pad)) {
          kapot.push({
            site,
            bron: relative(buildMap, bestand),
            href: link.href,
            doelSite: link.site,
          });
        }
      }
    }
  }
  return { kapot, gecontroleerd, overgeslagen };
}

// realpath aan beide kanten: Node lost import.meta.url op via symlinks heen,
// process.argv[1] niet altijd. Zonder dat doet het script in een gesymlinkte
// checkout niets en eindigt het met exitcode 0.
const isHoofdscript =
  process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (isHoofdscript) {
  const argumenten = process.argv.slice(2);
  const annotaties = argumenten.includes('--annotaties');
  const map = argumenten.find((a) => !a.startsWith('--')) ?? join(ROOT, 'sites');

  const builds = buildsIn(map);
  if (builds.size === 0) {
    console.error(
      `Geen gebouwde sites gevonden in ${map}. Bouw eerst (pnpm build) of wijs de artifacts aan.`,
    );
    process.exit(1);
  }

  const { kapot, gecontroleerd, overgeslagen } = controleer(builds);
  const perSite = new Map();
  for (const k of kapot) {
    if (!perSite.has(k.site)) perSite.set(k.site, []);
    perSite.get(k.site).push(k);
  }
  for (const [site, lijst] of perSite) {
    console.log(`\n${site}: ${lijst.length} kapotte cross-site link(s)`);
    for (const k of lijst) {
      const reden = k.reden ? ` (${k.reden}; gebruik <SiteLink> of de nieuwe URL)` : '';
      console.log(`  ${k.bron} -> ${k.href}${reden}`);
      if (annotaties)
        console.log(
          `::error title=cross-site link naar ${k.doelSite}::${site}/${k.bron} -> ${k.href}${reden}`,
        );
    }
  }
  console.log(
    `\nBuilds: ${[...builds.keys()].sort().join(', ')}. ` +
      `${gecontroleerd} links gecontroleerd, ${overgeslagen} overgeslagen (doelsite niet gebouwd), ${kapot.length} kapot.`,
  );
  process.exit(kapot.length > 0 ? 1 : 0);
}
