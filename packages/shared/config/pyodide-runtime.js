// De Pyodide-runtime van een site, uit node_modules in plaats van uit git.
//
// Elke site die Python in de browser draait, serveert Pyodide zelf onder
// <baseUrl>pyodide/, zodat het ook werkt op een schoolnetwerk dat CDN's
// blokkeert. Tot november 2026 stond die runtime daarvoor in static/pyodide/
// van elke site: vijf keer dezelfde 12 MB in git, met de hand ververst met
// `copy:pyodide`, en een test die moest bewaken dat de kopieën gelijk liepen
// met het npm-pakket. Nu komt hij rechtstreeks uit het geïnstalleerde
// `pyodide` (de catalog pint de versie exact): createConfig geeft een map met
// alleen de runtime-bestanden mee als extra static-map, en Docusaurus voegt
// die bij start en build samen met static/pyodide/ van de site, waar alleen
// nog de wheels staan die niet op npm staan (haal:wheels).
//
// Een site doet mee door `pyodide` als (dev)dependency te declareren.

const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

/**
 * Wat de browser van Pyodide nodig heeft. pyodide.mjs en de source maps
 * gebruikt geen enkele site (ze laden pyodide.js); de node-tests nemen
 * pyodide.mjs uit node_modules zelf.
 */
const RUNTIME_BESTANDEN = [
  'pyodide.js',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

/** Declareert de site in deze map `pyodide`? */
function gebruiktPyodide(siteDir) {
  const pad = path.join(siteDir, 'package.json');
  if (!fs.existsSync(pad)) return false;
  const pkg = JSON.parse(fs.readFileSync(pad, 'utf8'));
  return Boolean(pkg.dependencies?.pyodide || pkg.devDependencies?.pyodide);
}

/** De map van het geïnstalleerde pyodide-pakket, gezien vanuit de site. */
function pyodidePakketDir(siteDir) {
  const require = createRequire(path.join(siteDir, 'package.json'));
  return path.dirname(require.resolve('pyodide/package.json'));
}

/**
 * Zet de runtime klaar en geeft de static-map terug die createConfig meegeeft
 * (met daarin `pyodide/<bestanden>`), of null voor een site zonder Pyodide.
 * Per versie een eigen map; staan de bestanden er al met dezelfde grootte, dan
 * wordt er niets gekopieerd.
 */
function pyodideStaticDir(siteDir) {
  if (!gebruiktPyodide(siteDir)) return null;
  let bron;
  try {
    bron = pyodidePakketDir(siteDir);
  } catch {
    throw new Error(
      `${siteDir} declareert pyodide, maar het pakket is niet geïnstalleerd. Draai \`pnpm install\`.`,
    );
  }
  const versie = JSON.parse(fs.readFileSync(path.join(bron, 'package.json'), 'utf8')).version;
  const root = path.join(siteDir, 'node_modules', '.cache', 'coderius-pyodide', versie);
  const doel = path.join(root, 'pyodide');
  fs.mkdirSync(doel, { recursive: true });
  for (const naam of RUNTIME_BESTANDEN) {
    const van = path.join(bron, naam);
    const naar = path.join(doel, naam);
    if (fs.existsSync(naar) && fs.statSync(naar).size === fs.statSync(van).size) continue;
    fs.copyFileSync(van, naar);
  }
  return root;
}

module.exports = { RUNTIME_BESTANDEN, gebruiktPyodide, pyodideStaticDir };
