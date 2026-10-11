/**
 * Momentopname van alle links in de gebouwde sites: per pagina de absolute
 * URL's van elke <a href> in <main>, genormaliseerd (slash vóór # en aan het
 * eind weg). Voor en na een grote linkwijziging (zie zet-links-om.mjs) moeten
 * twee momentopnamen gelijk zijn, op de gemelde reparaties na.
 *
 *     node scripts/link-momentopname.mjs [map met builds] > voor.json
 *     node scripts/link-momentopname.mjs --vergelijk voor.json na.json
 */

import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildsIn, htmlBestanden } from './controleer-cross-links.mjs';

const { SITES, DOCENTEN_SITES, HOME } = createRequire(import.meta.url)(
  '../packages/shared/sites.js',
);
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** @param {string} url */
export function normaliseer(url) {
  const [pad, ...anker] = url.split('#');
  const schoon = pad.replace(/\/+$/, '') || pad;
  return anker.length ? `${schoon}#${anker.join('#')}` : schoon;
}

/** @param {Map<string, string>} builds */
export function momentopname(builds) {
  const uit = {};
  for (const [site, buildMap] of [...builds].sort()) {
    const registry = [...SITES, ...DOCENTEN_SITES, HOME].find((s) => s.id === site);
    if (!registry) continue;
    for (const bestand of htmlBestanden(buildMap)) {
      const bronPad = relative(buildMap, bestand)
        .split('\\')
        .join('/')
        .replace(/(^|\/)index\.html$/, '$1');
      const paginaUrl = new URL(bronPad, registry.url).href;
      const html = readFileSync(bestand, 'utf8');
      const start = html.indexOf('<main');
      if (start < 0) continue;
      const main = html.slice(start, html.indexOf('</main>', start) + 1 || undefined);
      const links = [];
      for (const m of main.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
        const href = m[1].replace(/&amp;/g, '&');
        if (/^(?:mailto:|tel:|javascript:)/i.test(href)) continue;
        try {
          links.push(normaliseer(new URL(href, paginaUrl).href));
        } catch {
          links.push(`ongeldig:${href}`);
        }
      }
      if (links.length) uit[`${site}/${bronPad}`] = links.sort();
    }
  }
  return uit;
}

const isHoofdscript =
  process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (isHoofdscript) {
  const args = process.argv.slice(2);
  if (args[0] === '--vergelijk') {
    const voor = JSON.parse(readFileSync(args[1], 'utf8'));
    const na = JSON.parse(readFileSync(args[2], 'utf8'));
    let verschillen = 0;
    for (const pagina of new Set([...Object.keys(voor), ...Object.keys(na)])) {
      const a = voor[pagina] ?? [];
      const b = na[pagina] ?? [];
      const weg = a.filter((x) => !b.includes(x));
      const erbij = b.filter((x) => !a.includes(x));
      if (!weg.length && !erbij.length) continue;
      verschillen += 1;
      console.log(pagina);
      for (const x of weg) console.log(`  - ${x}`);
      for (const x of erbij) console.log(`  + ${x}`);
    }
    console.log(`${verschillen} pagina('s) met verschillen.`);
    process.exit(verschillen ? 1 : 0);
  }
  const map = args[0] ?? join(ROOT, 'sites');
  process.stdout.write(`${JSON.stringify(momentopname(buildsIn(map)), null, 1)}\n`);
}
