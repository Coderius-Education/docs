/**
 * Een inhoudshash van alles waar de build van één site van afhangt: de map
 * van de site, de workspace-packages waar hij (transitief) van afhangt, en de
 * lockfile en root-config. Gelijke hash, gelijke build; CI gebruikt hem als
 * cache-sleutel voor de gebouwde site (`site-<os>-<id>-<hash>`), zodat
 * cross-links een site die niet veranderde uit de cache kan halen.
 *
 *     node scripts/site-hash.mjs python             de hash
 *     node scripts/site-hash.mjs python --lijst     de mappen en bestanden erin
 *     node scripts/site-hash.mjs python --omgeving  de hash van de bouwomgeving
 *     node scripts/site-hash.mjs python --sleutels  allebei, als regels voor
 *                                                   $GITHUB_OUTPUT
 *
 * De bouwomgeving is de sleutel van de webpack-cache van Docusaurus in CI.
 * Webpack controleert zelf de inhoud van elke module die hij bundelt (een
 * les, een component, een afbeelding, data), maar niet de code die vertaalt:
 * remark-plugins, loaders, de config, babel. Nagemeten: een gewijzigde
 * remark-plugin gaf met de cache 0 van de 248 pagina's met de nieuwe link,
 * zonder cache alle 248. De bouwomgeving telt daarom alleen code die Node
 * zelf laadt tijdens de build: .js, .mjs, .cjs en .ts, niet .tsx, en niet
 * in static/ (die gaat ongewijzigd mee) of in een test. Plus de lockfile en
 * de root-config. Een les, component, stijl of _category_.json verandert
 * de sleutel dus niet; een plugin, config of de registry wel.
 *
 * Deterministisch: de getrackte bestanden komen uit de git-index (pad, modus
 * en blob-hash, gesorteerd), dus de volgorde van de schijf doet er niet toe.
 * Bestanden die in de werkmap afwijken of nog niet getrackt zijn, telt hij op
 * hun inhoud mee; zo klopt de hash ook lokaal met wijzigingen die nog niet
 * gecommit zijn. Wat .gitignore uitsluit (build/, node_modules/) telt niet.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { siteDir } = require('../packages/shared/sites.js');
const { workspaceAfhankelijkheden } = require('../packages/shared/wijzigingen.js');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const posix = (p) => p.split('\\').join('/');

// Buiten de packages, maar wel invoer van elke build.
const ROOT_BESTANDEN = [
  'pnpm-lock.yaml',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  // Welke browsers babel bedient, en de pnpm-instellingen: raken elke build.
  '.browserslistrc',
  '.npmrc',
  '.nvmrc',
];

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
}

let workspaceCache = null;

/** { dir: { naam, deps } } voor elk workspace-package (één keer per proces). */
function workspace() {
  if (workspaceCache) return workspaceCache;
  const uit = execFileSync('pnpm', ['-r', 'ls', '--depth', '-1', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  const pakketten = {};
  for (const p of JSON.parse(uit)) {
    const dir = posix(relative(ROOT, p.path));
    if (!dir) continue;
    const pkg = JSON.parse(readFileSync(join(p.path, 'package.json'), 'utf8'));
    const deps = Object.entries({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    })
      .filter(([, versie]) => String(versie).startsWith('workspace:'))
      .map(([naam]) => naam);
    pakketten[dir] = { naam: pkg.name, deps };
  }
  workspaceCache = pakketten;
  return pakketten;
}

// Code die Node laadt tijdens de build, en dus niet door webpack op inhoud
// wordt gecontroleerd. Zie de bouwomgeving bovenaan.
const CODE = /\.(c|m)?js$|\.ts$/;
const GEEN_BUILD = /(^|\/)(static|__fixtures__|docs-tests)\/|\.test\.(c|m)?[jt]s$/;

/** Telt dit bestand mee in de bouwomgeving? */
export function inBouwomgeving(pad) {
  if (ROOT_BESTANDEN.includes(pad)) return true;
  return CODE.test(pad) && !GEEN_BUILD.test(pad);
}

function hashVan(paden, telt) {
  const hash = createHash('sha256');
  // Pad, modus en blob-hash van elk getrackt bestand.
  const regels = git('ls-files', '-s', '-z', '--', ...paden)
    .split('\0')
    .filter((regel) => regel && telt(regel.slice(regel.indexOf('\t') + 1)));
  hash.update(regels.map((regel) => `${regel}\0`).join(''));
  // Afwijkend in de werkmap (gewijzigd of nieuw): op inhoud.
  const afwijkend = new Set(
    [
      ...git('ls-files', '-m', '-z', '--', ...paden).split('\0'),
      ...git('ls-files', '-o', '--exclude-standard', '-z', '--', ...paden).split('\0'),
    ].filter((pad) => pad && telt(pad)),
  );
  for (const pad of [...afwijkend].sort()) {
    hash.update(`\0${pad}\0`);
    if (existsSync(join(ROOT, pad))) hash.update(readFileSync(join(ROOT, pad)));
    else hash.update('\0weg\0');
  }
  return { hash: hash.digest('hex').slice(0, 32), aantal: regels.length };
}

/**
 * De hash van alles waar de build van de site van afhangt, of met
 * `omgeving` alleen van de bouwomgeving.
 */
export function siteHash(id, { omgeving = false } = {}) {
  const mappen = workspaceAfhankelijkheden(workspace(), siteDir(id));
  const paden = [...mappen, ...ROOT_BESTANDEN];
  return { ...hashVan(paden, omgeving ? inBouwomgeving : () => true), mappen };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = process.argv[2];
  const vlag = (naam) => process.argv.includes(naam);
  if (!id || id.startsWith('--')) {
    console.error(
      'gebruik: node scripts/site-hash.mjs <site-id> [--omgeving] [--lijst] [--sleutels]',
    );
    process.exit(2);
  }
  if (vlag('--sleutels')) {
    console.log(`sitehash=${siteHash(id).hash}`);
    console.log(`omgevinghash=${siteHash(id, { omgeving: true }).hash}`);
  } else {
    const { hash, mappen, aantal } = siteHash(id, { omgeving: vlag('--omgeving') });
    if (vlag('--lijst')) {
      console.log([...mappen, ...ROOT_BESTANDEN].join('\n'));
      console.log(
        vlag('--omgeving')
          ? `${aantal} getrackte bestanden in de bouwomgeving (code die Node laadt, zie bovenaan)`
          : `${aantal} getrackte bestanden`,
      );
    }
    console.log(hash);
  }
}
