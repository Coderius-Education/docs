import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// In coderius-play is elke vorm massief, ook een tekst en ook zonder
// start_physics(): een bal stuitert ertegen. Een sensor laat hem door. Maar
// start_physics() zet ook de zwaartekracht aan, dus een sensor die je zo
// maakt, valt van het scherm. Het voorbeeld in 2.3 deed dat: de zone viel net
// zo hard als de bal, de bal raakte hem nooit, en "In de zone!" verscheen niet.
// Nagespeeld tegen de gebundelde wheel (3.5.0): met can_move=False blijft de
// zone staan en gaat when_touching af.

const SITE = fileURLToPath(new URL('../..', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

/** Elk stuk Python op een pagina: codeblokken en de code van een speeltuin. */
function code(tekst: string): string[] {
  return [
    ...[...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]),
    ...[...tekst.matchAll(/code=\{`([\s\S]*?)`\}/g)].map((m) => m[1]),
  ];
}

/**
 * Elke aanroep van start_physics(...) met zijn argumenten, ook als daar zelf
 * haakjes in staan (`x_speed=random.randint(1, 5)`).
 */
function aanroepen(code: string): string[] {
  const uit: string[] = [];
  for (const m of code.matchAll(/start_physics\(/g)) {
    const begin = m.index ?? 0;
    let diepte = 0;
    for (let i = begin + m[0].length - 1; i < code.length; i++) {
      if (code[i] === '(') diepte++;
      else if (code[i] === ')' && --diepte === 0) {
        uit.push(code.slice(begin, i + 1));
        break;
      }
    }
  }
  return uit;
}

const PAGINAS = ['docs', 'src/pages'].flatMap((map) => bestanden(join(SITE, map)));

describe('een sensor blijft op zijn plek', () => {
  it('er zijn sensoren om te toetsen', () => {
    const aantal = PAGINAS.flatMap((p) => code(readFileSync(p, 'utf8'))).filter((c) =>
      /sensor=True/.test(c),
    ).length;
    expect(aantal).toBeGreaterThan(5);
  });

  it('start_physics met sensor=True heeft ook can_move=False of obeys_gravity=False', () => {
    const fout: string[] = [];
    for (const pad of PAGINAS)
      for (const blok of code(readFileSync(pad, 'utf8'))) {
        // Een blok met # FOUT laat de fout bewust zien; alleen de GOED-helft telt.
        const telt = blok.includes('# FOUT') ? (blok.split('# GOED')[1] ?? '') : blok;
        for (const aanroep of aanroepen(telt))
          if (
            /sensor\s*=\s*True/.test(aanroep) &&
            !/can_move\s*=\s*False|obeys_gravity\s*=\s*False/.test(aanroep)
          )
            fout.push(`${pad.slice(SITE.length)}: ${aanroep}`);
      }
    expect(fout).toEqual([]);
  });

  it('leest ook een aanroep met haakjes in zijn argumenten', () => {
    expect(aanroepen('a.start_physics(x_speed=random.randint(1, 5), sensor=True)\n')).toEqual([
      'start_physics(x_speed=random.randint(1, 5), sensor=True)',
    ]);
  });

  it('de eerste fysicales laat zien dat een bal tegen een tekst stuitert, en wijst naar de sensor', () => {
    const les = readFileSync(join(SITE, 'docs/fysica/links_en_rechts.md'), 'utf8');
    expect(les).toMatch(/play\.new_text\(/);
    expect(les).toContain('site:play/docs/fysica/eigenschappen#sensor');
  });
});
