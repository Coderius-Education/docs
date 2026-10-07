import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lessen } from '../data/lessen';

// Een les verwijst naar een opdracht ("schrijf de oplossing van 9d.1 om") of
// naar een les ("zoals de teller in les 6c"). Na een verhuizing of een
// hernummering wees zo'n verwijzing vier keer naar de verkeerde plek: 9d.2
// noemde 9c.1, 9e noemde 9c en 9d.1, 14b noemde les 6a. Een opdracht waar je
// op voortbouwt staat in hetzelfde hoofdstuk, in dezelfde of een eerdere les;
// een les die je noemt, bestaat.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const bestanden = readdirSync(DOCS)
  .filter((m) => /^\d+-/.test(m))
  .sort()
  .flatMap((m) =>
    readdirSync(join(DOCS, m))
      .filter((n) => n.endsWith('.mdx'))
      .sort()
      .map((n) => `${m}/${n}`),
  );

const tekst = (pad: string) => readFileSync(join(DOCS, pad), 'utf8');

// Code en de opdrachtkoppen zelf tellen niet: alleen wat de leerling leest.
function proza(t: string): string {
  return t
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<CodeExercise>\{`[\s\S]*?`\}<\/CodeExercise>/g, '')
    .replace(/^#+ Opdracht.*$/gm, '');
}

const opdrachten = new Map<string, number>();
bestanden.forEach((pad, i) => {
  for (const m of tekst(pad).matchAll(/^#+ Opdracht (\d+[a-z]?\.\d+)/gm)) opdrachten.set(m[1], i);
});

describe('verwijzingen naar opdrachten en lessen', () => {
  it('er zijn opdrachten om naar te verwijzen', () => {
    expect(opdrachten.size).toBeGreaterThan(50);
  });

  it('een opdracht die je noemt, staat in hetzelfde hoofdstuk, niet verderop', () => {
    const kapot: string[] = [];
    bestanden.forEach((pad, i) => {
      for (const m of proza(tekst(pad)).matchAll(/(?<![\d.])(\d{1,2}[a-k]\.\d)(?!\d)/g)) {
        const doel = opdrachten.get(m[1]);
        if (doel === undefined) kapot.push(`${pad}: ${m[1]} bestaat niet`);
        else if (dirname(bestanden[doel]) !== dirname(pad))
          kapot.push(`${pad}: ${m[1]} staat in een ander hoofdstuk (${bestanden[doel]})`);
        else if (doel > i) kapot.push(`${pad}: ${m[1]} komt pas later`);
      }
    });
    expect(kapot).toEqual([]);
  });

  it('een les die je noemt, bestaat', () => {
    const ids = new Set(lessen.map((l) => l.id.replace(/^0/, '')));
    const kapot: string[] = [];
    for (const pad of bestanden) {
      for (const m of proza(tekst(pad)).matchAll(/\bles (\d{1,2}[a-k]?)\b/g)) {
        if (!ids.has(m[1])) kapot.push(`${pad}: les ${m[1]}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('vangt de verwijzing die 9d.2 had', () => {
    const i = bestanden.indexOf('06-modules/09d-modules.mdx');
    const doel = opdrachten.get('9c.1');
    expect(doel).toBeDefined();
    expect(dirname(bestanden[doel as number])).not.toBe(dirname(bestanden[i]));
  });
});
