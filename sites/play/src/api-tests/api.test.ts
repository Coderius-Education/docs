import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De lessen beloven API die de speeltuin ook echt moet kunnen draaien. De
// speeltuin draait niet op PyPI maar op de wheel in static/whl/ — dus is die
// wheel de bron van waarheid: elke `play.new_…` en `@play.when_…` uit de
// lesstof moet erin bestaan, anders toont een les code die in de browser op
// een AttributeError strandt.

const SITE = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const WHL_DIR = join(SITE, 'static', 'whl');
const ENGINE = join(SITE, 'src', 'components', 'CodeRunner', 'engine.js');

function playWheel(): string {
  const engine = readFileSync(ENGINE, 'utf8');
  const m = engine.match(/PLAY_WHEEL = '\/whl\/([^']+)'/);
  if (!m) throw new Error('PLAY_WHEEL niet gevonden in engine.js');
  return m[1];
}

/** Alle publieke play-symbolen uit de wheel: new_…, when_…, while_… enz. */
function wheelSymbolen(): Set<string> {
  // De api/__init__.py somt exact op wat `import play` aanbiedt.
  const apiInit = uitWheel('play/api/__init__.py');
  const symbolen = new Set<string>();
  for (const m of apiInit.matchAll(/^\s{4}([a-z_][a-z0-9_]*),/gm) as Iterable<RegExpMatchArray>) {
    symbolen.add(m[1]);
  }
  return symbolen;
}

/** Leest één bestand uit de gebundelde wheel. */
function uitWheel(bestand: string): string {
  const zip = join(WHL_DIR, playWheel());
  return execFileSync('unzip', ['-p', zip, bestand], { encoding: 'utf8' });
}

function lesPaginas(): string[] {
  const gevonden: string[] = [];
  const loop = (map: string): void => {
    for (const item of readdirSync(map)) {
      const pad = join(map, item);
      if (statSync(pad).isDirectory()) loop(pad);
      else if (/\.mdx?$/.test(item)) gevonden.push(pad);
    }
  };
  loop(join(SITE, 'docs'));
  return gevonden;
}

describe('de gebundelde wheel', () => {
  it('bestaat op de plek waar engine.js naar wijst', () => {
    expect(existsSync(join(WHL_DIR, playWheel())), playWheel()).toBe(true);
  });

  it('er slingert geen tweede play-wheel rond', () => {
    // Twee versies naast elkaar: de een wordt geserveerd, de ander suggereert
    // ten onrechte dat hij nog meedoet.
    const playWheels = readdirSync(WHL_DIR).filter((f) => f.startsWith('coderius_play'));
    expect(playWheels).toEqual([playWheel()]);
  });
});

describe('lesstof en wheel spreken dezelfde taal', () => {
  // Lui berekend: wijst engine.js naar een wheel die er niet is, dan hoort
  // dat een leesbare testfout te zijn en geen collectie-crash van het bestand.
  let cache: Set<string> | null = null;
  const symbolen = (): Set<string> => {
    cache = cache ?? wheelSymbolen();
    return cache;
  };

  it('de wheel exporteert een geloofwaardige API', () => {
    // Ondergrens tegen een kapotte extractie: een handvol ankers dat er
    // in elke versie in moet zitten.
    for (const anker of ['new_circle', 'new_text', 'repeat_forever', 'when_key_pressed']) {
      expect(symbolen().has(anker), anker).toBe(true);
    }
    expect(symbolen().size).toBeGreaterThan(20);
  });

  it('elke play.new_… en @play.when|while_… uit de lessen zit in de wheel', () => {
    const onbekend: string[] = [];

    for (const pad of lesPaginas()) {
      const tekst = readFileSync(pad, 'utf8');
      const gebruikt = new Set<string>();
      for (const m of tekst.matchAll(/\bplay\.(new_[a-z_]+)/g)) gebruikt.add(m[1]);
      for (const m of tekst.matchAll(/@play\.((?:when|while)_[a-z_]+)/g)) gebruikt.add(m[1]);

      for (const naam of gebruikt) {
        if (!symbolen().has(naam)) {
          onbekend.push(`${relative(SITE, pad)} — play.${naam}`);
        }
      }
    }

    expect(onbekend).toEqual([]);
  });

  it('elke nieuwe generator uit de wheel staat in de cheatsheet', () => {
    // Andersom: API die stil ongedocumenteerd blijft. De cheatsheet is de
    // referentie, dus elke new_… hoort er ten minste één keer in voor te komen.
    const cheatsheet = readFileSync(join(SITE, 'docs', 'cheatsheet.md'), 'utf8');
    const missend = [...symbolen()]
      .filter((naam) => naam.startsWith('new_'))
      .filter((naam) => !cheatsheet.includes(naam));

    expect(missend).toEqual([]);
  });
});

describe('de bootstrap van de speeltuin past op de wheel', () => {
  // engine.js draagt Python mee (bootstrap en reset) die diep in play's
  // binnenkant grijpt. Die binnenkant is geen publiek API: toen 3.4 de
  // program_started-boolean verving door een program_state-enum, crashte elke
  // browser-run op een AttributeError. Deze tests leggen de Python-strings
  // naast de wheel, zodat zulke drift een testfout wordt in plaats van een
  // kapotte speeltuin.
  const engine = readFileSync(ENGINE, 'utf8');

  it('elk globals_list-attribuut uit engine.js bestaat in globals.py', () => {
    const globalsPy = uitWheel('play/globals.py');
    // _pygbag_task maakt de bootstrap zelf aan; die hoort hier niet te bestaan.
    const eigen = new Set(['_pygbag_task']);
    const missend = [
      ...new Set([...engine.matchAll(/globals_list\.([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((m) => m[1])),
    ]
      .filter((attr) => !eigen.has(attr))
      .filter((attr) => !new RegExp(`\\b${attr}\\b`).test(globalsPy));

    expect(missend).toEqual([]);
  });

  it('elke from play.… import uit engine.js resolvet in de wheel', () => {
    const problemen: string[] = [];

    for (const m of engine.matchAll(/from play((?:\.[a-z_]+)+) import ([a-zA-Z_, ]+)/g)) {
      const modulePad = `play${m[1].split('.').join('/')}`;
      let bron: string;
      try {
        bron = uitWheel(`${modulePad}.py`);
      } catch {
        try {
          bron = uitWheel(`${modulePad}/__init__.py`);
        } catch {
          problemen.push(`module ${modulePad} bestaat niet in de wheel`);
          continue;
        }
      }
      for (const naam of m[2]
        .split(',')
        .map((n) => n.trim().split(' ')[0])
        .filter(Boolean)) {
        if (!new RegExp(`\\b${naam}\\b`).test(bron)) {
          problemen.push(`${modulePad}: ${naam}`);
        }
      }
    }

    expect(problemen).toEqual([]);
  });

  it('de loop-patch wijst naar bestaande namen in play/loop.py', () => {
    const loopPy = uitWheel('play/loop.py');
    for (const naam of [
      ...new Set([...engine.matchAll(/_play_loop\.([a-zA-Z_]+)/g)].map((m) => m[1])),
    ]) {
      expect(new RegExp(`\\b${naam}\\b`).test(loopPy), naam).toBe(true);
    }
  });
});
