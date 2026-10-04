/**
 * Een inhoudshash van alles waar de build van één site van afhangt: de map
 * van de site, de workspace-packages waar hij (transitief) van afhangt, en de
 * lockfile en root-config. Gelijke hash, gelijke build; CI gebruikt hem als
 * cache-sleutel voor de gebouwde site (`site-<os>-<id>-<hash>`), zodat
 * cross-links een site die niet veranderde uit de cache kan halen.
 *
 *     node scripts/site-hash.mjs python          de hash
 *     node scripts/site-hash.mjs python --lijst  de mappen en bestanden erin
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
];

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
}

/** { dir: { naam, deps } } voor elk workspace-package. */
function workspace() {
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
  return pakketten;
}

export function siteHash(id) {
  const mappen = workspaceAfhankelijkheden(workspace(), siteDir(id));
  const paden = [...mappen, ...ROOT_BESTANDEN];
  const hash = createHash('sha256');
  // Pad, modus en blob-hash van elk getrackt bestand.
  const index = git('ls-files', '-s', '-z', '--', ...paden);
  hash.update(index);
  // Afwijkend in de werkmap (gewijzigd of nieuw): op inhoud.
  const afwijkend = new Set(
    [
      ...git('ls-files', '-m', '-z', '--', ...paden).split('\0'),
      ...git('ls-files', '-o', '--exclude-standard', '-z', '--', ...paden).split('\0'),
    ].filter(Boolean),
  );
  for (const pad of [...afwijkend].sort()) {
    hash.update(`\0${pad}\0`);
    if (existsSync(join(ROOT, pad))) hash.update(readFileSync(join(ROOT, pad)));
    else hash.update('\0weg\0');
  }
  return { hash: hash.digest('hex').slice(0, 32), mappen, aantal: index.split('\0').length - 1 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = process.argv[2];
  if (!id) {
    console.error('gebruik: node scripts/site-hash.mjs <site-id> [--lijst]');
    process.exit(2);
  }
  const { hash, mappen, aantal } = siteHash(id);
  if (process.argv.includes('--lijst')) {
    console.log([...mappen, ...ROOT_BESTANDEN].join('\n'));
    console.log(`${aantal} getrackte bestanden`);
  }
  console.log(hash);
}
