// Start of preview alle sites tegelijk, elk op een eigen poort.
//
//   node scripts/run-all-sites.mjs serve [--build]   -> bouwt (optioneel) en
//                                                       serveert de statische
//                                                       build van elke site
//   node scripts/run-all-sites.mjs start             -> dev-server met
//                                                       hot reload per site
//
// Poorten lopen op vanaf BASE_PORT (3001, 3002, ...). De mapping site -> poort
// wordt bovenaan geprint. Ctrl-C stopt alle processen tegelijk.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { alleSiteMappen, SITES_BY_ID } = createRequire(import.meta.url)(
  '../packages/shared/sites.js',
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE_PORT = 3001;

const mode = process.argv[2];
const doBuild = process.argv.includes('--build');

if (mode !== 'serve' && mode !== 'start') {
  console.error('Gebruik: node scripts/run-all-sites.mjs <serve|start> [--build]');
  process.exit(1);
}

// Uit de registry (sites/<vak>/<id> en sites/home) — gesorteerd op id zodat
// poorten stabiel blijven.
const sites = alleSiteMappen().sort((a, b) => a.id.localeCompare(b.id));

// `serve` heeft een bestaande build nodig; bouw eerst als --build is gegeven.
if (mode === 'serve' && doBuild) {
  console.log('Bouwen van alle sites (pnpm build)...\n');
  const build = spawnSync('pnpm', ['build'], { cwd: ROOT, stdio: 'inherit', shell: true });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const children = [];

console.log('\nPreview-overzicht:');
sites.forEach(({ id: name, dir }, i) => {
  const port = BASE_PORT + i;

  if (mode === 'serve' && !fs.existsSync(path.join(ROOT, dir, 'build'))) {
    console.log(`  ${name.padEnd(12)} OVERGESLAGEN (geen build/ — draai met --build)`);
    return;
  }

  // Een cursus draait onder zijn pad (baseUrl), net als op de vak-host.
  const pad = SITES_BY_ID[name] ? `/${SITES_BY_ID[name].path}/` : '/';
  console.log(`  ${name.padEnd(12)} http://localhost:${port}${pad}`);

  const args =
    mode === 'serve'
      ? [
          '--filter',
          `./${dir}`,
          'exec',
          'docusaurus',
          'serve',
          '--port',
          String(port),
          '--dir',
          'build',
          '--no-open',
        ]
      : ['--filter', `./${dir}`, 'start', '--port', String(port), '--no-open'];

  const child = spawn('pnpm', args, { cwd: ROOT, stdio: 'inherit', shell: true });
  children.push(child);
});

console.log('\nCtrl-C stopt alle servers.\n');

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
