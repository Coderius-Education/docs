import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Sommige sites serveren Pyodide zelf uit static/pyodide/ in plaats van vanaf de
// CDN, zodat de speeltuin het ook doet op een schoolnetwerk dat CDN's blokkeert.
// Die kopie wordt met de hand gemaakt (`pnpm --filter <site> copy:pyodide`) en
// daarna gecommit — tientallen megabytes binair die daarna niemand meer bekijkt.
//
// Dat is precies hoe python-docs op een 0.28.0.dev0-snapshot achterbleef terwijl
// de catalog al op 0.29 stond en `PYODIDE_VERSION` in PyodideProvider.ts 0.29.4
// beloofde. Niets merkte het; het kwam boven omdat iemand toevallig het
// lock-bestand van die kopie opensloeg.
//
// Deze test legt de gecommitte kopie naast de geïnstalleerde pyodide. Vergelijken
// gaat op de checksum van de wasm en niet op een versienummer: 0.28 zet zijn
// versie in `info.version` van pyodide-lock.json, 0.29 niet meer, dus een
// versieveld is er simpelweg niet altijd.

const ROOT = join(fileURLToPath(new URL('../../..', import.meta.url)));
const SITES = join(ROOT, 'sites');
const WASM = 'pyodide.asm.wasm';

// Een site die (nog) niet gelijkloopt hoort hier met een reden te staan. Zonder
// die lijst zou deze test vandaag meteen rood zijn en dus meteen worden
// uitgezet; mét de lijst is de achterstand zichtbaar en telbaar.
const NOG_NIET_BIJGEWERKT = new Map([
  [
    'python',
    'staat nog op de 0.28.0.dev0-snapshot uit de init-commit; verversen geeft 12 MB binaire diff en gebeurt in een eigen commit',
  ],
  [
    'algorithms',
    'draait bewust op 0.27.4 (Python 3.12): de dertien met de hand toegevoegde wheels zijn cp312, en verversen breekt matplotlib in vijftien lessen — zie sites/algorithms/CLAUDE.md',
  ],
]);

function somVan(pad: string): string {
  return createHash('sha256').update(readFileSync(pad)).digest('hex');
}

/** De sites met een eigen gecommitte Pyodide-kopie. */
function zelfHostendeSites(): string[] {
  return readdirSync(SITES).filter((naam) =>
    existsSync(join(SITES, naam, 'static', 'pyodide', WASM)),
  );
}

function geinstalleerdeWasm(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('pyodide/package.json')), WASM);
}

describe('de zelf geserveerde Pyodide-kopieën', () => {
  it('er zijn sites die Pyodide zelf serveren', () => {
    // Ondergrens tegen een stille lege lijst: verhuist static/pyodide/ ooit,
    // dan hoort dat een testfout te zijn en geen groen vinkje over niets.
    expect(zelfHostendeSites().length).toBeGreaterThanOrEqual(3);
  });

  it('draaien dezelfde build als de geïnstalleerde pyodide', () => {
    const verwacht = somVan(geinstalleerdeWasm());
    const afwijkend = zelfHostendeSites()
      .filter((site) => !NOG_NIET_BIJGEWERKT.has(site))
      .filter((site) => somVan(join(SITES, site, 'static', 'pyodide', WASM)) !== verwacht);

    expect(afwijkend).toEqual([]);
  });

  it('staan niet voor niets op de uitzonderingslijst', () => {
    // Andersom: is een site bijgewerkt, dan moet hij van de lijst af. Anders
    // blijft er een uitzondering staan voor een probleem dat niet meer bestaat,
    // en dekt die stilzwijgend de volgende drift toe.
    const verwacht = somVan(geinstalleerdeWasm());
    const inmiddelsGelijk = [...NOG_NIET_BIJGEWERKT.keys()]
      .filter((site) => existsSync(join(SITES, site, 'static', 'pyodide', WASM)))
      .filter((site) => somVan(join(SITES, site, 'static', 'pyodide', WASM)) === verwacht);

    expect(inmiddelsGelijk).toEqual([]);
  });

  it('hebben wheels die bij de Python-versie van hun eigen runtime horen', () => {
    // De val waar algorithms in zou lopen. De npm-package van Pyodide bevat in
    // geen enkele versie wheels, alleen de runtime; wie een pakket nodig heeft
    // zet die wheels er met de hand bij. Vervang je dan alleen de runtime, dan
    // staan er cp312-wheels naast een 3.13-interpreter: die laden niet, en
    // loadPackage valt terug op de CDN die zo'n map juist vermijdt. Stil, want
    // er komt geen foutmelding uit de build.
    const mismatch: string[] = [];

    for (const site of zelfHostendeSites()) {
      const map = join(SITES, site, 'static', 'pyodide');
      const lock = JSON.parse(readFileSync(join(map, 'pyodide-lock.json'), 'utf8'));
      const [groot, klein] = String(lock.info.python).split('.');
      const verwacht = `cp${groot}${klein}`;

      for (const bestand of readdirSync(map).filter((n) => n.endsWith('.whl'))) {
        const tag = bestand.match(/-(cp\d{2,3})-/)?.[1];
        // Wheels zonder ABI-tag (py3-none-any) draaien op elke versie.
        if (tag && tag !== verwacht) {
          mismatch.push(`${site}: ${bestand} hoort bij ${tag}, runtime is ${verwacht}`);
        }
      }
    }

    expect(mismatch).toEqual([]);
  });

  it('declareren pyodide als devDependency', () => {
    // Zonder die declaratie hangt de kopie aan niets: geen catalog, geen
    // lockfile-druk, geen signaal als de rest doorloopt. Zo dreef python-docs
    // weg — de lockfile noemde pyodide daar wél, de package.json niet.
    const zonder = zelfHostendeSites().filter((site) => {
      const pkg = JSON.parse(readFileSync(join(SITES, site, 'package.json'), 'utf8'));
      return !pkg.devDependencies?.pyodide && !pkg.dependencies?.pyodide;
    });

    expect(zonder).toEqual([]);
  });
});
