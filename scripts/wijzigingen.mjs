/**
 * De plan-job van CI: wat raakt deze wijziging, en wat hoeft dus te draaien?
 * De beslissingen zelf staan in packages/shared/wijzigingen.js (getest); dit
 * script haalt alleen de invoer op bij git en pnpm, en geeft de uitkomst door.
 *
 *     node scripts/wijzigingen.mjs plan --base <sha> [--uit changed.json]
 *     node scripts/wijzigingen.mjs plan --volledig [--reden nightly]
 *
 * `plan` vergelijkt de werkmap met de merge-base van <sha> en HEAD
 * (`git diff -U0`), en vraagt pnpm welke packages geraakt zijn
 * (`--filter "...[<base>]"`: gewijzigd, plus alles wat ervan afhangt). Zonder
 * bruikbare base (eerste push, base = 000…, base niet in de geschiedenis)
 * draait alles. In GitHub Actions schrijft hij ook de job-outputs en een
 * samenvatting.
 *
 * Hulpcommando's voor de jobs, elk met het pad van changed.json:
 *
 *     vitest <changed.json>     argumenten voor vitest
 *     typecheck <changed.json>  --filter-argumenten voor pnpm (leeg: niets)
 *     cspell <changed.json>     de lespagina's om te spellen, één per regel
 *     filter <changed.json>     stdin `pad:regel:kolom - …` → alleen regels
 *                               die op een gewijzigde regel vallen
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { plan, parseDiff, binnenWijziging } = require('../packages/shared/wijzigingen.js');
const { alleSiteMappen } = require('../packages/shared/sites.js');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const posix = (p) => p.split('\\').join('/');

function git(...args) {
  // stderr opvangen: een base die niet bestaat is een verwachte uitkomst
  // (dan draait alles), geen "fatal:" in het log.
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function pnpmMappen(...filter) {
  const uit = execFileSync('pnpm', [...filter, 'ls', '--depth', '-1', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  return JSON.parse(uit || '[]')
    .map((p) => posix(relative(ROOT, p.path)))
    .filter((d) => d !== '');
}

const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', '__fixtures__', '.svelte-kit']);

function testBestanden(map) {
  const uit = [];
  let items = [];
  try {
    items = readdirSync(map, { withFileTypes: true });
  } catch {
    return uit;
  }
  for (const item of items) {
    if (OVERSLAAN.has(item.name)) continue;
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...testBestanden(pad));
    else if (item.name.endsWith('.test.ts')) uit.push(pad);
  }
  return uit;
}

/** De base om tegen te vergelijken, of een reden om alles te draaien. */
function kiesBase(base) {
  if (!base || /^0+$/.test(base)) return { reden: 'geen base (eerste push of handmatig)' };
  try {
    git('cat-file', '-e', `${base}^{commit}`);
  } catch {
    return { reden: `base ${base.slice(0, 12)} staat niet in de geschiedenis` };
  }
  try {
    return { base: git('merge-base', base, 'HEAD').trim() };
  } catch {
    return { reden: `geen merge-base met ${base.slice(0, 12)}` };
  }
}

function maakPlan(opties) {
  const sites = alleSiteMappen();
  const alleMappen = pnpmMappen('-r');
  const tests = [...testBestanden(join(ROOT, 'packages')), ...testBestanden(join(ROOT, 'sites'))]
    .map((pad) => ({ pad: posix(relative(ROOT, pad)), tekst: readFileSync(pad, 'utf8') }))
    .sort((a, b) => a.pad.localeCompare(b.pad));

  let volledig = opties.volledig;
  let reden = opties.reden ?? '';
  let base = null;
  if (!volledig) {
    const keuze = kiesBase(opties.base);
    if (keuze.base) base = keuze.base;
    else {
      volledig = true;
      reden = keuze.reden;
    }
  }

  let bestanden = {};
  let geraakt = [];
  if (base) {
    bestanden = parseDiff(git('diff', '-U0', '--no-color', '--no-renames', '--no-ext-diff', base));
    geraakt = pnpmMappen('--filter', `...[${base}]`);
  }
  return plan({ bestanden, geraakt, alleMappen, sites, tests, volledig, reden, base });
}

function outputs(p) {
  const regels = {
    volledig: p.volledig,
    sites: JSON.stringify(p.sites),
    ongewijzigd: JSON.stringify(p.ongewijzigd),
    build: p.sites.length > 0,
    ...p.jobs,
    typecheck: p.pakketten.length > 0,
    ...Object.fromEntries(Object.entries(p.runners).map(([n, r]) => [n, r.draaien])),
  };
  return Object.entries(regels).map(([k, v]) => `${k}=${v}`);
}

function samenvatting(p) {
  const ja = (b) => (b ? 'ja' : '—');
  const runners = Object.entries(p.runners)
    .map(
      ([n, r]) => `| ${n} | ${ja(r.draaien)} | ${r.alles ? 'alle blokken' : 'geraakte blokken'} |`,
    )
    .join('\n');
  return [
    '## Plan',
    '',
    p.volledig
      ? `Volledige run: ${p.reden}.`
      : `Vergeleken met \`${p.base?.slice(0, 12)}\`: ${Object.keys(p.bestanden).length} bestanden gewijzigd.`,
    '',
    `Te bouwen: ${p.sites.length ? p.sites.join(', ') : 'geen'}. Uit de cache voor cross-links: ${
      p.ongewijzigd.length ? p.ongewijzigd.join(', ') : 'geen'
    }.`,
    '',
    `Tests: ${p.vitest.alles ? 'alle' : `${p.vitest.bestanden.length} bestanden (vitest related)`}. Tekst: ${
      p.tekst.alles ? 'alle lespagina’s' : `${p.tekst.bestanden.length} lespagina’s`
    }.`,
    '',
    '| Runner | Draait | Wat |',
    '| --- | --- | --- |',
    runners,
    '',
  ].join('\n');
}

function lees(pad) {
  return JSON.parse(readFileSync(pad, 'utf8'));
}

const [opdracht, ...rest] = process.argv.slice(2);
const optie = (naam) => {
  const i = rest.indexOf(naam);
  return i === -1 ? undefined : rest[i + 1];
};

switch (opdracht) {
  case 'plan': {
    const p = maakPlan({
      base: optie('--base'),
      volledig: rest.includes('--volledig'),
      reden: optie('--reden'),
    });
    const uit = optie('--uit') ?? 'changed.json';
    writeFileSync(uit, `${JSON.stringify(p, null, 2)}\n`);
    const regels = outputs(p);
    console.log(regels.join('\n'));
    console.log(`\n${samenvatting(p)}`);
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `${regels.join('\n')}\n`);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, samenvatting(p));
    break;
  }
  case 'vitest': {
    const p = lees(rest[0]);
    if (p.volledig || p.vitest.alles) console.log('run');
    else console.log(['related', '--run', '--passWithNoTests', ...p.vitest.bestanden].join(' '));
    break;
  }
  case 'typecheck': {
    const p = lees(rest[0]);
    console.log(p.pakketten.map((d) => `--filter ./${d}`).join(' '));
    break;
  }
  case 'cspell': {
    const p = lees(rest[0]);
    console.log(p.tekst.bestanden.join('\n'));
    break;
  }
  case 'filter': {
    // cspell meldt "pad:regel:kolom - Unknown word (x)". Andere regels (de
    // samenvatting) gaan ongewijzigd door; afsluitcode 1 als er een melding
    // overblijft.
    const p = lees(rest[0]);
    let over = 0;
    for (const regel of readFileSync(0, 'utf8').split('\n')) {
      const m = regel.match(/^(.+?):(\d+):(\d+) - /);
      if (!m) continue;
      if (!binnenWijziging(p, posix(m[1]), Number(m[2]))) continue;
      console.log(regel);
      over += 1;
    }
    process.exit(over > 0 ? 1 : 0);
    break;
  }
  default:
    console.error('gebruik: node scripts/wijzigingen.mjs plan|vitest|typecheck|cspell|filter …');
    process.exit(2);
}
