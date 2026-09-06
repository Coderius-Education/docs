import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De lessen van deze site hangen aan hun volgorde: bestandsprefix en
// sidebar_position moeten gelijklopen en per hoofdstuk aaneengesloten zijn.
// De H1 (tevens sidebar-label) draagt geen nummer; de sidebar is de volgorde.
// Bij het invoegen van 02-bekijk schoven zestig bestanden op; niets bewaakte
// tot dan of de "Door naar"-links nog klopten. Docusaurus vangt alleen
// kapotte links, niet een verkeerde volgorde.
//
// De bouwstappen staan in een submap bouwen/ met een eigen _category_.json,
// maar tellen mee in de nummering van het hoofdstuk: de nummers van de
// hoofdstukmap en de submap vormen samen één aaneengesloten reeks, en de
// positie van de submap is het nummer van zijn eerste les. De eerste les van
// het hoofdstuk is het overzicht en linkt naar elke bouwstap.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const MET_BEKIJK = [
  'lineair-zoeken',
  'vind-maximum',
  'max-en-min',
  'binair-zoeken',
  'selection-sort',
  'bubble-sort',
];

type Les = {
  hoofdstuk: string;
  /** Pad vanaf docs/, zonder extensie: 'lineair-zoeken/bouwen/04-doorlopen'. */
  id: string;
  bestand: string;
  /** '' in de hoofdstukmap, 'bouwen' in de submap. */
  map: string;
  prefix: number;
  tekst: string;
};

function hoofdstukken(): string[] {
  return readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(DOCS, e.name, '_category_.json')))
    .map((e) => e.name)
    .sort();
}

function categorie(pad: string): { position: number; label: string } {
  return JSON.parse(readFileSync(join(DOCS, pad, '_category_.json'), 'utf8'));
}

/** De lessen van een hoofdstuk, inclusief die in de submap bouwen/, op nummer. */
function lessen(hoofdstuk: string): Les[] {
  const uit: Les[] = [];
  for (const map of ['', 'bouwen']) {
    const dir = join(DOCS, hoofdstuk, map);
    if (!existsSync(dir)) continue;
    for (const bestand of readdirSync(dir)
      .filter((f) => /^\d\d-.*\.mdx?$/.test(f))
      .sort()) {
      const stem = bestand.replace(/\.mdx?$/, '');
      uit.push({
        hoofdstuk,
        id: map ? `${hoofdstuk}/${map}/${stem}` : `${hoofdstuk}/${stem}`,
        bestand: map ? `${map}/${bestand}` : bestand,
        map,
        prefix: Number(bestand.slice(0, 2)),
        tekst: readFileSync(join(dir, bestand), 'utf8'),
      });
    }
  }
  return uit.sort((a, b) => a.prefix - b.prefix);
}

/** Bestaat het lesbestand met dit pad vanaf docs/ (zonder extensie of anker)? */
function bestaat(pad: string): boolean {
  const kaal = pad.replace(/[#?].*$/, '').replace(/\/$/, '');
  return existsSync(join(DOCS, `${kaal}.mdx`)) || existsSync(join(DOCS, `${kaal}.md`));
}

/** Een relatieve link (./x, ../x) vanuit een les, als pad vanaf docs/. */
function doelVan(les: Les, link: string): string {
  return posix.normalize(posix.join(posix.dirname(les.id), link));
}

const ALLE = hoofdstukken().flatMap(lessen);

describe('de nummering van de lessen', () => {
  it('vindt lessen in alle hoofdstukken', () => {
    expect(ALLE.length).toBeGreaterThan(100);
  });

  it('bestandsprefix en sidebar_position zijn gelijk', () => {
    const kapot = ALLE.filter((l) => !l.tekst.includes(`\nsidebar_position: ${l.prefix}\n`)).map(
      (l) => `${l.hoofdstuk}/${l.bestand}`,
    );
    expect(kapot).toEqual([]);
  });

  it('de H1 draagt geen lesnummer: de volgorde in de sidebar is de volgorde', () => {
    // De H1 is ook het sidebar-label. "1.4 Bouwsteen 1" las als een
    // paragraafnummer en verschoof bij elke ingeschoven les; het bestandsprefix
    // bepaalt de volgorde, de tekst hoeft dat niet te herhalen.
    const kapot = ALLE.filter((l) => /^# \d+\.\d+/m.test(l.tekst)).map((l) => l.id);
    expect(kapot).toEqual([]);
  });

  it('per hoofdstuk zijn de nummers aaneengesloten vanaf 1', () => {
    for (const h of hoofdstukken()) {
      const prefixen = lessen(h).map((l) => l.prefix);
      expect(prefixen, h).toEqual(prefixen.map((_, i) => i + 1));
    }
  });
});

describe('de links tussen lessen', () => {
  it('elke ./NN-, ../hoofdstuk/NN- en /docs/hoofdstuk/NN-link wijst naar een bestaand bestand', () => {
    const kapot: string[] = [];
    for (const l of ALLE) {
      for (const m of l.tekst.matchAll(/\]\((\.\.?\/[^)\s]+|\/docs\/[^)\s]+)\)/g)) {
        const link = m[1];
        if (!/(^|\/)\d\d-/.test(link)) continue;
        const pad = link.startsWith('/docs/') ? link.slice('/docs/'.length) : doelVan(l, link);
        if (!bestaat(pad)) kapot.push(`${l.id} -> ${m[0]}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('links noemen geen lesnummers in hun tekst', () => {
    // "[stap 4: …]" en "[1.8 Het complete algoritme]" verwezen naar nummers die
    // de H1 niet meer draagt.
    const kapot: string[] = [];
    for (const l of ALLE) {
      for (const m of l.tekst.matchAll(/\[(?:stap \d+:|\d+\.\d+ )[^\]]*\]\(/g)) {
        kapot.push(`${l.id}: ${m[0]}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de lescontrole herkent een verzonnen pad wél als kapot', () => {
    expect(bestaat('lineair-zoeken/01-concept')).toBe(true);
    expect(bestaat('lineair-zoeken/99-onzin')).toBe(false);
  });
});

describe('de bekijk-pagina en de verdwenen bouwsteen-widgets', () => {
  it('de zes zoek- en sorteerhoofdstukken hebben 02-bekijk met alleen de visualisatie', () => {
    for (const h of MET_BEKIJK) {
      const les = lessen(h).find((l) => l.bestand === '02-bekijk.mdx');
      expect(les, h).toBeDefined();
      expect(les?.tekst).toMatch(/<AlgorithmModel algorithm="[a-z-]+" alleenVisualisatie \/>/);
      expect(les?.tekst).toContain('<details>');
    }
  });

  it('de eerste les van elk hoofdstuk met bouwstappen linkt als overzicht naar elke stap en naar compleet', () => {
    // "Zo bouw je het op": de leerling ziet de route voordat de submap opengaat.
    const kapot: string[] = [];
    for (const h of hoofdstukken()) {
      const alle = lessen(h);
      const stappen = alle.filter((l) => l.map === 'bouwen');
      if (stappen.length === 0) continue;
      const eerste = alle[0];
      expect(eerste.tekst, h).toContain('## Zo bouw je het op');
      for (const stap of stappen) {
        if (!eerste.tekst.includes(`](./bouwen/${posix.basename(stap.id)})`))
          kapot.push(`${h}: ${stap.id}`);
      }
      const compleet = alle.find((l) => l.map === '' && /-compleet$/.test(l.id));
      if (compleet && !eerste.tekst.includes(`](./${posix.basename(compleet.id)})`))
        kapot.push(`${h}: ${compleet.id}`);
    }
    expect(kapot).toEqual([]);
  });

  it('geen enkele les gebruikt nog SteppingStoneModel', () => {
    const nog = ALLE.filter((l) => l.tekst.includes('SteppingStoneModel')).map((l) => l.id);
    expect(nog).toEqual([]);
  });
});
