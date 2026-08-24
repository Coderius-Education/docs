import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// <CodeUitleg> koppelt een uitleg aan een regelnummer in het codeblok ernaast.
// Dat nummer staat in de bron en de code staat er los van: verschuift er een
// regel — een import erbij, een lege regel eruit — dan wijst de uitleg stil
// naar de verkeerde regel. Aan de pagina zelf zie je dat niet, want er komt
// gewoon een bak omhoog. Vandaar deze controle.

const SITE = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const WORTELS = ['lego_auto', 'docs'];

const UITLEG_BLOK = /<CodeUitleg>([\s\S]*?)<\/CodeUitleg>/g;
const PYTHON_FENCE = /```python([^\n]*)\n([\s\S]*?)```/;
const REGEL_TAG = /<Regel\s+n=\{(\d+)\}(?:\s+tot=\{(\d+)\})?\s*>/g;

type Vondst = {
  bestand: string;
  blok: number;
  regels: number;
  tags: [number, number | undefined][];
};

function alleBlokken(): { vondsten: Vondst[]; zonderFence: string[]; zonderNummers: string[] } {
  const vondsten: Vondst[] = [];
  const zonderFence: string[] = [];
  const zonderNummers: string[] = [];

  for (const wortel of WORTELS) {
    for (const pad of alleLesbestanden(`${SITE}/${wortel}`)) {
      const bestand = pad
        .slice(SITE.length + 1)
        .split('\\')
        .join('/');
      const inhoud = readFileSync(pad, 'utf8');
      let blok = 0;

      for (const match of inhoud.matchAll(UITLEG_BLOK)) {
        blok += 1;
        const fence = match[1].match(PYTHON_FENCE);
        if (!fence) {
          zonderFence.push(`${bestand} blok ${blok}`);
          continue;
        }
        // Zonder showLineNumbers ziet de leerling geen nummers in de code en
        // verwijzen de bakjes naar iets wat er niet staat.
        if (!fence[1].includes('showLineNumbers')) {
          zonderNummers.push(`${bestand} blok ${blok}`);
        }

        const tags: [number, number | undefined][] = [...match[1].matchAll(REGEL_TAG)].map((t) => [
          Number(t[1]),
          t[2] ? Number(t[2]) : undefined,
        ]);

        vondsten.push({
          bestand,
          blok,
          regels: fence[2].replace(/\n$/, '').split('\n').length,
          tags,
        });
      }
    }
  }

  return { vondsten, zonderFence, zonderNummers };
}

describe('CodeUitleg-blokken', () => {
  const { vondsten, zonderFence, zonderNummers } = alleBlokken();

  it('er zijn blokken om te controleren', () => {
    // Anders zou een kapotte regex deze hele suite stil groen laten.
    expect(vondsten.length).toBeGreaterThan(5);
  });

  it('elk blok bevat een python-codeblok', () => {
    expect(zonderFence).toEqual([]);
  });

  it('elk codeblok toont regelnummers', () => {
    expect(zonderNummers).toEqual([]);
  });

  it('elk regelnummer bestaat echt in de code ernaast', () => {
    const kapot: string[] = [];
    for (const v of vondsten) {
      for (const [n, tot] of v.tags) {
        if (n < 1 || n > v.regels) {
          kapot.push(`${v.bestand} blok ${v.blok}: regel ${n}, maar de code heeft er ${v.regels}`);
        }
        if (tot !== undefined && (tot <= n || tot > v.regels)) {
          kapot.push(`${v.bestand} blok ${v.blok}: bereik ${n}-${tot} klopt niet`);
        }
      }
    }

    expect(kapot).toEqual([]);
  });

  it('elk blok legt minstens één regel uit, en geen regel dubbel', () => {
    const kapot: string[] = [];
    for (const v of vondsten) {
      if (v.tags.length === 0) kapot.push(`${v.bestand} blok ${v.blok}: geen enkele <Regel>`);
      const nummers = v.tags.map(([n]) => n);
      if (new Set(nummers).size !== nummers.length) {
        kapot.push(`${v.bestand} blok ${v.blok}: hetzelfde regelnummer twee keer`);
      }
    }

    expect(kapot).toEqual([]);
  });

  it('de uitleg wijst geen lege regel aan', () => {
    // Een lege regel uitleggen betekent bijna altijd dat de nummering één
    // verschoven is.
    const kapot: string[] = [];
    for (const wortel of WORTELS) {
      for (const pad of alleLesbestanden(`${SITE}/${wortel}`)) {
        const inhoud = readFileSync(pad, 'utf8');
        const bestand = pad
          .slice(SITE.length + 1)
          .split('\\')
          .join('/');
        let blok = 0;
        for (const match of inhoud.matchAll(UITLEG_BLOK)) {
          blok += 1;
          const fence = match[1].match(PYTHON_FENCE);
          if (!fence) continue;
          const lijnen = fence[2].replace(/\n$/, '').split('\n');
          for (const t of match[1].matchAll(REGEL_TAG)) {
            const n = Number(t[1]);
            if (lijnen[n - 1] !== undefined && lijnen[n - 1].trim() === '') {
              kapot.push(`${bestand} blok ${blok}: regel ${n} is leeg`);
            }
          }
        }
      }
    }

    expect(kapot).toEqual([]);
  });
});
