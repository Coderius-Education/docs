import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { algoritmes } from './algorithms';
import { pythonConcepten, voorkennisPerAlgoritme } from './conceptenkaart';

// Bewaakt dat conceptenkaart.ts gelijk blijft aan de echte <Voorkennis>-
// blokken in docs/**/*.mdx, en dat elke python-les die de kaart noemt
// terugwijst naar deze cursus. Stond eerst in scripts/check-voorkennis.mjs,
// dat nergens in CI draaide. Of de links zelf ergens op uitkomen bewaakt
// packages/shared/sitelink.test.ts monorepo-breed.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const PYTHON_DOCS = join(SITE, '..', 'python', 'docs');

const ITEM_RE = /\{site: 'python', to: '([^']+)', label: '([^']+)'\}/g;

function mdxBestanden(map: string): string[] {
  return readdirSync(map, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.mdx'))
    .map((e) => join(e.parentPath, e.name));
}

/** Per hoofdstuk (eerste padsegment) de unie van python-voorkennispaden uit de MDX. */
function voorkennisUitDocs(): { perHoofdstuk: Map<string, Set<string>>; paden: Set<string> } {
  const perHoofdstuk = new Map<string, Set<string>>();
  const paden = new Set<string>();
  for (const bestand of mdxBestanden(DOCS)) {
    const hoofdstuk = relative(DOCS, bestand).split(sep)[0];
    for (const m of readFileSync(bestand, 'utf8').matchAll(ITEM_RE)) {
      if (!perHoofdstuk.has(hoofdstuk)) perHoofdstuk.set(hoofdstuk, new Set());
      perHoofdstuk.get(hoofdstuk)?.add(m[1]);
      paden.add(m[1]);
    }
  }
  return { perHoofdstuk, paden };
}

describe('conceptenkaart.ts versus de <Voorkennis>-blokken in docs/', () => {
  const { perHoofdstuk, paden } = voorkennisUitDocs();
  const slugs = algoritmes.map((a) => a.slug).sort();
  const padPerId = new Map(pythonConcepten.map((c) => [c.id, c.to]));

  it('vindt überhaupt voorkennisblokken', () => {
    expect(perHoofdstuk.size).toBeGreaterThan(3);
  });

  it('hoofdstukken met python-voorkennis, slugs en datafile-keys vormen dezelfde set', () => {
    expect([...perHoofdstuk.keys()].sort()).toEqual(slugs);
    expect(Object.keys(voorkennisPerAlgoritme).sort()).toEqual(slugs);
  });

  it.each([...perHoofdstuk.entries()])(
    '%s: de kaart noemt precies de voorkennis uit de lessen',
    (hoofdstuk, mdxPaden) => {
      const dataPaden = (voorkennisPerAlgoritme[hoofdstuk] ?? []).map((id) => {
        const pad = padPerId.get(id);
        expect(pad, `onbekend concept-id '${id}' bij '${hoofdstuk}'`).toBeDefined();
        return pad;
      });
      expect([...dataPaden].sort()).toEqual([...mdxPaden].sort());
    },
  );

  it('de conceptenlijst dekt exact de python-paden die in docs/ voorkomen', () => {
    expect(pythonConcepten.map((c) => c.to).sort()).toEqual([...paden].sort());
  });
});

describe('de omgekeerde richting: python-lessen wijzen terug naar deze cursus', () => {
  // De python-cursus stript numerieke prefixen uit zijn URL's
  // (06-data/12-tuples.mdx -> /docs/data/tuples).
  const padNaarBestand = new Map<string, string>();
  for (const bron of mdxBestanden(PYTHON_DOCS)) {
    const publiek = relative(PYTHON_DOCS, bron)
      .replace(/\.mdx$/, '')
      .split(sep)
      .map((deel) => deel.replace(/^\d+-/, ''))
      .join('/');
    padNaarBestand.set(`/docs/${publiek}`, bron);
  }

  const TERUG_KOP = 'Waar kom je dit later weer tegen?';

  it.each(pythonConcepten.map((c) => [c.label, c] as const))(
    '%s heeft een terugverwijzing',
    (_label, concept) => {
      const bron = padNaarBestand.get(concept.to);
      expect(bron, `kaart-pad '${concept.to}' hoort bij geen python-les`).toBeDefined();
      if (!bron) return;
      const inhoud = readFileSync(bron, 'utf8');
      expect(inhoud).toContain(TERUG_KOP);
      expect(inhoud).toContain('site="algorithms"');
    },
  );
});
