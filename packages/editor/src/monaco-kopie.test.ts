import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// static/monaco/vs/ is een met de hand gekopieerde Monaco-distributie
// (`pnpm --filter @coderius/editor copy:monaco`), gecommit zodat sites hem
// zelf serveren. Tienduizenden regels geminificeerde vendorcode die daarna
// niemand meer bekijkt: precies de driftklasse waar pyodide-kopie.test.ts
// de Pyodide-kopieën voor bewaakt. Deze test doet hetzelfde voor Monaco —
// elk bestand in de kopie is byte-voor-byte het bestand uit de geïnstalleerde
// monaco-editor, en er ontbreekt er geen (op de bewust weggelaten
// UI-vertalingen na).

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const KOPIE = join(PACKAGE_ROOT, 'static', 'monaco', 'vs');
const VERTALING = /^nls\.messages\..+\.js$/;

function bestandenOnder(map: string): string[] {
  const paden: string[] = [];
  const loop = (huidig: string): void => {
    for (const naam of readdirSync(huidig)) {
      const pad = join(huidig, naam);
      if (statSync(pad).isDirectory()) loop(pad);
      else paden.push(relative(map, pad).split('\\').join('/'));
    }
  };
  loop(map);
  return paden.sort();
}

function somVan(pad: string): string {
  return createHash('sha256').update(readFileSync(pad)).digest('hex');
}

function geinstalleerdeVs(): string {
  const require = createRequire(join(PACKAGE_ROOT, 'package.json'));
  return join(dirname(require.resolve('monaco-editor/package.json')), 'min', 'vs');
}

describe('de gecommitte Monaco-kopie', () => {
  const bron = geinstalleerdeVs();
  const verwacht = bestandenOnder(bron).filter((p) => !VERTALING.test(p));
  const kopie = bestandenOnder(KOPIE);

  it('bevat precies de bestanden van de geïnstalleerde monaco-editor, zonder vertalingen', () => {
    // Ondergrens tegen een lege of verplaatste map: dan is "gelijk" geen bewijs.
    expect(verwacht.length).toBeGreaterThan(50);
    expect(kopie).toEqual(verwacht);
  });

  it('is byte-voor-byte gelijk aan de geïnstalleerde versie', () => {
    const afwijkend = verwacht.filter((p) => somVan(join(KOPIE, p)) !== somVan(join(bron, p)));
    expect(afwijkend).toEqual([]);
  });
});
