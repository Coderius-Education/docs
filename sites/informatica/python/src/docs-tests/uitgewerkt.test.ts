import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een proef in het hoofdstuk Herhalen (november 2026): de uitleg laat het
// programma in stappen groeien in plaats van het in één keer te tonen (een
// uitgewerkt voorbeeld, zie vakdidactiek). Elke stap heeft een `###` die zegt
// wat je daar doet, de code tot dan toe met zijn uitvoer, en de regels die
// nieuw of veranderd zijn gemarkeerd (```python {2-3}). Na het voorbeeld komt
// Maak het af: een programma van dezelfde vorm waarin de laatste stap nog
// open is, vóór de opdrachten waarin de leerling alles zelf schrijft.
//
// Wat hier vastligt, is wat een leerling anders voor zijn eigen fout aanziet:
// een markering op de verkeerde regel of een markering die ontbreekt, een
// verwachte uitvoer die de oplossing niet geeft, en startcode die al klaar
// is, leeg is of nooit stopt (de speeltuin heeft geen stopknop). De
// blokrunner in CI draait de codeblokken, maar legt de verwachte uitvoer vóór
// een veld niet naast de oplossing.
//
// Wat geen test ziet: of de leerling de verwachte uitvoer ook zonder het
// begrip van de les haalt (een andere `range` in plaats van `break`). Dat
// zegt de opdracht ("laat de `range` staan"), en dat lees je na.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const PROEF = '04-herhalen';

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? bestanden(join(map, f.name))
      : f.name.endsWith('.mdx')
        ? [join(map, f.name)]
        : [],
  );
}

const lessen = bestanden(DOCS).map((pad) => ({
  naam: relative(DOCS, pad),
  bron: readFileSync(pad, 'utf8'),
}));
const proef = lessen.filter((les) => les.naam.startsWith(PROEF));

const regelVan = (bron: string, plek: number) => bron.slice(0, plek).split('\n').length;

interface Blok {
  /** De regels die de les markeert (`{2-3}`), vanaf 1; leeg zonder markering. */
  gemarkeerd: number[];
  regels: string[];
  /** De regel van de fence in de bron, en waar het blok ophoudt. */
  regel: number;
  eind: number;
}

/** `{2-3,6}` als regelnummers. Een andere metastring (`showLineNumbers`) is geen markering. */
function gemarkeerd(meta: string): number[] {
  const tussen = /\{([\d,\s-]+)\}/.exec(meta)?.[1];
  if (!tussen) return [];
  return tussen.split(',').flatMap((deel) => {
    const [van, tot = van] = deel.trim().split('-').map(Number);
    return Array.from({ length: tot - van + 1 }, (_, i) => van + i);
  });
}

const pythonBlokken = (bron: string): Blok[] =>
  [...bron.matchAll(/^```python([^\n]*)\n([\s\S]*?)^```$/gm)].map((m) => ({
    gemarkeerd: gemarkeerd(m[1]),
    regels: m[2].replace(/\n$/, '').split('\n'),
    regel: regelVan(bron, m.index ?? 0),
    eind: (m.index ?? 0) + m[0].length,
  }));

/**
 * De regels van `nu` die nieuw of veranderd zijn sinds `vorige`: wat niet in de
 * langste gemeenschappelijke reeks van de twee zit. Lege regels tellen niet.
 * Een reeks en geen losse vergelijking per regel: komt er een regel bij die
 * gelijk is aan een regel verderop, dan is de nieuwe de bovenste.
 */
function nieuwSinds(vorige: string[], nu: string[]): number[] {
  // lengte[i][j]: de langste gemeenschappelijke reeks van vorige vanaf i en nu vanaf j.
  const lengte = Array.from({ length: vorige.length + 1 }, () =>
    new Array<number>(nu.length + 1).fill(0),
  );
  for (let i = vorige.length - 1; i >= 0; i--)
    for (let j = nu.length - 1; j >= 0; j--)
      lengte[i][j] =
        vorige[i] === nu[j]
          ? 1 + lengte[i + 1][j + 1]
          : Math.max(lengte[i + 1][j], lengte[i][j + 1]);
  const uit: number[] = [];
  let i = 0;
  let j = 0;
  while (j < nu.length) {
    // Kan de reeks zonder deze regel van `nu` even lang blijven, dan is hij
    // nieuw: zo is van twee gelijke regels de bovenste de nieuwe.
    const nieuw = i >= vorige.length || lengte[i][j + 1] === lengte[i][j];
    if (nieuw) {
      if (nu[j].trim()) uit.push(j + 1);
      j++;
    } else if (vorige[i] === nu[j]) {
      i++;
      j++;
    } else i++;
  }
  return uit;
}

/**
 * Het voorbeeld van een les: de blokken tot de voorspelvraag of Maak het af,
 * elk met het blok ervoor uit dezelfde `##`-sectie. Het eerste blok van een
 * sectie begint een nieuw voorbeeld en heeft er geen.
 */
function voorbeeld(bron: string): { blok: Blok; vorige: Blok | undefined }[] {
  const eind = bron.search(/^#{2,3} (Voorspel|Maak het af)$|^<Voorspel\b/m);
  const tekst = eind < 0 ? bron : bron.slice(0, eind);
  const secties = [...tekst.matchAll(/^## /gm)].map((m) => m.index ?? 0);
  const sectieVan = (blok: Blok) => secties.filter((plek) => plek < blok.eind).length;
  const blokken = pythonBlokken(tekst);
  return blokken.map((blok, i) => ({
    blok,
    vorige: i > 0 && sectieVan(blokken[i - 1]) === sectieVan(blok) ? blokken[i - 1] : undefined,
  }));
}

const gedeeld = (a: string[], b: string[]) => {
  const over = b.filter((r) => r.trim());
  return a.filter((r) => r.trim() && over.includes(r)).length;
};

interface MaakHetAf {
  les: string;
  regel: number;
  tekst: string;
  verwacht: string | undefined;
  startcode: string | undefined;
  oplossing: string | undefined;
  /** Wat er tussen het veld en het eind van de sectie staat. */
  naVeld: string;
  plek: number;
  bron: string;
}

/**
 * De code van een veld zoals de browser hem krijgt: in de les staat hij in een
 * template-literal, dus `\\n` in de bron is `\n` in het veld.
 */
const uitTemplate = (code: string) => new Function(`return \`${code}\`;`)() as string;

function maakHetAf(les: { naam: string; bron: string }): MaakHetAf | undefined {
  const kop = /^#{2,3} Maak het af$/m.exec(les.bron);
  if (!kop) return undefined;
  const vanaf = kop.index + kop[0].length;
  // De sectie loopt tot de volgende kop van hetzelfde niveau of hoger.
  const eind = new RegExp(`^#{2,${kop[0].indexOf(' ')}} `, 'm').exec(les.bron.slice(vanaf));
  const tekst = les.bron.slice(vanaf, eind ? vanaf + eind.index : undefined);
  const veld = /<CodeExercise>\{`([\s\S]*?)`\}<\/CodeExercise>/.exec(tekst);
  return {
    les: les.naam,
    regel: regelVan(les.bron, kop.index),
    tekst,
    verwacht: /^Verwachte uitvoer[^\n]*:\n\n```\n([\s\S]*?)^```$/m.exec(tekst)?.[1],
    startcode: veld ? uitTemplate(veld[1]) : undefined,
    oplossing: /oplossing\.<\/summary>\n\n```python\n([\s\S]*?)^```$/m.exec(tekst)?.[1],
    naVeld: veld ? tekst.slice(veld.index + veld[0].length) : '',
    plek: kop.index,
    bron: les.bron,
  };
}

const afmakers = lessen.flatMap((les) => maakHetAf(les) ?? []);

/** Draait een programma zoals de speeltuin: wat het print, en waarom het niet lukte. */
function draai(code: string) {
  const r = spawnSync('python3', ['-c', code], { encoding: 'utf8', timeout: 5000 });
  const fout =
    r.status === 0
      ? ''
      : r.status === null
        ? 'het programma stopte niet binnen vijf seconden'
        : `het programma viel om:\n${r.stderr}`;
  return { uitvoer: r.stdout ?? '', fout };
}

const inhoud = (code: string | undefined) =>
  (code ?? '')
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith('#'));

describe('nieuwSinds: welke regels er sinds de vorige stap bij kwamen', () => {
  it('een regel erbij, een regel veranderd, en regels die inspringen', () => {
    expect(nieuwSinds(['a', 'b'], ['a', 'b', 'c'])).toEqual([3]);
    expect(nieuwSinds(['a', 'b'], ['a', 'B'])).toEqual([2]);
    expect(
      nieuwSinds(['x = 5', '', 'print(x)'], ['x = 5', '', 'while x:', '    print(x)']),
    ).toEqual([3, 4]);
  });

  it('een lege regel erbij telt niet', () => {
    expect(nieuwSinds(['a'], ['a', '', 'b'])).toEqual([3]);
  });

  it('een nieuwe regel die gelijk is aan een regel eronder, is de bovenste', () => {
    // Per regel vergeleken koppelde de test de bovenste streep aan de oude en
    // wees hij de onderste aan.
    expect(
      nieuwSinds(
        ['print("Rondes")', 'print("---")'],
        ['print("---")', 'print("Rondes")', 'print("---")'],
      ),
    ).toEqual([1]);
  });
});

describe('uitgewerkt voorbeeld: het programma groeit in stappen', () => {
  // Een blok dat op het vorige doorbouwt: het neemt minstens de helft van de
  // regels ervan over.
  const bouwtDoor = proef.flatMap((les) =>
    voorbeeld(les.bron).flatMap(({ blok, vorige }) =>
      vorige &&
      gedeeld(vorige.regels, blok.regels) * 2 >= vorige.regels.filter((r) => r.trim()).length
        ? [{ les: les.naam, regel: blok.regel, blok }]
        : [],
    ),
  );
  const metMarkering = lessen.flatMap((les) => {
    const blokken = pythonBlokken(les.bron);
    return blokken.flatMap((blok, i) =>
      blok.gemarkeerd.length
        ? [{ les: les.naam, regel: blok.regel, bron: les.bron, blok, vorige: blokken[i - 1] }]
        : [],
    );
  });

  it('heeft in elke les van de proef een voorbeeld dat doorbouwt op de stap ervoor', () => {
    expect(proef.length).toBe(5);
    for (const les of proef)
      expect(
        bouwtDoor.filter((s) => s.les === les.naam).length,
        `${les.naam}: geen enkel blok bouwt door op het blok ervoor`,
      ).toBeGreaterThanOrEqual(1);
  });

  it.each(bouwtDoor)('$les:$regel een stap die doorbouwt, markeert wat er nieuw is', ({ blok }) => {
    expect(blok.gemarkeerd.length).toBeGreaterThan(0);
  });

  it.each(metMarkering)(
    '$les:$regel de gemarkeerde regels zijn wat er sinds het blok ervoor bij kwam',
    ({ blok, vorige }) => {
      expect(vorige, 'het eerste blok van een les heeft niets om mee te vergelijken').toBeDefined();
      expect(blok.gemarkeerd).toEqual(nieuwSinds(vorige.regels, blok.regels));
    },
  );

  it.each(metMarkering)(
    '$les:$regel een blok met een markering laat zijn uitvoer zien',
    ({ bron, blok }) => {
      expect(bron.slice(blok.eind, blok.eind + 30)).toMatch(/^\n\nUitvoer:\n\n```\n/);
    },
  );

  it.each(metMarkering)(
    '$les:$regel de tekst zegt in woorden wat er gemarkeerd is',
    ({ bron, blok }) => {
      // De markering is een kleur: op papier en voor een schermlezer is hij
      // er niet. De alinea boven het blok zegt het daarom ook.
      const voor = bron.slice(0, bron.lastIndexOf('```python', blok.eind)).trimEnd();
      const alinea = voor.slice(voor.lastIndexOf('\n\n') + 2);
      expect(alinea).toMatch(/gemarkeerde regels?\b/);
    },
  );
});

describe('Maak het af: de laatste stap is nog open', () => {
  it('staat in elke les van de proef', () => {
    expect(afmakers.map((a) => a.les).sort()).toEqual(proef.map((les) => les.naam).sort());
  });

  it.each(afmakers)(
    '$les:$regel staat na het voorbeeld en vóór de puzzel, de fouten en de opdrachten',
    ({ plek, bron }) => {
      const laatsteStap = pythonBlokken(bron)
        .filter((b) => b.gemarkeerd.length)
        .at(-1);
      expect(laatsteStap).toBeDefined();
      expect(plek).toBeGreaterThan(laatsteStap?.eind ?? 0);
      for (const kop of [/^## Puzzel$/m, /^## Er gaat iets mis$/m, /^## Opdracht /m]) {
        const erna = bron.search(kop);
        if (erna >= 0) expect(erna, String(kop)).toBeGreaterThan(plek);
      }
    },
  );

  it.each(afmakers)('$les:$regel zegt welke stap de leerling zelf doet', ({ tekst }) => {
    expect(tekst).toMatch(/(Eén stap is|Twee stappen zijn) nog open: [^\n]+ Doe die zelf/);
  });

  it.each(afmakers)(
    '$les:$regel heeft een verwachte uitvoer, een veld en direct daarna tip en oplossing',
    ({ verwacht, startcode, oplossing, naVeld }) => {
      expect(verwacht).toBeDefined();
      expect(startcode).toBeDefined();
      expect(oplossing).toBeDefined();
      expect(naVeld).toMatch(
        /^\n\n<details>\n<summary>Klik hier voor een tip\.<\/summary>[\s\S]*?<\/details>\n\n<details>\n<summary>Klik hier voor de oplossing\.<\/summary>/,
      );
    },
  );

  it.each(afmakers)(
    '$les:$regel de oplossing geeft de verwachte uitvoer',
    ({ verwacht, oplossing }) => {
      const { uitvoer, fout } = draai(oplossing ?? '');
      expect(fout).toBe('');
      expect(uitvoer).toBe(verwacht);
    },
  );

  it.each(afmakers)(
    '$les:$regel de startcode draait, stopt vanzelf en is nog niet klaar',
    ({ verwacht, startcode }) => {
      const { uitvoer, fout } = draai(startcode ?? '');
      expect(fout).toBe('');
      expect(uitvoer).not.toBe(verwacht);
    },
  );

  it.each(afmakers)(
    '$les:$regel de startcode is de oplossing zonder de laatste stap',
    ({ startcode, oplossing }) => {
      // De leerling maakt af, hij begint niet opnieuw: wat er al staat, blijft
      // staan (op inspringing en één veranderde regel na), en van de oplossing
      // ontbreken hooguit twee regels. Een leeg veld of een veld met iets
      // heel anders is een opdracht, geen Maak het af.
      const start = inhoud(startcode);
      const klaar = inhoud(oplossing);
      expect(start.length).toBeGreaterThanOrEqual(2);
      expect(start.filter((regel) => !klaar.includes(regel)).length).toBeLessThanOrEqual(1);
      const ontbreekt = klaar.filter((regel) => !start.includes(regel)).length;
      expect(ontbreekt).toBeGreaterThanOrEqual(1);
      expect(ontbreekt).toBeLessThanOrEqual(2);
    },
  );

  it.each(afmakers)(
    '$les:$regel een loop die nooit kan stoppen, noemt Stap voor stap in de opdracht',
    ({ tekst, oplossing }) => {
      // Eén regel van een while-loop te weinig ingesprongen, en het tabblad
      // loopt vast. De waarschuwing stond alleen in de dichte tip.
      if (!/^\s*while /m.test(oplossing ?? '')) return;
      const opdracht = tekst.slice(0, tekst.indexOf('<CodeExercise>'));
      expect(opdracht).toMatch(/Stap voor stap/);
    },
  );
});
