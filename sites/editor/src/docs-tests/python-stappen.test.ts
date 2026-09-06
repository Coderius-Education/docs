import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De python-tutorial is een doe-tutorial: de leerling zit erbij met de
// Verkenner en PowerShell open. Voor de git-tutorials bewaakt meedoen.test.ts
// dat elke stap zegt wat je moet zien; die test scoopt op docs/git, dus deze
// tutorial viel er buiten en had nergens zo'n kopje. Sinds de PowerShell-route
// telt het hier net zo hard: "je ziet .venv" is de hele controle van stap 4.

const WORTEL = fileURLToPath(new URL('../../../..', import.meta.url));
const PYTHON = fileURLToPath(new URL('../../docs/python', import.meta.url));
const FULLSTACK = fileURLToPath(new URL('../../../fullstack/docs', import.meta.url));

function stappen(): string[] {
  return readdirSync(PYTHON)
    .filter((f) => f.startsWith('stap-') && f.endsWith('.md'))
    .sort();
}

function tekst(bestand: string): string {
  return readFileSync(join(PYTHON, bestand), 'utf8');
}

/** Alle .md/.mdx onder een map, recursief. */
function lesbestanden(map: string): string[] {
  const uit: string[] = [];
  for (const item of readdirSync(map, { withFileTypes: true })) {
    if (item.isDirectory()) uit.push(...lesbestanden(join(map, item.name)));
    else if (/\.mdx?$/.test(item.name)) uit.push(join(map, item.name));
  }
  return uit;
}

describe('de stappen lopen op zonder gat', () => {
  it('is stap 1 tot en met 7, precies één bestand per nummer', () => {
    expect(stappen().map((f) => f.match(/^stap-(\d+)-/)?.[1])).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  it('bestandsnaam, sidebar_position en title noemen hetzelfde nummer', () => {
    // Docusaurus sorteert op sidebar_position, niet op bestandsnaam. Lopen die
    // uiteen, dan leest de leerling stap 5 na stap 3 en werkt het commando niet.
    const scheef: string[] = [];

    for (const bestand of stappen()) {
      const nummer = bestand.match(/^stap-(\d+)-/)?.[1];
      const inhoud = tekst(bestand);
      const positie = inhoud.match(/^sidebar_position:\s*(\d+)/m)?.[1];
      const titel = inhoud.match(/^title:\s*"?Stap (\d+)/m)?.[1];
      if (positie !== nummer || titel !== nummer) {
        scheef.push(`${bestand} — position ${positie}, title ${titel}`);
      }
    }

    expect(scheef).toEqual([]);
  });
});

describe('elke stap vertelt je wat je moet zien', () => {
  it('geen enkele stap laat je in het ongewisse', () => {
    const zonder = stappen().filter((f) => !/\n## Wat je nu ziet/.test(tekst(f)));

    expect(zonder).toEqual([]);
  });
});

describe('de stappen zijn uitvoerbaar zonder voorkennis van de interface', () => {
  it('noemt hoe je een terminal opent voordat er een commando in moet', () => {
    // "Typ dit in PowerShell" is nutteloos als je niet weet waar die zit.
    // Stap 2 legt het uit; de stappen daarna mogen ernaar linken.
    const fout = stappen().filter((bestand) => {
      const inhoud = tekst(bestand);
      if (!/```bash/.test(inhoud)) return false;
      return !(
        /adresbalk/.test(inhoud) ||
        /Openen in Terminal/.test(inhoud) ||
        /New Terminal/.test(inhoud) ||
        /stap-2-powershell/.test(inhoud)
      );
    });

    expect(fout).toEqual([]);
  });
});

describe('pip draait overal op dezelfde manier', () => {
  it('noemt pip als commando alleen als `python -m pip`', () => {
    // Kaal `pip` pakt op Windows soms de pip buiten de virtual environment, en
    // dan zegt Python later dat het het package niet kent. `python -m pip`
    // gebruikt gegarandeerd de Python die je net aanriep. De editor-cursus en
    // de fullstack-cursus mogen hierin niet uit elkaar lopen.
    const fout: string[] = [];

    for (const pad of [...lesbestanden(PYTHON), ...lesbestanden(FULLSTACK)]) {
      const regels = readFileSync(pad, 'utf8').split('\n');
      regels.forEach((regel, i) => {
        // Alleen pip als commando (`pip install`, `pip list`, …), niet het
        // woord pip in lopende tekst of in een kop.
        for (const m of regel.matchAll(/(?<![\w-])pip\s+(install|list|freeze|uninstall|show)\b/g)) {
          if (/python3? -m\s+$/.test(regel.slice(0, m.index))) continue;
          fout.push(`${relative(WORTEL, pad)}:${i + 1} — ${regel.trim()}`);
        }
      });
    }

    expect(fout).toEqual([]);
  });
});
