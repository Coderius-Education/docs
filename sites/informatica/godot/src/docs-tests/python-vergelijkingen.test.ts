import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// De cursus legt GDScript graag naast Python: "in Python schrijf je …", of een
// kolom "In Python" in een tabel. Dat helpt alleen als de leerling dat Python
// kent. Dictionaries zei "hetzelfde als in Python" bij .get(), en Lijsten
// vergeleek find met .index(); allebei komen ze in de python-cursus niet voor.
// Deze test eist dat elke functie in zo'n Python-vergelijking ergens in de
// python-cursus staat.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const PYTHON = join(SITE, '..', 'python', 'docs');

const PYTHON_TEKST = alleLesbestanden(PYTHON)
  .map((p) => readFileSync(p, 'utf8'))
  .join('\n');

/** De code in een Python-vergelijking: een kolom "Python" of een zin "in Python schrijf je `…`". */
function pythonCitaten(tekst: string): string[] {
  const uit: string[] = [];
  for (const m of tekst.matchAll(/in Python schrijf je `([^`]+)`/gi)) uit.push(m[1]);
  const regels = tekst.split('\n');
  regels.forEach((regel, i) => {
    if (!/^\|.*\|\s*$/.test(regel) || !/^\|[\s:|-]+\|\s*$/.test(regels[i + 1] ?? '')) return;
    const kolom = regel
      .split('|')
      .slice(1, -1)
      .findIndex((c) => /^\s*(?:in\s+)?python\s*$/i.test(c));
    if (kolom === -1) return;
    for (const rij of regels.slice(i + 2)) {
      if (!rij.startsWith('|')) break;
      const cel = rij.split('|').slice(1, -1)[kolom] ?? '';
      for (const c of cel.matchAll(/`([^`]+)`/g)) uit.push(c[1]);
    }
  });
  return uit;
}

/** De functies en methodes die een stukje code aanroept, zoals `len(` en `.get(`. */
function aanroepen(code: string): string[] {
  return [...code.matchAll(/(\.?)\b(\w+)\(/g)].map((m) => `${m[1]}${m[2]}(`);
}

describe('Python-vergelijkingen in de Godot-cursus', () => {
  it('vindt citaten in zinnen en in een kolom Python', () => {
    const tekst =
      'Daar schrijf je in Python schrijf je `d.get(x)`.\n\n| GDScript | In Python |\n|---|---|\n| `a.size()` | `len(a)` |\n';
    expect(pythonCitaten(tekst)).toEqual(['d.get(x)', 'len(a)']);
  });

  it('vergelijkt alleen met Python dat de python-cursus behandelt', () => {
    const fout: string[] = [];
    for (const wortel of [join(SITE, 'docs'), join(SITE, 'src', 'pages')]) {
      for (const pad of alleLesbestanden(wortel)) {
        for (const citaat of pythonCitaten(readFileSync(pad, 'utf8'))) {
          for (const a of aanroepen(citaat)) {
            if (!PYTHON_TEKST.includes(a))
              fout.push(`${pad.slice(SITE.length)}: ${a} uit "${citaat}"`);
          }
        }
      }
    }
    expect(fout).toEqual([]);
  });
});
