// Kopieert de Pyodide-distributie uit node_modules/pyodide/ naar static/pyodide/
// zodat de site Pyodide zelf serveert (geen CDN).
//
// Gebruik: `npm run copy:pyodide`
// Daarna: commit de gewijzigde bestanden in static/pyodide/.

import { cpSync, existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const src = join(projectRoot, 'node_modules', 'pyodide');
const dest = join(projectRoot, 'static', 'pyodide');

if (!existsSync(src)) {
  console.error(`Bron niet gevonden: ${src}`);
  console.error('Heb je `npm install` gedraaid?');
  process.exit(1);
}

// Schoonmaken om verweesde bestanden van vorige versie te verwijderen
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
