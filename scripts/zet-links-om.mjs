/**
 * Zet links naar pagina's in lestekst om naar [tekst](site:<cursus>/<pad>#anker)
 * (stijlgids §12): <SiteLink>, .md-bestandslinks, en absolute of relatieve
 * paden binnen de cursus. Afbeeldingen, downloads en ankers op dezelfde pagina
 * blijven zoals ze zijn.
 *
 *     pnpm build                                   eerst: routes en ankers komen uit de build
 *     node scripts/zet-links-om.mjs                droog: alleen het rapport
 *     node scripts/zet-links-om.mjs --schrijf      past de bestanden aan
 *     node scripts/zet-links-om.mjs --site python  één cursus
 *     node scripts/zet-links-om.mjs --rapport r.json --streng
 *
 * Routes komen niet uit een eigen nabouw van de routing van Docusaurus, maar
 * uit zijn eigen metadata (.docusaurus/…/site-*.json: bron -> permalink), en
 * elk doel wordt gecontroleerd tegen build/. Een relatieve link lost de browser
 * op tegen de URL van de pagina (zonder slash erachter); waar dat met slash een
 * andere pagina oplevert, staat hij in het rapport. Daarna moet een tweede run
 * niets meer vinden, en moet link-momentopname.mjs op de reparaties na gelijk
 * blijven.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ankersVan, doelBestand, doelVan } from './controleer-cross-links.mjs';
import { CONTENTMAPPEN, linksInBron } from './links-in-bron.mjs';

const require = createRequire(import.meta.url);
const {
  SITES,
  DOCENTEN_SITES,
  SITES_BY_ID,
  siteDir,
  routeUrl,
} = require('../packages/shared/sites.js');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ASSET = /\.(?!mdx?$)[a-z0-9]{1,5}$/i;

/** '/docs/x/' -> '/docs/x'; de root blijft '/'. */
export function schoneRoute(route) {
  const zonder = route.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  return zonder === '' ? '/' : zonder;
}

/**
 * Bron (absoluut pad) -> route zoals de permalink hem geeft, dus mét de slash
 * erachter bij een categorie-index: daartegen lost de browser relatieve links op.
 */
export function routesUitMetadata(siteMap, baseUrl) {
  const routes = new Map();
  const meta = join(siteMap, '.docusaurus');
  if (!existsSync(meta)) return routes;
  for (const plugin of readdirSync(meta)) {
    if (!/^docusaurus-plugin-content-(docs|pages|blog)$/.test(plugin)) continue;
    for (const instantie of readdirSync(join(meta, plugin))) {
      const map = join(meta, plugin, instantie);
      if (!statSync(map).isDirectory()) continue;
      for (const naam of readdirSync(map)) {
        if (!naam.startsWith('site-') || !naam.endsWith('.json')) continue;
        let data;
        try {
          data = JSON.parse(readFileSync(join(map, naam), 'utf8'));
        } catch {
          continue;
        }
        if (typeof data.source !== 'string' || typeof data.permalink !== 'string') continue;
        const bron = join(siteMap, data.source.replace(/^@site\//, ''));
        const route = data.permalink.startsWith(baseUrl)
          ? `/${data.permalink.slice(baseUrl.length)}`
          : data.permalink;
        routes.set(bron, route);
      }
    }
  }
  return routes;
}

function mdBestanden(map) {
  if (!existsSync(map)) return [];
  const uit = [];
  for (const naam of readdirSync(map)) {
    if (naam === 'node_modules' || naam.startsWith('.')) continue;
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) uit.push(...mdBestanden(pad));
    else if (/\.mdx?$/.test(naam)) uit.push(pad);
  }
  return uit;
}

/**
 * Volgt doorstuurpagina's (omleidingen) naar de route waar de les nu staat.
 * @returns {{ site: string, route: string } | null}
 */
function volgDoorsturen(builds, site, route) {
  let huidig = { site, route };
  for (let stap = 0; stap < 4; stap++) {
    const build = builds.get(huidig.site);
    const bestand = build && doelBestand(build, huidig.route);
    if (!bestand) return null;
    if (!bestand.endsWith('.html')) return huidig;
    const html = readFileSync(bestand, 'utf8');
    const m = /<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i.exec(html);
    if (!m) return huidig;
    const basis = new URL(routeUrl(huidig.site, huidig.route));
    const doel = doelVan(new URL(m[1].replace(/&amp;/g, '&'), basis));
    if (!doel) return null;
    huidig = { site: doel.site, route: schoneRoute(doel.pad) };
  }
  return null;
}

/**
 * Wat moet er met deze URL gebeuren?
 * @returns {{ actie: 'laat' } | { actie: 'zet', site: string, route: string, anker?: string, notitie?: string } | { actie: 'handmatig', reden: string }}
 */
export function beoordeel(url, ctx) {
  const { site, siteMap, bestand, route: paginaRoute, routes, builds, baseUrl } = ctx;
  if (!url || url.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//'))
    return { actie: 'laat' };
  if (url.includes('?')) return { actie: 'handmatig', reden: 'querystring' };
  const hekje = url.indexOf('#');
  const pad = hekje < 0 ? url : url.slice(0, hekje);
  const anker = hekje < 0 ? undefined : url.slice(hekje + 1) || undefined;
  if (pad.startsWith('@site/static') || pad.startsWith('/img/') || pad.startsWith('/static/'))
    return { actie: 'laat' };

  let doel;
  let notitie;
  if (/\.mdx?$/i.test(pad)) {
    const kandidaten = pad.startsWith('@site/')
      ? [join(siteMap, pad.slice('@site/'.length))]
      : pad.startsWith('/')
        ? [...CONTENTMAPPEN.map((m) => join(siteMap, m, pad)), join(siteMap, pad)]
        : [resolve(dirname(bestand), decodeURIComponent(pad))];
    const gevonden = kandidaten.find((k) => routes.has(k));
    if (!gevonden) return { actie: 'handmatig', reden: `bestand zonder route: ${pad}` };
    doel = { site, route: schoneRoute(routes.get(gevonden)) };
  } else if (ASSET.test(pad.split('/').pop() ?? '')) {
    return { actie: 'laat' };
  } else if (pad.startsWith('/')) {
    const eigenPrefix = baseUrl.slice(0, -1);
    const route = pad.startsWith(`${eigenPrefix}/`) ? pad.slice(eigenPrefix.length) : pad;
    doel = { site, route: schoneRoute(decodeURI(route)) };
  } else {
    if (!paginaRoute)
      return { actie: 'handmatig', reden: 'relatieve link in een bestand zonder eigen pagina' };
    const basis = `https://x${baseUrl.slice(0, -1)}`;
    // De browser lost op tegen de permalink; met een slash erachter (zoals de
    // cross-links-job de pagina ziet) kan het een andere pagina zijn.
    const zonder = new URL(pad, `${basis}${paginaRoute}`).pathname;
    const met = new URL(
      pad,
      `${basis}${paginaRoute.endsWith('/') ? paginaRoute : `${paginaRoute}/`}`,
    ).pathname;
    const naarRoute = (p) => schoneRoute(decodeURI(p.slice(baseUrl.length - 1)));
    const a = naarRoute(zonder);
    const b = naarRoute(met);
    const build = builds.get(site);
    const bestaatA = build && doelBestand(build, a);
    const bestaatB = build && doelBestand(build, b);
    if (bestaatA) {
      doel = { site, route: a };
      if (a !== b && bestaatB) notitie = `dubbelzinnig: met slash zou het ${b} zijn`;
    } else if (bestaatB) {
      doel = { site, route: b };
      if (a !== b) notitie = `gerepareerd: werkte alleen met slash erachter (anders ${a})`;
    } else return { actie: 'handmatig', reden: `relatief pad bestaat niet: ${pad}` };
  }
  return controleerDoel(doel, anker, notitie, builds);
}

function controleerDoel(gevraagd, anker, eerdereNotitie, builds) {
  let doel = gevraagd;
  let notitie = eerdereNotitie;
  if (!SITES_BY_ID[doel.site])
    return { actie: 'handmatig', reden: `onbekende cursus ${doel.site}` };
  const build = builds.get(doel.site);
  if (!build) return { actie: 'handmatig', reden: `geen build van ${doel.site}` };
  if (!doelBestand(build, doel.route))
    return { actie: 'handmatig', reden: `pagina bestaat niet: ${doel.site}${doel.route}` };
  const eind = volgDoorsturen(builds, doel.site, doel.route);
  if (eind && (eind.site !== doel.site || eind.route !== doel.route)) {
    notitie = [notitie, `doorgestuurd: ${doel.site}${doel.route} -> ${eind.site}${eind.route}`]
      .filter(Boolean)
      .join('; ');
    doel = eind;
  }
  if (anker) {
    const bestand = doelBestand(builds.get(doel.site), doel.route);
    let schoon = anker;
    try {
      schoon = decodeURIComponent(anker);
    } catch {}
    if (bestand?.endsWith('.html') && !ankersVan(bestand).has(schoon))
      notitie = [notitie, `anker #${anker} bestaat niet`].filter(Boolean).join('; ');
  }
  return { actie: 'zet', ...doel, ...(anker ? { anker } : {}), ...(notitie ? { notitie } : {}) };
}

// Routes zijn hier gedecodeerd; in een markdown-link mag geen spatie staan.
const siteUrl = ({ site, route, anker }) =>
  `site:${site}${encodeURI(route)}${anker ? `#${anker}` : ''}`;

/** Ruwe tekst van de kinderen van een <SiteLink>, of null als dat geen gewone tekst is. */
function linktekst(bron, node) {
  let kinderen = node.children || [];
  if (kinderen.length === 1 && kinderen[0].type === 'paragraph') kinderen = kinderen[0].children;
  if (!kinderen.length) return null;
  if (kinderen.some((k) => k.type.startsWith('mdx') || !k.position)) return null;
  const tekst = bron
    .slice(kinderen[0].position.start.offset, kinderen[kinderen.length - 1].position.end.offset)
    .trim();
  if (/\n\s*\n/.test(tekst)) return null;
  const open = (tekst.match(/(?<!\\)\[/g) ?? []).length;
  const dicht = (tekst.match(/(?<!\\)\]/g) ?? []).length;
  return open === dicht ? tekst : null;
}

/**
 * Wijzigingen voor één bestand.
 * @returns {{ edits: {from: number, to: number, text: string}[], meldingen: object[] }}
 */
export function wijzigingenVoor(bron, ctx) {
  const { links, fout } = linksInBron(bron);
  const meldingen = [];
  if (fout) return { edits: [], meldingen: [{ soort: 'parsefout', reden: fout }] };
  const edits = [];
  for (const link of links) {
    const plek = { regel: link.regel, url: link.url };
    if (link.soort === 'sitelink') {
      const tekst = linktekst(bron, link.node);
      const site = link.site ?? ctx.site;
      if (tekst === null || !link.url.startsWith('/')) {
        meldingen.push({
          ...plek,
          soort: 'sitelink',
          reden: 'handmatig: geen gewone linktekst of geen pad',
        });
        continue;
      }
      const hekje = link.url.indexOf('#');
      const pad = hekje < 0 ? link.url : link.url.slice(0, hekje);
      const anker = hekje < 0 ? undefined : link.url.slice(hekje + 1) || undefined;
      const oordeel = controleerDoel(
        { site, route: schoneRoute(pad) },
        anker,
        undefined,
        ctx.builds,
      );
      if (oordeel.actie !== 'zet') {
        meldingen.push({ ...plek, soort: 'sitelink', reden: oordeel.reden });
        continue;
      }
      edits.push({ from: link.start, to: link.end, text: `[${tekst}](${siteUrl(oordeel)})` });
      meldingen.push({
        ...plek,
        soort: 'sitelink',
        naar: siteUrl(oordeel),
        notitie: oordeel.notitie,
      });
      continue;
    }
    const oordeel = beoordeel(link.url, ctx);
    if (oordeel.actie === 'laat') continue;
    if (oordeel.actie === 'handmatig' || link.urlStart === undefined) {
      meldingen.push({
        ...plek,
        soort: link.soort,
        reden: oordeel.reden ?? 'URL niet te vinden in de bron',
      });
      continue;
    }
    edits.push({ from: link.urlStart, to: link.urlEnd, text: siteUrl(oordeel) });
    meldingen.push({
      ...plek,
      soort: link.soort,
      naar: siteUrl(oordeel),
      notitie: oordeel.notitie,
    });
  }
  return { edits, meldingen };
}

export function pasToe(bron, edits) {
  let uit = bron;
  for (const e of [...edits].sort((a, b) => b.from - a.from))
    uit = uit.slice(0, e.from) + e.text + uit.slice(e.to);
  return uit;
}

/** Haalt `import SiteLink from …` weg als SiteLink niet meer gebruikt wordt. */
export function zonderSiteLinkImport(bron) {
  if (/<SiteLink\b/.test(bron)) return bron;
  return bron.replace(/^import\s+SiteLink\s+from\s+['"][^'"]+['"];?\s*\n/m, '');
}

function main() {
  const args = process.argv.slice(2);
  const schrijf = args.includes('--schrijf');
  const streng = args.includes('--streng');
  const alleenSite = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
  const rapportPad = args.includes('--rapport') ? args[args.indexOf('--rapport') + 1] : null;

  const builds = new Map();
  for (const s of [...SITES, ...DOCENTEN_SITES]) {
    const b = join(ROOT, siteDir(s.id), 'build');
    if (existsSync(join(b, 'index.html'))) builds.set(s.id, b);
  }
  const homeBuild = join(ROOT, 'sites/home/build');
  if (existsSync(homeBuild)) builds.set('home', homeBuild);

  const rapport = {};
  let omgezet = 0;
  let handmatig = 0;
  let bestandenGewijzigd = 0;
  for (const s of [...SITES, ...DOCENTEN_SITES]) {
    if (alleenSite && s.id !== alleenSite) continue;
    const siteMap = join(ROOT, siteDir(s.id));
    const baseUrl = `/${s.path}/`;
    const routes = routesUitMetadata(siteMap, baseUrl);
    if (!routes.size) {
      console.error(`${s.id}: geen .docusaurus-metadata; bouw de site eerst.`);
      process.exitCode = 1;
      continue;
    }
    const perSite = { omgezet: 0, handmatig: [], notities: [] };
    for (const bestand of CONTENTMAPPEN.flatMap((m) => mdBestanden(join(siteMap, m)))) {
      const bron = readFileSync(bestand, 'utf8');
      const ctx = {
        site: s.id,
        siteMap,
        bestand,
        route: routes.get(bestand),
        routes,
        builds,
        baseUrl,
      };
      const { edits, meldingen } = wijzigingenVoor(bron, ctx);
      const rel = relative(ROOT, bestand);
      for (const m of meldingen) {
        if (m.naar) {
          perSite.omgezet += 1;
          if (m.notitie) perSite.notities.push({ bestand: rel, ...m });
        } else perSite.handmatig.push({ bestand: rel, ...m });
      }
      if (!edits.length) continue;
      const nieuw = zonderSiteLinkImport(pasToe(bron, edits));
      if (nieuw !== bron) {
        bestandenGewijzigd += 1;
        if (schrijf) writeFileSync(bestand, nieuw);
      }
    }
    omgezet += perSite.omgezet;
    handmatig += perSite.handmatig.length;
    rapport[s.id] = perSite;
    console.log(
      `${s.id}: ${perSite.omgezet} omgezet, ${perSite.notities.length} met notitie, ${perSite.handmatig.length} handmatig`,
    );
    for (const m of perSite.handmatig)
      console.log(`  HANDMATIG ${m.bestand}:${m.regel} ${m.url} — ${m.reden}`);
    for (const m of perSite.notities)
      console.log(`  NOTITIE   ${m.bestand}:${m.regel} ${m.url} -> ${m.naar} — ${m.notitie}`);
  }
  console.log(
    `\n${omgezet} links ${schrijf ? 'omgezet' : 'om te zetten'} in ${bestandenGewijzigd} bestanden; ${handmatig} handmatig.`,
  );
  if (rapportPad) writeFileSync(rapportPad, `${JSON.stringify(rapport, null, 1)}\n`);
  if (streng && handmatig) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
