export type Commit = {
  id: string;
  message: string;
  parent: string | null;
  tree: Record<string, string>;
};

export type RepoState = {
  initialized: boolean;
  workingDir: Record<string, string>;
  staged: Record<string, string> | null;
  commits: Commit[];
  head: string | null;
  ignored: string[];
  commands: string[];
};

export type CommandResult = {
  newState: RepoState;
  output: string;
  ok: boolean;
};

export function emptyState(initialFiles: Record<string, string> = {}): RepoState {
  return {
    initialized: false,
    workingDir: {...initialFiles},
    staged: null,
    commits: [],
    head: null,
    ignored: [],
    commands: [],
  };
}

function shortId(): string {
  return Math.random().toString(16).slice(2, 9);
}

function committedTree(state: RepoState): Record<string, string> {
  if (!state.head) return {};
  const c = state.commits.find((x) => x.id === state.head);
  return c ? c.tree : {};
}

function visibleFiles(state: RepoState): string[] {
  return Object.keys(state.workingDir).filter((f) => !state.ignored.includes(f));
}

function statusOutput(state: RepoState): string {
  if (!state.initialized) {
    return "fatal: niet in een git repository (gebruik eerst 'git init')";
  }
  const head = committedTree(state);
  const staged = state.staged ?? {};
  const wd = state.workingDir;

  const stagedNew: string[] = [];
  const stagedModified: string[] = [];
  const modified: string[] = [];
  const untracked: string[] = [];

  const allNames = new Set<string>([
    ...Object.keys(head),
    ...Object.keys(staged),
    ...visibleFiles(state),
  ]);

  for (const name of allNames) {
    const inHead = name in head;
    const inStaged = name in staged;
    const inWd = name in wd && !state.ignored.includes(name);

    if (inStaged && !inHead) stagedNew.push(name);
    else if (inStaged && inHead && staged[name] !== head[name]) stagedModified.push(name);

    if (inWd && inStaged && wd[name] !== staged[name]) modified.push(name);
    else if (inWd && !inStaged && inHead && wd[name] !== head[name]) modified.push(name);
    else if (inWd && !inStaged && !inHead) untracked.push(name);
  }

  const lines: string[] = ['Op branch main'];
  if (state.commits.length === 0 && stagedNew.length === 0 && stagedModified.length === 0) {
    lines.push('Nog geen commits');
  }

  if (stagedNew.length || stagedModified.length) {
    lines.push('', 'Klaar om te committen:');
    for (const f of stagedNew) lines.push(`  nieuw bestand: ${f}`);
    for (const f of stagedModified) lines.push(`  gewijzigd:     ${f}`);
  }

  if (modified.length) {
    lines.push('', 'Wijzigingen in werkmap (nog niet gestaged):');
    for (const f of modified) lines.push(`  gewijzigd:     ${f}`);
  }

  if (untracked.length) {
    lines.push('', 'Niet-gevolgde bestanden:');
    for (const f of untracked) lines.push(`  ${f}`);
  }

  if (
    stagedNew.length === 0 &&
    stagedModified.length === 0 &&
    modified.length === 0 &&
    untracked.length === 0
  ) {
    lines.push('Niets te committen, werkmap is schoon');
  }

  return lines.join('\n');
}

function logOutput(state: RepoState): string {
  if (!state.initialized) {
    return "fatal: niet in een git repository (gebruik eerst 'git init')";
  }
  if (state.commits.length === 0) {
    return "fatal: nog geen commits — maak er eerst een met 'git commit'";
  }
  const lines: string[] = [];
  let id: string | null = state.head;
  while (id) {
    const c = state.commits.find((x) => x.id === id);
    if (!c) break;
    lines.push(`commit ${c.id}`);
    lines.push(`    ${c.message}`);
    lines.push('');
    id = c.parent;
  }
  return lines.join('\n').trimEnd();
}

function parseAdd(rest: string): string[] | null {
  const arg = rest.trim();
  if (!arg) return null;
  if (arg === '.') return ['.'];
  return arg.split(/\s+/);
}

function parseCommitMessage(rest: string): string | null {
  const m = rest.match(/^-m\s+(?:"([^"]*)"|'([^']*)'|(\S+))\s*$/);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

export function runCommand(state: RepoState, input: string): CommandResult {
  const result = _runCommand(state, input);
  const trimmed = input.trim();
  if (!trimmed) return result;
  return {
    ...result,
    newState: {...result.newState, commands: [...state.commands, trimmed]},
  };
}

function _runCommand(state: RepoState, input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {newState: state, output: '', ok: true};
  }
  if (!trimmed.startsWith('git')) {
    return {
      newState: state,
      output: `commando '${trimmed.split(/\s+/)[0]}' niet herkend — alleen 'git ...' commando's werken hier`,
      ok: false,
    };
  }

  const afterGit = trimmed.slice(3).trim();
  if (!afterGit) {
    return {
      newState: state,
      output: "gebruik: git <commando> (probeer: init, status, add, commit, log)",
      ok: false,
    };
  }

  const spaceIdx = afterGit.indexOf(' ');
  const sub = spaceIdx === -1 ? afterGit : afterGit.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? '' : afterGit.slice(spaceIdx + 1);

  switch (sub) {
    case 'init': {
      if (state.initialized) {
        return {
          newState: state,
          output: 'Bestaande Git repository opnieuw geïnitialiseerd',
          ok: true,
        };
      }
      return {
        newState: {...state, initialized: true, staged: {}},
        output: 'Lege Git repository geïnitialiseerd op branch main',
        ok: true,
      };
    }

    case 'status': {
      return {newState: state, output: statusOutput(state), ok: state.initialized};
    }

    case 'add': {
      if (!state.initialized) {
        return {
          newState: state,
          output: "fatal: niet in een git repository (gebruik eerst 'git init')",
          ok: false,
        };
      }
      const args = parseAdd(rest);
      if (!args) {
        return {
          newState: state,
          output: "gebruik: git add <bestand> of git add .",
          ok: false,
        };
      }
      const staged = {...(state.staged ?? {})};
      const targets =
        args[0] === '.'
          ? visibleFiles(state)
          : args.filter((f) => !state.ignored.includes(f));

      const missing = targets.filter((f) => !(f in state.workingDir));
      if (missing.length) {
        return {
          newState: state,
          output: `fatal: pathspec '${missing[0]}' komt niet overeen met een bestand`,
          ok: false,
        };
      }
      for (const f of targets) {
        staged[f] = state.workingDir[f];
      }
      return {newState: {...state, staged}, output: '', ok: true};
    }

    case 'commit': {
      if (!state.initialized) {
        return {
          newState: state,
          output: "fatal: niet in een git repository (gebruik eerst 'git init')",
          ok: false,
        };
      }
      const message = parseCommitMessage(rest);
      if (message === null) {
        return {
          newState: state,
          output: "gebruik: git commit -m \"je bericht\"",
          ok: false,
        };
      }
      const staged = state.staged ?? {};
      const head = committedTree(state);
      const stagedNames = Object.keys(staged);
      const realChange =
        stagedNames.length > 0 && stagedNames.some((k) => staged[k] !== head[k]);

      if (!realChange) {
        return {
          newState: state,
          output: 'Niets te committen, werkmap is schoon',
          ok: false,
        };
      }
      const newTree: Record<string, string> = {...head, ...staged};
      const commit: Commit = {
        id: shortId(),
        message,
        parent: state.head,
        tree: newTree,
      };
      return {
        newState: {
          ...state,
          commits: [...state.commits, commit],
          head: commit.id,
          staged: {},
        },
        output: `[main ${commit.id.slice(0, 7)}] ${message}`,
        ok: true,
      };
    }

    case 'log': {
      return {newState: state, output: logOutput(state), ok: state.commits.length > 0};
    }

    default:
      return {
        newState: state,
        output: `git: '${sub}' is geen git-commando in deze simulator (probeer: init, status, add, commit, log)`,
        ok: false,
      };
  }
}

export function setFile(state: RepoState, name: string, content: string): RepoState {
  return {...state, workingDir: {...state.workingDir, [name]: content}};
}

export function deleteFile(state: RepoState, name: string): RepoState {
  const wd = {...state.workingDir};
  delete wd[name];
  return {...state, workingDir: wd};
}

export function addToIgnore(state: RepoState, name: string): RepoState {
  if (state.ignored.includes(name)) return state;
  return {...state, ignored: [...state.ignored, name]};
}
