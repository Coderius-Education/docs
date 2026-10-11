/**
 * Controleert elke link tussen twee cursussites tegen de gebouwde sites.
 *
 *     node scripts/controleer-cross-links.mjs               sites/<vak>/<site>/build
 *     node scripts/controleer-cross-links.mjs builds        map met artifacts
 *     node scripts/controleer-cross-links.mjs --annotaties  GitHub-annotaties
 *     node scripts/controleer-cross-links.mjs --compleet    elke site moet er zijn
 *     node scripts/controleer-cross-links.mjs --ankers=waarschuw
 *                                     ontbrekende ankers als waarschuwing
 *
 * CI bouwt alleen de sites die een wijziging raakt en haalt de rest uit de
 * cache (zie de jobs `build` en `voorraad` in build.yml). Met --compleet faalt
 * het script als er een site uit de registry ontbreekt: een link naar een site
 * zonder build telt anders stil als overgeslagen.
 *
 * Waarom dit naast de guard-tests bestaat: elke cursus is een eigen
 * Docusaurus-site, en `onBrokenLinks: 'throw'` controleert alleen links
 * binnen de eigen site. Een site:-link of <Voorkennis>-item naar een andere
 * cursus wordt een gewone externe URL, en niets kijkt bij het bouwen of dat
 * pad op de andere site bestaat. De guard-test links-in-lestekst.test.ts
 * bewaakt alleen de vorm van de links in de bron; voorkennis.test.ts vertaalt
 * een pad met de hand terug naar een bronbestand, een benadering van de
 * routing van Docusaurus. Dit script kijkt naar wat de browser krijgt: de href
 * in de gebouwde HTML, of het bestand achter die URL in de build van de
 * doelsite bestaat, en of het anker erop staat.
 *
 * Alleen registry-domeinen (packages/shared/sites.js) tellen mee; externe
 * sites en stats.coderius.nl niet. Dat geldt ook voor links binnen één cursus:
 * relatieve hrefs worden opgelost zoals de browser dat doet.
 *
 * Ankers: bij een <a href="...#kop"> moet de doelpagina een element met
 * id="kop" hebben (Docusaurus zet dat op elke kop, ook met {#vast-id}). Een
 * doorstuurpagina (omleidingen) wordt gevolgd. Fragmenten met '=' zijn geen
 * anker maar app-state (bv. #code=... in robotica) en tellen niet mee.
 *
 * Een href die nog met site: begint, is een [tekst](site:...)-link die de
 * remark-plugin niet zag, bv. in een bestand buiten docs/, src/pages of blog/.
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

const { SITES, DOCENTEN_SITES, SUBJECTS, SUBJECTS_BY_ID, HOME, parseSiteUrl } = createRequire(
  import.meta.url,
)('../packages/shared/sites.js');

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
 * Links en assets naar een registry-domein in één HTML-bestand.
 * Met paginaUrl worden ook relatieve URLs zoals in de browser opgelost.
 * ObjViewer publiceert zijn runtime-requests als data-obj-src/data-obj-mtl. Een host
 * die met een registry-domein begínt maar er niet aan gelijk is
 * (`informatica.coderius.nlpython/...`, het gevolg van een pad zonder slash)
 * telt als misvormd: die hoort gemeld te worden, niet stil genegeerd.
 * Alleen een <a> krijgt een `anker`: een fragment in src of in een SVG-<use>
 * is geen kop op een pagina.
 * @param {string} html
 * @param {string} [paginaUrl]
 * @returns {{ href: string, site: string, pad: string, anker?: string, misvormd?: true, oudDomein?: true, nietOmgezet?: true }[]}
 */
export function hrefsUit(html, paginaUrl) {
  const uit = [];
  for (const m of html.matchAll(/\s(href|src|poster|data-obj-src|data-obj-mtl)="([^"]+)"/g)) {
    const href = decodeerEntiteiten(m[2]);
    const isLink = m[1] === 'href' && tagVoor(html, m.index) === 'a';
    if (isLink && href.startsWith('site:')) {
      let doelSite = HOME.id;
      try {
        doelSite = parseSiteUrl(href)?.site ?? doelSite;
      } catch {}
      uit.push({ href, site: doelSite, pad: '', nietOmgezet: true });
      continue;
    }
    const alleenAnker = href.startsWith('#');
    if (!paginaUrl && !/^https?:\/\//.test(href)) continue;
    if (alleenAnker ? !isLink : /^(?:data:|blob:|mailto:|tel:|javascript:)/i.test(href)) continue;
    let url;
    try {
      url = new URL(href, paginaUrl);
    } catch {
      continue;
    }
    const anker = isLink ? ankerVan(url.hash) : undefined;
    if (alleenAnker && !anker) continue;
    const doel = doelVan(url);
    if (doel) {
      uit.push({ href, ...doel, ...(anker ? { anker } : {}) });
      continue;
    }
    const aangeplakt = BEKENDE_HOSTS.find((host) => url.host.startsWith(host));
    if (aangeplakt)
      uit.push({
        href,
        site: OUDE_HOSTS.get(aangeplakt) ?? HOME.id,
        pad: url.pathname,
        misvormd: true,
      });
  }
  return uit;
}

/** Naam van de tag waarin het attribuut op positie `index` staat. */
function tagVoor(html, index) {
  const start = html.lastIndexOf('<', index);
  return /^<([a-zA-Z][\w-]*)/.exec(html.slice(start, start + 40))?.[1].toLowerCase();
}

function decodeerEntiteiten(tekst) {
  return tekst
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Het anker uit een URL-fragment, of undefined als het geen anker is: leeg,
 * app-state met '=' (#code=...) of Docusaurus' eigen skip-link.
 * @param {string} hash
 */
export function ankerVan(hash) {
  let anker;
  try {
    anker = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return undefined;
  }
  if (!anker || anker.includes('=') || anker === '__docusaurus_skipToContent_fallback')
    return undefined;
  return anker;
}

/**
 * Het bestand dat statische hosting voor dit pad serveert, of null.
 * @param {string} buildMap
 * @param {string} pad
 */
export function doelBestand(buildMap, pad) {
  let schoon;
  try {
    schoon = decodeURIComponent(pad);
  } catch {
    return null;
  }
  const rel = schoon.replace(/^\/+|\/+$/g, '');
  const kandidaten = rel === '' ? ['index.html'] : [join(rel, 'index.html'), `${rel}.html`, rel];
  for (const kandidaat of kandidaten) {
    const bestand = join(buildMap, kandidaat);
    if (existsSync(bestand) && statSync(bestand).isFile()) return bestand;
  }
  return null;
}

const ankerCache = new Map();

/**
 * Alle ankers op een gebouwde pagina: elke id en elke <a name>.
 * @param {string} bestand
 */
export function ankersVan(bestand) {
  let ankers = ankerCache.get(bestand);
  if (ankers) return ankers;
  ankers = new Set();
  const html = readFileSync(bestand, 'utf8');
  for (const m of html.matchAll(/\s(?:id|name)="([^"]+)"/g)) ankers.add(decodeerEntiteiten(m[1]));
  ankerCache.set(bestand, ankers);
  return ankers;
}

/** De URL waar een doorstuurpagina (omleidingen) naartoe wijst, of null. */
function doorstuurVan(bestand) {
  const html = readFileSync(bestand, 'utf8');
  const m = /<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i.exec(html);
  return m ? decodeerEntiteiten(m[1]) : null;
}

/**
 * Bestaat dit pad in een gebouwde site? Precies wat statische hosting doet:
 * `<pad>/index.html`, `<pad>.html` of het bestand zelf; de root is index.html.
 * @param {string} buildMap
 * @param {string} pad
 */
export function doelBestaat(buildMap, pad) {
  return doelBestand(buildMap, pad) !== null;
}

/**
 * Staat het anker op de doelpagina? Volgt tot drie doorstuurpagina's, zodat
 * een link naar een verhuisde les het anker op de nieuwe plek controleert.
 * @param {Map<string, string>} builds
 * @param {{ site: string, pad: string, anker: string }} link
 * @param {string} paginaUrl de URL van de doelpagina, om doorsturen op te lossen
 * @returns {boolean | null} null als de doelsite van een doorstuur niet gebouwd is
 */
export function ankerBestaat(builds, link, paginaUrl) {
  let { site, pad } = link;
  let url = paginaUrl;
  for (let stap = 0; stap < 4; stap++) {
    const build = builds.get(site);
    if (!build) return null;
    const bestand = doelBestand(build, pad);
    if (!bestand || !bestand.endsWith('.html')) return false;
    const verder = doorstuurVan(bestand);
    if (!verder) return ankersVan(bestand).has(link.anker);
    const volgende = new URL(verder, url);
    const doel = doelVan(volgende);
    if (!doel) return null;
    ({ site, pad } = doel);
    url = volgende.href;
  }
  return false;
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
  const ankers = [];
  let gecontroleerd = 0;
  let overgeslagen = 0;
  for (const [site, buildMap] of builds) {
    for (const bestand of htmlBestanden(buildMap)) {
      const registry = [...ALLE_SITES, HOME].find((s) => s.id === site);
      const bronPad = relative(buildMap, bestand)
        .split('\\')
        .join('/')
        // Alleen een heel index.html-segment: h-index.html is een eigen pagina.
        .replace(/(^|\/)index\.html$/, '$1');
      const paginaUrl = registry ? new URL(bronPad, registry.url).href : undefined;
      for (const link of hrefsUit(readFileSync(bestand, 'utf8'), paginaUrl)) {
        // Een oud subdomein of een aangeplakte host is kapot, of de doelsite
        // nu gebouwd is of niet.
        if (link.oudDomein || link.misvormd || link.nietOmgezet) {
          gecontroleerd += 1;
          kapot.push({
            site,
            bron: relative(buildMap, bestand),
            href: link.href,
            doelSite: link.site,
            ...(link.oudDomein ? { reden: 'oud domein' } : {}),
            ...(link.nietOmgezet
              ? {
                  reden:
                    'site:-link niet omgezet; staat het bestand buiten docs/, src/pages of blog/?',
                }
              : {}),
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
        } else if (link.anker) {
          const doelUrl = new URL(link.href, paginaUrl).href;
          if (ankerBestaat(builds, link, doelUrl) === false)
            ankers.push({
              site,
              bron: relative(buildMap, bestand),
              href: link.href,
              doelSite: link.site,
              reden: `anker #${link.anker} bestaat niet`,
            });
        }
      }
    }
  }
  return { kapot, ankers, gecontroleerd, overgeslagen };
}

// realpath aan beide kanten: Node lost import.meta.url op via symlinks heen,
// process.argv[1] niet altijd. Zonder dat doet het script in een gesymlinkte
// checkout niets en eindigt het met exitcode 0.
const isHoofdscript =
  process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (isHoofdscript) {
  const argumenten = process.argv.slice(2);
  const annotaties = argumenten.includes('--annotaties');
  const compleet = argumenten.includes('--compleet');
  const ankerModus =
    argumenten.find((a) => a.startsWith('--ankers='))?.slice('--ankers='.length) ?? 'fout';
  const map = argumenten.find((a) => !a.startsWith('--')) ?? join(ROOT, 'sites');

  const builds = buildsIn(map);
  if (builds.size === 0) {
    console.error(
      `Geen gebouwde sites gevonden in ${map}. Bouw eerst (pnpm build) of wijs de artifacts aan.`,
    );
    process.exit(1);
  }

  const ontbreekt = [...ALLE_SITES, HOME].map((s) => s.id).filter((id) => !builds.has(id));
  if (compleet && ontbreekt.length) {
    console.error(
      `Geen build van: ${ontbreekt.join(', ')}. Met --compleet moet elke site er zijn.`,
    );
    process.exit(1);
  }

  const resultaat = controleer(builds);
  const { gecontroleerd, overgeslagen } = resultaat;
  const kapot = ankerModus === 'fout' ? [...resultaat.kapot, ...resultaat.ankers] : resultaat.kapot;
  const waarschuwingen = ankerModus === 'fout' ? [] : resultaat.ankers;
  meld(kapot, 'kapotte link(s)', 'error', annotaties);
  meld(waarschuwingen, 'ontbrekend(e) anker(s)', 'warning', annotaties);
  console.log(
    `\nBuilds: ${[...builds.keys()].sort().join(', ')}. ` +
      `${gecontroleerd} links gecontroleerd, ${overgeslagen} overgeslagen (doelsite niet gebouwd), ` +
      `${kapot.length} kapot, ${waarschuwingen.length} waarschuwing(en).`,
  );
  process.exit(kapot.length > 0 ? 1 : 0);
}

function meld(lijst, wat, niveau, annotaties) {
  const perSite = new Map();
  for (const k of lijst) {
    if (!perSite.has(k.site)) perSite.set(k.site, []);
    perSite.get(k.site).push(k);
  }
  for (const [site, links] of perSite) {
    console.log(`\n${site}: ${links.length} ${wat}`);
    for (const k of links) {
      const reden = k.reden
        ? ` (${k.reden}${k.reden === 'oud domein' ? '; gebruik een site:-link' : ''})`
        : '';
      console.log(`  ${k.bron} -> ${k.href}${reden}`);
      if (annotaties)
        console.log(
          `::${niveau} title=link naar ${k.doelSite}::${site}/${k.bron} -> ${k.href}${reden}`,
        );
    }
  }
}
