import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { type RepoState, emptyState, runCommand, schrijfBestand } from './gitEngine';
import { SCENARIOS, type Scenario, doeStap } from './scenarios';

// Een leerdoel dat niet te halen is, is de stilste bug van deze site: het
// vinkje wordt nooit groen en de leerling weet niet of het aan hem of aan de
// pagina ligt. Daarom speelt deze test elk doel echt na.

const BASIS = fileURLToPath(new URL('../../../docs/git/basis', import.meta.url));

/** De toestand waarin de leerling binnenkomt, net als in de simulator. */
function beginsituatie(s: Scenario): RepoState {
  let state = emptyState(s.initialFiles);
  for (const stap of s.voorbereiding) state = doeStap(state, stap).state;
  return state;
}

function speelNa(s: Scenario): RepoState {
  let state = beginsituatie(s);
  // Dezelfde functie als de simulator: die leidt de negeerlijst af uit
  // .gitignore zodra je dat bestand opslaat.
  for (const stap of s.oplossing) state = doeStap(state, stap).state;
  return state;
}

describe('elk leerdoel is haalbaar', () => {
  for (const s of Object.values(SCENARIOS)) {
    it(`${s.id}: de oplossing haalt het doel`, () => {
      expect(s.objective.check(speelNa(s))).toBe(true);
    });

    it(`${s.id}: het doel staat niet meteen op groen`, () => {
      // Zonder deze kant is een doel als `() => true` ook "haalbaar" — en met
      // een voorbereiding erbij is de valkuil groter: die zou het doel al
      // kunnen halen voordat de leerling iets doet.
      expect(s.objective.check(beginsituatie(s))).toBe(false);
    });

    it(`${s.id}: elk commando in de oplossing wordt geaccepteerd`, () => {
      let state = beginsituatie(s);
      for (const stap of s.oplossing) {
        if (typeof stap !== 'string') {
          state = doeStap(state, stap).state;
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

describe('elke stap begint waar de vorige ophield', () => {
  const volgorde = Object.values(SCENARIOS);

  it('alleen stap 1 begint met een map zonder repository', () => {
    const zonderInit = volgorde.filter((s) => !beginsituatie(s).initialized).map((s) => s.id);
    expect(zonderInit).toEqual(['stap-1-init']);
  });

  it('elk voorbereidend commando wordt begrepen', () => {
    for (const s of volgorde) {
      let state = emptyState(s.initialFiles);
      for (const stap of s.voorbereiding) {
        const r = doeStap(state, stap);
        expect(
          r.ok,
          `${s.id}: voorbereiding '${JSON.stringify(stap)}' mislukte — ${r.output}`,
        ).toBe(true);
        state = r.state;
      }
    }
  });

  it('een stap begint met wat de vorige opleverde', () => {
    // De index belooft: "wat je in de vorige stap deed staat al gedaan". Stap
    // 6 en 7 begonnen met één commit, terwijl de leerling er in stap 5 net
    // een tweede had gemaakt: "alle commits, nieuwste eerst" was met één
    // commit niet te zien.
    const stand = (st: RepoState) => ({
      bestanden: st.workingDir,
      staging: st.staged,
      commits: st.commits.map((c) => [c.message, c.tree]),
    });
    for (let i = 1; i < volgorde.length; i++)
      expect(stand(beginsituatie(volgorde[i])), volgorde[i].id).toEqual(
        stand(speelNa(volgorde[i - 1])),
      );
  });

  it('de latere stappen hebben al een commit', () => {
    // Vanaf stap 5 gaat de les over een tweede commit, over de geschiedenis en
    // over negeren. Die vragen allemaal om een repository die al iets bevat.
    for (const id of ['stap-5-tweede-commit', 'stap-6-log', 'stap-7-gitignore']) {
      expect(beginsituatie(SCENARIOS[id]).commits.length, id).toBeGreaterThan(0);
    }
  });

  it('geen enkele oplossing begint nog met git init', () => {
    // Precies de klacht: elke oefening opnieuw bij het begin beginnen.
    const dubbel = volgorde
      .filter((s) => s.id !== 'stap-1-init')
      .filter((s) => s.oplossing.some((o) => typeof o === 'string' && o.startsWith('git init')))
      .map((s) => s.id);

    expect(dubbel).toEqual([]);
  });
});

describe('stap 7: .gitignore geldt alleen voor wat git nog niet volgt', () => {
  const s = SCENARIOS['stap-7-gitignore'];
  const na = (...stappen: Scenario['oplossing']) => {
    let state = beginsituatie(s);
    for (const stap of stappen) state = doeStap(state, stap).state;
    return state;
  };
  const geheim = { soort: 'schrijf', naam: 'geheim.txt', inhoud: 'wachtwoord123\n' } as const;
  const negeer = { soort: 'schrijf', naam: '.gitignore', inhoud: 'geheim.txt\n' } as const;

  it('wie eerst git add . typt, haalt het doel niet', () => {
    // Uit de doorloop: de balk werd groen en geheim.txt stond doorgestreept,
    // terwijl het in staging stond en git status `new file: geheim.txt`
    // meldde. Het doel keek naar de negeerlijst, niet naar wat git doet.
    const state = na(geheim, 'git add .', negeer);
    expect(s.objective.check(state)).toBe(false);
    expect(s.objective.vast?.(state)).toMatch(/herstart oefening/);
    expect(runCommand(state, 'git status').output).toMatch(/new file: {3}geheim\.txt/);
  });

  it('in de goede volgorde is er niets vastgelopen', () => {
    expect(s.objective.vast?.(na(geheim))).toBeNull();
    const state = na(geheim, negeer);
    expect(s.objective.check(state)).toBe(true);
    expect(s.objective.vast?.(state)).toBeNull();
  });

  it('opslaan in de simulator en in de test is dezelfde functie', () => {
    const state = schrijfBestand(beginsituatie(s), '.gitignore', '# geheimen\n\ngeheim.txt\n');
    expect(state.ignored).toEqual(['geheim.txt']);
  });
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
