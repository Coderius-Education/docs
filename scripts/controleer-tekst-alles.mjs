/**
 * `pnpm tekst` — spelling en stijl in één keer, zoals de schrijfgids §17 het
 * beschrijft. Handig vlak voor een commit; in CI draaien de twee stappen apart
 * zodat hun annotaties uit elkaar te houden zijn.
 *
 *     pnpm tekst          alles
 *     pnpm tekst play     alleen die site
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const site = process.argv.slice(2).find((a) => !a.startsWith('--'));

const patroon = site
  ? [`sites/${site}/docs/**/*.{md,mdx}`, `sites/${site}/src/pages/**/*.{md,mdx}`]
  : ['sites/*/docs/**/*.{md,mdx}', 'sites/*/src/pages/**/*.{md,mdx}'];

console.log('── Spelling ──────────────────────────────────────────────────');
const spel = spawnSync(
  'npx',
  ['cspell', 'lint', '--no-progress', '--relative', '--no-must-find-files', ...patroon],
  { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' },
);

console.log('\n── Stijl ─────────────────────────────────────────────────────');
const stijl = spawnSync('node', ['scripts/controleer-tekst.mjs', ...(site ? [site] : [])], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

// Beide stappen zijn rapporterend, niet blokkerend: pas als de achterstand weg
// is gaat --streng aan en telt de uitkomst mee.
process.exit(spel.status === null || stijl.status === null ? 1 : 0);
