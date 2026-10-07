import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// `sites/editor/CLAUDE.md`: "Voor sneltoetsen: noem zowel Windows/Linux (Ctrl)
// als Mac (Cmd)." Die afspraak stond acht keer niet in de git-tutorials, en
// een leerling met een MacBook loopt daar vast. Deze test houdt hem vast.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

// Source Control is in VS Code de uitzondering: die houdt op macOS Ctrl, omdat
// Cmd+Shift+G daar "zoek vorige" is. Een Cmd-variant noemen zou dus fout zijn.
const ALLEEN_CTRL = ['Ctrl+Shift+G'];

function paginas(map: string = DOCS): string[] {
  const gevonden: string[] = [];
  for (const item of readdirSync(map)) {
    const pad = join(map, item);
    if (statSync(pad).isDirectory()) {
      gevonden.push(...paginas(pad));
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      gevonden.push(pad);
    }
  }
  return gevonden;
}

describe('sneltoetsen noemen beide platforms', () => {
  it('vindt de documentatie', () => {
    expect(paginas().length).toBeGreaterThan(20);
  });

  it('elke Ctrl-sneltoets noemt ook zijn Cmd-variant', () => {
    const missend: string[] = [];

    for (const pad of paginas()) {
      const regels = readFileSync(pad, 'utf8').split('\n');
      regels.forEach((regel, i) => {
        for (const m of regel.matchAll(/Ctrl\+[A-Za-z+]+/g)) {
          const toets = m[0];
          if (ALLEEN_CTRL.includes(toets)) continue;
          // De Cmd-variant mag op dezelfde regel of vlak erna staan.
          const omgeving = regels.slice(i, i + 2).join(' ');
          if (!omgeving.includes('Cmd+')) {
            missend.push(`${relative(DOCS, pad)}:${i + 1} — ${toets}`);
          }
        }
      });
    }

    expect(missend).toEqual([]);
  });

  it('de uitzonderingen krijgen juist geen Cmd-variant', () => {
    // Andersom net zo belangrijk: wie hier klakkeloos Cmd bijzet, stuurt elke
    // Mac-leerling naar de verkeerde sneltoets.
    const fout: string[] = [];

    for (const pad of paginas()) {
      const regels = readFileSync(pad, 'utf8').split('\n');
      regels.forEach((regel, i) => {
        for (const toets of ALLEEN_CTRL) {
          if (!regel.includes(toets)) continue;
          const cmdVariant = toets.replace('Ctrl+', 'Cmd+');
          if (regel.includes(cmdVariant)) {
            fout.push(`${relative(DOCS, pad)}:${i + 1} — ${cmdVariant} bestaat niet in VS Code`);
          }
        }
      });
    }

    expect(fout).toEqual([]);
  });
});
