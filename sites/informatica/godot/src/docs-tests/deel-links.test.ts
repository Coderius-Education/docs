import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het bewegingsscript heet in de sidebar "Deel 1" tot en met "Deel 7", en
// lessen verwijzen ernaar als "[Deel 6 — Stoppen](site:godot/docs/…)". Een
// link met het nummer of de naam van een ander deel stuurt de leerling naar
// de verkeerde stap, en een zin die code noemt en naar een deel wijst, moet
// naar het deel wijzen waar die code staat: Animaties zei dat move_toward uit
// "Deel 5 — Lopen" kwam, terwijl het pas in Deel 6 staat.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? bestanden(join(map, e.name))
      : /\.mdx?$/.test(e.name)
        ? [join(map, e.name)]
        : [],
  );
}

const ALLE = [...bestanden(join(ROOT, 'docs')), ...bestanden(join(ROOT, 'src/pages'))].map(
  (pad) => ({ pad: pad.slice(ROOT.length), tekst: readFileSync(pad, 'utf8') }),
);

/** Per slug van een deel: het label in de sidebar en de tekst van de les. */
const DELEN = new Map<string, { label: string; tekst: string }>();
for (const { tekst } of ALLE) {
  const slug = tekst.match(/^slug:\s*\/?(\S+)/m)?.[1];
  const label = tekst.match(/^sidebar_label:\s*"?(Deel \d+: [^"\n]+)"?/m)?.[1];
  if (slug && label) DELEN.set(slug, { label, tekst });
}

const DEEL_LINK = /\[(Deel \d+) — ([^\]]+)\]\(site:godot\/docs\/([^)#]+)/g;

describe('links naar een deel van het bewegingsscript', () => {
  it('noemen het deel zoals de sidebar het noemt', () => {
    const fout: string[] = [];
    let gezien = 0;
    for (const { pad, tekst } of ALLE) {
      for (const m of tekst.matchAll(DEEL_LINK)) {
        gezien += 1;
        const label = DELEN.get(m[3])?.label;
        if (label !== `${m[1]}: ${m[2]}`) {
          fout.push(`${pad}: "${m[1]} — ${m[2]}" wijst naar ${m[3]} ("${label}")`);
        }
      }
    }
    expect(DELEN.size).toBe(7);
    expect(gezien).toBeGreaterThan(10);
    expect(fout).toEqual([]);
  });

  it('wijzen naar het deel waar de code uit de zin staat', () => {
    const fout: string[] = [];
    for (const { pad, tekst } of ALLE) {
      for (const regel of tekst.split('\n')) {
        // Tabellen en de navigatie onderaan noemen delen zonder uitleg.
        if (regel.startsWith('|') || regel.startsWith('←')) continue;
        for (const zin of regel.split(/(?<=\.)\s+/)) {
          for (const m of zin.matchAll(DEEL_LINK)) {
            const doel = DELEN.get(m[3])?.tekst ?? '';
            for (const c of zin.matchAll(/`([A-Za-z_]\w*)`/g)) {
              if (!new RegExp(`\\b${c[1]}\\b`).test(doel)) {
                fout.push(`${pad}: \`${c[1]}\` staat niet in ${m[1]}`);
              }
            }
          }
        }
      }
    }
    expect(fout).toEqual([]);
  });
});
