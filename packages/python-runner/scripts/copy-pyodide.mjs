// Kopieert de Pyodide-distributie uit node_modules/pyodide/ naar static/pyodide/
// van de aanroepende site, zodat die Pyodide zelf serveert (geen CDN — werkt
// ook op schoolnetwerken die externe CDN's blokkeren).
//
// Gebruik vanuit een site: `"copy:pyodide": "node ../../packages/python-runner/scripts/copy-pyodide.mjs"`
// (de site heeft `pyodide` als devDependency). Daarna: commit static/pyodide/.
//
// Die kopie is twaalf megabyte binair die daarna niemand meer inkijkt, en het
// script draait met de hand — dus hij kan achterblijven zonder dat iets het
// merkt. Dat is ook echt gebeurd: python-docs bleef op een 0.28.0.dev0-snapshot
// staan en algorithms op Python 3.12, terwijl de catalog al op 0.29 stond.
// `src/pyodide-kopie.test.ts` legt elke gecommitte kopie nu naast de
// geïnstalleerde pyodide. Ververs je er een, dan hoort die site van de
// uitzonderingslijst in die test af — de test dwingt dat zelf af.
//
// Let op: de npm-package van Pyodide bevat alléén de runtime, geen enkele wheel
// — niet in 0.29 en ook niet in 0.27. Een site die een pakket nodig heeft
// (algorithms draait matplotlib) haalt die wheels apart op met
// haal-pyodide-wheels.mjs hiernaast, via een script `haal:wheels`. Bij zo'n site
// ververst dit script alleen de runtime en laat het de wheels staan; na de push
// haalt de workflow pyodide-wheels de wheels van de nieuwe lock op en ruimt hij
// de oude op. Staan er wheels zonder zo'n script, dan zijn ze met de hand
// toegevoegd en weigert dit script, want wegvegen zou ze stil kwijtmaken.

import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
} from 'node:fs';
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

const pkg = JSON.parse(readFileSync(join(siteRoot, 'package.json'), 'utf8'));
const haaltWheels = Boolean(pkg.scripts?.['haal:wheels']);

// Wheels die er staan maar niet uit de npm-package komen. Zonder haal:wheels
// zijn ze met de hand toegevoegd, en ze wegvegen breekt de site stil:
// loadPackage valt dan terug op de CDN die deze map juist vermijdt, zonder
// foutmelding. Liever hier stoppen dan dat later in de klas ontdekken.
if (existsSync(dest)) {
  const bron = new Set(readdirSync(src));
  const wheels = readdirSync(dest).filter((n) => n.endsWith('.whl') && !bron.has(n));
  if (wheels.length > 0 && !haaltWheels) {
    console.error(`${dest} bevat ${wheels.length} wheel(s) die niet uit de npm-package komen:`);
    for (const naam of wheels.slice(0, 5)) console.error(`  ${naam}`);
    if (wheels.length > 5) console.error(`  ... en nog ${wheels.length - 5}`);
    console.error('');
    console.error('Die zijn met de hand toegevoegd en gaan bij een verversing verloren.');
    console.error('Geef de site een script haal:wheels (zie algorithms), dan blijven ze');
    console.error('staan en haalt de workflow pyodide-wheels de nieuwe op.');
    process.exit(1);
  }
  for (const naam of readdirSync(dest)) {
    if (!wheels.includes(naam)) rmSync(join(dest, naam), { recursive: true, force: true });
  }
  if (wheels.length > 0) {
    console.log(`${wheels.length} wheels blijven staan; haal:wheels --opruimen ververst ze.`);
  }
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
