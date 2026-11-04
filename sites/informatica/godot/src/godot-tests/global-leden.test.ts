import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een les die heel global.gd laat zien, vervangt bij een leerling die het
// overneemt alles wat er al stond. In de JSON-les ontbrak zo de lijst
// `levels` uit Lijsten: na het plakken liep de vlag vast op "Invalid access
// to property or key 'levels'". Deze test loopt de cursus in de volgorde van
// de sidebar door en eist dat elk volledig global-script in hoofdstuk 10
// alles heeft wat de cursus tot dan toe als `Global.<naam>` gebruikte.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const BLOK = /```gdscript\n([\s\S]*?)```/g;

function positie(pad: string): number {
  return Number(readFileSync(pad, 'utf8').match(/^sidebar_position:\s*(\d+)/m)?.[1] ?? 0);
}

/** De lesbestanden van de hoofdstukken, in de volgorde van de sidebar. */
function lessenInVolgorde(): { pad: string; hoofdstuk: number }[] {
  const hoofdstukken = readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d+-/.test(e.name))
    .sort((a, b) => Number.parseInt(a.name, 10) - Number.parseInt(b.name, 10));
  return hoofdstukken.flatMap((map) =>
    readdirSync(join(DOCS, map.name))
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => join(DOCS, map.name, f))
      .sort((a, b) => positie(a) - positie(b))
      .map((pad) => ({ pad, hoofdstuk: Number.parseInt(map.name, 10) })),
  );
}

function isGlobalScript(code: string): boolean {
  return code.startsWith('extends Node\n') && /^var score\b/m.test(code);
}

function leden(code: string): Set<string> {
  return new Set([...code.matchAll(/^(?:var|const|func)\s+(\w+)/gm)].map((m) => m[1]));
}

describe('volledige global-scripts in hoofdstuk 10', () => {
  it('bevatten alles wat de cursus daarvoor als Global.<naam> gebruikte', () => {
    const gebruikt = new Set<string>();
    const fout: string[] = [];
    let gecontroleerd = 0;
    for (const { pad, hoofdstuk } of lessenInVolgorde()) {
      const inhoud = readFileSync(pad, 'utf8');
      for (const m of inhoud.matchAll(BLOK)) {
        const code = m[1];
        if (hoofdstuk === 10 && isGlobalScript(code)) {
          gecontroleerd += 1;
          const heeft = leden(code);
          const mist = [...gebruikt].filter((naam) => !heeft.has(naam));
          if (mist.length) {
            const regel = inhoud.slice(0, m.index).split('\n').length;
            fout.push(`${pad.slice(DOCS.length)}:${regel} mist ${mist.join(', ')}`);
          }
        }
        for (const g of code.matchAll(/\bGlobal\.(\w+)/g)) gebruikt.add(g[1]);
      }
    }
    expect(gecontroleerd).toBeGreaterThan(0);
    expect(fout).toEqual([]);
  });
});
