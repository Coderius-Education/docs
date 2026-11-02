/**
 * Command definitions for the Linux terminal simulator.
 * Each command is a function that takes (args, env) and returns output string(s).
 * env contains: { cwd, fs, setCwd, terminal, write, writeln }
 */

import { EERSTE_LES } from './commandos';
import {
  GEHEIME_MAP,
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
 * Een patroon van grep (een BRE, zoals GNU grep hem leest) als reguliere
 * expressie van JavaScript. In een BRE zijn + ? | ( ) { } gewone tekens, en
 * alleen met een \ ervoor bijzonder; een * aan het begin is ook gewoon een
 * sterretje. Eerst las de oefenterminal het patroon als JavaScript, en gaf
 * grep '*.html' een melding die het echte grep niet kent.
 */
export function breRegex(patroon, hoofdletters = false) {
  let bron = '';
  let begin = true;
  for (let i = 0; i < patroon.length; i++) {
    const ch = patroon[i];
    if (ch === '\\' && i + 1 === patroon.length) throw new Error('Trailing backslash');
    if (ch === '\\') {
      const volgend = patroon[++i];
      bron += '+?|(){}'.includes(volgend) ? volgend : `\\${volgend}`;
      begin = volgend === '(' || volgend === '|';
      continue;
    }
    if (ch === '[') {
      // Een ] direct na [ of [^ hoort bij de tekens, niet bij het einde.
      let start = i + 1;
      if (patroon[start] === '^') start++;
      if (patroon[start] === ']') start++;
      const eind = patroon.indexOf(']', start);
      // GNU grep 3.11: een [ als laatste teken is een ongeldig patroon, een
      // [ met nog iets erachter maar zonder ] is "Unmatched [".
      if (eind === -1)
        throw new Error(
          i === patroon.length - 1
            ? 'Invalid regular expression'
            : 'Unmatched [, [^, [:, [., or [=',
        );
      bron += patroon.slice(i, eind + 1);
      i = eind;
    } else if (ch === '*') bron += begin ? '\\*' : '*';
    else if ('+?|(){}'.includes(ch)) bron += `\\${ch}`;
    else if (ch === '^') bron += begin ? '^' : '\\^';
    else if (ch === '$') bron += i === patroon.length - 1 ? '$' : '\\$';
    else if (ch === '/') bron += '\\/';
    else bron += ch;
    begin = ch === '^' && begin;
  }
  try {
    return new RegExp(bron, hoofdletters ? 'i' : '');
  } catch {
    throw new Error('Unmatched ( or \\(');
  }
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
 * De invoer van head, tail en wc: een bestand, of anders wat er door de pipe
 * binnenkomt. Zonder allebei wacht het echte commando op het toetsenbord; dat
 * kan de oefenterminal niet, dus zegt hij wat er mist.
 */
function vanInvoer(env, cmd, bestand, stdin) {
  if (bestand !== undefined) return lees(env, cmd, bestand);
  if (stdin !== null && stdin !== undefined) return { content: stdin };
  return { error: `${cmd}: missing operand` };
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
  // Per woord: staat er een * of ? buiten aanhalingstekens? Alleen dan vult
  // de shell het in; '*.txt' gaat zoals het is naar het commando.
  const jokers = [];
  let current = '';
  let joker = false;
  let gezien = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (const ch of cmdStr) {
    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      gezien = true;
      continue;
    }
    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      gezien = true;
      continue;
    }
    if (ch === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current || gezien) {
        parts.push(current);
        jokers.push(joker);
      }
      current = '';
      joker = false;
      gezien = false;
      continue;
    }
    if ((ch === '*' || ch === '?') && !inSingleQuote && !inDoubleQuote) joker = true;
    current += ch;
  }
  if (current || gezien) {
    parts.push(current);
    jokers.push(joker);
  }

  // De shell vult ~ in voordat het commando het ziet: mv ~ x krijgt
  // /home/student, en zegt dat ook in een foutmelding.
  const ingevuld = parts.map((p) => (p === '~' || p.startsWith('~/') ? HOME + p.slice(1) : p));
  return { name: ingevuld[0] || '', args: ingevuld.slice(1), jokers: jokers.slice(1) };
}

/** Een patroon met * en ? als reguliere expressie, voor één naam (zonder /). */
export function jokerRegex(patroon) {
  let bron = '';
  for (const ch of patroon) {
    if (ch === '*') bron += '[^/]*';
    else if (ch === '?') bron += '[^/]';
    else bron += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${bron}$`);
}

/**
 * Vult een woord met * of ? in zoals bash: elk stuk van het pad met een
 * joker tegen de namen in die map, op alfabet. Een naam met een punt vooraan
 * telt alleen als het patroon ook met een punt begint. Past er niets, dan
 * blijft het woord staan zoals het was (en zegt ls dat '*.xyz' niet bestaat).
 */
export function vulJokersIn(woord, env) {
  const absoluut = woord.startsWith('/');
  const stukken = woord.split('/');
  let kandidaten = [{ tekst: absoluut ? '' : null, pad: absoluut ? '/' : env.cwd }];
  stukken.forEach((stuk, i) => {
    if (i === 0 && absoluut) return;
    const volgende = [];
    for (const k of kandidaten) {
      const plak = (naam) => (k.tekst === null ? naam : `${k.tekst}/${naam}`);
      const pad = (naam) => (k.pad === '/' ? `/${naam}` : `${k.pad}/${naam}`);
      if (!/[*?]/.test(stuk)) {
        volgende.push({ tekst: plak(stuk), pad: stuk === '' ? k.pad : resolvePath(k.pad, stuk) });
        continue;
      }
      const map = getNode(env.fs, k.pad);
      if (!map.isDir) continue;
      const regex = jokerRegex(stuk);
      for (const naam of Object.keys(map.node).sort()) {
        if (naam.startsWith('.') && !stuk.startsWith('.')) continue;
        if (regex.test(naam)) volgende.push({ tekst: plak(naam), pad: pad(naam) });
      }
    }
    kandidaten = volgende;
  });
  const gevonden = kandidaten.filter((k) => getNode(env.fs, k.pad).exists).map((k) => k.tekst);
  return gevonden.length ? gevonden : [woord];
}

/**
 * cp en mv voor één bestand: naar een nieuwe naam, of in een bestaande map.
 * mv verplaatst ook een map; cp doet dat alleen met -r, en dat kent deze
 * oefenterminal niet.
 */
function kopieer(cmd, args, env, verplaats) {
  const namen = args.filter((a) => !a.startsWith('-'));
  if (namen.length < 2) return { output: `${cmd}: missing file operand`, exitCode: 1 };
  if (namen.length > 2) {
    // cp a.txt b.txt map/: meer dan één bron, dan moet het laatste een map zijn.
    const doel = namen.at(-1);
    const map = getNode(env.fs, resolvePath(env.cwd, doel));
    if (!map.exists)
      return { output: `${cmd}: target '${doel}': No such file or directory`, exitCode: 1 };
    if (!map.isDir) return { output: `${cmd}: target '${doel}': Not a directory`, exitCode: 1 };
    const fouten = namen
      .slice(0, -1)
      .map((bron) => kopieerEen(cmd, bron, doel, env, verplaats))
      .filter((r) => r.exitCode !== 0)
      .map((r) => r.output);
    return { output: fouten.join('\n'), exitCode: fouten.length ? 1 : 0 };
  }
  return kopieerEen(cmd, namen[0], namen[1], env, verplaats);
}

function kopieerEen(cmd, bron, doel, env, verplaats) {
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

/** Hoeveel bytes een tekst is (UTF-8), zoals ls het telt. */
const bytes = (tekst) => new TextEncoder().encode(tekst).length;

/** 4096 -> 4.0K, zoals ls -h: één decimaal onder de 10, naar boven afgerond. */
function leesbaar(n) {
  if (n < 1024) return String(n);
  const eenheden = ['K', 'M', 'G'];
  let waarde = n;
  let i = -1;
  while (waarde >= 1024 && i < eenheden.length - 1) {
    waarde /= 1024;
    i++;
  }
  return waarde < 10
    ? `${(Math.ceil(waarde * 10) / 10).toFixed(1)}${eenheden[i]}`
    : `${Math.ceil(waarde)}${eenheden[i]}`;
}

/**
 * Wat ls -l over één pad zegt: rechten, eigenaar, groep, grootte. Van jou in
 * je thuismap en /tmp, van root daarbuiten, met de rechten van een echte
 * Ubuntu voor /tmp, /root, /etc/shadow en je thuismap.
 */
function gegevens(env, absPad) {
  const node = getNode(env.fs, absPad);
  if (absPad === GEHEIME_MAP)
    return { rechten: 'drwx------', eigenaar: 'root', groep: 'root', grootte: 4096, map: true };
  if (node.permissionDenied)
    return { rechten: '-rw-r-----', eigenaar: 'root', groep: 'shadow', grootte: 1024, map: false };
  const vanJou = magSchrijven(absPad) && absPad !== '/tmp';
  const eigenaar = vanJou ? 'student' : 'root';
  if (node.isDir) {
    const rechten =
      absPad === '/tmp' ? 'drwxrwxrwt' : absPad === HOME ? 'drwxr-x---' : 'drwxr-xr-x';
    return { rechten, eigenaar, groep: eigenaar, grootte: 4096, map: true, node: node.node };
  }
  return {
    rechten: '-rw-r--r--',
    eigenaar,
    groep: eigenaar,
    grootte: bytes(node.node),
    map: false,
  };
}

/** Het aantal links: 1 voor een bestand, 2 plus de mappen erin voor een map. */
function links(env, absPad, g) {
  if (!g.map || !g.node) return g.map ? 2 : 1;
  const kind = (n) => (absPad === '/' ? `/${n}` : `${absPad}/${n}`);
  return (
    2 +
    Object.keys(g.node).filter((n) => {
      const k = g.node[n];
      return (k !== null && typeof k === 'object') || kind(n) === GEHEIME_MAP;
    }).length
  );
}

/**
 * De regels van ls -l, met de kolommen even breed zoals coreutils 9.4 ze
 * zet: één spatie na de rechten, eigenaar en groep links uitgelijnd, de
 * grootte rechts.
 */
function langeRegels(env, rijen, mens) {
  const g = rijen.map(({ naam, pad }) => {
    const d = gegevens(env, pad);
    return { ...d, naam, links: links(env, pad, d) };
  });
  const maat = (d) => (mens ? leesbaar(d.grootte) : String(d.grootte));
  const breed = (f) => Math.max(...g.map((d) => f(d).length));
  const wl = breed((d) => String(d.links));
  const we = breed((d) => d.eigenaar);
  const wg = breed((d) => d.groep);
  const wm = breed(maat);
  const regels = g.map(
    (d) =>
      `${d.rechten} ${String(d.links).padStart(wl)} ${d.eigenaar.padEnd(we)} ${d.groep.padEnd(wg)} ${maat(d).padStart(wm)} Mar 26 10:00 ${d.naam}`,
  );
  // total: de blokken van 1K die de bestanden innemen, per 4K afgerond.
  const blokken = g.reduce((som, d) => som + Math.ceil(d.grootte / 4096) * 4, 0);
  return { regels, total: mens ? leesbaar(blokken * 1024) : String(blokken) };
}

/** ls voor één map of bestand. */
function lsEen(args, target, env, { doorgeven = false } = {}) {
  const showAll = args.some((a) => /^-[a-zA-Z]*a/.test(a));
  const showLong = args.some((a) => /^-[a-zA-Z]*l/.test(a));
  const mens = args.some((a) => /^-[a-zA-Z]*h/.test(a));
  const absPath = resolvePath(env.cwd, target);
  const node = getNode(env.fs, absPath);
  // Een bestand (ook een dat je niet mag lezen, zoals /etc/shadow): ls noemt
  // het, met -l op één regel. Alleen in een map die je niet mag lezen, kan ls
  // niet kijken.
  if (node.isFile || (node.permissionDenied && absPath !== GEHEIME_MAP)) {
    if (!showLong) return { output: target, exitCode: 0 };
    return {
      output: langeRegels(env, [{ naam: target, pad: absPath }], mens).regels[0],
      exitCode: 0,
    };
  }
  const result = listDir(env.fs, absPath);

  // Met het pad zoals de leerling het typte, net als ls zelf.
  if (result.error)
    return { output: result.error.replace(`'${absPath}'`, `'${target}'`), exitCode: 2 };

  const kind = (n) => (absPath === '/' ? `/${n}` : `${absPath}/${n}`);
  let entries = result.entries.map((e) => ({ ...e, pad: kind(e.name) }));
  if (!showAll) {
    entries = entries.filter((e) => !e.name.startsWith('.'));
  } else {
    // -a toont ook . (deze map) en .. (de map erboven), zoals de echte ls.
    entries = [
      { name: '.', isDir: true, pad: absPath },
      { name: '..', isDir: true, pad: resolvePath(absPath, '..') },
      ...entries,
    ];
  }

  if (showLong) {
    const { regels: lijst, total } = langeRegels(
      env,
      entries.map((e) => ({ naam: e.name, pad: e.pad })),
      mens,
    );
    return { output: [`total ${total}`, ...lijst].join('\n'), exitCode: 0 };
  }

  // Naar een pipe of een bestand: één naam per regel en geen kleur, net
  // als de echte ls. Dan werkt `ls /etc | grep host`.
  if (doorgeven) return { output: entries.map((e) => e.name).join('\n'), exitCode: 0 };
  const names = entries.map((e) =>
    e.isDir || e.pad === GEHEIME_MAP ? `\x1b[1;34m${e.name}\x1b[0m` : e.name,
  );
  return { output: names.join('  '), exitCode: 0 };
}

const COMMANDS = {
  ls(args, env, stdin, opties = {}) {
    const doelen = args.filter((a) => !a.startsWith('-'));
    if (doelen.length <= 1) return lsEen(args, doelen[0] ?? env.cwd, env, opties);
    // Meer namen (ls a.txt b.txt, of ls *.txt): eerst de fouten, dan de
    // bestanden samen, dan elke map met zijn naam erboven. Zo doet ls het ook.
    const opts = args.filter((a) => a.startsWith('-'));
    const fouten = [];
    const bestanden = [];
    const mappen = [];
    for (const doel of doelen) {
      const node = getNode(env.fs, resolvePath(env.cwd, doel));
      if (!node.exists) fouten.push(`ls: cannot access '${doel}': No such file or directory`);
      else if (node.isDir) mappen.push(doel);
      else bestanden.push(doel);
    }
    const blokken = [];
    if (bestanden.length) {
      const regelsVan = bestanden.map((b) => lsEen(opts, b, env, opties).output);
      const lang = opts.some((o) => o.includes('l'));
      blokken.push(regelsVan.join(lang || opties.doorgeven ? '\n' : '  '));
    }
    for (const map of mappen) blokken.push(`${map}:\n${lsEen(opts, map, env, opties).output}`);
    const uitvoer = [...fouten, blokken.join('\n\n')].filter(Boolean).join('\n');
    return { output: uitvoer, exitCode: fouten.length ? 2 : 0 };
  },

  cat(args, env) {
    if (args.length === 0) return { output: 'cat: missing operand', exitCode: 1 };
    // Achter elkaar, zonder iets ertussen: cat a.txt b.txt plakt de bestanden.
    let uitvoer = '';
    let exitCode = 0;
    for (const arg of args) {
      if (arg.startsWith('-')) continue;
      const result = lees(env, 'cat', arg);
      if (result.error) {
        uitvoer += `${result.error}\n`;
        exitCode = 1;
      } else {
        uitvoer += result.content;
      }
    }
    return { output: uitvoer.replace(/\n$/, ''), exitCode };
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
    // Opties los of samen (-in), en het patroon is het eerste woord zonder -.
    const opties = new Set(
      args.filter((a) => /^-[a-zA-Z]+$/.test(a)).flatMap((a) => [...a.slice(1)]),
    );
    const filteredArgs = args.filter((a) => !/^-[a-zA-Z]+$/.test(a));
    if (filteredArgs.length === 0)
      return {
        output:
          "Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.",
        exitCode: 2,
      };
    const pattern = filteredArgs[0];
    const files = filteredArgs.slice(1);

    let regex;
    try {
      regex = breRegex(pattern, opties.has('i'));
    } catch (fout) {
      return { output: `grep: ${fout.message}`, exitCode: 2 };
    }
    const past = (regel) => regex.test(regel) !== opties.has('v');
    const tel = (lijst, naam) => {
      const raak = lijst.map((r, i) => ({ r, nr: i + 1 })).filter(({ r }) => past(r));
      const voor = naam === undefined ? '' : `${naam}:`;
      if (opties.has('c')) return { uit: [`${voor}${raak.length}`], raak: raak.length };
      return {
        uit: raak.map(({ r, nr }) => `${voor}${opties.has('n') ? `${nr}:` : ''}${r}`),
        raak: raak.length,
      };
    };

    if (files.length === 0) {
      if (stdin === null || stdin === undefined)
        return {
          output:
            'oefenterminal: grep zonder bestand wacht op wat je typt; dat kan hier niet. Zet een bestand achter het patroon.',
          exitCode: 2,
        };
      const { uit, raak } = tel(regels(stdin));
      return { output: uit.join('\n'), exitCode: raak ? 0 : 1 };
    }

    // Meer bestanden (grep Failed /var/log/*.log): de naam voor elke regel.
    const uit = [];
    let gevonden = false;
    let fout = false;
    for (const file of files) {
      const result = lees(env, 'grep', file);
      if (result.error) {
        uit.push(result.error);
        fout = true;
        continue;
      }
      const r = tel(regels(result.content), files.length > 1 ? file : undefined);
      if (r.raak) gevonden = true;
      uit.push(...r.uit);
    }
    return { output: uit.join('\n'), exitCode: fout ? 2 : gevonden ? 0 : 1 };
  },

  history(args, env) {
    // Zoals bash: elk commando met een nummer, history zelf als laatste.
    const alles = env.geschiedenis ?? [];
    const n = Number.parseInt(args[0], 10);
    const begin = Number.isNaN(n) ? 0 : Math.max(0, alles.length - n);
    const lijst = alles.slice(begin).map((r, i) => `${String(begin + i + 1).padStart(5)}  ${r}`);
    return { output: lijst.join('\n'), exitCode: 0 };
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
        "  find <pad> -name '<patroon>' [-type f|d] - Bestanden vinden",
        '  mkdir [-p] <map>  - Map maken',
        '  touch <bestand>   - Leeg bestand maken',
        '  cp <bron> <doel>  - Bestand kopiëren',
        '  mv <bron> <doel>  - Verplaatsen of hernoemen',
        '  rm [-r] <pad>     - Weggooien (er is geen prullenbak)',
        '  echo <tekst> > <bestand> - Tekst in een bestand zetten (>> vult aan)',
        '  uname [-a]        - Systeeminformatie tonen',
        '  hostname          - Hostnaam tonen',
        "  history           - De commando's die je typte",
        '  clear             - Scherm leegmaken',
        '  help              - Dit hulpoverzicht tonen',
        '',
        'Tab vult een commando of naam aan; pijltje omhoog haalt een vorig commando terug.',
      ].join('\n'),
      exitCode: 0,
    };
  },

  head(args, env, stdin) {
    let numLines = 10;
    const filteredArgs = [];
    for (let i = 0; i < args.length; i++) {
      // head -3 is hetzelfde als head -n 3.
      if (/^-\d+$/.test(args[i])) numLines = Number.parseInt(args[i].slice(1), 10);
      else if (args[i] === '-n' && args[i + 1]) {
        numLines = Number.parseInt(args[i + 1], 10) || 10;
        i++; // skip next arg
      } else if (!args[i].startsWith('-')) {
        filteredArgs.push(args[i]);
      }
    }
    const result = vanInvoer(env, 'head', filteredArgs[0], stdin);
    if (result.error) return { output: result.error, exitCode: 1 };
    const lines = regels(result.content).slice(0, numLines);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  tail(args, env, stdin) {
    let numLines = 10;
    const filteredArgs = [];
    for (let i = 0; i < args.length; i++) {
      // tail -3 is hetzelfde als tail -n 3.
      if (/^-\d+$/.test(args[i])) numLines = Number.parseInt(args[i].slice(1), 10);
      else if (args[i] === '-n' && args[i + 1]) {
        numLines = Number.parseInt(args[i + 1], 10) || 10;
        i++;
      } else if (!args[i].startsWith('-')) {
        filteredArgs.push(args[i]);
      }
    }
    const result = vanInvoer(env, 'tail', filteredArgs[0], stdin);
    if (result.error) return { output: result.error, exitCode: 1 };
    const lines = regels(result.content).slice(-numLines);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  wc(args, env, stdin) {
    const countLines = args.includes('-l');
    const countWords = args.includes('-w');
    const countChars = args.includes('-c') || args.includes('-m');
    const filteredArgs = args.filter((a) => !a.startsWith('-'));
    const result = vanInvoer(env, 'wc', filteredArgs[0], stdin);
    if (result.error) return { output: result.error, exitCode: 1 };
    const content = result.content;
    // wc -l telt regeleinden, net als de echte wc.
    const lines = (content.match(/\n/g) ?? []).length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    // If no specific flag, show all three
    const naam = filteredArgs[0];
    if (!countLines && !countWords && !countChars) {
      // Uit een pipe: zonder naam, en breder (coreutils rekent met 7 tekens).
      if (naam === undefined)
        return {
          output: [lines, words, chars].map((n) => String(n).padStart(7)).join(' '),
          exitCode: 0,
        };
      return { output: `  ${lines}  ${words} ${chars} ${naam}`, exitCode: 0 };
    }
    const parts = [];
    if (countLines) parts.push(lines);
    if (countWords) parts.push(words);
    if (countChars) parts.push(chars);
    if (naam === undefined) {
      // Uit een pipe: één getal kaal, meer getallen elk 7 breed.
      const uit = parts.length === 1 ? String(parts[0]) : parts.map((n) => String(n).padStart(7));
      return { output: [uit].flat().join(' '), exitCode: 0 };
    }
    parts.push(naam);
    return { output: parts.join(' '), exitCode: 0 };
  },

  find(args, env) {
    // GNU find 4.9: eerst de plekken, dan de uitdrukking (-name, -iname,
    // -type). Een woord na de uitdrukking is een fout; meestal een *.txt
    // zonder aanhalingstekens die de shell al had ingevuld.
    const plekken = [];
    const tests = [];
    let vorige = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-name' || a === '-iname' || a === '-type') {
        if (args[i + 1] === undefined)
          return { output: `find: missing argument to \`${a}'`, exitCode: 1 };
        tests.push({ soort: a, waarde: args[i + 1] });
        vorige = a;
        i++;
      } else if (a.startsWith('-')) {
        return { output: `find: unknown predicate \`${a}'`, exitCode: 1 };
      } else if (tests.length) {
        const hint =
          vorige === '-name' || vorige === '-iname'
            ? `\nfind: possible unquoted pattern after predicate \`${vorige}'?`
            : '';
        return { output: `find: paths must precede expression: \`${a}'${hint}`, exitCode: 1 };
      } else plekken.push(a);
    }
    for (const t of tests) {
      if (t.soort === '-type' && !['f', 'd'].includes(t.waarde))
        return { output: `find: Unknown argument to -type: ${t.waarde}`, exitCode: 1 };
    }
    const regexen = tests.map((t) =>
      t.soort === '-type'
        ? null
        : new RegExp(jokerRegex(t.waarde).source, t.soort === '-iname' ? 'i' : ''),
    );
    const past = (naam, isMap) =>
      tests.every((t, i) =>
        t.soort === '-type' ? (t.waarde === 'd') === isMap : regexen[i].test(naam),
      );

    const uit = [];
    let exitCode = 0;
    const loop = (tekst, absPad) => {
      const { node, exists, isDir, permissionDenied } = getNode(env.fs, absPad);
      // Een map die je niet mag lezen (/root): find noemt hem wel, maar kan er
      // niet in. /etc/shadow is een bestand dat je niet mag lezen; dat noemt
      // find gewoon.
      const geheim = permissionDenied && absPad === GEHEIME_MAP;
      const naam = tekst === '/' ? '/' : tekst.replace(/\/$/, '').split('/').pop();
      if (!exists) {
        uit.push(`find: ‘${tekst}’: No such file or directory`);
        exitCode = 1;
        return;
      }
      if (past(naam, isDir || geheim)) uit.push(tekst);
      if (geheim) {
        uit.push(`find: ‘${tekst}’: Permission denied`);
        exitCode = 1;
        return;
      }
      if (!isDir) return;
      const basis = tekst.endsWith('/') ? tekst.slice(0, -1) : tekst;
      for (const kind of Object.keys(node).sort()) {
        loop(`${basis}/${kind}`, absPad === '/' ? `/${kind}` : `${absPad}/${kind}`);
      }
    };
    for (const plek of plekken.length ? plekken : ['.']) loop(plek, resolvePath(env.cwd, plek));
    return { output: uit.join('\n'), exitCode };
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
};

/**
 * Commando's die op een echte Linux bestaan, maar niet in de oefenterminal.
 * Eerst gaven ze `command not found`, alsof ze nergens bestaan, en zei chmod
 * "gewijzigd (gesimuleerd)" zonder iets te veranderen. Nu zegt de terminal
 * eerlijk waar het wel kan. De les waar ze aan bod komen, staat erbij.
 */
export const NIET_HIER = {
  // Elk commando uit de lessen dat de oefenterminal niet nadoet, met de les
  // waar het aan bod komt (commandos.js).
  ...Object.fromEntries(
    Object.entries(EERSTE_LES)
      .filter(([naam]) => !Object.hasOwn(COMMANDS, naam))
      .map(([naam, { les }]) => [naam, les]),
  ),
  // En een paar die leerlingen proberen zonder dat een les ze behandelt.
  'apt-get': EERSTE_LES.apt.les,
  vim: EERSTE_LES.nano.les,
  vi: EERSTE_LES.nano.les,
  chown: null,
  su: null,
  less: null,
  git: null,
};

/**
 * De opties die de oefenterminal per commando echt uitvoert. Een commando
 * dat hier niet staat (echo, find, history), leest zijn opties zelf.
 */
const OPTIES = {
  ls: 'alh',
  cat: '',
  cd: '',
  pwd: '',
  whoami: '',
  id: '',
  hostname: '',
  uname: 'ar',
  grep: 'ivcn',
  head: 'n',
  tail: 'n',
  wc: 'lwcm',
  mkdir: 'p',
  touch: '',
  rm: 'rRf',
  cp: '',
  mv: '',
  clear: '',
  help: '',
};

/** De eerste optie die dit commando hier niet kent, of null. */
function onbekendeOptie(naam, args) {
  const kent = OPTIES[naam];
  if (kent === undefined) return null;
  for (const a of args) {
    if (a === '-' || !a.startsWith('-') || /^-\d+$/.test(a)) continue;
    if (a.startsWith('--')) return a;
    for (const ch of a.slice(1)) if (!kent.includes(ch)) return `-${ch}`;
  }
  return null;
}

/** De commando's die de oefenterminal kent, voor Tab. */
export const COMMANDONAMEN = Object.keys(COMMANDS).sort();

/**
 * Execute a single command. Returns { output, exitCode }.
 */
export function executeCommand(cmdStr, env, stdin, { doorgeven = false } = {}) {
  const { opdracht, naar, aanvullen } = splitRedirect(cmdStr);
  const { name, args: woorden, jokers } = parseArgs(opdracht);
  if (!name) return { output: '', exitCode: 0 };
  // De shell vult jokertekens in vóór het commando draait: ls ziet a.txt b.txt,
  // nooit *.txt (tenzij er niets past).
  const args = woorden.flatMap((w, i) => (jokers[i] ? vulJokersIn(w, env) : [w]));

  if (naar === '')
    return { output: "bash: syntax error near unexpected token `newline'", exitCode: 2 };

  // bash opent het doelbestand vóór het commando draait: > maakt het leeg,
  // ook als het commando daarna faalt of niet bestaat. Een fout bij het
  // openen betekent dat het commando niet draait.
  let doelPad = null;
  if (naar) {
    doelPad = resolvePath(env.cwd, naar);
    const open = aanvullen
      ? writeFile(env.fs, doelPad, '', { append: true })
      : writeFile(env.fs, doelPad, '');
    if (open.error) return { output: `bash: ${naar}: ${open.error}`, exitCode: 1 };
  }

  const handler = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  if (!handler) {
    if (Object.hasOwn(NIET_HIER, name)) {
      const les = NIET_HIER[name];
      const waar = les ? `, vanaf les ${les}` : '';
      return {
        output: `oefenterminal: ${name} werkt hier niet, wel op je eigen Linux${waar}.`,
        exitCode: 127,
      };
    }
    return { output: `bash: ${name}: command not found`, exitCode: 127 };
  }

  // Een optie die de oefenterminal niet kent, slaat hij niet stil over: dan
  // zou cp -i toch overschrijven en grep -v het omgekeerde geven.
  const onbekend = onbekendeOptie(name, args);
  if (onbekend)
    return {
      output: `oefenterminal: ${name} ${onbekend} werkt hier niet, wel op je eigen Linux.`,
      exitCode: 2,
    };

  if (doelPad) {
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
      // Wat door een pipe gaat, eindigt met een regeleinde, net als echt:
      // dan telt wc -l de laatste regel mee.
      pipeOutput =
        result.output && !result.output.endsWith('\n') ? `${result.output}\n` : result.output;
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
