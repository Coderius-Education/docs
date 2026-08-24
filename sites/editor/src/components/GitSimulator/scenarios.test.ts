import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { type RepoState, deleteFile, emptyState, runCommand, setFile } from './gitEngine';
import { SCENARIOS, type Scenario } from './scenarios';

// Een leerdoel dat niet te halen is, is de stilste bug van deze site: het
// vinkje wordt nooit groen en de leerling weet niet of het aan hem of aan de
// pagina ligt. Daarom speelt deze test elk doel echt na.

const BASIS = fileURLToPath(new URL('../../../docs/git/basis', import.meta.url));

function speelNa(s: Scenario): RepoState {
  let state = emptyState(s.initialFiles);
  for (const stap of s.oplossing) {
    if (typeof stap === 'string') {
      const r = runCommand(state, stap);
      state = r.newState;
      continue;
    }
    if (stap.soort === 'verwijder') {
      state = deleteFile(state, stap.naam);
      continue;
    }
    state = setFile(state, stap.naam, stap.inhoud);
    // De simulator leidt de negeerlijst af uit .gitignore zodra je die opslaat;
    // index.tsx doet dat in saveEditor. Hier hetzelfde, anders test deze suite
    // een ander bestand dan de leerling bewerkt.
    if (stap.naam === '.gitignore') {
      state = {
        ...state,
        ignored: stap.inhoud
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#')),
      };
    }
  }
  return state;
}

describe('elk leerdoel is haalbaar', () => {
  for (const s of Object.values(SCENARIOS)) {
    it(`${s.id}: de oplossing haalt het doel`, () => {
      expect(s.objective.check(speelNa(s))).toBe(true);
    });

    it(`${s.id}: het doel staat niet meteen op groen`, () => {
      // Zonder deze kant is een doel als `() => true` ook "haalbaar".
      expect(s.objective.check(emptyState(s.initialFiles))).toBe(false);
    });

    it(`${s.id}: elk commando in de oplossing wordt geaccepteerd`, () => {
      let state = emptyState(s.initialFiles);
      for (const stap of s.oplossing) {
        if (typeof stap !== 'string') {
          state = setFile(
            state,
            stap.naam,
            'soort' in stap && stap.soort === 'schrijf' ? stap.inhoud : '',
          );
          continue;
        }
        const r = runCommand(state, stap);
        expect(r.output, `${s.id}: '${stap}' werd niet begrepen`).not.toMatch(
          /is not a git command|command not found/,
        );
        state = r.newState;
      }
    });
  }
});

describe('de pagina en de scenario-lijst horen bij elkaar', () => {
  const paginas = readdirSync(BASIS).filter((f) => f.endsWith('.mdx'));

  it('vindt de lespaginas', () => {
    expect(paginas.length).toBeGreaterThan(0);
  });

  it('elke scenarioId op een pagina bestaat', () => {
    const gebruikt: string[] = [];
    for (const p of paginas) {
      const inhoud = readFileSync(join(BASIS, p), 'utf8');
      for (const m of inhoud.matchAll(/scenarioId="([^"]+)"/g)) {
        gebruikt.push(m[1]);
        expect(SCENARIOS[m[1]], `${p} verwijst naar onbekend scenario '${m[1]}'`).toBeDefined();
      }
    }
    expect(gebruikt.length).toBeGreaterThan(0);
  });

  it('elk scenario wordt door een pagina gebruikt', () => {
    // Andersom: een scenario dat nergens staat is dood gewicht dat wel
    // meegetest wordt en zo een vals gevoel van dekking geeft.
    const alleMdx = paginas.map((p) => readFileSync(join(BASIS, p), 'utf8')).join('\n');
    const ongebruikt = Object.keys(SCENARIOS).filter(
      (id) => !alleMdx.includes(`scenarioId="${id}"`),
    );
    expect(ongebruikt).toEqual([]);
  });

  it('de simulator staat op elke stap-pagina', () => {
    const zonder = paginas
      .filter((p) => p.startsWith('stap-'))
      .filter((p) => !readFileSync(join(BASIS, p), 'utf8').includes('<GitSimulator'));
    expect(zonder).toEqual([]);
  });
});

describe('de commandos uit de lestekst werken in de simulator', () => {
  it('elk bash-blok op een basis-pagina wordt begrepen', () => {
    // De les toont `git add .` alleen in lopende tekst en `git commit -m "..."`
    // in een blok. Breekt de parser daarop, dan volgt de leerling de pagina en
    // krijgt hij een foutmelding.
    const problemen: string[] = [];

    for (const p of readdirSync(BASIS).filter((f) => f.endsWith('.mdx'))) {
      const inhoud = readFileSync(join(BASIS, p), 'utf8');
      for (const blok of inhoud.matchAll(/```bash\n([\s\S]*?)```/g)) {
        // Elk blok begint bij een verse repository die al geinitialiseerd is,
        // want de pagina's tonen losse commando's zonder de aanloop.
        let state = runCommand(emptyState({ 'hello.txt': 'Hallo wereld.\n' }), 'git init').newState;

        for (const regel of blok[1]
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean)) {
          const r = runCommand(state, regel);
          if (/is not a git command|command not found|usage: git/.test(r.output)) {
            problemen.push(`${p}: '${regel}'`);
          }
          state = r.newState;
        }
      }
    }

    expect(problemen).toEqual([]);
  });
});
