import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BRONNEN, auteursEnJaar } from './bronnen.js';

// De functies van onderzoek en de typen theoriegericht en ontwerpgericht zijn
// gebaseerd op Eureka! (Wientjes & Veenhoven, 2023). Begrippen en indelingen
// mag je overnemen, de uitwerking van een ander niet; wat je overneemt, noem
// je. Deze test eist dat elke pagina in die twee mappen de bron onderaan
// noemt, met <Bron>, dat elke <Bron> een bekende bron gebruikt, en dat de
// docentenhandleiding dezelfde bron verantwoordt.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');

function pagina(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return pagina(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const OP_EUREKA = ['opzet/functies', 'typen'];

describe('bronvermelding', () => {
  it('de verwijzing staat in APA-stijl, zoals de site leerlingen leert', () => {
    expect(auteursEnJaar(BRONNEN.eureka)).toBe('Wientjes, H., & Veenhoven, J. (2023)');
    expect(BRONNEN.eureka.titel).toBe(
      'Eureka! Didactiek voor het leren onderzoeken in vwo én havo',
    );
    expect(BRONNEN.eureka.url).toMatch(/^https:\/\/www\.uu\.nl\//);
  });

  for (const map of OP_EUREKA) {
    for (const pad of pagina(join(DOCS, map))) {
      it(`${relative(DOCS, pad)} noemt Eureka onder ## Bron, als laatste kop`, () => {
        const tekst = readFileSync(pad, 'utf8');
        const koppen = [...tekst.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
        expect(koppen.at(-1)).toBe('Bron');
        const sectie = tekst.split(/^## Bron\s*$/m)[1];
        expect(sectie).toMatch(/<Bron id="eureka" over="[^"]{10,}" \/>/);
      });
    }
  }

  it('elke <Bron> in de docs gebruikt een bron uit src/data/bronnen.js', () => {
    const onbekend = pagina(DOCS).flatMap((pad) =>
      [...readFileSync(pad, 'utf8').matchAll(/<Bron id="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((id) => !(id in BRONNEN))
        .map((id) => `${relative(DOCS, pad)}: ${id}`),
    );
    expect(onbekend).toEqual([]);
  });

  it('de docentenhandleiding verantwoordt de bron en zegt wat eigen werk is', () => {
    const docenten = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    const sectie = docenten.split(/^## Bronnen\s*$/m)[1]?.split(/^## /m)[0] ?? '';
    expect(sectie).toContain(auteursEnJaar(BRONNEN.eureka));
    expect(sectie).toContain(BRONNEN.eureka.titel);
    expect(sectie).toContain(BRONNEN.eureka.url);
    expect(sectie).toContain('eigen uitwerking');
  });
});
