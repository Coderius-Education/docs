import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lesBestaat } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { algoritmes } from './algorithms';
import { pythonConcepten, voorkennisPerAlgoritme } from './conceptenkaart';

// Bewaakt de interne consistentie van de kaartdata en of alles waar ze naar
// wijst op schijf bestaat. voorkennis.test.ts hiernaast vergelijkt de kaart
// met de <Voorkennis>-blokken in de lessen; wat daar niet aan bod komt staat
// hier: dubbele ids, een concept dat niemand gebruikt, een startPad naar een
// hernoemde les, en de lesvolgorde die de linkerkolom van de kaart bepaalt.
// Cross-site paden vallen buiten de linkcheck van `pnpm build`.

const SITES_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const PYTHON_DOCS = join(SITES_ROOT, 'python', 'docs');

const slugs = algoritmes.map((a) => a.slug);
const conceptIds = new Set(pythonConcepten.map((c) => c.id));

/**
 * Positie van een python-pad in de lesvolgorde: (mapnummer, bestandsprefix).
 * '/docs/tekst/04a-f-strings' -> ['02', '04a']. Docusaurus stript alleen een
 * puur numeriek prefix, dus '04a-f-strings' staat nog in de URL en
 * 'tuples' niet meer (12-tuples.mdx).
 */
function lesPositie(to: string): [string, string] | undefined {
  const [mapSlug, paginaSlug] = to.replace(/^\/docs\//, '').split('/');
  const map = readdirSync(PYTHON_DOCS, { withFileTypes: true }).find(
    (e) => e.isDirectory() && e.name.replace(/^\d+-/, '') === mapSlug,
  );
  if (!map) return undefined;
  const bestand = readdirSync(join(PYTHON_DOCS, map.name)).find((naam) => {
    const kaal = naam.replace(/\.mdx?$/, '');
    return kaal === paginaSlug || kaal.replace(/^\d+-/, '') === paginaSlug;
  });
  if (!bestand) return undefined;
  return [map.name.split('-')[0], bestand.split('-')[0]];
}

describe('pythonConcepten', () => {
  it('id, label en pad zijn elk uniek', () => {
    for (const veld of ['id', 'label', 'to'] as const) {
      const waarden = pythonConcepten.map((c) => c[veld]);
      expect(new Set(waarden).size, `dubbel in '${veld}'`).toBe(waarden.length);
    }
  });

  it('elk pad wijst naar een bestaande les in de python-cursus', () => {
    const kapot = pythonConcepten
      .filter((c) => !lesBestaat(SITES_ROOT, 'python', c.to))
      .map((c) => `${c.id} -> ${c.to}`);
    expect(kapot).toEqual([]);
  });

  it('staat in de lesvolgorde van de python-cursus', () => {
    // De lijst bepaalt de verticale volgorde van de linkerkolom; een concept
    // op de verkeerde plek laat de lijnen op de kaart elkaar kruisen.
    const posities = pythonConcepten.map((c) => lesPositie(c.to)?.join('/') ?? `?${c.to}`);
    expect(posities).toEqual([...posities].sort());
  });

  it('elk concept is voorkennis voor minstens één algoritme', () => {
    const gebruikt = new Set(Object.values(voorkennisPerAlgoritme).flat());
    expect([...conceptIds].filter((id) => !gebruikt.has(id))).toEqual([]);
  });
});

describe('voorkennisPerAlgoritme', () => {
  it('elke sleutel is een algoritme-slug en elk algoritme heeft voorkennis', () => {
    expect(Object.keys(voorkennisPerAlgoritme).sort()).toEqual([...slugs].sort());
    const leeg = slugs.filter((slug) => (voorkennisPerAlgoritme[slug] ?? []).length === 0);
    expect(leeg).toEqual([]);
  });

  it('elke waarde is een bekend concept-id, hoogstens één keer per algoritme', () => {
    const kapot: string[] = [];
    for (const [slug, ids] of Object.entries(voorkennisPerAlgoritme)) {
      for (const id of ids) {
        if (!conceptIds.has(id)) kapot.push(`${slug}: onbekend concept '${id}'`);
      }
      if (new Set(ids).size !== ids.length) kapot.push(`${slug}: dubbel concept`);
    }
    expect(kapot).toEqual([]);
  });
});

describe('algoritmes', () => {
  it('elke slug komt maar één keer voor', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('elk startPad ligt in de map van de slug en bestaat als les', () => {
    const kapot = algoritmes
      .filter(
        (a) =>
          !a.startPad.startsWith(`/docs/${a.slug}/`) ||
          !lesBestaat(SITES_ROOT, 'algorithms', a.startPad),
      )
      .map((a) => `${a.slug} -> ${a.startPad}`);
    expect(kapot).toEqual([]);
  });

  it('de lescontrole herkent een verzonnen pad wél als kapot', () => {
    // Zonder deze check zou een lesBestaat die altijd ja zegt alles groen laten.
    expect(lesBestaat(SITES_ROOT, 'python', '/docs/data/bestaat-niet')).toBe(false);
    expect(lesBestaat(SITES_ROOT, 'algorithms', '/docs/hanoi/01-concept')).toBe(false);
    expect(lesPositie('/docs/data/bestaat-niet')).toBeUndefined();
  });
});
