// Kopieert de Pyodide-distributie uit node_modules/pyodide/ naar static/pyodide/
// van de aanroepende site, zodat die Pyodide zelf serveert (geen CDN — werkt
// ook op schoolnetwerken die externe CDN's blokkeren).
//
// Gebruik vanuit een site: `"copy:pyodide": "node ../../packages/python-runner/scripts/copy-pyodide.mjs"`
// (de site heeft `pyodide` als devDependency). Daarna: commit static/pyodide/.

import { cpSync, existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const siteRoot = process.cwd();
const require = createRequire(join(siteRoot, 'package.json'));

let src;
try {
  src = dirname(require.resolve('pyodide/package.json'));
} catch {
  console.error(`Kan 'pyodide' niet vinden vanuit ${siteRoot}.`);
  console.error('Voeg pyodide toe als devDependency en draai `pnpm install`.');
  process.exit(1);
}

const dest = join(siteRoot, 'static', 'pyodide');

// Schoonmaken om verweesde bestanden van een vorige versie te verwijderen.
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true });

// Filter: irrelevante bestanden weggooien (niet nodig voor runtime).
const dropPatterns = [
  /\.d\.ts$/,
  /^package\.json$/,
  /^README/i,
  /^LICENSE/i,
  /^CHANGELOG/i,
  /^console.*\.html$/, // Pyodide REPL-demo, niet nodig
];

// Submappen die altijd weg moeten (geen runtime-functie).
const dropDirs = new Set(['node_modules']);

let dropped = 0;
for (const entry of readdirSync(dest)) {
  const full = join(dest, entry);
  const stats = statSync(full);

  if (stats.isDirectory() && dropDirs.has(entry)) {
    rmSync(full, { recursive: true, force: true });
    dropped++;
    continue;
  }

  if (stats.isFile() && dropPatterns.some((re) => re.test(entry))) {
    unlinkSync(full);
    dropped++;
  }
}

const remaining = readdirSync(dest);
console.log(`Pyodide gekopieerd naar ${dest}`);
console.log(`  ${remaining.length} bestanden over (${dropped} irrelevante verwijderd)`);
