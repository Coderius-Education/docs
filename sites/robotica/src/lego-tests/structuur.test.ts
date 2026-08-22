import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { alleLesbestanden } from './extract';

// Bewaakt de structuur van het lego_auto-traject: opdrachtnummers die kloppen
// met de plek van de pagina, imports die echt bestaan, unieke posities en
// bevroren slugs. Allemaal dingen die stil kapotgaan zodra er een hoofdstuk
// schuift — precies wat er bij deze verbouwing twee keer bijna gebeurde.

const LEGO = fileURLToPath(new URL('../../lego_auto', import.meta.url));
const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const PAGES = fileURLToPath(new URL('../pages', import.meta.url));
const SITE = fileURLToPath(new URL('../..', import.meta.url));
const PYTHON_DOCS = fileURLToPath(new URL('../../../python/docs', import.meta.url));

type Pagina = {
  pad: string;
  rel: string;
  inhoud: string;
  positie: number | undefined;
  slug: string | undefined;
  /** positie van de map (uit _category_.json), of undefined voor root-pagina's */
  hoofdstuk: number | undefined;
};

function categoriePositie(map: string): number | undefined {
  const pad = join(map, '_category_.json');
  if (!existsSync(pad)) return undefined;
  return JSON.parse(readFileSync(pad, 'utf8')).position;
}

function verzamelPaginas(): Pagina[] {
  return alleLesbestanden(LEGO).map((pad) => {
    const inhoud = readFileSync(pad, 'utf8');
    // Let op: 0 is een geldige positie — geen `|| undefined`, dat maakt van
    // een falsy nul "geen positie".
    const positieMatch = inhoud.match(/^sidebar_position:\s*(\d+)/m);
    return {
      pad,
      rel: pad.slice(LEGO.length + 1),
      inhoud,
      positie: positieMatch ? Number(positieMatch[1]) : undefined,
      slug: inhoud.match(/^slug:\s*(\S+)/m)?.[1],
      hoofdstuk: categoriePositie(dirname(pad)),
    };
  });
}

const paginas = verzamelPaginas();

// De bevroren URL's van het traject. Een slug wijzigen breekt bookmarks,
// cross-site-links en geprinte QR-codes — daarom moet elke slug uit deze
// lijst blijven bestaan, en hoort elke nieuwe pagina zijn slug hier toe te
// voegen (vanaf dat moment is ook die bevroren).
const BEVROREN_SLUGS = [
  '/afstand',
  '/afstand/concept',
  '/afstand/monteren',
  '/afstand/op-het-scherm',
  '/afstand/uitlezen',
  '/batterijen',
  '/batterijen/aansluiten',
  '/batterijen/concept',
  '/batterijen/main-py',
  '/batterijen/materiaal',
  '/doosje',
  '/eerste-programma',
  '/eerste-programma/knipperen',
  '/eerste-programma/lampje',
  '/frame',
  '/lijnsensor',
  '/lijnsensor/code-begrijpen',
  '/lijnsensor/een-sensor',
  '/lijnsensor/materiaal',
  '/lijnsensor/monteren',
  '/lijnsensor/twee-sensoren',
  '/lijnvolgen',
  '/lijnvolgen/hoe-werkt-het',
  '/lijnvolgen/nu-jij',
  '/lijnvolgen/rechtdoor',
  '/motoren',
  '/motoren-op-lego',
  '/motoren/aansluiten',
  '/motoren/concept',
  '/motoren/draaien',
  '/motoren/let-op',
  '/motoren/materiaal',
  '/scherm',
  '/scherm/concept',
  '/scherm/materiaal',
  '/scherm/waardes-op-scherm',
  '/software/bibliotheek',
  '/software/bord',
  '/software/editor',
  '/software/micropython',
  '/software/verbinden',
];

describe('lego_auto-structuur', () => {
  it('elke pagina heeft een expliciete slug (bevroren URL)', () => {
    expect(paginas.filter((p) => !p.slug).map((p) => p.rel)).toEqual([]);
  });

  it('slugs zijn echt bevroren: elke bevroren slug bestaat nog, elke slug staat op de lijst', () => {
    const huidig = new Set(paginas.map((p) => p.slug));
    // een slug wijzigen of een pagina weghalen laat de oude URL verdwijnen
    expect(BEVROREN_SLUGS.filter((s) => !huidig.has(s))).toEqual([]);
    // een nieuwe slug moet aan BEVROREN_SLUGS toegevoegd worden (en is dan bevroren)
    const bekend = new Set(BEVROREN_SLUGS);
    expect(paginas.filter((p) => p.slug && !bekend.has(p.slug)).map((p) => p.slug)).toEqual([]);
  });

  it('sidebar_positions zijn uniek binnen elke map', () => {
    const perMap = new Map<string, number[]>();
    for (const p of paginas) {
      const map = p.rel.includes('/') ? p.rel.split('/')[0] : '.';
      perMap.set(map, [...(perMap.get(map) ?? []), p.positie ?? -1]);
    }
    const kapot: string[] = [];
    for (const [map, posities] of perMap) {
      if (new Set(posities).size !== posities.length) {
        kapot.push(`${map}: ${posities.sort((a, b) => a - b).join(', ')}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('categorieposities zijn uniek', () => {
    const posities = readdirSync(LEGO, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => categoriePositie(join(LEGO, e.name)))
      .filter((p): p is number => p !== undefined);
    expect(new Set(posities).size).toBe(posities.length);
  });

  it('elke MDX-import wijst naar een bestaand bestand', () => {
    const kapot: string[] = [];
    for (const p of paginas) {
      for (const m of p.inhoud.matchAll(/^import \w+ from '(\/[^']+)'/gm)) {
        if (!existsSync(join(SITE, m[1]))) kapot.push(`${p.rel} -> ${m[1]}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('opdrachtnummers kloppen met hoofdstuk- en paginapositie', () => {
    // Format uit de schrijfgids: "## Opdracht <H>.<S>.<letter>:" met
    // H = position van de map en S = sidebar_position van de pagina.
    const kapot: string[] = [];
    for (const p of paginas) {
      for (const m of p.inhoud.matchAll(/^## Opdracht ([^:\n]+):/gm)) {
        const nummer = m[1].match(/^(\d+)\.(\d+)\.[a-z]$/);
        if (!nummer) {
          kapot.push(`${p.rel}: "Opdracht ${m[1]}" volgt het H.S.letter-format niet`);
          continue;
        }
        if (Number(nummer[1]) !== p.hoofdstuk || Number(nummer[2]) !== p.positie) {
          kapot.push(
            `${p.rel}: Opdracht ${m[1]} maar hoofdstuk=${p.hoofdstuk}, positie=${p.positie}`,
          );
        }
      }
    }
    expect(kapot).toEqual([]);
  });
});

describe('Voorkennis-links naar de python-site', () => {
  // Zelfde aanpak als sites/godot/src/data/voorkennis.test.ts: cross-site
  // links vallen buiten de linkcheck van de build, dus zonder deze test
  // breekt een hernoemde python-les de robotica-links pas in productie.
  // Geldt voor lego_auto én de Bibliotheek (docs/) — beide hebben
  // Voorkennis-blokken.
  const ITEM_RE = /\{site: 'python', to: '([^']+)', label: '([^']+)'\}/g;

  const alleZones = [
    ...paginas.map((p) => ({ rel: `lego_auto/${p.rel}`, inhoud: p.inhoud })),
    ...alleLesbestanden(DOCS).map((pad) => ({
      rel: `docs/${pad.slice(DOCS.length + 1)}`,
      inhoud: readFileSync(pad, 'utf8'),
    })),
    // src/pages (docenten, cursusoverzicht) linkt ook cross-site
    ...alleLesbestanden(PAGES).map((pad) => ({
      rel: `src/pages/${pad.slice(PAGES.length + 1)}`,
      inhoud: readFileSync(pad, 'utf8'),
    })),
  ];

  function pythonUrlBestaat(to: string): boolean {
    const segmenten = to.replace(/^\/docs\//, '').split('/');
    if (segmenten.length !== 2) return false;
    const [mapSegment, paginaSegment] = segmenten;
    const mapNaam = readdirSync(PYTHON_DOCS).find(
      (naam) => naam === mapSegment || naam.replace(/^\d+-/, '') === mapSegment,
    );
    if (!mapNaam) return false;
    for (const bestand of readdirSync(join(PYTHON_DOCS, mapNaam))) {
      if (!/\.mdx?$/.test(bestand)) continue;
      const inhoud = readFileSync(join(PYTHON_DOCS, mapNaam, bestand), 'utf8');
      const slug = inhoud.match(/^slug:\s*(\S+)/m)?.[1];
      if (slug) {
        if (slug === to || slug === `/${paginaSegment}` || slug === paginaSegment) return true;
        continue;
      }
      const kaal = bestand.replace(/\.mdx?$/, '');
      if (kaal === paginaSegment || kaal.replace(/^\d+-/, '') === paginaSegment) return true;
    }
    return false;
  }

  it('elk Voorkennis-pad bestaat als python-lespagina', () => {
    const kapot: string[] = [];
    for (const p of alleZones) {
      for (const m of p.inhoud.matchAll(ITEM_RE)) {
        if (!pythonUrlBestaat(m[1])) kapot.push(`${p.rel}: ${m[1]}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('nergens kaal-geharde python-links', () => {
    // De :::tip[Python opfrissen]-blokken met https://python.coderius.nl-URL's
    // zijn vervangen door Voorkennis-blokken; hardcoded cross-site-URL's
    // horen niet terug te komen (registry is de bron van waarheid).
    const kapot = alleZones.filter((p) => p.inhoud.includes('python.coderius.nl'));
    expect(kapot.map((p) => p.rel)).toEqual([]);
  });
});
