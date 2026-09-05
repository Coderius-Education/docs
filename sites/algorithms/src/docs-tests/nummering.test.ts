import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De lessen van deze site hangen aan hun nummer: bestandsprefix,
// sidebar_position, het nummer in de H1 en de "Door naar [stap N: …]"-links
// moeten gelijklopen. Bij het invoegen van 02-bekijk schoven zestig
// bestanden op; niets bewaakte tot dan of een H1 nog bij zijn bestand
// hoorde of een staplabel bij zijn doel. Docusaurus vangt alleen kapotte
// links, niet een verkeerd nummer.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const MET_BEKIJK = [
  'lineair-zoeken',
  'vind-maximum',
  'max-en-min',
  'binair-zoeken',
  'selection-sort',
  'bubble-sort',
];

type Les = { hoofdstuk: string; bestand: string; prefix: number; tekst: string };

function hoofdstukken(): string[] {
  return readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(DOCS, e.name, '_category_.json')))
    .map((e) => e.name)
    .sort();
}

function positieVan(hoofdstuk: string): number {
  return JSON.parse(readFileSync(join(DOCS, hoofdstuk, '_category_.json'), 'utf8')).position;
}

function lessen(hoofdstuk: string): Les[] {
  return readdirSync(join(DOCS, hoofdstuk))
    .filter((f) => /^\d\d-.*\.mdx?$/.test(f))
    .sort()
    .map((bestand) => ({
      hoofdstuk,
      bestand,
      prefix: Number(bestand.slice(0, 2)),
      tekst: readFileSync(join(DOCS, hoofdstuk, bestand), 'utf8'),
    }));
}

/** Bestaat het lesbestand `hoofdstuk/NN-naam` (zonder extensie of anker)? */
function bestaat(pad: string): boolean {
  const kaal = pad.replace(/[#?].*$/, '').replace(/\/$/, '');
  return existsSync(join(DOCS, `${kaal}.mdx`)) || existsSync(join(DOCS, `${kaal}.md`));
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

  it('de H1 draagt het nummer hoofdstuk.les van zijn bestand', () => {
    const kapot = ALLE.filter((l) => {
      const kop = l.tekst.match(/^# (\S+) /m)?.[1];
      return kop !== `${positieVan(l.hoofdstuk)}.${l.prefix}`;
    }).map((l) => `${l.hoofdstuk}/${l.bestand}`);
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
      for (const m of l.tekst.matchAll(/\]\((\.\/|\.\.\/|\/docs\/)([^)\s]+)\)/g)) {
        const [, soort, rest] = m;
        if (!/(^|\/)\d\d-/.test(rest)) continue;
        const pad = soort === './' ? `${l.hoofdstuk}/${rest}` : rest;
        if (!bestaat(pad)) kapot.push(`${l.hoofdstuk}/${l.bestand} -> ${m[0]}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('het nummer in "Door naar [stap N: …]" is het nummer van het doelbestand', () => {
    const kapot: string[] = [];
    for (const l of ALLE) {
      for (const m of l.tekst.matchAll(/\[stap (\d+): [^\]]+\]\(\.\/(\d\d)-/g)) {
        if (Number(m[1]) !== Number(m[2])) kapot.push(`${l.hoofdstuk}/${l.bestand}: ${m[0]}`);
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

  it('geen enkele les gebruikt nog SteppingStoneModel', () => {
    const nog = ALLE.filter((l) => l.tekst.includes('SteppingStoneModel')).map(
      (l) => `${l.hoofdstuk}/${l.bestand}`,
    );
    expect(nog).toEqual([]);
  });
});
