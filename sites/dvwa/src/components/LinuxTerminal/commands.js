/**
 * Command definitions for the Linux terminal simulator.
 * Each command is a function that takes (args, env) and returns output string(s).
 * env contains: { cwd, fs, setCwd, terminal, write, writeln }
 */

import { resolvePath, getNode, listDir, readFile } from './filesystem';

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

  return { name: parts[0] || '', args: parts.slice(1) };
}

const COMMANDS = {
  ls(args, env) {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const target = args.find(a => !a.startsWith('-')) || env.cwd;
    const absPath = resolvePath(env.cwd, target);
    const result = listDir(env.fs, absPath);

    if (result.error) return { output: result.error, exitCode: 1 };

    let entries = result.entries;
    if (!showAll) {
      entries = entries.filter(e => !e.name.startsWith('.'));
    }

    if (showLong) {
      const lines = entries.map(e => {
        const perms = e.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = e.isDir ? '4096' : ' 256';
        return `${perms}  1 student student ${size} Mar 26 10:00 ${e.name}${e.isDir ? '' : ''}`;
      });
      return { output: lines.join('\n'), exitCode: 0 };
    }

    const names = entries.map(e => e.isDir ? `\x1b[1;34m${e.name}\x1b[0m` : e.name);
    return { output: names.join('  '), exitCode: 0 };
  },

  cat(args, env) {
    if (args.length === 0) return { output: 'cat: missing operand', exitCode: 1 };
    const outputs = [];
    let exitCode = 0;
    for (const arg of args) {
      if (arg.startsWith('-')) continue;
      const absPath = resolvePath(env.cwd, arg);
      const result = readFile(env.fs, absPath);
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
      return { output: 'Linux dvwa-lab 5.15.0-1 #1 SMP Debian 5.15.0-1 x86_64 GNU/Linux', exitCode: 0 };
    }
    if (args.includes('-r')) {
      return { output: '5.15.0-1', exitCode: 0 };
    }
    return { output: 'Linux', exitCode: 0 };
  },

  echo(args) {
    const text = args.join(' ');
    return { output: text, exitCode: 0 };
  },

  hostname() {
    return { output: 'dvwa-lab', exitCode: 0 };
  },

  cd(args, env) {
    const target = args[0] || '/home/student';
    if (target === '~') {
      env.setCwd('/home/student');
      return { output: '', exitCode: 0 };
    }
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
    const filteredArgs = args.filter(a => !a.startsWith('-'));
    const pattern = filteredArgs[0];
    const file = filteredArgs[1];

    let lines;
    if (stdin) {
      lines = stdin.split('\n');
    } else if (file) {
      const absPath = resolvePath(env.cwd, file);
      const result = readFile(env.fs, absPath);
      if (result.error) return { output: result.error, exitCode: 1 };
      lines = result.content.split('\n');
    } else {
      return { output: 'grep: missing file operand', exitCode: 1 };
    }

    const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
    const matching = lines.filter(line => regex.test(line));

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
        'Beschikbare commando\'s:',
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
        numLines = parseInt(args[i + 1], 10) || 10;
        i++; // skip next arg
      } else if (!args[i].startsWith('-')) {
        filteredArgs.push(args[i]);
      }
    }
    if (filteredArgs.length === 0) return { output: 'head: missing operand', exitCode: 1 };
    const absPath = resolvePath(env.cwd, filteredArgs[0]);
    const result = readFile(env.fs, absPath);
    if (result.error) return { output: result.error, exitCode: 1 };
    const lines = result.content.split('\n').slice(0, numLines);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  tail(args, env) {
    let numLines = 10;
    const filteredArgs = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) {
        numLines = parseInt(args[i + 1], 10) || 10;
        i++;
      } else if (!args[i].startsWith('-')) {
        filteredArgs.push(args[i]);
      }
    }
    if (filteredArgs.length === 0) return { output: 'tail: missing operand', exitCode: 1 };
    const absPath = resolvePath(env.cwd, filteredArgs[0]);
    const result = readFile(env.fs, absPath);
    if (result.error) return { output: result.error, exitCode: 1 };
    const allLines = result.content.split('\n');
    const lines = allLines.slice(-numLines);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  wc(args, env) {
    const countLines = args.includes('-l');
    const countWords = args.includes('-w');
    const countChars = args.includes('-c') || args.includes('-m');
    const filteredArgs = args.filter(a => !a.startsWith('-'));
    if (filteredArgs.length === 0) return { output: 'wc: missing operand', exitCode: 1 };
    const absPath = resolvePath(env.cwd, filteredArgs[0]);
    const result = readFile(env.fs, absPath);
    if (result.error) return { output: result.error, exitCode: 1 };
    const content = result.content;
    const lines = content.split('\n').length;
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
        const childPath = currentPath === '/' ? '/' + key : currentPath + '/' + key;
        const child = node[key];
        if (child === null) continue; // permission denied
        if (namePattern) {
          const regex = new RegExp('^' + namePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
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
    if (permissionDenied) return { output: `find: '${searchPath}': Permission denied`, exitCode: 1 };
    if (!isDir) {
      // It's a file — check if it matches
      if (namePattern) {
        const fileName = absPath.split('/').pop();
        const regex = new RegExp('^' + namePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        if (regex.test(fileName)) return { output: absPath, exitCode: 0 };
        return { output: '', exitCode: 0 };
      }
      return { output: absPath, exitCode: 0 };
    }

    const found = walkFs(node, absPath);
    return { output: found.join('\n'), exitCode: 0 };
  },

  chmod(args) {
    if (args.length < 2) return { output: 'chmod: missing operand', exitCode: 1 };
    const mode = args[0];
    const file = args[1];
    return { output: `chmod: mode van '${file}' gewijzigd naar ${mode} (gesimuleerd)`, exitCode: 0 };
  },

  ping(args, env) {
    if (args.length === 0) return { output: 'ping: usage: ping [-c count] host', exitCode: 1 };

    let count = 4;
    let host = args[args.length - 1];
    const cIdx = args.indexOf('-c');
    if (cIdx >= 0 && args[cIdx + 1]) {
      count = parseInt(args[cIdx + 1], 10) || 4;
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
export function executeCommand(cmdStr, env, stdin) {
  const { name, args } = parseArgs(cmdStr);
  if (!name) return { output: '', exitCode: 0 };

  const handler = COMMANDS[name];
  if (!handler) {
    return { output: `bash: ${name}: command not found`, exitCode: 127 };
  }

  return handler(args, env, stdin);
}

/**
 * Execute a full command line with chaining (;, &&, ||, |).
 * Returns array of { output, exitCode } for each command.
 */
export function executeCommandLine(line, env) {
  const parsed = parseCommandLine(line);
  const results = [];
  let lastExitCode = 0;
  let pipeOutput = null;

  for (let i = 0; i < parsed.length; i++) {
    const { cmd, operator } = parsed[i];
    if (!cmd) continue;

    const result = executeCommand(cmd, env, pipeOutput);
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
