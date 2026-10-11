import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BRONNEN, auteursEnJaar } from './bronnen.js';

// De site neemt begrippen en indelingen over uit twee boeken: Ik denk (Le
// Coultre, 2007), hoofdstuk 4 Kennisleer en 5 Wetenschapsfilosofie, en Eureka!
// (Wientjes & Veenhoven, 2023), hoofdstuk 2 Wat is goed onderzoek, plus de
// functies en typen van onderzoek. Begrippen en indelingen mag je overnemen,
// de uitwerking van een ander niet; wat je overneemt, noem je. Deze test legt
// per pagina vast welke bron en welk hoofdstuk erbij hoort, en eist de
// vermelding bovenaan, direct onder de titel. Een nieuwe pagina in een van de
// mappen hieronder moet in de lijst, met een bron of met een reden zonder.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');

const H4 = '4, Kennisleer';
const H5 = '5, Wetenschapsfilosofie';
const H2 = '2, Wat is goed onderzoek';

type Verwacht = { id: keyof typeof BRONNEN; hoofdstuk?: string } | { geen: string };

const VERWACHT: Record<string, Verwacht> = {
  // Ik denk, hoofdstuk 4 Kennisleer
  'kennisleer/hoe-weet-je-iets.mdx': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/a-priori.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/a-posteriori.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/vork-van-hume.mdx': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/soorten-kennis.mdx': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/objectief.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/subjectief.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/scepticisme.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/rationalisme.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/empirisme.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/denkers.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/plato.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/aristoteles.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/descartes.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/spinoza.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/locke.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/berkeley.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/hume.md': { id: 'ikdenk', hoofdstuk: H4 },
  'kennisleer/chomsky.md': { geen: 'Chomsky staat niet in een inleiding uit 2007' },
  // Ik denk, hoofdstuk 5 Wetenschapsfilosofie
  'kennisleer/inductieprobleem.md': { id: 'ikdenk', hoofdstuk: H5 },
  'kennisleer/intersubjectief.md': { id: 'ikdenk', hoofdstuk: H5 },
  'vragen/hypothese.md': { id: 'ikdenk', hoofdstuk: H5 },
  // Eureka!, hoofdstuk 2 Wat is goed onderzoek
  'spelregels/de-vier-spelregels.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/betrouwbaar.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/valide.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/interne-validiteit.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/externe-validiteit.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/intern-vs-extern.mdx': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/aanvaardbaar.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/transparant.md': { id: 'eureka', hoofdstuk: H2 },
  'spelregels/auteursrecht.md': { geen: 'gaat over de wet, geen stof uit Eureka!' },
  // Eureka!, hoofdstuk niet bekend: de functies en de typen van onderzoek
  'opzet/functies/functies-overzicht.mdx': { id: 'eureka' },
  'opzet/functies/puur-beschrijvend.md': { id: 'eureka' },
  'opzet/functies/beschrijvend-vergelijkend.md': { id: 'eureka' },
  'opzet/functies/beschrijvend-definierend.md': { id: 'eureka' },
  'opzet/functies/beschrijvend-evaluerend.md': { id: 'eureka' },
  'opzet/functies/verklarend-explorerend.md': { id: 'eureka' },
  'opzet/functies/verklarend-toetsend.md': { id: 'eureka' },
  'typen/theorie-vs-ontwerp.mdx': { id: 'eureka' },
  'typen/theoriegericht.md': { id: 'eureka' },
  'typen/ontwerpgericht.md': { id: 'eureka' },
};

// Elke pagina in deze mappen moet in VERWACHT staan.
const MAPPEN = ['kennisleer', 'spelregels', 'opzet/functies', 'typen'];

function paginas(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return paginas(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const rel = (pad: string) => relative(DOCS, pad).split('\\').join('/');

describe('bronvermelding', () => {
  it('de verwijzingen staan in APA-stijl, zoals de site leerlingen leert', () => {
    expect(auteursEnJaar(BRONNEN.eureka)).toBe('Wientjes, H., & Veenhoven, J. (2023)');
    expect(auteursEnJaar(BRONNEN.ikdenk)).toBe('Le Coultre, E.-A. (2007)');
    expect(BRONNEN.eureka.url).toMatch(/^https:\/\/www\.uu\.nl\//);
  });

  it('elke pagina in de mappen met een bron staat in de lijst', () => {
    const ontbreekt = MAPPEN.flatMap((map) => paginas(join(DOCS, map)))
      .map(rel)
      .filter((pad) => !(pad in VERWACHT));
    expect(ontbreekt).toEqual([]);
  });

  for (const [pad, verwacht] of Object.entries(VERWACHT)) {
    const tekst = readFileSync(join(DOCS, pad), 'utf8').replace(/^---[\s\S]*?---\s*/, '');
    if ('geen' in verwacht) {
      it(`${pad} heeft bewust geen bron (${verwacht.geen})`, () => {
        expect(tekst).not.toContain('<Bron ');
      });
      continue;
    }
    it(`${pad} noemt ${verwacht.id} bovenaan, direct onder de titel`, () => {
      // De opdrachtgever wil de bron bovenaan: wie de pagina opent, ziet
      // meteen waar de indeling vandaan komt. Zonder eigen kop, anders zou
      // "Bron" als eerste in de inhoudsopgave staan.
      const hoofdstuk = verwacht.hoofdstuk ? ` hoofdstuk="${verwacht.hoofdstuk}"` : '';
      const regel = new RegExp(
        `^# [^\\n]+\\n\\n<Bron id="${verwacht.id}"${hoofdstuk} over="[^"]{10,}" \\/>\\n`,
      );
      expect(tekst).toMatch(regel);
      expect(tekst).not.toMatch(/^## Bron\s*$/m);
      expect(tekst.match(/<Bron /g)).toHaveLength(1);
    });
  }

  it('elke <Bron> in de docs gebruikt een bron uit src/data/bronnen.js', () => {
    const onbekend = paginas(DOCS).flatMap((pad) =>
      [...readFileSync(pad, 'utf8').matchAll(/<Bron id="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((id) => !(id in BRONNEN))
        .map((id) => `${rel(pad)}: ${id}`),
    );
    expect(onbekend).toEqual([]);
  });

  it('de docentenhandleiding verantwoordt beide bronnen en zegt wat eigen werk is', () => {
    const docenten = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    const sectie = docenten.split(/^## Bronnen\s*$/m)[1]?.split(/^## /m)[0] ?? '';
    for (const bron of Object.values(BRONNEN)) {
      expect(sectie).toContain(auteursEnJaar(bron));
      expect(sectie).toContain(bron.titel);
    }
    expect(sectie).toContain(BRONNEN.eureka.url);
    expect(sectie).toContain('eigen uitwerking');
    for (const hoofdstuk of [H4, H5, H2]) {
      expect(sectie.toLowerCase(), hoofdstuk).toContain(`hoofdstuk ${hoofdstuk}`.toLowerCase());
    }
  });
});
