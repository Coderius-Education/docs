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
// een markering op de verkeerde regel, een verwachte uitvoer die de oplossing
// niet geeft, en startcode die al klaar is of nooit stopt (de speeltuin heeft
// geen stopknop). De blokrunner in CI draait de codeblokken, maar legt de
// verwachte uitvoer vóór een veld niet naast de oplossing.

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

interface Blok {
  /** Wat er achter ```python staat, zoals `{2-3}`. */
  meta: string;
  regels: string[];
}

const pythonBlokken = (bron: string): Blok[] =>
  [...bron.matchAll(/^```python([^\n]*)\n([\s\S]*?)^```$/gm)].map((m) => ({
    meta: m[1].trim(),
    regels: m[2].replace(/\n$/, '').split('\n'),
  }));

/** `{2-3,6}` als regelnummers, vanaf 1. */
function gemarkeerd(meta: string): number[] {
  const tussen = /\{([\d,\s-]+)\}/.exec(meta)?.[1];
  if (!tussen) return [];
  return tussen.split(',').flatMap((deel) => {
    const [van, tot = van] = deel.trim().split('-').map(Number);
    return Array.from({ length: tot - van + 1 }, (_, i) => van + i);
  });
}

/** De regels van `nu` die niet in `vorige` staan: nieuw of veranderd. Lege regels tellen niet. */
function nieuwSinds(vorige: string[], nu: string[]): number[] {
  const over = [...vorige];
  return nu.flatMap((regel, i) => {
    if (!regel.trim()) return [];
    const plek = over.indexOf(regel);
    if (plek < 0) return [i + 1];
    over.splice(plek, 1);
    return [];
  });
}

interface MaakHetAf {
  les: string;
  tekst: string;
  verwacht: string | undefined;
  startcode: string | undefined;
  oplossing: string | undefined;
  /** Wat er tussen het veld en het eind van de sectie staat. */
  naVeld: string;
  /** De plek van de sectie en van de eerste opdracht in de bron. */
  plek: number;
  eersteOpdracht: number;
}

function maakHetAf(les: { naam: string; bron: string }): MaakHetAf | undefined {
  const kop = /^#{2,3} Maak het af$/m.exec(les.bron);
  if (!kop) return undefined;
  const vanaf = kop.index + kop[0].length;
  const eind = /^## /m.exec(les.bron.slice(vanaf));
  const tekst = les.bron.slice(vanaf, eind ? vanaf + eind.index : undefined);
  const veld = /<CodeExercise>\{`([\s\S]*?)`\}<\/CodeExercise>/.exec(tekst);
  return {
    les: les.naam,
    tekst,
    verwacht: /^Verwachte uitvoer:\n\n```\n([\s\S]*?)^```$/m.exec(tekst)?.[1],
    startcode: veld?.[1],
    oplossing: /oplossing\.<\/summary>\n\n```python\n([\s\S]*?)^```$/m.exec(tekst)?.[1],
    naVeld: veld ? tekst.slice(veld.index + veld[0].length) : '',
    plek: kop.index,
    eersteOpdracht: les.bron.search(/^## Opdracht /m),
  };
}

const afmakers = lessen.flatMap((les) => maakHetAf(les) ?? []);

/** Draait een programma zoals de speeltuin: wat het print, of dat het omviel of niet stopte. */
function draai(code: string) {
  const r = spawnSync('python3', ['-c', code], { encoding: 'utf8', timeout: 5000 });
  return { uitvoer: r.stdout ?? '', gelukt: r.status === 0 };
}

describe('uitgewerkt voorbeeld: het programma groeit in stappen', () => {
  const metMarkering = lessen.flatMap((les) => {
    const blokken = pythonBlokken(les.bron);
    return blokken.flatMap((blok, i) =>
      blok.meta ? [{ les: les.naam, blok, vorige: blokken[i - 1] }] : [],
    );
  });

  it('heeft in elke les van de proef stappen met een gemarkeerde regel', () => {
    const proef = lessen.filter((les) => les.naam.startsWith(PROEF));
    expect(proef.length).toBe(5);
    for (const les of proef)
      expect(
        metMarkering.some((m) => m.les === les.naam),
        `${les.naam} markeert in geen enkele stap wat er nieuw is`,
      ).toBe(true);
  });

  it.each(metMarkering)(
    '$les: de gemarkeerde regels zijn wat er sinds de vorige stap bij kwam',
    ({ blok, vorige }) => {
      expect(vorige, 'een eerste blok heeft niets om mee te vergelijken').toBeDefined();
      expect(gemarkeerd(blok.meta)).toEqual(nieuwSinds(vorige.regels, blok.regels));
    },
  );

  it.each(metMarkering)(
    '$les: een blok met een markering laat zijn uitvoer zien',
    ({ les, blok }) => {
      const bron = lessen.find((l) => l.naam === les)?.bron ?? '';
      const na = bron.slice(bron.indexOf(blok.regels.join('\n')) + blok.regels.join('\n').length);
      expect(na).toMatch(/^\n```\n\nUitvoer:\n\n```\n/);
    },
  );
});

describe('Maak het af: de laatste stap is nog open', () => {
  it('staat in elke les van de proef', () => {
    expect(afmakers.map((a) => a.les).sort()).toEqual(
      lessen
        .map((les) => les.naam)
        .filter((naam) => naam.startsWith(PROEF))
        .sort(),
    );
  });

  it.each(afmakers)('$les: staat vóór de opdrachten', ({ plek, eersteOpdracht }) => {
    expect(eersteOpdracht).toBeGreaterThan(plek);
  });

  it.each(afmakers)('$les: zegt welke stap de leerling zelf doet', ({ tekst }) => {
    expect(tekst).toMatch(/Doe zelf de laatste (twee )?stap(pen)?/);
  });

  it.each(afmakers)(
    '$les: heeft een verwachte uitvoer, een veld en direct daarna tip en oplossing',
    ({ verwacht, startcode, oplossing, naVeld }) => {
      expect(verwacht).toBeDefined();
      expect(startcode).toBeDefined();
      expect(oplossing).toBeDefined();
      expect(naVeld).toMatch(
        /^\n\n<details>\n<summary>Klik hier voor een tip\.<\/summary>[\s\S]*?<\/details>\n\n<details>\n<summary>Klik hier voor de oplossing\.<\/summary>/,
      );
    },
  );

  it.each(afmakers)('$les: de oplossing geeft de verwachte uitvoer', ({ verwacht, oplossing }) => {
    const { uitvoer, gelukt } = draai(oplossing ?? '');
    expect(gelukt).toBe(true);
    expect(uitvoer).toBe(verwacht);
  });

  it.each(afmakers)(
    '$les: de startcode draait, stopt vanzelf en is nog niet klaar',
    ({ verwacht, startcode }) => {
      const { uitvoer, gelukt } = draai(startcode ?? '');
      expect(gelukt, 'de startcode valt om of stopt niet binnen vijf seconden').toBe(true);
      expect(uitvoer).not.toBe(verwacht);
    },
  );

  it.each(afmakers)(
    '$les: de startcode is de oplossing zonder de laatste stap',
    ({ startcode, oplossing }) => {
      // Wat er al staat, blijft staan (op inspringing en één veranderde regel
      // na): de leerling maakt af, hij begint niet opnieuw.
      const start = (startcode ?? '').split('\n').filter((r) => r.trim());
      const klaar = (oplossing ?? '').split('\n').map((r) => r.trim());
      const weg = start.filter((regel) => !klaar.includes(regel.trim()));
      expect(weg.length).toBeLessThanOrEqual(1);
    },
  );
});
