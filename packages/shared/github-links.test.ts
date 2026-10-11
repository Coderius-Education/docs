import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden, siteMappenOpSchijf } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Een les die naar een bestand in deze repository op GitHub linkt
// (github.com/Coderius-Education/docs/blob/main/<pad>), wijst naar een pad op
// schijf. Bij de verhuizing naar sites/<vak>/<id>/ bleven vier links naar de
// 3D-modellen van robotica op sites/robotica/… staan; GitHub geeft daar een
// 404, en de cross-links-job ziet het niet, want github.com is geen site uit
// de registry. Deze test legt elk zo'n pad naast de bestanden in de checkout.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', 'static', 'extracted']);

const GITHUB =
  /https:\/\/(?:github\.com\/Coderius-Education\/docs\/(?:blob|tree|raw)|raw\.githubusercontent\.com\/Coderius-Education\/docs)\/main\/([^\s)"'<>#?]+)/g;

function lesbestanden(): string[] {
  const uit: string[] = [];
  for (const { map } of siteMappenOpSchijf(ROOT)) {
    for (const entry of readdirSync(map, { withFileTypes: true })) {
      if (!entry.isDirectory() || OVERSLAAN.has(entry.name)) continue;
      for (const pad of alleLesbestanden(join(map, entry.name))) {
        if (!pad.split(/[\\/]/).some((deel) => OVERSLAAN.has(deel))) uit.push(pad);
      }
    }
  }
  return uit;
}

const links = lesbestanden().flatMap((pad) =>
  [...readFileSync(pad, 'utf8').matchAll(GITHUB)].map((m) => ({
    bron: relative(ROOT, pad).split('\\').join('/'),
    doel: decodeURIComponent(m[1]).replace(/[.,]$/, ''),
  })),
);

describe('links naar bestanden in deze repository op GitHub', () => {
  it('vindt de links naar de 3D-modellen van robotica', () => {
    // Een kapotte regex of walk zou de test hieronder leeg en groen laten.
    expect(links.filter((l) => l.doel.endsWith('.stl')).length).toBeGreaterThanOrEqual(4);
  });

  it('elk pad bestaat in de checkout', () => {
    const kapot = links
      .filter((l) => !existsSync(join(ROOT, l.doel)))
      .map((l) => `${l.bron} -> ${l.doel}`);
    expect(kapot).toEqual([]);
  });
});
