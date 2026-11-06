import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ML_MAPPEN } from '../lib/mlSidebar';
import { routeBestand, projecten as routeProjecten } from './ml-route';

// Een project van de route machine learning noemt in zijn :::info de Python
// die het gebruikt: "`random.choice` uit [een les](site:…)". Bij de review
// bleek dat zo'n link vaker meer belooft dan de les geeft: `min` wees naar
// een les met alleen `min(lijst)`, `random.choice` naar een project waar het
// alleen in een onderzoeksvraag stond. Deze test eist dat elke term in
// backticks vóór "uit [les](site:…)" ook echt op die les staat.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const PYTHON = fileURLToPath(new URL('../../../python/docs/', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

/** Route op de site → bestand. Python zet de cijferprefixen er niet in, algoritmes wel. */
const lessen = new Map<string, string>();
for (const pad of bestanden(PYTHON)) {
  const route = relative(PYTHON, pad)
    .replace(/\.mdx?$/, '')
    .split('/')
    .map((deel) => deel.replace(/^\d+-/, ''))
    .join('/');
  lessen.set(`python/docs/${route}`, pad);
}
for (const pad of bestanden(DOCS)) {
  lessen.set(`algorithms/docs/${relative(DOCS, pad).replace(/\.mdx?$/, '')}`, pad);
}

/** `.split()` → split, `random.randint(1, 6)` → random.randint. */
function kern(term: string): string {
  return term.replace(/^\./, '').split('(')[0];
}

const projecten = bestanden(DOCS).filter((p) => /\/ml-[a-z]+\//.test(p));
const eersteStappen = new Set(routeProjecten().map((p) => routeBestand(p.stappen[0])));

describe('de :::info van een project belooft niets wat de les niet geeft', () => {
  it('er zijn projecten om te controleren', () => {
    expect(projecten.length).toBeGreaterThanOrEqual(15);
  });

  for (const pad of projecten) {
    it(relative(DOCS, pad), () => {
      const tekst = readFileSync(pad, 'utf8');
      const info = tekst.match(/^:::info\n([\s\S]*?)\n:::/m)?.[1] ?? '';
      // Zonder blok, of met een titel achter :::info, slaagde de test stil.
      // De eerste stap van een project noemt de Python die het project
      // gebruikt; een latere stap mag een eigen blok hebben, maar hoeft niet.
      if (eersteStappen.has(pad))
        expect(info.length, 'de eerste stap heeft een :::info zonder titel').toBeGreaterThan(0);
      const fout: string[] = [];
      let vorige = 0;
      for (const m of info.matchAll(/uit\s+\[[^\]]*\]\(site:([^)#]+)(?:#[^)]*)?\)/g)) {
        const zin = info.slice(vorige, m.index);
        vorige = (m.index ?? 0) + m[0].length;
        const termen = [...zin.matchAll(/`([^`]+)`/g)].map((t) => kern(t[1]));
        if (termen.length === 0) continue;
        const doel = lessen.get(m[1]);
        if (!doel) {
          fout.push(`site:${m[1]} bestaat niet`);
          continue;
        }
        // Alleen code telt: een codeblok, een editor of een term tussen
        // backticks. Eerst zocht de test het woord in het hele bestand, en dan
        // gaf `min` ook groen op een les waar min alleen in een zin stond.
        const daar = readFileSync(doel, 'utf8');
        const code = `${codeVan(daar)}\n${[...daar.matchAll(/`([^`\n]+)`/g)].map((t) => t[1]).join('\n')}`;
        for (const term of termen) {
          const eind = /\w$/.test(term) ? '\\b' : '';
          const woord = new RegExp(
            `(^|\\W)${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${eind}`,
            'm',
          );
          if (!woord.test(code)) fout.push(`\`${term}\` staat niet in de code van site:${m[1]}`);
        }
      }
      expect(fout).toEqual([]);
    });
  }
});

// De routepagina zet per fase bij elkaar wat je moet kunnen voordat je
// begint (`## Wat moet je al kunnen?`). Die tabel moet de :::info-blokken van
// de projecten volgen: elke link naar de python-cursus of een ander hoofdstuk
// staat in de rij van de fase, en een link naar een project van een andere
// fase staat erin als "fase X".

const FASES = ['A', 'B', 'C', 'D', 'E', 'F'];

describe('de voorkennis per fase op de routepagina volgt de projecten', () => {
  const route = readFileSync(join(DOCS, 'machine-learning.md'), 'utf8');
  const sectie = route.split('## Wat moet je al kunnen?')[1]?.split(/^## /m)[0] ?? '';
  const rijen = new Map<string, string[]>();
  for (const regel of sectie.split('\n')) {
    const cellen = regel.split('|').map((c) => c.trim());
    if (FASES.includes(cellen[1])) rijen.set(cellen[1], cellen.slice(2));
  }

  it('elke fase heeft een rij', () => {
    expect([...rijen.keys()]).toEqual(FASES);
  });

  ML_MAPPEN.forEach((map, i) => {
    const fase = FASES[i];
    it(`fase ${fase} (${map})`, () => {
      const [python = '', cursus = ''] = rijen.get(fase) ?? [];
      const mist: string[] = [];
      for (const pad of projecten.filter((p) => p.includes(`/${map}/`))) {
        const info = readFileSync(pad, 'utf8').match(/^:::info\n([\s\S]*?)\n:::/m)?.[1] ?? '';
        for (const m of info.matchAll(/\]\((site:[^)]+)\)/g)) {
          const doel = m[1];
          const ml = doel.match(/^site:algorithms\/docs\/(ml-[a-z]+)\//);
          if (ml) {
            if (ml[1] === map) continue;
            const andere = FASES[ML_MAPPEN.indexOf(ml[1])];
            if (!new RegExp(`fase[^|]*\\b${andere}\\b`).test(cursus))
              mist.push(`${relative(DOCS, pad)}: fase ${andere}`);
          } else if (!`${python} ${cursus}`.includes(`(${doel})`)) {
            mist.push(`${relative(DOCS, pad)}: ${doel}`);
          }
        }
      }
      expect(mist).toEqual([]);
    });
  });
});

// De tabel volgde eerst alleen de :::info-blokken. Daardoor miste hij wat de
// code wel gebruikte maar het blok niet noemde: `in` op een dictionary en een
// loop over zijn sleutels (les 11b) in fase A en B, `def` en `return` in fase
// D, `random.seed` uit fase B in Nim, en een tuple als sleutel uit fase D in
// de kortste weg ("geen eerdere fase" stond er bij E). Deze test leest de code
// van elke fase, en eist per bouwsteen dat de rij hem dekt: met de les zelf, of
// met de fase waar hij vandaan komt. De rijen van de fases die een rij noemt,
// tellen mee.

type Bouwsteen = { naam: string; patroon: (code: string) => boolean; les?: string; fase?: string };

const DICT_NAMEN = /^\s*(\w+) = \{/gm;
function dictNamen(code: string): string[] {
  return [...code.matchAll(DICT_NAMEN)].map((m) => m[1]);
}

const BOUWSTENEN: Bouwsteen[] = [
  {
    naam: 'def met return',
    patroon: (c) => /^\s*def \w+\(/m.test(c) && /\breturn\b/.test(c),
    les: 'site:python/docs/functies/09b-return',
  },
  {
    naam: 'while',
    patroon: (c) => /^\s*while /m.test(c),
    les: 'site:python/docs/herhalen/while-loop',
  },
  {
    naam: 'in op een dictionary, of een loop over zijn sleutels',
    patroon: (c) =>
      dictNamen(c).some((d) =>
        new RegExp(`(\\bnot in ${d}\\b|\\bin ${d}\\b)`).test(c.replace(/\bin \w+\.split\(\)/g, '')),
      ),
    les: 'site:python/docs/data/11b-itereren-dictionaries',
  },
  { naam: 'random.seed', patroon: (c) => /random\.seed\(/.test(c), fase: 'B' },
  {
    naam: 'een tuple als sleutel',
    patroon: (c) => /\{\s*\(?\w+\s*:/.test(c) && /\w+\[\(\w+, \w+\)\]|\{start: 0\}/.test(c),
    fase: 'D',
  },
];

function codeVan(tekst: string): string {
  const stukken = [
    ...[...tekst.matchAll(/```python\n([\s\S]*?)```/g)].map((m) => m[1]),
    ...[...tekst.matchAll(/initialCode=\{`([\s\S]*?)`\}/g)].map((m) => m[1]),
  ];
  return stukken.join('\n');
}

describe('de voorkennis per fase dekt de code van de fase', () => {
  const route = readFileSync(join(DOCS, 'machine-learning.md'), 'utf8');
  const sectie = route.split('## Wat moet je al kunnen?')[1]?.split(/^## /m)[0] ?? '';
  const rijen = new Map<string, [string, string]>();
  for (const regel of sectie.split('\n')) {
    const c = regel.split('|').map((x) => x.trim());
    if (FASES.includes(c[1])) rijen.set(c[1], [c[2] ?? '', c[3] ?? '']);
  }
  const eerdere = (fase: string): string[] => {
    const cursus = rijen.get(fase)?.[1] ?? '';
    return FASES.filter((f) => f !== fase && new RegExp(`fase[^|]*\\b${f}\\b`).test(cursus));
  };

  ML_MAPPEN.forEach((map, i) => {
    const fase = FASES[i];
    it(`fase ${fase} (${map})`, () => {
      const code = projecten
        .filter((p) => p.includes(`/${map}/`))
        .map((p) => codeVan(readFileSync(p, 'utf8')))
        .join('\n');
      const zichtbaar = [fase, ...eerdere(fase)];
      const gedekt = zichtbaar.map((f) => rijen.get(f)?.join(' ') ?? '').join(' ');
      const mist: string[] = [];
      for (const b of BOUWSTENEN) {
        if (!b.patroon(code)) continue;
        if (b.les && !gedekt.includes(`(${b.les})`)) mist.push(`${b.naam}: ${b.les}`);
        if (b.fase && !zichtbaar.includes(b.fase)) mist.push(`${b.naam}: fase ${b.fase}`);
      }
      expect(mist).toEqual([]);
    });
  });
});
