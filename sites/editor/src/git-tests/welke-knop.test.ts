import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Elke git-tutorial eindigt met een tabel "Welke knop is welk commando?". Die
// tabel is de brug tussen de VS Code-knoppen en de commandoregel, en juist zo'n
// samenvatting loopt uit de pas zodra een stap verandert: de les krijgt een
// ander commando, de tabel blijft staan.

const GIT = fileURLToPath(new URL('../../docs/git', import.meta.url));

function paginas(map: string = GIT): string[] {
  const gevonden: string[] = [];
  for (const item of readdirSync(map)) {
    const pad = join(map, item);
    if (statSync(pad).isDirectory()) gevonden.push(...paginas(pad));
    else if (item.endsWith('.md') || item.endsWith('.mdx')) gevonden.push(pad);
  }
  return gevonden;
}

// Twee tutorials hebben bewust geen vertaaltabel: in `basis` typ je de
// commando's zelf in de simulator, en `github` speelt zich helemaal op de
// website af — daar hoort geen enkel commando bij.
const ZONDER_TABEL = ['basis', 'github'];

/** De git-subcommando's die deze cursus behandelt. */
const BEKEND = [
  'add',
  'branch',
  'checkout',
  'clone',
  'commit',
  'config',
  'init',
  'log',
  'merge',
  'pull',
  'push',
  'remote',
  'restore',
  'rm',
  'status',
  '--version',
];

function gitCommandos(tekst: string): string[] {
  // Alles wat als `git ...` in code-opmaak staat, of in een bash-blok.
  const uit = new Set<string>();
  for (const m of tekst.matchAll(/`(git [^`]+)`/g)) uit.add(m[1].trim());
  for (const blok of tekst.matchAll(/```bash\n([\s\S]*?)```/g)) {
    for (const regel of blok[1].split('\n')) {
      const schoon = regel.replace(/#.*$/, '').trim();
      if (schoon.startsWith('git ')) uit.add(schoon);
    }
  }
  return [...uit];
}

describe('welke-knop-tabellen', () => {
  const tabellen = paginas().filter((p) => p.endsWith('welke-knop.md'));

  it('elke tutorial met stappen heeft er een', () => {
    const mappen = readdirSync(GIT).filter((d) => statSync(join(GIT, d)).isDirectory());
    const zonder = mappen
      .filter((d) => readdirSync(join(GIT, d)).some((f) => f.startsWith('stap-')))
      .filter((d) => !ZONDER_TABEL.includes(d))
      .filter((d) => !readdirSync(join(GIT, d)).includes('welke-knop.md'));

    expect(zonder).toEqual([]);
  });

  it('noemt alleen git-commandos die deze cursus behandelt', () => {
    const onbekend: string[] = [];

    for (const pad of tabellen) {
      for (const cmd of gitCommandos(readFileSync(pad, 'utf8'))) {
        const sub = cmd.split(/\s+/)[1];
        if (!BEKEND.includes(sub)) {
          onbekend.push(`${relative(GIT, pad)} — ${cmd}`);
        }
      }
    }

    expect(onbekend).toEqual([]);
  });

  it('elk commando in een tabel wordt ergens in de cursus getoond', () => {
    // Zo kan de samenvatting niet iets beloven wat de les nergens uitlegt.
    const wees: string[] = [];

    // De tutorials bouwen op elkaar voort, dus `git push` mag in de tabel van
    // pull-clone staan terwijl de push-tutorial hem uitlegt. Wat niet mag: een
    // commando dat de cursus nergens laat zien.
    const alleStappen = paginas()
      .filter((p) => !p.endsWith('welke-knop.md'))
      .map((p) => readFileSync(p, 'utf8'))
      .join('\n');
    const getoond = gitCommandos(alleStappen);

    for (const pad of tabellen) {
      for (const cmd of gitCommandos(readFileSync(pad, 'utf8'))) {
        // Vergelijk op het subcommando plus zijn eerste vlag: de tabel schrijft
        // `<url>` waar de stap een echte URL toont.
        const kern = cmd.split(/\s+/).slice(0, 2).join(' ');
        const vlag = cmd.match(/\s(-{1,2}[a-zA-Z-]+)/)?.[1];
        const gevonden = getoond.some((s) => s.startsWith(kern) && (!vlag || s.includes(vlag)));
        if (!gevonden) wees.push(`${relative(GIT, pad)} — ${cmd}`);
      }
    }

    expect(wees).toEqual([]);
  });
});

describe('de cursus is intern consistent', () => {
  it('noemt overal main en nergens master als jouw eigen branch', () => {
    // De hele leerlijn gaat uit van `main`. Duikt `master` op als naam van de
    // branch waar de leerling op werkt, dan is er iets uit de pas gelopen —
    // behalve in stap-1-config, dat juist uitlegt waarom je het omzet.
    const fout: string[] = [];

    for (const pad of paginas()) {
      if (pad.endsWith('stap-1-config.md')) continue;
      readFileSync(pad, 'utf8')
        .split('\n')
        .forEach((regel, i) => {
          if (/\bmaster\b/.test(regel)) fout.push(`${relative(GIT, pad)}:${i + 1}`);
        });
    }

    expect(fout).toEqual([]);
  });

  it('legt init.defaultBranch uit voordat er een repository gemaakt wordt', () => {
    const config = readFileSync(join(GIT, 'vscode/stap-1-config.md'), 'utf8');
    expect(config).toContain('init.defaultBranch main');
    // De escape voor wie al een map had.
    expect(config).toContain('git branch -m main');

    const configPositie = Number(
      readFileSync(join(GIT, 'vscode/stap-1-config.md'), 'utf8').match(
        /sidebar_position:\s*(\d+)/,
      )?.[1],
    );
    const initPositie = Number(
      readFileSync(join(GIT, 'vscode/stap-3-source-control.md'), 'utf8').match(
        /sidebar_position:\s*(\d+)/,
      )?.[1],
    );
    expect(configPositie).toBeLessThan(initPositie);
  });
});

describe('de volgorde van de tutorials', () => {
  // De leerlijn heeft een vaste volgorde en de pagina's verwijzen naar elkaar.
  // Verschuif je er een, dan wijzen die verwijzingen achteruit zonder dat een
  // build daarover klaagt — de links blijven immers bestaan.
  const VOLGORDE = ['basis', 'github', 'vscode', 'push', 'pull-clone', 'branches', 'pull-request'];

  function positie(map: string): number {
    return JSON.parse(readFileSync(join(GIT, map, '_category_.json'), 'utf8')).position;
  }

  it('de sidebar staat in de bedoelde volgorde', () => {
    const opVolgorde = [...VOLGORDE].sort((a, b) => positie(a) - positie(b));
    expect(opVolgorde).toEqual(VOLGORDE);
  });

  it('elke map uit de sidebar staat in de lijst', () => {
    const mappen = readdirSync(GIT)
      .filter((d) => statSync(join(GIT, d)).isDirectory())
      .sort();
    expect(mappen).toEqual([...VOLGORDE].sort());
  });

  it('de overzichtspagina noemt ze in dezelfde volgorde', () => {
    const index = readFileSync(join(GIT, 'index.md'), 'utf8');
    const genoemd = [...index.matchAll(/\]\(\.\/([a-z-]+)\/\)/g)]
      .map((m) => m[1])
      .filter((naam, i, alle) => alle.indexOf(naam) === i);

    expect(genoemd).toEqual(VOLGORDE);
  });

  it('geen enkele "Volgende tutorial" wijst achteruit', () => {
    const fout: string[] = [];

    for (const map of VOLGORDE) {
      for (const pad of paginas().filter((p) => p.includes(`/${map}/`))) {
        const tekst = readFileSync(pad, 'utf8');
        const na = tekst.split('## Volgende tutorial')[1];
        if (!na) continue;
        for (const m of na.matchAll(/\/git\/([a-z-]+)\//g)) {
          const doel = VOLGORDE.indexOf(m[1]);
          if (doel !== -1 && doel <= VOLGORDE.indexOf(map)) {
            fout.push(`${relative(GIT, pad)} wijst terug naar ${m[1]}`);
          }
        }
      }
    }

    expect(fout).toEqual([]);
  });

  it('geen enkele inleiding beweert dat je iets al gehad hebt wat nog moet komen', () => {
    // "In X heb je ..." is een terugblik en moet dus achteruit wijzen. Een
    // vooruitblik ("In X koppel je ...") mag juist wel vooruit, dus die vorm
    // laten we met rust.
    const fout: string[] = [];

    for (const map of VOLGORDE) {
      const index = join(GIT, map, map === 'basis' ? 'index.mdx' : 'index.md');
      const eerste = readFileSync(index, 'utf8').split('\n## ')[0];

      for (const m of eerste.matchAll(/\[[^\]]+\]\(\/git\/([a-z-]+)\/\)[^.]*\bheb je\b/g)) {
        if (VOLGORDE.indexOf(m[1]) > VOLGORDE.indexOf(map)) {
          fout.push(`${map}/index zegt "heb je" over het latere ${m[1]}`);
        }
      }
    }

    expect(fout).toEqual([]);
  });
});
