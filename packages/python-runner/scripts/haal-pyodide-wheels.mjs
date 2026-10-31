// Haalt de wheels van één Pyodide-pakket plus alles waar het van afhangt naar
// static/pyodide/ van de aanroepende site.
//
// Waarom dit naast copy-pyodide.mjs bestaat: de npm-package van Pyodide bevat
// alléén de runtime, in geen enkele versie een wheel. Een site die matplotlib
// of een ander pakket zelf wil serveren — want anders valt loadPackage terug op
// de CDN die zo'n map juist vermijdt — moet die wheels apart ophalen. Dat is
// tot nu toe met de hand gebeurd, en daardoor liep de matplotlib-set van
// algorithms jaren achter op de runtime ernaast.
//
// Gebruik vanuit een site:
//   node ../../packages/python-runner/scripts/haal-pyodide-wheels.mjs matplotlib
//   ... --toon        laat alleen zien wat er opgehaald zou worden
//   ... --basis <url> ander adres dan de standaard-CDN (mirror, eigen kopie)
//   ... --opruimen    haal ook de wheels weg die niet meer bij de keten horen
//                     (die van de vorige Pyodide-versie)
//
// Een wheel die er al staat met de goede checksum wordt niet opnieuw
// opgehaald, dus het script mag vaker draaien. De workflow pyodide-wheels doet
// dat na elke wijziging van een pyodide-lock.json, want cdn.jsdelivr.net is
// niet overal bereikbaar.
//
// De versies en checksums komen uit de pyodide-lock.json van de geïnstalleerde
// pyodide, dus je krijgt precies de wheels die bij díe runtime horen. Elk
// bestand wordt na het ophalen tegen zijn sha256 uit dat lock-bestand gelegd.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const toonAlleen = args.includes('--toon');
const opruimen = args.includes('--opruimen');
const basisIndex = args.indexOf('--basis');
// Let op de -1: staat er geen --basis, dan mag index 0 niet worden weggefilterd
// als "de waarde erachter" — dat is juist de pakketnaam.
const basisWaardeIndex = basisIndex === -1 ? -1 : basisIndex + 1;
const pakketten = args.filter((a, i) => !a.startsWith('--') && i !== basisWaardeIndex);

if (pakketten.length === 0) {
  console.error('Geef minstens één pakketnaam op, bijvoorbeeld: matplotlib');
  process.exit(1);
}

const siteRoot = process.cwd();
const require = createRequire(join(siteRoot, 'package.json'));

let pyodideMap;
try {
  pyodideMap = dirname(require.resolve('pyodide/package.json'));
} catch {
  console.error(`Kan 'pyodide' niet vinden vanuit ${siteRoot}.`);
  console.error('Voeg pyodide toe als devDependency en draai `pnpm install`.');
  process.exit(1);
}

const versie = JSON.parse(readFileSync(join(pyodideMap, 'package.json'), 'utf8')).version;
const lock = JSON.parse(readFileSync(join(pyodideMap, 'pyodide-lock.json'), 'utf8'));
const basis =
  basisIndex === -1
    ? `https://cdn.jsdelivr.net/pyodide/v${versie}/full/`
    : args[basisIndex + 1].replace(/\/?$/, '/');

// De hele keten, niet alleen het gevraagde pakket: matplotlib zonder numpy of
// pillow importeert niet.
const nodig = new Set();
const todo = [...pakketten];
while (todo.length > 0) {
  const naam = todo.pop();
  if (nodig.has(naam)) continue;
  const pakket = lock.packages[naam];
  if (!pakket) {
    console.error(`Pyodide ${versie} kent geen pakket '${naam}'.`);
    process.exit(1);
  }
  nodig.add(naam);
  todo.push(...(pakket.depends ?? []));
}

const dest = join(siteRoot, 'static', 'pyodide');
console.log(`Pyodide ${versie} (Python ${lock.info.python}), ${nodig.size} wheels:`);
for (const naam of [...nodig].sort()) {
  console.log(`  ${lock.packages[naam].file_name}`);
}
console.log(`\nvanaf ${basis}`);
console.log(`naar  ${dest}`);

if (toonAlleen) {
  console.log('\n--toon stond aan; er is niets opgehaald.');
  process.exit(0);
}

if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

const somVan = (bytes) => createHash('sha256').update(bytes).digest('hex');

if (opruimen) {
  const horenErbij = new Set([...nodig].map((naam) => lock.packages[naam].file_name));
  for (const bestand of readdirSync(dest).filter((n) => n.endsWith('.whl'))) {
    if (horenErbij.has(bestand)) continue;
    rmSync(join(dest, bestand));
    console.log(`weg: ${bestand}`);
  }
}

let opgehaald = 0;
for (const naam of [...nodig].sort()) {
  const pakket = lock.packages[naam];
  const doel = join(dest, pakket.file_name);
  if (existsSync(doel) && somVan(readFileSync(doel)) === pakket.sha256) continue;
  const antwoord = await fetch(basis + pakket.file_name);
  if (!antwoord.ok) {
    console.error(`\n${pakket.file_name}: HTTP ${antwoord.status}`);
    console.error('Lukt het niet? Deze wheels staan niet op PyPI, alleen in de');
    console.error('Pyodide-distributie. Draai dit vanaf een machine die de CDN kan');
    console.error('bereiken, of geef met --basis een mirror op.');
    process.exit(1);
  }
  const bytes = Buffer.from(await antwoord.arrayBuffer());
  const som = somVan(bytes);
  if (pakket.sha256 && som !== pakket.sha256) {
    console.error(`\n${pakket.file_name}: checksum klopt niet`);
    console.error(`  verwacht ${pakket.sha256}`);
    console.error(`  gekregen ${som}`);
    process.exit(1);
  }
  writeFileSync(doel, bytes);
  opgehaald++;
}

console.log(`\n${opgehaald} wheels opgehaald en op checksum gecontroleerd; de rest stond er al.`);
if (!opruimen) {
  console.log('Wheels van een vorige Pyodide-versie ruim je op met --opruimen.');
}
