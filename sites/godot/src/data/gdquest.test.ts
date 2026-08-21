import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GDQUEST_LESSEN, GDQUEST_URL, gdquestBySlug, gdquestKoppelingen } from './gdquest';

// Bewaakt de <GDQuestLes>-callouts. Het component zoekt op paginaslug en
// rendert niets bij een onbekende slug, dus een typefout is op de pagina zelf
// onzichtbaar. Deze test maakt dat geval hard, net als de koppeling met
// Code.org in web.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const CALLOUT_RE = /<GDQuestLes\s+slug="([^"]+)"/g;

function alleLessen(map: string): { pad: string; inhoud: string }[] {
  const gevonden: { pad: string; inhoud: string }[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) {
      gevonden.push(...alleLessen(volledig));
    } else if (/\.mdx?$/.test(entry.name)) {
      gevonden.push({ pad: volledig, inhoud: readFileSync(volledig, 'utf8') });
    }
  }
  return gevonden;
}

const lessen = alleLessen(DOCS);

// slug uit de frontmatter -> bestandspad
const slugPerBestand = new Map<string, string>();
for (const { pad, inhoud } of lessen) {
  const slug = inhoud.match(/^slug:\s*\/(\S+)/m)?.[1];
  if (slug) slugPerBestand.set(slug, pad);
}

function gebruikteSlugs(): { slug: string; pad: string }[] {
  return lessen.flatMap(({ pad, inhoud }) =>
    [...inhoud.matchAll(CALLOUT_RE)].map((m) => ({ slug: m[1], pad })),
  );
}

describe('GDQuest-lessenlijst', () => {
  it('heeft oplopende, unieke nummers en een titel per les', () => {
    const nummers = GDQUEST_LESSEN.map((l) => l.nummer);
    expect(new Set(nummers).size).toBe(nummers.length);
    expect(nummers).toEqual([...nummers].sort((a, b) => a - b));
    expect(GDQUEST_LESSEN.filter((l) => l.titel.trim() === '')).toEqual([]);
  });

  it('verwijst naar de cursus zelf, niet naar een losse les-URL', () => {
    // Losse les-URL's zijn vanaf hier niet te controleren; zie gdquest.ts.
    expect(GDQUEST_URL).toBe('https://gdquest.github.io/learn-gdscript/');
  });
});

describe('GDQuest-koppelingen', () => {
  it('wijst elke koppeling naar een bestaande lespagina', () => {
    const kapot = gdquestKoppelingen
      .filter((k) => !slugPerBestand.has(k.slug))
      .map((k) => `${k.slug} bestaat niet als lespagina`);

    expect(kapot).toEqual([]);
  });

  it('gebruikt alleen lesnummers die in de lijst staan', () => {
    const bekend = new Set(GDQUEST_LESSEN.map((l) => l.nummer));
    const kapot = gdquestKoppelingen.flatMap((k) =>
      k.lessen.filter((n) => !bekend.has(n)).map((n) => `${k.slug} verwijst naar les ${n}`),
    );

    expect(kapot).toEqual([]);
  });

  it('heeft een onderwerp zodra het lesnummer nog ontbreekt', () => {
    // Anders zou de callout "Dat oefen je los in ." tonen.
    const kapot = gdquestKoppelingen
      .filter((k) => k.lessen.length === 0 && !k.onderwerp)
      .map((k) => `${k.slug} heeft geen lessen en geen onderwerp`);

    expect(kapot).toEqual([]);
  });

  it('vult per koppeling een concept en een titel in', () => {
    for (const k of gdquestKoppelingen) {
      expect(k.concept.trim(), `${k.slug} mist een concept`).not.toBe('');
      expect(k.nl.trim(), `${k.slug} mist een titel`).not.toBe('');
      expect(k.to).toBe(`/docs/${k.slug}`);
    }
  });

  it('heeft geen dubbele slugs', () => {
    const slugs = gdquestKoppelingen.map((k) => k.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(Object.keys(gdquestBySlug).length).toBe(slugs.length);
  });
});

describe('GDQuest-callouts in de lessen', () => {
  it('staat op elke pagina die in de mapping staat, en nergens anders', () => {
    const gebruikt = gebruikteSlugs();

    const onbekend = gebruikt
      .filter(({ slug }) => !gdquestBySlug[slug])
      .map(({ slug, pad }) => `${slug} in ${pad.slice(DOCS.length + 1)}`);
    expect(onbekend).toEqual([]);

    const ontbreekt = gdquestKoppelingen
      .map((k) => k.slug)
      .filter((slug) => !gebruikt.some((g) => g.slug === slug));
    expect(ontbreekt).toEqual([]);
  });

  it('zet de callout op de pagina waar hij over gaat', () => {
    // Een callout met de slug van een ándere les leest als een fout van ons.
    const verkeerd: string[] = [];
    for (const { slug, pad } of gebruikteSlugs()) {
      if (slugPerBestand.get(slug) !== pad) {
        verkeerd.push(`callout "${slug}" staat in ${pad.slice(DOCS.length + 1)}`);
      }
    }
    expect(verkeerd).toEqual([]);
  });
});
