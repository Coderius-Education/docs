import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  HOOFDSTUKKEN,
  LEERLIJNEN,
  conceptenPerLes,
  godotConcepten,
  lessen,
  uitlegSlug,
} from './conceptenkaart';

// Bewaakt dat de conceptenkaart gelijk blijft aan de lessen: elke slug
// bestaat, elk `to`-anker staat letterlijk als \{#anker} in het bronbestand,
// en de kaartdata is intern consistent. Ankers vallen buiten de linkcheck
// van `pnpm build`, dus zonder deze test breekt een hernoemde kop de kaart
// pas op in productie.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function alleLesbestanden(map: string): string[] {
  const paden: string[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) {
      paden.push(...alleLesbestanden(volledig));
    } else if (/\.mdx?$/.test(entry.name)) {
      paden.push(volledig);
    }
  }
  return paden;
}

// slug (zonder slash) -> bestandsinhoud, en -> hoofdstuknummer uit de mapnaam
const inhoudPerSlug = new Map<string, string>();
const hoofdstukPerSlug = new Map<string, number>();
for (const pad of alleLesbestanden(DOCS)) {
  const inhoud = readFileSync(pad, 'utf8');
  const slug = inhoud.match(/^slug:\s*\/(\S+)/m)?.[1];
  if (!slug) continue;
  inhoudPerSlug.set(slug, inhoud);
  const map = pad.slice(DOCS.length + 1).split(/[/\\]/)[0];
  const nummer = map.match(/^(\d+)-/)?.[1];
  if (nummer) hoofdstukPerSlug.set(slug, Number(nummer));
}

function categorieLabel(nummer: number): string | undefined {
  const map = readdirSync(DOCS, { withFileTypes: true }).find(
    (e) => e.isDirectory() && e.name.startsWith(`${String(nummer).padStart(2, '0')}-`),
  );
  if (!map) return undefined;
  return JSON.parse(readFileSync(join(DOCS, map.name, '_category_.json'), 'utf8')).label;
}

describe('conceptenkaart-data', () => {
  it('elke les bestaat als docs-pagina en komt maar één keer voor', () => {
    const slugs = lessen.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.filter((slug) => !inhoudPerSlug.has(slug))).toEqual([]);
  });

  it('conceptenPerLes heeft exact de lessen als sleutels', () => {
    expect(Object.keys(conceptenPerLes).sort()).toEqual(lessen.map((l) => l.slug).sort());
  });

  it('elk concept-id in conceptenPerLes bestaat, en elk concept wordt gebruikt', () => {
    const bekend = new Set(godotConcepten.map((c) => c.id));
    const gebruikt = new Set(Object.values(conceptenPerLes).flat());

    expect([...gebruikt].filter((id) => !bekend.has(id))).toEqual([]);
    expect(godotConcepten.map((c) => c.id).filter((id) => !gebruikt.has(id))).toEqual([]);
  });

  it('geen dubbele concepten binnen één les en geen dubbele concept-ids', () => {
    for (const [slug, ids] of Object.entries(conceptenPerLes)) {
      expect(new Set(ids).size, `dubbel concept in les '${slug}'`).toBe(ids.length);
    }
    const ids = godotConcepten.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elke leerlijn bestaat en heeft minstens één concept', () => {
    const bekend = new Set(LEERLIJNEN.map((l) => l.id));
    for (const concept of godotConcepten) {
      expect(bekend.has(concept.leerlijn), `onbekende leerlijn bij '${concept.id}'`).toBe(true);
    }
    for (const leerlijn of LEERLIJNEN) {
      expect(
        godotConcepten.some((c) => c.leerlijn === leerlijn.id),
        `leerlijn '${leerlijn.id}' is leeg`,
      ).toBe(true);
    }
  });

  it('elk to-anker staat letterlijk als \\{#anker} in het lesbestand', () => {
    const kapot: string[] = [];
    for (const concept of godotConcepten) {
      const match = concept.to.match(/^\/docs\/([^#]+)#([\w-]+)$/);
      if (!match) {
        kapot.push(`${concept.id}: '${concept.to}' is geen /docs/<slug>#<anker>`);
        continue;
      }
      const [, slug, anker] = match;
      const inhoud = inhoudPerSlug.get(slug);
      if (!inhoud) {
        kapot.push(`${concept.id}: les '${slug}' bestaat niet`);
      } else if (!inhoud.includes(`\\{#${anker}}`)) {
        kapot.push(`${concept.id}: anker '\\{#${anker}}' ontbreekt in '${slug}'`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de les waar een concept naar wijst, heeft dat concept ook op de kaart', () => {
    const kapot: string[] = [];
    for (const concept of godotConcepten) {
      const slug = concept.to.match(/^\/docs\/([^#]+)#/)?.[1] ?? '';
      if (!(conceptenPerLes[slug] ?? []).includes(concept.id)) {
        kapot.push(`${concept.id} wijst naar '${slug}' maar staat daar niet bij`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('geeft elke les het hoofdstuk van de map waarin hij staat', () => {
    // Vangt een verplaatst hoofdstuk: de kaart filtert hierop, en een
    // verkeerd nummer laat een les in het verkeerde hoofdstuk opduiken.
    const kapot = lessen
      .filter((l) => hoofdstukPerSlug.get(l.slug) !== l.hoofdstuk)
      .map((l) => `${l.slug}: kaart zegt ${l.hoofdstuk}, map zegt ${hoofdstukPerSlug.get(l.slug)}`);

    expect(kapot).toEqual([]);
  });

  it('kent elk hoofdstuk dat lessen heeft, met het label uit _category_.json', () => {
    const bekend = new Set(HOOFDSTUKKEN.map((h) => h.nummer));
    expect([...new Set(lessen.map((l) => l.hoofdstuk))].filter((n) => !bekend.has(n))).toEqual([]);

    const kapot: string[] = [];
    for (const h of HOOFDSTUKKEN) {
      if (!lessen.some((l) => l.hoofdstuk === h.nummer)) {
        kapot.push(`hoofdstuk ${h.nummer} heeft geen lessen op de kaart`);
      }
      const label = categorieLabel(h.nummer);
      if (label !== h.label) {
        kapot.push(`hoofdstuk ${h.nummer}: kaart zegt '${h.label}', map zegt '${label}'`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('legt elk concept uit in een les die ook op de kaart staat', () => {
    // De kaart tekent een dikke lijn naar die ene les en noemt hem in het
    // paneel; wijst `to` naar een pagina buiten `lessen`, dan valt dat weg.
    const opDeKaart = new Set(lessen.map((l) => l.slug));
    const kapot = godotConcepten
      .filter((c) => !opDeKaart.has(uitlegSlug(c)))
      .map((c) => `${c.id} legt uit in '${uitlegSlug(c)}', maar die les staat niet op de kaart`);

    expect(kapot).toEqual([]);
  });
});
