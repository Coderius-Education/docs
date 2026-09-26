import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { algoritmes } from '../../../algorithms/src/data/algorithms';
import {
  pythonConcepten,
  voorkennisPerAlgoritme,
} from '../../../algorithms/src/data/conceptenkaart';
import { lessen } from '../data/lessen';
import { type Activiteit, activiteiten, indelen, pastNa } from '../data/projecten';

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
      expect(a.lessen.length, a.id).toBeGreaterThan(0);
      for (const id of a.lessen) expect(bekend.has(id), `${a.id}: les ${id}`).toBe(true);
    }
  });

  it('de algoritmes zijn die van de algoritmes-cursus, met de lessen van de conceptenkaart', () => {
    const lesVanPad = new Map(lessen.map((l) => [l.pad, l.id]));
    const opKaart = new Map(pythonConcepten.map((c) => [c.id, c.to]));
    const alg = activiteiten.filter((a) => a.soort === 'algoritme');
    expect(alg.map((a) => a.id)).toEqual(algoritmes.map((a) => `algoritme-${a.slug}`));
    for (const a of algoritmes) {
      const kaart = alg.find((x) => x.id === `algoritme-${a.slug}`) as Activiteit;
      expect(kaart.titel).toBe(a.titel);
      expect(kaart.wat).toBe(a.samenvatting);
      expect(kaart.link).toEqual({ site: 'algorithms', to: a.startPad });
      const nodig = voorkennisPerAlgoritme[a.slug].map((c) => lesVanPad.get(opKaart.get(c) ?? ''));
      expect([...kaart.lessen].sort(), a.slug).toEqual([...new Set(nodig)].sort());
    }
  });

  it('beide overzichten gebruiken de projectkiezer, het turtle-overzicht alleen met turtle', () => {
    const hoofd = readFileSync(join(DOCS, 'projecten', 'index.mdx'), 'utf8');
    const turtle = readFileSync(join(DOCS, 'projecten', 'turtle', 'index.mdx'), 'utf8');
    expect(hoofd).toContain('<ProjectKiezer />');
    expect(turtle).toContain("<ProjectKiezer soorten={['turtle']} />");
  });
});

describe('indelen', () => {
  const vind = (id: string) => activiteiten.find((a) => a.id === id) as Activiteit;

  it('zonder gekozen les past alles, in de volgorde van de cursus', () => {
    const { nu, straks } = indelen(activiteiten, null, null);
    expect(straks).toEqual([]);
    expect(nu).toHaveLength(activiteiten.length);
    const plekken = nu.map((a) => lessen.indexOf(pastNa(a)));
    expect(plekken).toEqual([...plekken].sort((x, y) => x - y));
  });

  it('bij een les past wat alleen die les of eerdere nodig heeft', () => {
    const { nu, straks } = indelen(activiteiten, '05c', null);
    expect(nu.map((a) => a.id)).toContain('turtle-verkeerslicht');
    expect(nu.map((a) => a.id)).toContain('turtle-een-huis');
    expect(straks.map((a) => a.id)).toContain('turtle-veelhoeken');
    expect(straks.map((a) => a.id)).toContain('tien-groene-flessen');
  });

  it('de les zelf telt mee: bij 6a For-loop passen de veelhoeken', () => {
    const { nu } = indelen(activiteiten, '06a', null);
    expect(nu).toContain(vind('turtle-veelhoeken'));
  });

  it('de soort filtert beide lijsten', () => {
    const { nu, straks } = indelen(activiteiten, '05c', 'turtle');
    expect([...nu, ...straks].every((a) => a.soort === 'turtle')).toBe(true);
    expect(nu.length + straks.length).toBe(activiteiten.filter((a) => a.soort === 'turtle').length);
  });

  it('pastNa is de laatste les die nodig is', () => {
    expect(pastNa(vind('tien-groene-flessen')).id).toBe('09b');
    expect(pastNa(vind('turtle-een-huis')).id).toBe('01');
  });
});
