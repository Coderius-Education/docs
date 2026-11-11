import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tips } from '../../sites/informatica/didactiek/src/data/tips';

// Werkvormen: de schakel tussen een les en vakdidactiek. Elk les-tabblad
// heeft een werkvorm, elke werkvorm een icoon en minstens één tip, en elke
// tip bestaat bij vakdidactiek. Zonder deze test wijst een icoon in de
// docentenhandleiding stil naar een tip die is hernoemd of verdwenen.

const require = createRequire(import.meta.url);
const { WERKVORMEN, werkvorm, werkvormVan, werkvormenVan } = require('./werkvormen/index.js');
const { werkvormenVanLes, mdxParser } = require('./plugins/werkvormen.js');

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIDACTIEK = join(ROOT, 'sites/informatica/didactiek');

describe('werkvormen.json', () => {
  it('elke werkvorm heeft een eigen id, een label, een zin en een icoon', () => {
    const ids = WERKVORMEN.map((w: { id: string }) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of WERKVORMEN) {
      expect(w.label, w.id).toMatch(/^[A-Z]/);
      // Eén zin voor de docent, over zijn leerlingen (stijlgids §15).
      expect(w.doet, w.id).toMatch(/^[A-ZÉ].*\.$/);
      expect(w.doet, w.id).not.toMatch(/\bje leert\b|\bde leerling\b/);
      expect(w.icoon.length, w.id).toBeGreaterThan(0);
      for (const d of w.icoon) expect(d, w.id).toMatch(/^M[\d\s.,a-zA-Z-]+$/);
      // Een patroon dat niet compileert, gooit hier.
      for (const k of [...w.koppen, ...(w.laatsteVan ? [w.laatsteVan] : [])]) new RegExp(k);
    }
  });

  it('precies één werkvorm vangt de koppen op die nergens bij horen', () => {
    const standaard = WERKVORMEN.filter((w: { standaard?: boolean }) => w.standaard);
    expect(standaard.map((w: { id: string }) => w.id)).toEqual(['uitleg']);
    expect(standaard[0].koppen).toEqual([]);
  });

  it('elke werkvorm wijst naar minstens één tip die bij vakdidactiek bestaat, onder dezelfde naam', () => {
    const fout: string[] = [];
    for (const w of WERKVORMEN) {
      if (w.tips.length === 0) fout.push(`${w.id}: geen tip`);
      for (const { slug, term } of w.tips) {
        const tip = tips.find((t) => t.slug === slug);
        if (!tip) fout.push(`${w.id}: geen tip '${slug}' bij vakdidactiek`);
        else if (tip.term !== term) fout.push(`${w.id}: '${slug}' heet daar "${tip.term}"`);
        if (!existsSync(join(DIDACTIEK, 'docs', `${slug}.md`)))
          fout.push(`${w.id}: docs/${slug}.md`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('noemt bij elke tip de paper waar hij op steunt, zoals vakdidactiek hem noemt', () => {
    // De docentenhandleiding toont de literatuur naast de tip. Een bron
    // noemen we alleen als vakdidactiek hem uitlegt, met dezelfde paper.
    const fout: string[] = [];
    for (const w of WERKVORMEN) {
      for (const { slug, bron } of w.tips as { slug: string; bron?: string }[]) {
        const tip = tips.find((t) => t.slug === slug);
        if (!tip) continue;
        const verwacht =
          tip.bron === 'onderzoek' ? `${tip.paper.auteurs} (${tip.paper.jaar})` : undefined;
        if (bron !== verwacht) fout.push(`${w.id}: '${slug}' is ${verwacht ?? 'uit de praktijk'}`);
      }
    }
    expect(fout).toEqual([]);
  });
});

describe('werkvormVan en werkvormenVan', () => {
  it('herkent de vaste koppen van een les', () => {
    expect(
      [
        'Wat ga je leren?',
        'Theorie',
        'Predict',
        'Probeer en onderzoek',
        'Modify',
        'Make',
        'Er gaat iets mis',
        'Stap 2: de functie aan een event koppelen',
        'De for-loop: vooraf bekend aantal keer',
        'Uitleg',
      ].map(werkvormVan),
    ).toEqual([
      'leerdoel',
      'uitleg',
      'voorspellen',
      'onderzoeken',
      'aanpassen',
      'maken',
      'fouten',
      'stap',
      'uitleg',
      'uitleg',
    ]);
  });

  it('van een rij genummerde opdrachten is alleen de laatste zelf maken', () => {
    expect(werkvormenVan(['Opdracht 1: A', 'Opdracht 2: B', 'Opdracht 3: C'])).toEqual([
      'aanpassen',
      'aanpassen',
      'maken',
    ]);
    // Eén opdracht is geen rij: die blijft aanpassen.
    expect(werkvormenVan(['Predict', 'Opdracht 1: A'])).toEqual(['voorspellen', 'aanpassen']);
  });

  it('geeft bij een id de werkvorm terug', () => {
    expect(werkvorm('fouten').label).toBe('Fouten herkennen');
    expect(werkvorm('bestaat-niet')).toBeUndefined();
  });
});

describe('de werkvormen van een les (plugins/werkvormen.js)', () => {
  const LES = [
    'import X from "x";',
    '',
    '# Les',
    '',
    'export const start = `<p>',
    '',
    '## geen kop',
    '</p>`;',
    '',
    'Eerst wat uitleg.',
    '',
    'En nog een alinea, zodat de uitleg een eigen tabblad is.',
    '',
    '## Predict',
    '',
    'Vraag.',
    '',
    '## Opdracht 1: Een',
    '',
    'Doe.',
    '',
    '## Opdracht 2: Twee',
    '',
    'Doe.',
    '',
    '## Er gaat iets mis',
    '',
    'Fout.',
    '',
  ].join('\n');

  it('leest een les zoals de build: startcode telt niet, uitleg vooraf wel', async () => {
    const parse = await mdxParser();
    expect(werkvormenVanLes(LES, parse)).toEqual([
      'uitleg',
      'voorspellen',
      'aanpassen',
      'maken',
      'fouten',
    ]);
  });

  it('slaat de front matter over, ook een lege', async () => {
    // Zonder dat las de parser de laatste regel van de front matter als een
    // kop: elke les van html-css kreeg er een tabblad uitleg bij.
    const parse = await mdxParser();
    const kaal = werkvormenVanLes(LES, parse);
    expect(werkvormenVanLes(`---\n---\n\n${LES}`, parse)).toEqual(kaal);
    expect(werkvormenVanLes(`---\ntitle: Een les\n---\n\n${LES}`, parse)).toEqual(kaal);
  });

  it('telt het leerdoel mee, ook al heeft het geen eigen tabblad', async () => {
    // "Wat ga je leren?" staat bovenaan het tabblad erna (LesLeerdoel). Voor
    // de docent blijft het een werkvorm van de les.
    const parse = await mdxParser();
    const les =
      '# Les\n\n## Wat ga je leren?\n\nKoppen.\n\n## Theorie\n\nUitleg.\n\n## Make\n\nBouw.\n';
    expect(werkvormenVanLes(les, parse)).toEqual(['leerdoel', 'uitleg', 'maken']);
  });

  it('een les zonder tabbladen heeft geen werkvormen', async () => {
    const parse = await mdxParser();
    expect(werkvormenVanLes('# Les\n\nAlleen tekst.\n', parse)).toBeNull();
    expect(werkvormenVanLes(`---\nles_tabs: false\n---\n\n${LES}`, parse)).toBeNull();
  });

  it('geeft voor elke les van de web-cursus een werkvorm per tabblad', async () => {
    const parse = await mdxParser();
    const les = readFileSync(
      join(ROOT, 'sites/informatica/web/docs/html-css/koppen-lijsten.mdx'),
      'utf8',
    );
    expect(werkvormenVanLes(les, parse)).toEqual([
      'leerdoel',
      'uitleg',
      'voorspellen',
      'onderzoeken',
      'aanpassen',
      'maken',
      'fouten',
    ]);
  });
});
