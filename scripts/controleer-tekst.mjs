/**
 * Draait de schrijfgids-regels over alle lestekst.
 *
 * Aanroep vanuit de repo-root:
 *
 *     node scripts/controleer-tekst.mjs            alle sites
 *     node scripts/controleer-tekst.mjs play       alleen die site
 *     node scripts/controleer-tekst.mjs --streng   fouten laten falen
 *
 * In GitHub Actions schrijft hij zijn meldingen als annotaties, zodat ze in de
 * diff van de pull request op de juiste regel staan in plaats van onderin een
 * joblog. Daarnaast komt er een tabel per site in de job-samenvatting.
 *
 * Standaard is de afsluitcode 0, ook bij meldingen: de uit losse repo's
 * gemigreerde sites hebben nog een achterstand, en blokkeren zou betekenen dat
 * niemand nog iets kan mergen. Met --streng tellen fouten wél mee.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { controleer } = require('../packages/shared/stijl.js');
const { alleSiteMappen } = require('../packages/shared/sites.js');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  'static',
  '__fixtures__',
  'extracted',
]);

const argumenten = process.argv.slice(2);
const streng = argumenten.includes('--streng');
const alleenSite = argumenten.find((a) => !a.startsWith('--'));

/** Elke .md/.mdx onder docs/ en src/pages/ van elke site. */
function lesbestanden(map) {
  const uit = [];
  for (const naam of readdirSync(map)) {
    if (OVERSLAAN.has(naam)) continue;
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) uit.push(...lesbestanden(pad));
    else if (/\.mdx?$/.test(naam)) uit.push(pad);
  }
  return uit;
}

// Uit de registry: elke site staat in sites/<vak>/<id> (de homepage in
// sites/home, zonder docs/ of src/pages/, dus die levert niets op).
function sites() {
  return alleSiteMappen()
    .filter(({ id }) => !alleenSite || id === alleenSite)
    .sort((a, b) => a.id.localeCompare(b.id));
}

const inActions = process.env.GITHUB_ACTIONS === 'true';
const perSite = new Map();
let fouten = 0;
let waarschuwingen = 0;

for (const { id: site, dir } of sites()) {
  const wortels = [join(ROOT, dir, 'docs'), join(ROOT, dir, 'src', 'pages')];
  const telling = { fout: 0, waarschuwing: 0, bestanden: 0 };

  for (const wortel of wortels) {
    let bestanden = [];
    try {
      bestanden = lesbestanden(wortel);
    } catch {
      continue; // die map heeft deze site niet
    }

    for (const pad of bestanden) {
      const relatief = relative(ROOT, pad).split('\\').join('/');
      const meldingen = controleer(readFileSync(pad, 'utf8'), { bestand: relatief });
      if (!meldingen.length) continue;
      telling.bestanden += 1;

      for (const m of meldingen) {
        telling[m.niveau] += 1;
        if (m.niveau === 'fout') fouten += 1;
        else waarschuwingen += 1;

        if (inActions) {
          const soort = m.niveau === 'fout' ? 'error' : 'warning';
          console.log(`::${soort} file=${relatief},line=${m.regel},title=${m.naam}::${m.bericht}`);
        } else {
          console.log(
            `${relatief}:${m.regel}  ${m.niveau.padEnd(13)} ${m.naam.padEnd(20)} ${m.bericht}`,
          );
        }
      }
    }
  }

  if (telling.fout || telling.waarschuwing) perSite.set(site, telling);
}

const regels = [...perSite.entries()]
  .sort((a, b) => b[1].fout + b[1].waarschuwing - (a[1].fout + a[1].waarschuwing))
  .map(([site, t]) => `| ${site} | ${t.fout} | ${t.waarschuwing} | ${t.bestanden} |`);

const samenvatting = [
  '## Stijl',
  '',
  '| Site | Fouten | Waarschuwingen | Bestanden |',
  '| --- | ---: | ---: | ---: |',
  ...regels,
  '',
  `Totaal: ${fouten} fouten en ${waarschuwingen} waarschuwingen.`,
  '',
  'De regels staan in `org-handbook/WRITING_STYLE_GUIDE.md`. Klopt een melding niet,',
  'markeer de uitzondering dan in de bron met een reden — zie §17.',
  '',
].join('\n');

console.log(`\n${samenvatting}`);

if (inActions && process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, samenvatting);
}

process.exit(streng && fouten > 0 ? 1 : 0);
