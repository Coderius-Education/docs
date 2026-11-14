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
    expect(runCommand(state, 'git status').output).toMatch(/new file: {3}geheim\.txt/);
  });

  it('staat geheim.txt alleen in staging, dan is het niet vast: de tip zegt hoe het eruit gaat', () => {
    // Eerst stond hier "klik op herstart oefening", terwijl het nog op te
    // lossen was, met wat git status zelf aanraadt.
    const state = na(geheim, 'git add .', negeer);
    expect(s.objective.vast?.(state)).toBeNull();
    expect(s.objective.tip?.(state)).toMatch(/git restore --staged geheim\.txt/);
    for (const oplossing of ['git restore --staged geheim.txt', 'git rm --cached geheim.txt']) {
      const r = runCommand(state, oplossing);
      expect(r.ok, oplossing).toBe(true);
      expect(s.objective.check(r.newState), oplossing).toBe(true);
    }
  });

  it('staat geheim.txt in een commit, dan is het vast, met de echte reden', () => {
    const state = na(geheim, 'git add .', 'git commit -m "oeps"', negeer);
    expect(s.objective.check(state)).toBe(false);
    expect(s.objective.vast?.(state)).toMatch(/in de geschiedenis.*herstart oefening/);
    // Ook als git het daarna niet meer volgt: de oude commit heeft het nog.
    const later = na(
      geheim,
      'git add .',
      'git commit -m "oeps"',
      negeer,
      'git rm --cached geheim.txt',
      'git commit -m "weg"',
    );
    expect(s.objective.check(later)).toBe(false);
    expect(s.objective.vast?.(later)).toMatch(/herstart oefening/);
  });

  it('zit het in de laatste commit met nog iets anders, dan haalt --amend het eruit', () => {
    const anders = { soort: 'schrijf', naam: 'hello.txt', inhoud: 'Hallo.\n' } as const;
    const state = na(geheim, anders, 'git add .', 'git commit -m "oeps"', negeer);
    expect(s.objective.vast?.(state)).toBeNull();
    expect(s.objective.tip?.(state)).toMatch(/git rm --cached geheim\.txt.*--amend/);
    let st = state;
    for (const c of ['git rm --cached geheim.txt', 'git commit --amend -m "zonder geheim"'])
      st = runCommand(st, c).newState;
    expect(s.objective.check(st)).toBe(true);
  });

  it('na git rm --cached noemt de tip alleen nog de --amend', () => {
    // De tip bleef `git rm --cached geheim.txt` aanraden nadat de leerling
    // dat al deed, en nog een keer gaf `fatal: pathspec 'geheim.txt' did
    // not match any files`.
    const anders = { soort: 'schrijf', naam: 'hello.txt', inhoud: 'Hallo.\n' } as const;
    const state = na(
      geheim,
      anders,
      'git add .',
      'git commit -m "oeps"',
      negeer,
      'git rm --cached geheim.txt',
    );
    expect(s.objective.vast?.(state)).toBeNull();
    const tip = s.objective.tip?.(state) ?? '';
    expect(tip).toMatch(/git commit --amend/);
    expect(tip).not.toMatch(/git rm --cached/);
    expect(runCommand(state, 'git rm --cached geheim.txt').ok).toBe(false);
    expect(s.objective.check(runCommand(state, 'git commit --amend -m "zonder"').newState)).toBe(
      true,
    );
  });

  it('is geheim.txt weg uit de werkmap, dan zegt de tip het, en hoe het terugkomt', () => {
    // Weggegooid met de knop x, of met git rm en --amend: het doel bleef
    // open, zonder dat iets zei waarom.
    const anders = { soort: 'schrijf', naam: 'hello.txt', inhoud: 'Hallo.\n' } as const;
    const weg = { soort: 'verwijder', naam: 'geheim.txt' } as const;
    for (const [hoe, state] of [
      ['met de knop x', na(geheim, negeer, weg)],
      [
        'met git rm en --amend',
        na(
          geheim,
          anders,
          'git add .',
          'git commit -m "oeps"',
          negeer,
          'git rm geheim.txt',
          'git commit --amend -m "zonder"',
        ),
      ],
    ] as const) {
      expect(s.objective.check(state), hoe).toBe(false);
      expect(s.objective.vast?.(state), hoe).toBeNull();
      expect(s.objective.tip?.(state), hoe).toMatch(/niet in de werkmap.*\+ nieuw bestand/);
      expect(s.objective.check(doeStap(state, geheim).state), hoe).toBe(true);
    }
  });

  it('een spatie voor geheim.txt in .gitignore: de tip zegt dat git die meeleest', () => {
    const state = na(geheim, { soort: 'schrijf', naam: '.gitignore', inhoud: ' geheim.txt\n' });
    expect(s.objective.check(state)).toBe(false);
    expect(s.objective.tip?.(state)).toMatch(/spatie voor geheim\.txt/);
  });

  it('in de goede volgorde is er niets vastgelopen', () => {
    expect(s.objective.vast?.(na(geheim))).toBeNull();
    const state = na(geheim, negeer);
    expect(s.objective.check(state)).toBe(true);
    expect(s.objective.vast?.(state)).toBeNull();
  });

  it('het doel kijkt naar wat er nu is: zonder .gitignore niet meer gehaald', () => {
    // Na het weggooien van .gitignore bleef het doel groen.
    const state = na(geheim, negeer, { soort: 'verwijder', naam: '.gitignore' });
    expect(s.objective.check(state)).toBe(false);
    expect(runCommand(state, 'git status').output).toContain('\tgeheim.txt');
  });

  it('opslaan in de simulator en in de test is dezelfde functie', () => {
    const state = schrijfBestand(beginsituatie(s), '.gitignore', '# geheimen\n\ngeheim.txt\n');
    expect(state.ignored).toEqual(['geheim.txt']);
  });
});

describe('stap 2 en 6 tellen elk commando dat lukte', () => {
  const begin = (id: string) => beginsituatie(SCENARIOS[id]);
  const na = (id: string, c: string) => runCommand(begin(id), c).newState;

  it('stap 6: elk log-commando dat het log toont', () => {
    // Eerst telden alleen `git log` en `git log --oneline`.
    const { check } = SCENARIOS['stap-6-log'].objective;
    for (const c of [
      'git log',
      'git log -1',
      'git log -n 2',
      'git log --oneline -3',
      'git log main',
      'git status && git log --oneline',
      'git --no-pager log',
    ])
      expect(check(na('stap-6-log', c)), c).toBe(true);
    for (const c of ['git log --foo', 'git log --graph', 'git logx', 'git status'])
      expect(check(na('stap-6-log', c)), c).toBe(false);
  });

  it('stap 2: ook git status -s', () => {
    const { check } = SCENARIOS['stap-2-status'].objective;
    expect(check(na('stap-2-status', 'git status -s'))).toBe(true);
    expect(check(na('stap-2-status', 'git status --bogus'))).toBe(false);
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
