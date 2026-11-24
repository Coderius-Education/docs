import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De bouw-route van een algoritme is een voorbeeld dat in stappen groeit:
// elke pagina in `bouwen/` voegt één bouwsteen toe. Twee dingen ontbraken
// (root-CLAUDE.md, Een voorbeeld in stappen):
//
// - Wat er op een bouwpagina nieuw is, was niet te zien. Het blok markeert
//   die regels nu (```python {4-5}), en de alinea erboven zegt het ook in
//   woorden: een markering is een kleur, en op papier en voor een
//   schermlezer is hij er niet.
// - Van het hele algoritme bekijken (de compleet-pagina) ging de route
//   direct naar aanpassen en zelf bouwen. Daartussen staat nu Maak het af:
//   het algoritme staat er op één bouwsteen na, en die schrijft de leerling.
//
// De blokrunner legt de verwachte uitvoer vóór een veld al naast wat het
// antwoord print. Deze test bewaakt de vorm, en draait ook de startcode: die
// moet vanzelf stoppen (de speeltuin heeft geen stopknop) en nog niet klaar
// zijn.

const require = createRequire(import.meta.url);
const { nieuwSinds, uitMeta, alsMeta, bouwtVoortOp } =
  require('../../../../../packages/shared/nieuw-sinds.js') as {
    nieuwSinds: (vorige: string[], nu: string[]) => number[];
    bouwtVoortOp: (vorige: string[], nu: string[]) => boolean;
    uitMeta: (meta: string) => number[];
    alsMeta: (nummers: number[]) => string;
  };

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const hoofdstukken = readdirSync(DOCS, { withFileTypes: true })
  .filter((f) => f.isDirectory() && existsSync(join(DOCS, f.name, 'bouwen')))
  .map((f) => f.name)
  .sort();

const lessenIn = (map: string) =>
  readdirSync(map)
    .filter((naam) => /^\d.*\.mdx?$/.test(naam))
    .sort();

const regelsVan = (code: string) => code.replace(/\n$/, '').split('\n');

/** De code in een `<PyRunner initialCode={`…`} />`, zoals de leerling hem ziet. */
const runners = (bron: string) =>
  [...bron.matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map((m) =>
    regelsVan(m[1].replace(/\\([\\`$])/g, '$1')),
  );

interface Fence {
  meta: string;
  regels: string[];
  /** De alinea direct boven het blok, langs een marker in commentaar. */
  erboven: string;
}

function fences(bron: string): Fence[] {
  return [...bron.matchAll(/```python([^\n]*)\n([\s\S]*?)```/g)].map((m) => {
    const ervoor = bron
      .slice(0, m.index)
      .replace(/(\{\/\*[\s\S]*?\*\/\}\s*)+$/, '')
      .trimEnd();
    return {
      meta: /\{[\d,\s-]+\}/.exec(m[1])?.[0] ?? '',
      regels: regelsVan(m[2]),
      erboven: ervoor.slice(ervoor.lastIndexOf('\n\n') + 2),
    };
  });
}

const vol = (regels: string[]) => regels.filter((regel) => regel.trim());

interface Pagina {
  naam: string;
  fences: Fence[];
  /** Elk blok code van de pagina: de codeblokken en de velden. */
  blokken: string[][];
}

const routes = hoofdstukken.map((hoofdstuk) => {
  const map = join(DOCS, hoofdstuk, 'bouwen');
  const paginas: Pagina[] = lessenIn(map).map((naam) => {
    const bron = readFileSync(join(map, naam), 'utf8');
    const eigen = fences(bron);
    return {
      naam: `${hoofdstuk}/bouwen/${naam}`,
      fences: eigen,
      blokken: [...eigen.map((f) => f.regels), ...runners(bron)],
    };
  });
  return { hoofdstuk, paginas };
});

/** Een blok dat regels deelt met de pagina ervoor en er toch niet op voortbouwt, met de reden. */
const BOUWT_NIET_VOORT: Record<string, string> = {
  'binair-zoeken/bouwen/08-niet-gevonden.mdx':
    'de code gaat in een functie; het blok met de inspringing in commentaar deelt met de pagina ervoor alleen de regel `...`',
  'minimax/bouwen/08-actions.mdx':
    'het blok is een bord om mee te testen; drie van zijn zes regels staan ook in een bord van de pagina ervoor',
};

/** Elke bouwpagina met de pagina ervoor; de eerste van een route heeft er geen. */
const stappen = routes.flatMap(({ paginas }) =>
  paginas.map((pagina, i) => ({ pagina, vorige: paginas[i - 1] as Pagina | undefined })),
);

const gemarkeerd = stappen.flatMap(({ pagina, vorige }) =>
  pagina.fences.filter((f) => f.meta).map((fence) => ({ naam: pagina.naam, fence, vorige })),
);

describe('een bouwsteen markeert wat er nieuw is', () => {
  it('in de meeste routes is er iets gemarkeerd', () => {
    // Niet in elke: in knapsack en selection sort is elke bouwsteen een
    // nieuwe functie, en deelt geen blok een regel met de pagina ervoor.
    const met = new Set(gemarkeerd.map((g) => g.naam.split('/')[0]));
    expect(met.size).toBeGreaterThanOrEqual(6);
    expect(gemarkeerd.length).toBeGreaterThanOrEqual(12);
  });

  it.each(gemarkeerd)(
    '$naam: de gemarkeerde regels zijn het verschil met een blok van de bouwsteen ervoor',
    ({ fence, vorige }) => {
      // De eerste bouwsteen heeft niets om op voort te bouwen.
      expect(vorige, 'de eerste bouwsteen van een route markeert niets').toBeDefined();
      // Nieuw is wat er sinds één blok van de pagina ervoor bij kwam of
      // veranderde, of wat op die hele pagina nergens letterlijk staat: een
      // regel uit het veld van de vorige bouwsteen is voor de leerling niet
      // nieuw, ook als het blok waarop dit voortbouwt hem niet had.
      const blokken = vorige?.blokken ?? [];
      const gezien = new Set(blokken.flat());
      const nergens = fence.regels.flatMap((regel, i) =>
        regel.trim() && !gezien.has(regel) ? [i + 1] : [],
      );
      const hoort = [...blokken.map((blok) => nieuwSinds(blok, fence.regels)), nergens].map(
        alsMeta,
      );
      expect(hoort).toContain(alsMeta(uitMeta(fence.meta)));
      // En niet het hele blok: dan bouwt het nergens op voort.
      expect(uitMeta(fence.meta).length).toBeLessThan(vol(fence.regels).length);
    },
  );

  it.each(gemarkeerd)('$naam: de alinea boven het blok zegt het ook in woorden', ({ fence }) => {
    expect(fence.erboven).toMatch(/gemarkeerde\s+regels?\b/);
  });

  it('een blok dat voortbouwt op de bouwsteen ervoor, staat op een pagina met een markering', () => {
    // Voortbouwen: minstens de helft van de regels van een blok van de
    // pagina ervoor staat er weer in, ook als ze nu inspringen, en er kwam
    // iets bij (`bouwtVoortOp`). Eerst moest de helft van het nieuwe blok
    // letterlijk gelijk zijn, en hoefde een blok dat er veel bij kreeg niets
    // te markeren. Blijft er geen regel letterlijk staan (de code gaat in
    // een functie of een lus, en elke regel springt anders in), dan zou de
    // markering het hele blok zijn, en die zegt niets: bubble sort 06 en
    // minimax 07.
    const zonder = stappen
      .filter(({ pagina, vorige }) => {
        if (!vorige || pagina.naam in BOUWT_NIET_VOORT) return false;
        if (pagina.fences.some((f) => f.meta)) return false;
        return pagina.fences.some(
          (fence) =>
            vol(fence.regels).length >= 3 &&
            vorige.blokken.some(
              (blok) =>
                bouwtVoortOp(blok, fence.regels) &&
                nieuwSinds(blok, fence.regels).length < vol(fence.regels).length,
            ),
        );
      })
      .map(({ pagina }) => pagina.naam);
    expect(zonder).toEqual([]);
  });
});

// --- Maak het af ---------------------------------------------------------

/** Routes zonder Maak het af, met de reden. */
const ZONDER_MAAK_HET_AF: Record<string, string> = {
  minimax:
    'geen compleet-pagina: de route eindigt met de tiende functie in het lokale tictactoe.py, en elke bouwpagina is al een Bouw zelf en test van die bouwsteen',
  cfg: 'de leerling plakt op de compleet-pagina zijn eigen grammatica, met zelfgekozen namen; geen les toont een grammatica, dus een Maak het af zou de eerste voorgeschreven zijn',
  // Een doorloop als leerling (november 2026): in deze drie routes was elke
  // bouwpagina al een Bouw en test van precies de stap die Maak het af open
  // liet. In hanoi schreef de leerling dezelfde drie regels zo drie keer.
  hanoi: 'elke bouwpagina is al een Bouw en test; Maak het af herhaalde de recursie-stap',
  knapsack:
    'elke bouwpagina is al een Bouw zelf en test; Maak het af herhaalde het vullen van een rij',
  pagerank: 'elke bouwpagina is al een invuloefening; Maak het af herhaalde één update',
};

function compleetVan(hoofdstuk: string) {
  const naam = lessenIn(join(DOCS, hoofdstuk)).find((n) => /compleet/.test(n));
  if (!naam) return null;
  const bron = readFileSync(join(DOCS, hoofdstuk, naam), 'utf8');
  const koppen = [...bron.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  const start = bron.indexOf('\n## Maak het af\n');
  const sectie = start < 0 ? '' : bron.slice(start + 1).split(/\n## /)[0];
  return { naam: `${hoofdstuk}/${naam}`, koppen, sectie };
}

const paginas = hoofdstukken
  .filter((h) => !(h in ZONDER_MAAK_HET_AF))
  .map((hoofdstuk) => ({ hoofdstuk, ...compleetVan(hoofdstuk) }));

function delen(sectie: string) {
  const veld = /<PyRunner initialCode=\{`([\s\S]*?)`\}\s*\/>/.exec(sectie);
  const tekst = sectie.slice(0, veld?.index ?? sectie.length);
  const na = veld ? sectie.slice(veld.index + veld[0].length) : '';
  return {
    tekst,
    verwacht: /Verwachte uitvoer:\n\n```\n([\s\S]*?)```\s*$/.exec(tekst)?.[1] ?? null,
    start: veld ? veld[1].replace(/\\([\\`$])/g, '$1') : null,
    // Tip en antwoord direct na het veld: de build zet ze dan in het veld.
    hulp: /^\s*<details>\s*<summary>Tip<\/summary>[\s\S]*?<\/details>\s*<details>\s*<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/.exec(
      na,
    ),
  };
}

/** Zet `nieuw` op de plek van de regel die `plek` bevat, met zijn inspringing. */
function opPlek(code: string, plek: RegExp, nieuw: string[]) {
  return code
    .split('\n')
    .flatMap((regel) =>
      plek.test(regel) ? nieuw.map((n) => regel.match(/^\s*/)?.[0] + n) : [regel],
    )
    .join('\n');
}

// Een Maak het af die je zonder het algoritme haalt, oefent niets (doorloop
// als leerling, november 2026). Per route de manieren die een leerling kent
// om de open stap over te slaan: geeft zo'n manier de verwachte uitvoer, dan
// zegt de opdracht dat het niet mag. Bij de sorteeralgoritmes print het
// programma de lijst na elke ronde, en dan geeft een `sort` een andere
// uitvoer.
interface Flauw {
  naam: string;
  maak: (start: string) => string;
  verboden: RegExp;
}
const OPEN = /# hier komt/;
const FLAUW: Record<string, Flauw[]> = {
  'vind-maximum': [
    {
      naam: 'met max overslaat',
      maak: (s) =>
        opPlek(
          s.replace(/\n\s*if waarde > maximum:\n\s*maximum = waarde/, ''),
          /waarde = lijst\[1\]/,
          ['maximum = max(lijst)'],
        ),
      verboden: /niet de functie `max`/,
    },
  ],
  'max-en-min': [
    {
      naam: 'met min en max overslaat',
      maak: (s) => opPlek(s, OPEN, ['klein, groot = min(lijst), max(lijst)']),
      verboden: /zonder de functies `min` en `max`/,
    },
    {
      naam: 'met twee lussen doet',
      maak: (s) =>
        opPlek(s, OPEN, [
          'for getal in lijst:',
          '    if getal < klein:',
          '        klein = getal',
          'for getal in lijst:',
          '    if getal > groot:',
          '        groot = getal',
        ]),
      verboden: /met één `for`-lus/,
    },
  ],
  'selection-sort': [
    {
      naam: 'met sort overslaat',
      maak: (s) => opPlek(s, OPEN, ['lijst.sort()']),
      verboden: /niet de functie `sorted`/,
    },
  ],
  'bubble-sort': [
    {
      naam: 'met sorted nagaat',
      maak: (s) => opPlek(s, OPEN, ['if lijst == sorted(lijst):', '    break']),
      verboden: /niet de functie `sorted`/,
    },
  ],
};

const draai = (code: string) =>
  spawnSync('python3', ['-c', code], { encoding: 'utf8', timeout: 5000 });

describe('de compleet-pagina eindigt met Maak het af', () => {
  it('elke route heeft een compleet-pagina of een reden', () => {
    expect(paginas.filter((p) => !p.naam).map((p) => p.hoofdstuk)).toEqual([]);
    for (const hoofdstuk of Object.keys(ZONDER_MAAK_HET_AF))
      expect(hoofdstukken).toContain(hoofdstuk);
    const namen = stappen.map(({ pagina }) => pagina.naam);
    for (const naam of Object.keys(BOUWT_NIET_VOORT)) expect(namen).toContain(naam);
  });

  describe.each(paginas.filter((p) => p.naam))('$naam', ({ hoofdstuk, koppen, sectie }) => {
    const { tekst, verwacht, start, hulp } = delen(sectie ?? '');
    const antwoord = /```python[^\n]*\n([\s\S]*?)```/.exec(hulp?.[1] ?? '')?.[1] ?? null;

    it('is het eerste tabblad, en de rij blijft kort', () => {
      // Eerst stond Maak het af achteraan, na Run, waar de leerling in de
      // Code-oefening van het model de hele functie al zelf schreef: de hulp
      // nam af en daarna weer toe. Nu komt hij van de laatste bouwpagina en
      // vult hij één bouwsteen in, en daarna schrijft hij alles.
      expect(koppen?.[0]).toBe('Maak het af');
      expect(koppen?.length).toBeLessThanOrEqual(8);
    });

    it('zegt welke stap open is, in hooguit een paar regels', () => {
      expect(tekst).toMatch(/Eén stap is nog open: [^.]+\. Doe die zelf\b/);
      const alineas = tekst
        .split('Verwachte uitvoer:')[0]
        .replace(/^## Maak het af\n/, '')
        .trim();
      expect(alineas.length).toBeLessThanOrEqual(420);
    });

    it('heeft de verwachte uitvoer, het veld, en tip en antwoord direct erna', () => {
      expect(verwacht, 'Verwachte uitvoer: met zijn blok, vlak voor het veld').not.toBeNull();
      expect(start, 'een <PyRunner initialCode>').not.toBeNull();
      expect(hulp, 'Tip en Antwoord direct na het veld').not.toBeNull();
      expect(antwoord, 'het hele programma in het antwoord').not.toBeNull();
    });

    it('het antwoord geeft de verwachte uitvoer', () => {
      const uit = draai(antwoord ?? 'raise SystemExit(1)');
      expect(uit.status, uit.stderr).toBe(0);
      expect(uit.stdout.trimEnd()).toBe((verwacht ?? '').trimEnd());
    });

    it('de startcode draait, stopt vanzelf en is nog niet klaar', () => {
      const uit = draai(start ?? 'raise SystemExit(1)');
      expect(uit.error, 'de startcode stopt niet binnen vijf seconden').toBeUndefined();
      expect(uit.status, uit.stderr).toBe(0);
      expect(uit.stdout.trimEnd()).not.toBe((verwacht ?? '').trimEnd());
    });

    it('de startcode is het antwoord op één bouwsteen na', () => {
      const s = vol(regelsVan(start ?? '')).map((r) => r.trimEnd());
      const a = vol(regelsVan(antwoord ?? '')).map((r) => r.trimEnd());
      const open = a.filter((regel) => !s.includes(regel));
      const anders = s.filter((regel) => !a.includes(regel));
      expect(open.length, open.join(' | ')).toBeGreaterThanOrEqual(1);
      expect(open.length, open.join(' | ')).toBeLessThanOrEqual(8);
      // Commentaar op de plek van de bouwsteen, en een regel die de functie
      // netjes laat eindigen.
      expect(anders.length, anders.join(' | ')).toBeLessThanOrEqual(4);
      expect(s.length).toBeGreaterThanOrEqual(a.length / 2);
      // Een while die de leerling zelf schrijft, kan eindeloos lopen.
      if (open.some((regel) => /^\s*while\b/.test(regel))) expect(tekst).toMatch(/\*\*Pas op:\*\*/);
    });

    it.each(FLAUW[hoofdstuk] ?? [])(
      'wie de stap $naam, haalt de verwachte uitvoer niet, of de opdracht sluit dat uit',
      ({ maak, verboden }) => {
        const uit = draai(maak(start ?? ''));
        expect(uit.status, uit.stderr).toBe(0);
        if (uit.stdout.trimEnd() === (verwacht ?? '').trimEnd()) expect(tekst).toMatch(verboden);
      },
    );

    it('een regel code is hooguit 66 tekens', () => {
      const lang = [...regelsVan(start ?? ''), ...regelsVan(antwoord ?? '')].filter(
        (regel) => regel.length > 66,
      );
      expect(lang).toEqual([]);
    });
  });
});
