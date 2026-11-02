/**
 * Command definitions for the Linux terminal simulator.
 * Each command is a function that takes (args, env) and returns output string(s).
 * env contains: { cwd, fs, setCwd, terminal, write, writeln }
 */

import {
  HOME,
  getNode,
  listDir,
  magSchrijven,
  magVerwijderen,
  makeDir,
  readFile,
  removeNode,
  resolvePath,
  splitPad,
  writeFile,
} from './filesystem';

/** De regels van een tekst, zonder het lege stuk na het laatste regeleinde. */
function regels(tekst) {
  const delen = tekst.split('\n');
  if (delen.at(-1) === '') delen.pop();
  return delen;
}

/**
 * Leest een bestand voor een commando, met de foutmelding zoals bash hem
 * geeft: de naam van het commando en het pad zoals de leerling het typte
 * (`head: notitie.txt: No such file or directory`), niet `cat:` en het
 * absolute pad.
 */
function lees(env, cmd, arg) {
  const result = readFile(env.fs, resolvePath(env.cwd, arg));
  if (!result.error) return result;
  const reden = result.error.slice(result.error.lastIndexOf(': ') + 2);
  // head en tail zeggen het anders dan cat (GNU coreutils 9).
  if ((cmd === 'head' || cmd === 'tail') && reden !== 'Is a directory')
    return { error: `${cmd}: cannot open '${arg}' for reading: ${reden}` };
  return { error: `${cmd}: ${arg}: ${reden}` };
}

/**
 * Parse a command line into chained commands, respecting ;, &&, ||, and |
 * Returns an array of { cmd, operator } where operator is what comes AFTER this cmd.
 */
export function parseCommandLine(line) {
  const result = [];
  let current = '';
  let i = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += ch;
      i++;
      continue;
    }
    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += ch;
      i++;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === ';') {
        result.push({ cmd: current.trim(), operator: ';' });
        current = '';
        i++;
        continue;
      }
      if (ch === '&' && next === '&') {
        result.push({ cmd: current.trim(), operator: '&&' });
        current = '';
        i += 2;
        continue;
      }
      if (ch === '|' && next === '|') {
        result.push({ cmd: current.trim(), operator: '||' });
        current = '';
        i += 2;
        continue;
      }
      if (ch === '|') {
        result.push({ cmd: current.trim(), operator: '|' });
        current = '';
        i++;
        continue;
      }
    }

    current += ch;
    i++;
  }

  if (current.trim()) {
    result.push({ cmd: current.trim(), operator: null });
  }

  return result;
}

/**
 * Parse a single command string into command name and arguments.
 */
function parseArgs(cmdStr) {
  const parts = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (const ch of cmdStr) {
    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (ch === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current) parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) parts.push(current);

  // De shell vult ~ in voordat het commando het ziet: mv ~ x krijgt
  // /home/student, en zegt dat ook in een foutmelding.
  const ingevuld = parts.map((p) => (p === '~' || p.startsWith('~/') ? HOME + p.slice(1) : p));
  return { name: ingevuld[0] || '', args: ingevuld.slice(1) };
}

/**
 * cp en mv voor één bestand: naar een nieuwe naam, of in een bestaande map.
 * mv verplaatst ook een map; cp doet dat alleen met -r, en dat kent deze
 * oefenterminal niet.
 */
function kopieer(cmd, args, env, verplaats) {
  const namen = args.filter((a) => !a.startsWith('-'));
  if (namen.length < 2) return { output: `${cmd}: missing file operand`, exitCode: 1 };
  const [bron, doel] = namen;
  const bronPad = resolvePath(env.cwd, bron);
  const bronNode = getNode(env.fs, bronPad);
  if (!bronNode.exists)
    return { output: `${cmd}: cannot stat '${bron}': No such file or directory`, exitCode: 1 };
  if (bronNode.permissionDenied)
    return { output: `${cmd}: cannot open '${bron}' for reading: Permission denied`, exitCode: 1 };
  if (bronNode.isDir && !verplaats)
    return { output: `${cmd}: -r not specified; omitting directory '${bron}'`, exitCode: 1 };

  let doelPad = resolvePath(env.cwd, doel);
  let doelNaam = doel;
  const doelNode = getNode(env.fs, doelPad);
  // Een / aan het eind belooft een map: is die er niet, dan weigert het.
  if (doel.endsWith('/') && !(doelNode.exists && doelNode.isDir)) {
    const reden = 'Not a directory';
    return verplaats
      ? { output: `mv: cannot move '${bron}' to '${doel}': ${reden}`, exitCode: 1 }
      : { output: `cp: cannot create regular file '${doel}': ${reden}`, exitCode: 1 };
  }
  if (doelNode.exists && doelNode.isDir) {
    const naam = splitPad(bronPad)[1];
    doelPad = doelPad === '/' ? `/${naam}` : `${doelPad}/${naam}`;
    doelNaam = `${doel.replace(/\/$/, '')}/${naam}`;
  }
  if (doelPad === bronPad)
    return { output: `${cmd}: '${bron}' and '${doelNaam}' are the same file`, exitCode: 1 };
  if (verplaats && bronNode.isDir && doelPad.startsWith(`${bronPad}/`))
    return {
      output: `mv: cannot move '${bron}' to a subdirectory of itself, '${doelNaam}'`,
      exitCode: 1,
    };
  if (verplaats && !magVerwijderen(bronPad))
    return {
      output: `mv: cannot move '${bron}' to '${doelNaam}': Permission denied`,
      exitCode: 1,
    };

  const [ouder, naam] = splitPad(doelPad);
  const map = getNode(env.fs, ouder);
  const geen = `${cmd}: cannot create regular file '${doelNaam}'`;
  if (!map.exists || !map.isDir)
    return { output: `${geen}: No such file or directory`, exitCode: 1 };
  if (!magSchrijven(doelPad)) return { output: `${geen}: Permission denied`, exitCode: 1 };
  const bestaand = map.node[naam];
  if (bestaand && typeof bestaand === 'object' && !bronNode.isDir)
    return {
      output: `${cmd}: cannot overwrite directory '${doel}' with non-directory`,
      exitCode: 1,
    };

  map.node[naam] = bronNode.node;
  if (verplaats) {
    const [bronOuder, bronNaam] = splitPad(bronPad);
    delete getNode(env.fs, bronOuder).node[bronNaam];
  }
  return { output: '', exitCode: 0 };
}

const COMMANDS = {
  ls(args, env, stdin, { doorgeven = false } = {}) {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const target = args.find((a) => !a.startsWith('-')) || env.cwd;
    const absPath = resolvePath(env.cwd, target);
    // Een bestand: ls noemt het (met -l op één regel), zoals de echte ls.
    const bestand = getNode(env.fs, absPath);
    if (bestand.isFile) {
      if (!showLong) return { output: target, exitCode: 0 };
      const eigenaar = magSchrijven(absPath) ? 'student student' : 'root    root   ';
      return { output: `-rw-r--r--  1 ${eigenaar}  256 Mar 26 10:00 ${target}`, exitCode: 0 };
    }
    const result = listDir(env.fs, absPath);

    // Met het pad zoals de leerling het typte, net als ls zelf.
    if (result.error)
      return { output: result.error.replace(`'${absPath}'`, `'${target}'`), exitCode: 2 };

    let entries = result.entries;
    if (!showAll) {
      entries = entries.filter((e) => !e.name.startsWith('.'));
    } else {
      // -a toont ook . (deze map) en .. (de map erboven), zoals de echte ls.
      entries = [{ name: '.', isDir: true }, { name: '..', isDir: true }, ...entries];
    }

    if (showLong) {
      const lines = entries.map((e) => {
        const perms = e.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = e.isDir ? '4096' : ' 256';
        // Van jou in je thuismap en /tmp, van root daarbuiten.
        const kind = absPath === '/' ? `/${e.name}` : `${absPath}/${e.name}`;
        // /tmp is van root, maar iedereen mag erin schrijven (de t: alleen
        // je eigen bestanden weghalen).
        if (kind === '/tmp') return `drwxrwxrwt  1 root    root    ${size} Mar 26 10:00 ${e.name}`;
        const eigenaar = magSchrijven(kind) ? 'student student' : 'root    root   ';
        // Wat je niet mag lezen (/etc/shadow, /root), met de rechten van een
        // echte Ubuntu: alleen root, en voor shadow ook de groep shadow.
        if (getNode(env.fs, kind).permissionDenied) {
          const geheim =
            e.name === 'root' ? 'drwx------  1 root    root   ' : '-rw-r-----  1 root    shadow ';
          return `${geheim} ${size} Mar 26 10:00 ${e.name}`;
        }
        return `${perms}  1 ${eigenaar} ${size} Mar 26 10:00 ${e.name}`;
      });
      return { output: lines.join('\n'), exitCode: 0 };
    }

    // Naar een pipe of een bestand: één naam per regel en geen kleur, net
    // als de echte ls. Dan werkt `ls /etc | grep host`.
    if (doorgeven) return { output: entries.map((e) => e.name).join('\n'), exitCode: 0 };
    const names = entries.map((e) => (e.isDir ? `\x1b[1;34m${e.name}\x1b[0m` : e.name));
    return { output: names.join('  '), exitCode: 0 };
  },

  cat(args, env) {
    if (args.length === 0) return { output: 'cat: missing operand', exitCode: 1 };
    const outputs = [];
    let exitCode = 0;
    for (const arg of args) {
      if (arg.startsWith('-')) continue;
      const result = lees(env, 'cat', arg);
      if (result.error) {
        outputs.push(result.error);
        exitCode = 1;
      } else {
        outputs.push(result.content);
      }
    }
    return { output: outputs.join('\n'), exitCode };
  },

  pwd(args, env) {
    return { output: env.cwd, exitCode: 0 };
  },

  whoami() {
    return { output: 'student', exitCode: 0 };
  },

  id() {
    return { output: 'uid=1000(student) gid=1000(student) groups=1000(student)', exitCode: 0 };
  },

  uname(args) {
    if (args.includes('-a')) {
      return {
        output: 'Linux oefenpc 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux',
        exitCode: 0,
      };
    }
    if (args.includes('-r')) {
      return { output: '6.8.0-45-generic', exitCode: 0 };
    }
    return { output: 'Linux', exitCode: 0 };
  },

  echo(args) {
    const text = args.join(' ');
    return { output: text, exitCode: 0 };
  },

  hostname() {
    return { output: 'oefenpc', exitCode: 0 };
  },

  cd(args, env) {
    const target = args[0] || '~';
    const absPath = resolvePath(env.cwd, target);
    const { exists, isDir, permissionDenied } = getNode(env.fs, absPath);

    if (!exists) return { output: `bash: cd: ${target}: No such file or directory`, exitCode: 1 };
    if (permissionDenied) return { output: `bash: cd: ${target}: Permission denied`, exitCode: 1 };
    if (!isDir) return { output: `bash: cd: ${target}: Not a directory`, exitCode: 1 };

    env.setCwd(absPath);
    return { output: '', exitCode: 0 };
  },

  grep(args, env, stdin) {
    if (args.length === 0) return { output: 'grep: missing pattern', exitCode: 1 };

    const caseInsensitive = args.includes('-i');
    const filteredArgs = args.filter((a) => !a.startsWith('-'));
    const pattern = filteredArgs[0];
    const file = filteredArgs[1];

    let lines;
    if (stdin) {
      lines = regels(stdin);
    } else if (file) {
      const result = lees(env, 'grep', file);
      if (result.error) return { output: result.error, exitCode: 2 };
      lines = regels(result.content);
    } else {
      return { output: 'grep: missing file operand', exitCode: 1 };
    }

    let regex;
    try {
      regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
    } catch {
      return { output: 'grep: Invalid regular expression', exitCode: 2 };
    }
    const matching = lines.filter((line) => regex.test(line));

    if (matching.length === 0) return { output: '', exitCode: 1 };
    return { output: matching.join('\n'), exitCode: 0 };
  },

  clear(args, env) {
    env.clear();
    return { output: '', exitCode: 0 };
  },

  help() {
    return {
      output: [
        "Beschikbare commando's:",
        '  ls [pad]          - Bestanden tonen',
        '  cat <bestand>     - Bestandsinhoud tonen',
        '  cd [pad]          - Van map wisselen',
        '  pwd               - Huidige map tonen',
        '  whoami            - Gebruikersnaam tonen',
        '  id                - Gebruikersinformatie tonen',
        '  echo <tekst>      - Tekst tonen',
        '  grep <patroon>    - Zoeken in tekst',
        '  head [-n N] <bestand> - Eerste N regels tonen (standaard 10)',
        '  tail [-n N] <bestand> - Laatste N regels tonen (standaard 10)',
        '  wc [-l|-w|-c] <bestand> - Regels/woorden/tekens tellen',
        '  find <pad> -name <patroon> - Bestanden zoeken',
        '  mkdir [-p] <map>  - Map maken',
        '  touch <bestand>   - Leeg bestand maken',
        '  cp <bron> <doel>  - Bestand kopiëren',
        '  mv <bron> <doel>  - Verplaatsen of hernoemen',
        '  rm [-r] <pad>     - Weggooien (er is geen prullenbak)',
        '  echo <tekst> > <bestand> - Tekst in een bestand zetten (>> vult aan)',
        '  chmod <mode> <bestand> - Rechten wijzigen (gesimuleerd)',
        '  uname [-a]        - Systeeminformatie tonen',
        '  hostname          - Hostnaam tonen',
        '  ping <host>       - Netwerk-ping simuleren',
        '  clear             - Scherm leegmaken',
        '  help              - Dit hulpoverzicht tonen',
      ].join('\n'),
      exitCode: 0,
    };
  },

  head(args, env) {
    let numLines = 10;
    const filteredArgs = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) {
        numLines = Number.parseInt(args[i + 1], 10) || 10;
        i++; // skip next arg
      } else if (!args[i].startsWith('-')) {
        filteredArgs.push(args[i]);
      }
    }
    if (filteredArgs.length === 0) return { output: 'head: missing operand', exitCode: 1 };
    const result = lees(env, 'head', filteredArgs[0]);
    if (result.error) return { output: result.error, exitCode: 1 };
    const lines = regels(result.content).slice(0, numLines);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  tail(args, env) {
    let numLines = 10;
    const filteredArgs = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) {
        numLines = Number.parseInt(args[i + 1], 10) || 10;
        i++;
      } else if (!args[i].startsWith('-')) {
        filteredArgs.push(args[i]);
      }
    }
    if (filteredArgs.length === 0) return { output: 'tail: missing operand', exitCode: 1 };
    const result = lees(env, 'tail', filteredArgs[0]);
    if (result.error) return { output: result.error, exitCode: 1 };
    const lines = regels(result.content).slice(-numLines);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  wc(args, env) {
    const countLines = args.includes('-l');
    const countWords = args.includes('-w');
    const countChars = args.includes('-c') || args.includes('-m');
    const filteredArgs = args.filter((a) => !a.startsWith('-'));
    if (filteredArgs.length === 0) return { output: 'wc: missing operand', exitCode: 1 };
    const result = lees(env, 'wc', filteredArgs[0]);
    if (result.error) return { output: result.error, exitCode: 1 };
    const content = result.content;
    // wc -l telt regeleinden, net als de echte wc.
    const lines = (content.match(/\n/g) ?? []).length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    // If no specific flag, show all three
    if (!countLines && !countWords && !countChars) {
      return { output: `  ${lines}  ${words} ${chars} ${filteredArgs[0]}`, exitCode: 0 };
    }
    const parts = [];
    if (countLines) parts.push(lines);
    if (countWords) parts.push(words);
    if (countChars) parts.push(chars);
    parts.push(filteredArgs[0]);
    return { output: parts.join(' '), exitCode: 0 };
  },

  find(args, env) {
    let searchPath = '.';
    let namePattern = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name' && args[i + 1]) {
        namePattern = args[i + 1];
        i++;
      } else if (!args[i].startsWith('-')) {
        searchPath = args[i];
      }
    }
    const absPath = resolvePath(env.cwd, searchPath);

    function walkFs(node, currentPath) {
      const results = [];
      if (node === null || typeof node === 'string') return results;
      for (const key of Object.keys(node).sort()) {
        const childPath = currentPath === '/' ? `/${key}` : `${currentPath}/${key}`;
        const child = node[key];
        if (child === null) continue; // permission denied
        if (namePattern) {
          const regex = new RegExp(`^${namePattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
          if (regex.test(key)) {
            results.push(childPath);
          }
        } else {
          results.push(childPath);
        }
        if (child && typeof child === 'object') {
          results.push(...walkFs(child, childPath));
        }
      }
      return results;
    }

    const { node, exists, isDir, permissionDenied } = getNode(env.fs, absPath);
    if (!exists) return { output: `find: '${searchPath}': No such file or directory`, exitCode: 1 };
    if (permissionDenied)
      return { output: `find: '${searchPath}': Permission denied`, exitCode: 1 };
    if (!isDir) {
      // It's a file — check if it matches
      if (namePattern) {
        const fileName = absPath.split('/').pop();
        const regex = new RegExp(`^${namePattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
        if (regex.test(fileName)) return { output: absPath, exitCode: 0 };
        return { output: '', exitCode: 0 };
      }
      return { output: absPath, exitCode: 0 };
    }

    const found = walkFs(node, absPath);
    return { output: found.join('\n'), exitCode: 0 };
  },

  mkdir(args, env) {
    const parents = args.includes('-p');
    const mappen = args.filter((a) => !a.startsWith('-'));
    if (mappen.length === 0) return { output: 'mkdir: missing operand', exitCode: 1 };
    const fouten = [];
    for (const map of mappen) {
      const r = makeDir(env.fs, resolvePath(env.cwd, map), { parents });
      if (r.error) fouten.push(`mkdir: cannot create directory \u2018${map}\u2019: ${r.error}`);
    }
    return { output: fouten.join('\n'), exitCode: fouten.length ? 1 : 0 };
  },

  touch(args, env) {
    const namen = args.filter((a) => !a.startsWith('-'));
    if (namen.length === 0) return { output: 'touch: missing file operand', exitCode: 1 };
    const fouten = [];
    for (const naam of namen) {
      const absPath = resolvePath(env.cwd, naam);
      if (getNode(env.fs, absPath).exists) continue;
      const r = writeFile(env.fs, absPath, '');
      if (r.error) fouten.push(`touch: cannot touch '${naam}': ${r.error}`);
    }
    return { output: fouten.join('\n'), exitCode: fouten.length ? 1 : 0 };
  },

  rm(args, env) {
    const recursive = args.some((a) => /^-[a-zA-Z]*[rR]/.test(a));
    // -f: zwijg over wat er niet is, net als de echte rm.
    const forceer = args.some((a) => /^-[a-zA-Z]*f/.test(a));
    const namen = args.filter((a) => !a.startsWith('-'));
    if (namen.length === 0) return { output: 'rm: missing operand', exitCode: 1 };
    const fouten = [];
    for (const naam of namen) {
      const r = removeNode(env.fs, resolvePath(env.cwd, naam), { recursive });
      if (r.error && !(forceer && r.error === 'No such file or directory'))
        fouten.push(`rm: cannot remove '${naam}': ${r.error}`);
    }
    return { output: fouten.join('\n'), exitCode: fouten.length ? 1 : 0 };
  },

  cp(args, env) {
    return kopieer('cp', args, env, false);
  },

  mv(args, env) {
    return kopieer('mv', args, env, true);
  },

  chmod(args) {
    if (args.length < 2) return { output: 'chmod: missing operand', exitCode: 1 };
    const mode = args[0];
    const file = args[1];
    return {
      output: `chmod: mode van '${file}' gewijzigd naar ${mode} (gesimuleerd)`,
      exitCode: 0,
    };
  },

  ping(args, env) {
    if (args.length === 0) return { output: 'ping: usage: ping [-c count] host', exitCode: 1 };

    let count = 4;
    let host = args[args.length - 1];
    const cIdx = args.indexOf('-c');
    if (cIdx >= 0 && args[cIdx + 1]) {
      count = Number.parseInt(args[cIdx + 1], 10) || 4;
      if (host === args[cIdx + 1]) host = args[args.length - 1];
    }

    const lines = [`PING ${host} (${host}) 56(84) bytes of data.`];
    for (let i = 1; i <= Math.min(count, 4); i++) {
      const time = (0.5 + Math.random() * 2).toFixed(1);
      lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${time} ms`);
    }
    lines.push('');
    lines.push(`--- ${host} ping statistics ---`);
    lines.push(`${count} packets transmitted, ${count} received, 0% packet loss`);

    return { output: lines.join('\n'), exitCode: 0, isAsync: true };
  },
};

/**
 * Execute a single command. Returns { output, exitCode }.
 */
export function executeCommand(cmdStr, env, stdin, { doorgeven = false } = {}) {
  const { opdracht, naar, aanvullen } = splitRedirect(cmdStr);
  const { name, args } = parseArgs(opdracht);
  if (!name) return { output: '', exitCode: 0 };

  if (naar === '')
    return { output: "bash: syntax error near unexpected token `newline'", exitCode: 2 };

  const handler = COMMANDS[name];
  if (!handler) {
    return { output: `bash: ${name}: command not found`, exitCode: 127 };
  }

  // bash opent het doelbestand vóór het commando draait: een fout daar
  // betekent dat het commando niet draait.
  if (naar) {
    const doelPad = resolvePath(env.cwd, naar);
    const leeg = writeFile(env.fs, doelPad, '', { append: true });
    if (leeg.error) return { output: `bash: ${naar}: ${leeg.error}`, exitCode: 1 };
    const result = handler(args, env, stdin, { doorgeven: true });
    // Een foutmelding gaat naar het scherm, niet het bestand in (stderr).
    if (result.exitCode !== 0) return result;
    const tekst = result.output ? `${result.output}\n` : '';
    writeFile(env.fs, doelPad, tekst, { append: aanvullen });
    return { output: '', exitCode: 0 };
  }

  return handler(args, env, stdin, { doorgeven });
}

/**
 * Haalt `> bestand` of `>> bestand` van het einde van een commando, buiten
 * aanhalingstekens. naar is null zonder omleiding en '' als de naam ontbreekt.
 */
export function splitRedirect(cmdStr) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < cmdStr.length; i++) {
    const ch = cmdStr[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '>' && !inSingle && !inDouble) {
      const aanvullen = cmdStr[i + 1] === '>';
      const rest = cmdStr.slice(i + (aanvullen ? 2 : 1)).trim();
      const naar = parseArgs(rest).name;
      return { opdracht: cmdStr.slice(0, i).trim(), naar, aanvullen };
    }
  }
  return { opdracht: cmdStr, naar: null, aanvullen: false };
}

/**
 * Execute a full command line with chaining (;, &&, ||, |).
 * Returns array of { output, exitCode } for each command.
 */
export function executeCommandLine(line, buiten) {
  // Een cd midden in de regel (`cd /etc; ls`) geldt voor de commando's erna.
  const env = {
    ...buiten,
    setCwd: (nieuw) => {
      env.cwd = nieuw;
      buiten.setCwd?.(nieuw);
    },
  };
  const parsed = parseCommandLine(line);
  const results = [];
  let lastExitCode = 0;
  let pipeOutput = null;

  for (let i = 0; i < parsed.length; i++) {
    const { cmd, operator } = parsed[i];
    if (!cmd) continue;

    let result;
    try {
      result = executeCommand(cmd, env, pipeOutput, { doorgeven: operator === '|' });
    } catch (fout) {
      // Een fout in de simulator mag de terminal niet laten hangen: zonder
      // deze vangst kwam er geen nieuwe prompt meer.
      result = { output: `bash: ${cmd.split(' ')[0]}: ${fout.message}`, exitCode: 1 };
    }
    pipeOutput = null;

    if (operator === '|') {
      // Pipe: pass output to next command as stdin
      pipeOutput = result.output;
      // Don't add to results (piped output is consumed)
    } else {
      results.push(result);
    }

    lastExitCode = result.exitCode;

    // Handle && and ||
    if (operator === '&&' && lastExitCode !== 0) break;
    if (operator === '||' && lastExitCode === 0) break;
  }

  return results;
}
