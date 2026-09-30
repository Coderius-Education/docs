import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Sinds Godot 4.4 staat Autoload in Project Settings niet meer als eigen
// tabblad, maar onder het tabblad Globals (naast Shader Globals en Groups).
// De les Global variables zei "klik op het tabblad Autoload", en een leerling
// met 4.7 vond dat niet (issue #117). Elke aanwijzing naar Autoload in
// Project Settings noemt daarom Globals.

const SITE = fileURLToPath(new URL('../..', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const pagina = [...bestanden(join(SITE, 'docs')), ...bestanden(join(SITE, 'src/pages'))];

describe('Autoload staat onder Globals', () => {
  it('een aanwijzing naar Autoload in Project Settings noemt Globals', () => {
    const fout = pagina.flatMap((pad) =>
      readFileSync(pad, 'utf8')
        .split('\n')
        .map((regel, i) => ({ regel, nr: i + 1 }))
        .filter(
          ({ regel }) =>
            (/Project Settings/.test(regel) && /Autoload/.test(regel)) ||
            /tabblad \*\*Autoload\*\*/.test(regel),
        )
        .filter(({ regel }) => !/Globals/.test(regel))
        .map(({ nr }) => `${pad.slice(SITE.length)}:${nr}`),
    );
    expect(fout).toEqual([]);
  });

  it('de les Global variables wijst naar het tabblad Globals', () => {
    const les = readFileSync(join(SITE, 'docs/07-signals-en-score/global_variables.md'), 'utf8');
    expect(les).toContain('tabblad **Globals**');
  });
});
