import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gebruiktPyodide } from '@coderius/shared/config/pyodide-runtime';
import { alleSiteMappen } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';

// De Pyodide van elke site. De runtime staat niet meer in git: createConfig
// zet hem bij start en build uit het geïnstalleerde `pyodide`-pakket onder
// <baseUrl>pyodide/ (packages/shared/config/pyodide-runtime.js). Tot november
// 2026 stond hij als kopie in static/pyodide/ van vijf sites, en liep er een
// zo achter: python-docs op een 0.28.0.dev0-snapshot, algorithms op 0.27.4.
// Wat nog wel in static/pyodide/ staat, zijn de wheels die niet op npm staan
// (haal:wheels), en die moeten bij precies die runtime horen.

const ROOT = join(fileURLToPath(new URL('../../..', import.meta.url)));
const sites = alleSiteMappen().map((s) => ({ id: s.id, map: join(ROOT, s.dir) }));
const RUNTIME = /^(pyodide(\.asm)?\.(js|mjs|wasm)(\.map)?|python_stdlib\.zip|pyodide-lock\.json)$/;

function somVan(pad: string): string {
  return createHash('sha256').update(readFileSync(pad)).digest('hex');
}

/** Het lock-bestand van de geïnstalleerde Pyodide: wat elke site serveert. */
function geinstalleerdeLock() {
  const require = createRequire(import.meta.url);
  return JSON.parse(
    readFileSync(
      join(dirname(require.resolve('pyodide/package.json')), 'pyodide-lock.json'),
      'utf8',
    ),
  );
}

/** Bronbestanden van een site, zonder tests, builds, static en node_modules. */
function bronnen(map: string): string[] {
  if (!existsSync(map)) return [];
  const uit: string[] = [];
  for (const item of readdirSync(map, { withFileTypes: true })) {
    if (['node_modules', 'build', 'static'].includes(item.name) || item.name.startsWith('.'))
      continue;
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...bronnen(pad));
    else if (/\.(ts|tsx|js|mjs)$/.test(item.name) && !item.name.includes('.test.')) uit.push(pad);
  }
  return uit;
}

describe('de Pyodide van elke site', () => {
  const metPyodide = sites.filter(({ map }) => gebruiktPyodide(map)).map((s) => s.id);

  it('vijf sites serveren Pyodide', () => {
    // Ondergrens tegen een stille lege lijst.
    expect(metPyodide.sort()).toEqual(['algorithms', 'ctf', 'ide', 'play', 'python']);
  });

  it('wie Pyodide laadt, declareert het pakket', () => {
    // Zonder `pyodide` in package.json zet createConfig de runtime niet klaar,
    // en vraagt de site in de browser om bestanden die er niet zijn. Een site
    // laadt Pyodide als zijn bron een adres `…pyodide/` noemt: de clientModule
    // van python, ctf en ide, de eigen laders van algorithms en play.
    const zonder = sites
      .filter(({ map }) =>
        bronnen(join(map, 'src')).some((pad) => /pyodide\/['`]/.test(readFileSync(pad, 'utf8'))),
      )
      .filter(({ map }) => !gebruiktPyodide(map))
      .map((s) => s.id);
    expect(zonder).toEqual([]);
  });

  it('zet de runtime niet meer in git, alleen wheels', () => {
    const runtime = sites.flatMap(({ id, map }) => {
      const pyodide = join(map, 'static', 'pyodide');
      if (!existsSync(pyodide)) return [];
      return readdirSync(pyodide)
        .filter((n) => RUNTIME.test(n) || !n.endsWith('.whl'))
        .map((n) => `${id}: static/pyodide/${n}`);
    });
    expect(runtime, 'de runtime komt uit node_modules (pyodide-runtime.js)').toEqual([]);
  });

  it('heeft de hele wheel-keten die haal:wheels belooft, met de checksums uit de lock', () => {
    // Een runtime zonder zijn wheels bouwt gewoon: de build kijkt niet in
    // static/. Pas in de browser zegt loadPackage dat matplotlib er niet is,
    // en dan zien vijftien lessen geen grafiek. Na een upgrade vult de
    // workflow pyodide-wheels de keten aan; tot die klaar is, is dit rood. Een
    // wheel die niet bij de keten hoort (van een vorige versie, of voor een
    // andere Python) is ook een fout: die laadt nooit meer.
    const lock = geinstalleerdeLock();
    const problemen: string[] = [];

    for (const { id, map } of sites) {
      const pkg = JSON.parse(readFileSync(join(map, 'package.json'), 'utf8'));
      const haal: string | undefined = pkg.scripts?.['haal:wheels'];
      const dir = join(map, 'static', 'pyodide');
      const wheels = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.whl')) : [];
      if (!haal) {
        // Wie wheels serveert, moet ze ook kunnen verversen.
        if (wheels.length) problemen.push(`${id}: wheels zonder haal:wheels-script`);
        continue;
      }

      const woorden = haal.split(/\s+/);
      const pakketten = woorden
        .slice(woorden.findIndex((w) => w.endsWith('haal-pyodide-wheels.mjs')) + 1)
        .filter((w) => !w.startsWith('--'));
      const keten = new Set<string>();
      const todo = [...pakketten];
      while (todo.length) {
        const naam = todo.pop() as string;
        if (keten.has(naam)) continue;
        if (!lock.packages[naam]) {
          problemen.push(`${id}: de lock kent geen pakket ${naam}`);
          continue;
        }
        keten.add(naam);
        todo.push(...(lock.packages[naam].depends ?? []));
      }

      const verwacht = new Map(
        [...keten].map((n) => [lock.packages[n].file_name, lock.packages[n].sha256]),
      );
      for (const [bestand, sha] of verwacht) {
        const pad = join(dir, bestand);
        if (!existsSync(pad)) problemen.push(`${id}: ${bestand} ontbreekt`);
        else if (somVan(pad) !== sha) problemen.push(`${id}: ${bestand} heeft een andere checksum`);
      }
      for (const bestand of wheels) {
        if (!verwacht.has(bestand)) problemen.push(`${id}: ${bestand} hoort niet bij de keten`);
      }
    }

    expect(problemen).toEqual([]);
  });
});

describe('de Pyodide-versie in de bron', () => {
  it('elke vastgelegde versie wijst naar de geïnstalleerde build', () => {
    // play laadt Pyodide in een eigen iframe en heeft daarom een eigen constante,
    // los van die in PyodideProvider. Twee constanten betekent twee versies
    // zodra iemand er één bumpt — play liep zo lang achter op 0.27.x. Deze test
    // is wat ze bij elkaar houdt; een import zou play's bundel opzadelen met een
    // module die die site verder niet gebruikt.
    const require = createRequire(import.meta.url);
    const geinstalleerd = JSON.parse(
      readFileSync(require.resolve('pyodide/package.json'), 'utf8'),
    ).version;

    const afwijkend: string[] = [];
    for (const pad of [...bronnen(join(ROOT, 'sites')), ...bronnen(join(ROOT, 'packages'))]) {
      const tekst = readFileSync(pad, 'utf8');
      for (const m of tekst.matchAll(/PYODIDE_VERSION = '([^']+)'/g)) {
        if (m[1] !== geinstalleerd) afwijkend.push(`${pad}: PYODIDE_VERSION ${m[1]}`);
      }
    }

    expect(afwijkend, `geïnstalleerd is ${geinstalleerd}`).toEqual([]);
  });

  it('de catalog pint pyodide exact', () => {
    // Met een bereik (^0.29.3) kan een verse lockfile een nieuwere patch
    // kiezen; dan krijgt elke site een andere runtime dan zijn wheels.
    const werkruimte = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
    expect(werkruimte).toMatch(/^ {2}pyodide: \d+\.\d+\.\d+$/m);
  });
});
