/**
 * Controleert elke link tussen twee cursussites tegen de gebouwde sites.
 *
 *     node scripts/controleer-cross-links.mjs               sites/<site>/build
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
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { SITES, HOME } = createRequire(import.meta.url)('../packages/shared/sites.js');

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** host -> site-id, uit de registry (cursussen plus de apex-homepage). */
export const HOST_NAAR_SITE = new Map([...SITES, HOME].map((s) => [new URL(s.url).host, s.id]));

/** @param {string} host */
export function siteVanHost(host) {
  return HOST_NAAR_SITE.get(host) ?? null;
}

/**
 * Alle absolute hrefs naar een registry-domein in één HTML-bestand.
 * @param {string} html
 * @returns {{ href: string, site: string, pad: string }[]}
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
    const site = siteVanHost(url.host);
    if (!site) continue;
    uit.push({ href: m[1], site, pad: url.pathname });
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
 * Vindt de builds in een map. Twee indelingen: `sites/<site>/build` (lokaal)
 * en `<site>-static/` (de artifacts uit CI, één map per artifact).
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

const isHoofdscript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

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
      console.log(`  ${k.bron} -> ${k.href}`);
      if (annotaties)
        console.log(
          `::error title=cross-site link naar ${k.doelSite}::${site}/${k.bron} -> ${k.href}`,
        );
    }
  }
  console.log(
    `\nBuilds: ${[...builds.keys()].sort().join(', ')}. ` +
      `${gecontroleerd} links gecontroleerd, ${overgeslagen} overgeslagen (doelsite niet gebouwd), ${kapot.length} kapot.`,
  );
  process.exit(kapot.length > 0 ? 1 : 0);
}
