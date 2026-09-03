import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { knowledgeGraph } from './knowledgeGraph';
import { progressData } from './progress';

// Bewaakt de twee handgeschreven datasets achter de kennisgraaf, de skill-tree
// en het radardiagram. Ze wijzen naar elkaar via losse strings ('basis',
// 'Basis', 't06', '06a. For-loop') die nergens getypeerd zijn: een typefout in
// een concept-id laat KnowledgeGraph.js omvallen op `.find(...).label`, een
// ontbrekende sleutel in progress.js tekent een NaN in de SVG, en een les die
// wél in docs/ staat maar niet in progress.js valt stil buiten de grafiek.
//
// Geen van beide bestanden bevat een docs-link; de koppeling met de lessen
// loopt via het nummerprefix van de bestandsnaam (04a-f-strings.mdx <->
// '04a. f-strings' <-> 't04').

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const concepten = knowledgeGraph.concepts;
const tutorials = knowledgeGraph.tutorials;
const conceptIds = new Set(concepten.map((c) => c.id));

// Prefix van een lesbestand: '04a-f-strings.mdx' -> '04a'.
const lesPrefixen = alleLesbestanden(DOCS)
  .map((pad) => basename(pad).match(/^(\d+[a-z]?)-/)?.[1])
  .filter((p): p is string => p !== undefined)
  .sort();

// Prefix van een progress-rij: '04a. f-strings' -> '04a'.
function progressPrefix(tutorial: string): string | undefined {
  return tutorial.match(/^(\d+[a-z]?)\. /)?.[1];
}

// Lessen die (nog) geen rij in progress.js hebben, met de reden. Zonder deze
// lijst dekt de test alleen wat er is; nu valt elke nieuwe les op tot iemand
// hem hier of in progress.js zet.
const ZONDER_VOORTGANG: Record<string, string> = {
  '06d': 'break: later toegevoegd, niveau per concept nog niet toegekend',
  '09c': 'scope: later toegevoegd, niveau per concept nog niet toegekend',
  '09d': 'modules: later toegevoegd, niveau per concept nog niet toegekend',
  '09e': 'eigen module: later toegevoegd, niveau per concept nog niet toegekend',
};

describe('knowledgeGraph.js', () => {
  it('concept-ids en tutorial-ids zijn uniek', () => {
    expect(conceptIds.size).toBe(concepten.length);
    const tIds = tutorials.map((t) => t.id);
    expect(new Set(tIds).size).toBe(tIds.length);
  });

  it('elke tutorial-id past bij het nummer in zijn titel, in oplopende volgorde', () => {
    const kapot = tutorials
      .filter((t) => `t${t.title.match(/^(\d+)\. /)?.[1]}` !== t.id)
      .map((t) => `${t.id}: '${t.title}'`);
    expect(kapot).toEqual([]);

    const nummers = tutorials.map((t) => Number(t.id.slice(1)));
    expect(nummers).toEqual([...nummers].sort((a, b) => a - b));
  });

  it('elke impact wijst naar een bestaand concept, hoogstens één keer per tutorial', () => {
    const kapot: string[] = [];
    for (const t of tutorials) {
      const gezien = new Set<string>();
      for (const imp of t.impact) {
        if (!conceptIds.has(imp.concept))
          kapot.push(`${t.id} -> onbekend concept '${imp.concept}'`);
        if (gezien.has(imp.concept)) kapot.push(`${t.id} -> '${imp.concept}' dubbel`);
        gezien.add(imp.concept);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('elk impact-niveau ligt tussen 1 en maxLevel van het concept', () => {
    // SkillTree tekent maxLevel + 1 bolletjes en zoekt daarin het niveau op;
    // een niveau daarbuiten krijgt nooit een tekstballon.
    const maxPerConcept = new Map(concepten.map((c) => [c.id, c.maxLevel]));
    const kapot: string[] = [];
    for (const t of tutorials) {
      for (const imp of t.impact) {
        const max = maxPerConcept.get(imp.concept) ?? 0;
        if (!Number.isInteger(imp.level) || imp.level < 1 || imp.level > max) {
          kapot.push(`${t.id}/${imp.concept}: niveau ${imp.level} (max ${max})`);
        }
      }
    }
    expect(kapot).toEqual([]);
  });

  it('niveaus lopen per concept niet terug over de tutorials heen', () => {
    // De componenten nemen het maximum tot nu toe; een lager niveau in een
    // latere tutorial is dus een typefout die nooit zichtbaar wordt.
    const hoogste = new Map<string, { level: number; tutorial: string }>();
    const kapot: string[] = [];
    for (const t of tutorials) {
      for (const imp of t.impact) {
        const vorig = hoogste.get(imp.concept);
        if (vorig && imp.level <= vorig.level) {
          kapot.push(`${t.id}/${imp.concept}: ${imp.level} na ${vorig.level} in ${vorig.tutorial}`);
        }
        hoogste.set(imp.concept, { level: imp.level, tutorial: t.id });
      }
    }
    expect(kapot).toEqual([]);
  });

  it('elke verbinding loopt tussen twee bestaande, verschillende concepten', () => {
    const kapot: string[] = [];
    const gezien = new Set<string>();
    for (const { from, to } of knowledgeGraph.connections) {
      if (!conceptIds.has(from) || !conceptIds.has(to)) kapot.push(`${from} -> ${to}: onbekend`);
      if (from === to) kapot.push(`${from} -> ${to}: naar zichzelf`);
      if (gezien.has(`${from}>${to}`)) kapot.push(`${from} -> ${to}: dubbel`);
      gezien.add(`${from}>${to}`);
    }
    expect(kapot).toEqual([]);
  });

  it('de verbindingen vormen geen kringloop', () => {
    const uit = new Map<string, string[]>();
    for (const { from, to } of knowledgeGraph.connections) {
      uit.set(from, [...(uit.get(from) ?? []), to]);
    }
    const klaar = new Set<string>();
    const opPad = new Set<string>();
    const kring: string[] = [];
    const bezoek = (id: string, pad: string[]) => {
      if (opPad.has(id)) {
        kring.push([...pad, id].join(' -> '));
        return;
      }
      if (klaar.has(id)) return;
      opPad.add(id);
      for (const volgende of uit.get(id) ?? []) bezoek(volgende, [...pad, id]);
      opPad.delete(id);
      klaar.add(id);
    };
    for (const id of conceptIds) bezoek(id, []);
    expect(kring).toEqual([]);
  });

  it('elk concept wordt door minstens één tutorial geraakt', () => {
    const geraakt = new Set(tutorials.flatMap((t) => t.impact.map((i) => i.concept)));
    expect([...conceptIds].filter((id) => !geraakt.has(id))).toEqual([]);
  });

  it('elke tutorial hoort bij minstens één les in docs/', () => {
    const nummers = new Set(lesPrefixen.map((p) => p.replace(/[a-z]$/, '')));
    const kapot = tutorials.filter((t) => !nummers.has(t.id.slice(1))).map((t) => t.id);
    expect(kapot).toEqual([]);
  });
});

describe('progress.js', () => {
  const eersteSleutels = Object.keys(progressData[0].levels).sort();

  it('elke rij heeft dezelfde concept-sleutels als de eerste', () => {
    // SkillGraph leest de sleutels van rij 0 en zoekt ze in elke andere rij op.
    const kapot = progressData
      .filter((d) => Object.keys(d.levels).sort().join() !== eersteSleutels.join())
      .map((d) => d.tutorial);
    expect(kapot).toEqual([]);
  });

  it('de sleutels zijn precies de concepten uit de kennisgraaf', () => {
    expect(eersteSleutels.map((s) => s.toLowerCase()).sort()).toEqual([...conceptIds].sort());
  });

  it('elk niveau is een geheel getal van 0 tot en met 10', () => {
    // Het radardiagram toont "Niveau x / 10".
    const kapot: string[] = [];
    for (const d of progressData) {
      for (const [concept, niveau] of Object.entries(d.levels)) {
        if (!Number.isInteger(niveau) || niveau < 0 || niveau > 10) {
          kapot.push(`${d.tutorial}/${concept}: ${niveau}`);
        }
      }
    }
    expect(kapot).toEqual([]);
  });

  it('niveaus lopen per concept nooit terug', () => {
    const kapot: string[] = [];
    for (let i = 1; i < progressData.length; i++) {
      const vorig = progressData[i - 1];
      const nu = progressData[i];
      for (const concept of Object.keys(nu.levels) as (keyof typeof nu.levels)[]) {
        if (nu.levels[concept] < vorig.levels[concept]) {
          kapot.push(
            `${nu.tutorial}/${concept}: ${nu.levels[concept]} na ${vorig.levels[concept]}`,
          );
        }
      }
    }
    expect(kapot).toEqual([]);
  });

  it('elke rij hoort bij een les in docs/ en een tutorial in de kennisgraaf', () => {
    const tutorialIds = new Set(tutorials.map((t) => t.id));
    const kapot: string[] = [];
    for (const d of progressData) {
      const prefix = progressPrefix(d.tutorial);
      if (!prefix) {
        kapot.push(`'${d.tutorial}' begint niet met een lesnummer`);
        continue;
      }
      if (!lesPrefixen.includes(prefix)) kapot.push(`'${d.tutorial}': geen les ${prefix}-*`);
      if (!tutorialIds.has(`t${prefix.replace(/[a-z]$/, '')}`)) {
        kapot.push(`'${d.tutorial}': geen tutorial in de kennisgraaf`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('de rijen staan in lesvolgorde en elke les komt maar één keer voor', () => {
    const prefixen = progressData.map((d) => progressPrefix(d.tutorial) ?? '');
    expect(new Set(prefixen).size).toBe(prefixen.length);
    expect(prefixen).toEqual([...prefixen].sort());
  });

  it('elke les in docs/ heeft een rij, of staat met reden in de uitzonderingen', () => {
    const metRij = new Set(progressData.map((d) => progressPrefix(d.tutorial)));
    const vergeten = lesPrefixen.filter((p) => !metRij.has(p) && !(p in ZONDER_VOORTGANG));
    expect(vergeten).toEqual([]);
  });

  it('houdt de uitzonderingenlijst zelf ook schoon', () => {
    const metRij = new Set(progressData.map((d) => progressPrefix(d.tutorial)));
    const kapot: string[] = [];
    for (const [prefix, reden] of Object.entries(ZONDER_VOORTGANG)) {
      if (!lesPrefixen.includes(prefix)) kapot.push(`${prefix}: geen les meer`);
      if (metRij.has(prefix)) kapot.push(`${prefix}: heeft inmiddels een rij`);
      if (reden.trim() === '') kapot.push(`${prefix}: geen reden`);
    }
    expect(kapot).toEqual([]);
  });
});
