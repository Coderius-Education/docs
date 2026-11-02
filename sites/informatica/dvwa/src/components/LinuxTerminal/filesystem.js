/**
 * Virtual filesystem for the Linux terminal simulator.
 * Provides a fake Linux filesystem with files relevant to DVWA exercises.
 */

const defaultFilesystem = {
  etc: {
    passwd: [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
      'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
      'student:x:1000:1000:student:/home/student:/bin/bash',
    ].join('\n'),
    shadow: null, // permission denied
    hostname: 'dvwa-lab',
    'os-release': [
      'NAME="Debian GNU/Linux"',
      'VERSION="12 (bookworm)"',
      'ID=debian',
      'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"',
    ].join('\n'),
    hosts: [
      '127.0.0.1\tlocalhost',
      '127.0.1.1\tdvwa-lab',
      '::1\t\tlocalhost ip6-localhost ip6-loopback',
    ].join('\n'),
    group: ['root:x:0:', 'www-data:x:33:', 'student:x:1000:'].join('\n'),
  },
  home: {
    student: {
      '.bashrc':
        '# ~/.bashrc\nexport PS1="student@dvwa:~$ "\nexport PATH="/usr/local/bin:/usr/bin:/bin"',
      'notities.txt':
        'TODO: DVWA challenges afmaken\n- Brute force: klaar\n- Command injection: bezig\n- Authorization bypass: nog niet begonnen',
    },
  },
  var: {
    www: {
      html: {
        'index.php': '<?php echo "<h1>Welcome to DVWA</h1>"; ?>',
        'login.php':
          '<?php\n// Vulnerable login - no input sanitization\n$user = $_GET["username"];\n$pass = $_GET["password"];\n?>',
        config: {
          'config.inc.php':
            "<?php\n$_DVWA['db_server'] = '127.0.0.1';\n$_DVWA['db_database'] = 'dvwa';\n$_DVWA['db_user'] = 'admin';\n$_DVWA['db_password'] = 'password';\n?>",
        },
        '.htaccess': 'RewriteEngine On\nRewriteRule ^index\\.php$ - [L]',
      },
    },
    log: {
      'auth.log': [
        'Mar 26 10:15:01 dvwa-lab sshd[1234]: Failed password for admin from 192.168.1.100',
        'Mar 26 10:15:03 dvwa-lab sshd[1234]: Failed password for admin from 192.168.1.100',
        'Mar 26 10:15:04 dvwa-lab sshd[1234]: Failed password for admin from 192.168.1.100',
        'Mar 26 10:15:05 dvwa-lab sshd[1234]: Accepted password for admin from 192.168.1.100',
      ].join('\n'),
      apache2: {
        'access.log':
          '192.168.1.100 - - [26/Mar/2026:10:15:01 +0100] "GET /login.php HTTP/1.1" 200 1234',
        'error.log': '',
      },
    },
  },
  tmp: {},
  usr: {
    bin: {},
    local: { bin: {} },
  },
  bin: {},
  root: null, // permission denied
};

/**
 * Resolve a path relative to cwd. Returns an absolute path array.
 */
export const HOME = '/home/student';

/** De map in de prompt, zoals bash hem toont: ~ voor je thuismap, ook als begin. */
export function promptPad(cwd) {
  if (cwd === HOME) return '~';
  if (cwd.startsWith(`${HOME}/`)) return `~${cwd.slice(HOME.length)}`;
  return cwd;
}

export function resolvePath(cwd, invoer) {
  let parts;
  // ~ is je thuismap, net als in bash: ~ en ~/notities.txt.
  const inputPath = invoer === '~' || invoer.startsWith('~/') ? HOME + invoer.slice(1) : invoer;
  if (inputPath.startsWith('/')) {
    parts = inputPath.split('/').filter(Boolean);
  } else {
    parts = [...cwd.split('/').filter(Boolean), ...inputPath.split('/').filter(Boolean)];
  }

  const resolved = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return `/${resolved.join('/')}`;
}

/**
 * Navigate the filesystem tree to a given absolute path.
 * Returns { node, exists, isFile, isDir, permissionDenied }
 */
export function getNode(fs, absPath) {
  if (absPath === '/') {
    return { node: fs, exists: true, isFile: false, isDir: true, permissionDenied: false };
  }

  const parts = absPath.split('/').filter(Boolean);
  let current = fs;

  for (let i = 0; i < parts.length; i++) {
    if (current === null) {
      return { node: null, exists: true, isFile: false, isDir: false, permissionDenied: true };
    }
    if (typeof current !== 'object') {
      return { node: null, exists: false, isFile: false, isDir: false, permissionDenied: false };
    }
    if (!(parts[i] in current)) {
      return { node: null, exists: false, isFile: false, isDir: false, permissionDenied: false };
    }
    current = current[parts[i]];
  }

  if (current === null) {
    return { node: null, exists: true, isFile: false, isDir: false, permissionDenied: true };
  }
  if (typeof current === 'string') {
    return { node: current, exists: true, isFile: true, isDir: false, permissionDenied: false };
  }
  return { node: current, exists: true, isFile: false, isDir: true, permissionDenied: false };
}

/**
 * List directory contents. Returns sorted array of names with '/' suffix for dirs.
 */
export function listDir(fs, absPath) {
  const { node, exists, isDir, permissionDenied } = getNode(fs, absPath);
  if (!exists) return { error: `ls: cannot access '${absPath}': No such file or directory` };
  if (permissionDenied)
    return { error: `ls: cannot open directory '${absPath}': Permission denied` };
  if (!isDir) return { error: `ls: cannot access '${absPath}': Not a directory` };

  return {
    entries: Object.keys(node)
      .sort()
      .map((name) => {
        const child = node[name];
        const isChildDir = child !== null && typeof child === 'object';
        return { name, isDir: isChildDir };
      }),
  };
}

/**
 * Read file contents.
 */
export function readFile(fs, absPath) {
  const { node, exists, isFile, isDir, permissionDenied } = getNode(fs, absPath);
  if (!exists) return { error: `cat: ${absPath}: No such file or directory` };
  if (permissionDenied) return { error: `cat: ${absPath}: Permission denied` };
  if (isDir) return { error: `cat: ${absPath}: Is a directory` };
  if (isFile) return { content: node };
  return { error: `cat: ${absPath}: Cannot read` };
}

/**
 * Mag de leerling hier schrijven? Alleen in zijn thuismap en in /tmp, zoals
 * een gewone gebruiker op een echte Linux. Elders: Permission denied, en dat
 * is precies wat de les over rechten laat zien.
 */
export function magSchrijven(absPath) {
  return (
    absPath === HOME ||
    absPath.startsWith(`${HOME}/`) ||
    absPath === '/tmp' ||
    absPath.startsWith('/tmp/')
  );
}

/**
 * Mag de leerling dit weghalen of verplaatsen? Dat hangt, net als op een echte
 * Linux, af van de map erboven: /tmp zelf en je thuismap zelf horen in mappen
 * van root, en die mag je dus niet weghalen.
 */
export function magVerwijderen(absPath) {
  return magSchrijven(splitPad(absPath)[0]);
}

/** De map boven absPath en de naam erin: '/a/b' -> ['/a', 'b']. */
export function splitPad(absPath) {
  const delen = absPath.split('/').filter(Boolean);
  const naam = delen.pop() ?? '';
  return [`/${delen.join('/')}`, naam];
}

/**
 * Zet een bestand neer (of vult het aan). De map erboven moet bestaan.
 * @returns {{ error?: string }} error is de reden zonder commandonaam:
 *   'No such file or directory', 'Is a directory', 'Permission denied'.
 */
export function writeFile(fs, absPath, content, { append = false } = {}) {
  const [ouder, naam] = splitPad(absPath);
  const map = getNode(fs, ouder);
  if (!map.exists || !map.isDir) return { error: 'No such file or directory' };
  if (map.permissionDenied || !magSchrijven(absPath)) return { error: 'Permission denied' };
  const bestaand = map.node[naam];
  if (bestaand !== undefined && bestaand !== null && typeof bestaand === 'object')
    return { error: 'Is a directory' };
  map.node[naam] = append && typeof bestaand === 'string' ? `${bestaand}${content}` : content;
  return {};
}

/** Maakt een lege map. Met `parents` ook de mappen erboven, zoals mkdir -p. */
export function makeDir(fs, absPath, { parents = false } = {}) {
  const hier = getNode(fs, absPath);
  if (hier.exists) return parents && hier.isDir ? {} : { error: 'File exists' };
  const [ouder, naam] = splitPad(absPath);
  const map = getNode(fs, ouder);
  if (!map.exists && parents) {
    const fout = makeDir(fs, ouder, { parents });
    if (fout.error) return fout;
    return makeDir(fs, absPath);
  }
  if (!map.exists || !map.isDir) return { error: 'No such file or directory' };
  if (map.permissionDenied || !magSchrijven(absPath)) return { error: 'Permission denied' };
  map.node[naam] = {};
  return {};
}

/** Haalt een bestand of map weg. Een map alleen met `recursive`, zoals rm -r. */
export function removeNode(fs, absPath, { recursive = false } = {}) {
  const hier = getNode(fs, absPath);
  if (!hier.exists) return { error: 'No such file or directory' };
  if (!magVerwijderen(absPath)) return { error: 'Permission denied' };
  if (hier.isDir && !recursive) return { error: 'Is a directory' };
  const [ouder, naam] = splitPad(absPath);
  delete getNode(fs, ouder).node[naam];
  return {};
}

export function createFilesystem(extraFiles) {
  // Deep clone default filesystem and merge extra files
  const fs = JSON.parse(JSON.stringify(defaultFilesystem));
  if (extraFiles) {
    mergeDeep(fs, extraFiles);
  }
  return fs;
}

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
