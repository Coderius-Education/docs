import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De uitleg van een les over JavaScript toonde de code in één keer. In de
// lessen waar een script groeit, laat hij nu zien hoe het ontstaat: elke stap
// toont de code tot dan toe, en wat nieuw of veranderd is, is gemarkeerd
// (```js {2}). De alinea erboven zegt het ook in woorden: een markering is
// een kleur, en op papier en voor een schermlezer is hij er niet
// (root-CLAUDE.md, Een voorbeeld in stappen).
//
// Geen Maak het af, anders dan in de python-cursus: Opdracht 1 van een les
// is hier al code die de leerling aanpast.

const require = createRequire(import.meta.url);
const { nieuwSinds, uitMeta, alsMeta, bouwtVoortOp } =
  require('../../../../../packages/shared/nieuw-sinds.js') as {
    nieuwSinds: (vorige: string[], nu: string[]) => number[];
    bouwtVoortOp: (vorige: string[], nu: string[]) => boolean;
    uitMeta: (meta: string) => number[];
    alsMeta: (nummers: number[]) => string;
  };

const MAP = fileURLToPath(new URL('../../docs/js-basics', import.meta.url));

interface Blok {
  taal: string;
  meta: string;
  regels: string[];
  /** De alinea direct boven het blok. */
  erboven: string;
}

/** De codeblokken van de uitleg: alles vóór Predict, zonder de startcode in de exports. */
function blokken(bron: string): Blok[] {
  const uitleg = bron.split(/^## Predict\b/m)[0];
  return [...uitleg.matchAll(/```(\w+)([^\n]*)\n([\s\S]*?)```/g)].map((m) => {
    const ervoor = uitleg.slice(0, m.index).trimEnd();
    return {
      taal: m[1],
      meta: /\{[\d,\s-]+\}/.exec(m[2])?.[0] ?? '',
      regels: m[3].replace(/\n$/, '').split('\n'),
      erboven: ervoor.slice(ervoor.lastIndexOf('\n\n') + 2),
    };
  });
}

const vol = (regels: string[]) => regels.filter((regel) => regel.trim());

const lessen = readdirSync(MAP)
  .filter((naam) => /\.mdx?$/.test(naam))
  .sort()
  .map((naam) => ({ naam, blokken: blokken(readFileSync(join(MAP, naam), 'utf8')) }));

/** Elk blok met het blok van dezelfde taal ervoor: daar bouwt het op voort. */
const paren = lessen.flatMap(({ naam, blokken }) =>
  blokken.map((blok, i) => ({
    naam,
    nr: i + 1,
    blok,
    vorige: blokken
      .slice(0, i)
      .filter((b) => b.taal === blok.taal)
      .at(-1),
  })),
);

const gemarkeerd = paren.filter(({ blok }) => blok.meta);

describe('de uitleg van een JavaScript-les groeit in stappen', () => {
  it('in de lessen waar een script groeit, is er iets gemarkeerd', () => {
    // Niet in elke les: tekst veranderen en inline stijl zijn één regel code,
    // en operatoren en de moderne DOM een rij losse begrippen.
    expect(new Set(gemarkeerd.map((g) => g.naam)).size).toBeGreaterThanOrEqual(10);
  });

  it.each(gemarkeerd)(
    '$naam, blok $nr: de gemarkeerde regels zijn het verschil met het blok ervoor',
    ({ blok, vorige }) => {
      expect(vorige, 'het eerste blok van een voorbeeld markeert niets').toBeDefined();
      expect(alsMeta(uitMeta(blok.meta))).toBe(
        alsMeta(nieuwSinds(vorige?.regels ?? [], blok.regels)),
      );
      // Niet het hele blok: dan bouwt het nergens op voort.
      expect(uitMeta(blok.meta).length).toBeLessThan(vol(blok.regels).length);
    },
  );

  it.each(gemarkeerd)('$naam, blok $nr: de alinea erboven zegt het ook in woorden', ({ blok }) => {
    expect(blok.erboven).toMatch(/gemarkeerde\s+regels?\b/);
  });

  it('een blok dat voortbouwt op het blok ervoor, heeft een markering', () => {
    // Voortbouwen: minstens de helft van de regels van het blok van dezelfde
    // taal ervoor staat er weer in, ook als ze nu inspringen, en er kwam iets
    // bij of er veranderde iets (`bouwtVoortOp`). Eerst telde een regel die
    // in een functie kwam niet als dezelfde, en hoefde zo'n blok niets te
    // markeren.
    const zonder = paren
      .filter(
        ({ blok, vorige }) => !blok.meta && vorige && bouwtVoortOp(vorige.regels, blok.regels),
      )
      .map(({ naam, nr }) => `${naam}, blok ${nr}`);
    expect(zonder).toEqual([]);
  });
});
