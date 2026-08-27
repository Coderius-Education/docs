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
// (algorithms draait matplotlib) haalt die wheels apart op — daarvoor is
// haal-pyodide-wheels.mjs hiernaast. Dit script begon met de doelmap leeggooien
// en zou ze daarmee wissen; vandaar de controle hieronder.

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

// Wheels die er staan maar niet uit de npm-package komen, zijn met de hand
// toegevoegd. Ze wegvegen breekt de site stil: loadPackage valt dan terug op de
// CDN die deze map juist vermijdt, zonder foutmelding. Liever hier stoppen dan
// dat later in de klas ontdekken.
if (existsSync(dest)) {
  const bron = new Set(readdirSync(src));
  const handmatig = readdirSync(dest).filter((n) => n.endsWith('.whl') && !bron.has(n));
  if (handmatig.length > 0) {
    console.error(`${dest} bevat ${handmatig.length} wheel(s) die niet uit de npm-package komen:`);
    for (const naam of handmatig.slice(0, 5)) console.error(`  ${naam}`);
    if (handmatig.length > 5) console.error(`  ... en nog ${handmatig.length - 5}`);
    console.error('');
    console.error('Die zijn met de hand toegevoegd en gaan bij een verversing verloren.');
    console.error('Haal eerst de bijbehorende wheels van de nieuwe Pyodide-versie op,');
    console.error('zet ze klaar, en verwijder daarna deze map zelf.');
    process.exit(1);
  }
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
