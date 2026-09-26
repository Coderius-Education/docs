import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { algoritmes } from '../../../algorithms/src/data/algorithms';
import {
  kernPerAlgoritme,
  pythonConcepten,
  voorkennisPerAlgoritme,
} from '../../../algorithms/src/data/conceptenkaart';
import { lessen } from '../data/lessen';
import {
  type Activiteit,
  CONCEPTNAMEN,
  activiteiten,
  conceptenIn,
  filter,
  vanafLes,
} from '../data/projecten';

// De projectkiezer op /docs/projecten leunt op twee handgeschreven lijsten:
// de lessen (lessen.ts) en de activiteiten (projecten.ts). Deze test houdt ze
// gelijk aan de cursus, en de algoritmes gelijk aan de algoritmes-cursus.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const DOCS = join(SITE, 'docs');

function lesbestanden(): string[] {
  return readdirSync(DOCS)
    .filter((map) => /^\d+-/.test(map) && statSync(join(DOCS, map)).isDirectory())
    .sort()
    .flatMap((map) =>
      readdirSync(join(DOCS, map))
        .filter((n) => n.endsWith('.mdx'))
        .sort()
        .map((n) => join(map, n)),
    );
}

describe('lessen.ts', () => {
  const bestanden = lesbestanden();

  it('bevat precies de lessen in docs/, in dezelfde volgorde', () => {
    expect(lessen.map((l) => l.id)).toEqual(bestanden.map((b) => basename(b).split('-')[0]));
  });

  it('elke les heeft de kop en het pad van zijn bestand', () => {
    bestanden.forEach((bestand, i) => {
      const [map, naam] = bestand.split('/');
      const tekst = readFileSync(join(DOCS, bestand), 'utf8');
      const kop = tekst.match(/^# (.+)$/m)?.[1];
      const slug = (s: string) => s.replace(/^\d+-/, '').replace(/\.mdx$/, '');
      expect(lessen[i].label, bestand).toBe(kop);
      expect(lessen[i].pad, bestand).toBe(`/docs/${slug(map)}/${slug(naam)}`);
      const categorie = JSON.parse(readFileSync(join(DOCS, map, '_category_.json'), 'utf8'));
      expect(lessen[i].hoofdstuk, bestand).toBe(categorie.label);
    });
  });
});

describe('projecten.ts', () => {
  it('elke activiteit heeft een uniek id en noemt alleen bestaande lessen', () => {
    const ids = activiteiten.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const bekend = new Set(lessen.map((l) => l.id));
    for (const a of activiteiten) {
      expect(a.concepten.length, a.id).toBeGreaterThan(0);
      for (const id of [...a.concepten, ...(a.lessen ?? [])]) {
        expect(bekend.has(id), `${a.id}: les ${id}`).toBe(true);
      }
    }
  });

  it('wat je oefent is een deel van wat nodig is, en elk concept heeft een korte naam', () => {
    for (const a of activiteiten) {
      const nodig = new Set(a.lessen ?? a.concepten);
      for (const id of a.concepten) {
        expect(nodig.has(id), `${a.id}: ${id}`).toBe(true);
        expect(CONCEPTNAMEN[id], `${a.id}: geen naam voor ${id}`).toBeDefined();
      }
    }
    // En geen naam die nergens meer gebruikt wordt.
    expect(Object.keys(CONCEPTNAMEN).sort()).toEqual(conceptenIn(activiteiten).sort());
  });

  it('de algoritmes zijn die van de algoritmes-cursus: kern als concept, voorkennis als nodig', () => {
    const lesVanPad = new Map(lessen.map((l) => [l.pad, l.id]));
    const opKaart = new Map(pythonConcepten.map((c) => [c.id, c.to]));
    const alg = activiteiten.filter((a) => a.soort === 'algoritme');
    expect(alg.map((a) => a.id)).toEqual(algoritmes.map((a) => `algoritme-${a.slug}`));
    for (const a of algoritmes) {
      const kaart = alg.find((x) => x.id === `algoritme-${a.slug}`) as Activiteit;
      expect(kaart.titel).toBe(a.titel);
      expect(kaart.wat).toBe(a.samenvatting);
      expect(kaart.link).toEqual({ site: 'algorithms', to: a.startPad });
      const naarLes = (ids: string[]) =>
        [...new Set(ids.map((c) => lesVanPad.get(opKaart.get(c) ?? '')))].sort();
      expect([...(kaart.lessen ?? [])].sort(), a.slug).toEqual(
        naarLes(voorkennisPerAlgoritme[a.slug]),
      );
      expect([...kaart.concepten].sort(), a.slug).toEqual(naarLes(kernPerAlgoritme[a.slug]));
    }
  });

  it('beide overzichten gebruiken de projectkiezer, het turtle-overzicht alleen met turtle', () => {
    const hoofd = readFileSync(join(DOCS, 'projecten', 'index.mdx'), 'utf8');
    const turtle = readFileSync(join(DOCS, 'projecten', 'turtle', 'index.mdx'), 'utf8');
    expect(hoofd).toContain('<ProjectKiezer />');
    expect(turtle).toContain("<ProjectKiezer soorten={['turtle']} />");
  });
});

describe('filter en conceptenIn', () => {
  const vind = (id: string) => activiteiten.find((a) => a.id === id) as Activiteit;

  it('zonder keuze staat alles er, in de volgorde waarin je het kunt doen', () => {
    const alles = filter(activiteiten, null, null);
    expect(alles).toHaveLength(activiteiten.length);
    const plekken = alles.map((a) => lessen.indexOf(vanafLes(a)));
    expect(plekken).toEqual([...plekken].sort((x, y) => x - y));
  });

  it('een concept toont precies de activiteiten die het oefenen', () => {
    const met = filter(activiteiten, '07', null).map((a) => a.id);
    expect(met).toContain('turtle-spiraal');
    expect(met).toContain('algoritme-binair-zoeken');
    expect(met).not.toContain('turtle-veelhoeken');
    for (const id of met) expect(vind(id).concepten).toContain('07');
  });

  it('max én min oefent geen tuples: dat is voorkennis, geen kern', () => {
    expect(filter(activiteiten, '12', null).map((a) => a.id)).not.toContain('algoritme-max-en-min');
    expect(vind('algoritme-max-en-min').lessen).toContain('12');
  });

  it('de soort filtert daarbovenop', () => {
    const turtle = filter(activiteiten, '06a', 'turtle');
    expect(turtle.length).toBeGreaterThan(0);
    expect(turtle.every((a) => a.soort === 'turtle' && a.concepten.includes('06a'))).toBe(true);
  });

  it('conceptenIn geeft de gebruikte concepten in de volgorde van de cursus', () => {
    const ids = conceptenIn(activiteiten);
    expect(ids).toEqual(lessen.map((l) => l.id).filter((id) => ids.includes(id)));
    expect(conceptenIn([vind('turtle-robotkop')])).toEqual(['02', '03']);
  });

  it('vanafLes is de laatste les die nodig is', () => {
    expect(vanafLes(vind('tien-groene-flessen')).id).toBe('09b');
    expect(vanafLes(vind('turtle-regenboog')).id).toBe('10a');
  });
});
