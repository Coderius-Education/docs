/**
 * Virtual filesystem for the Linux terminal simulator.
 * Provides a fake Linux filesystem with files relevant to DVWA exercises.
 */

const defaultFilesystem = {
  'etc': {
    'passwd': [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
      'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
      'student:x:1000:1000:student:/home/student:/bin/bash',
    ].join('\n'),
    'shadow': null, // permission denied
    'hostname': 'dvwa-lab',
    'os-release': [
      'NAME="Debian GNU/Linux"',
      'VERSION="12 (bookworm)"',
      'ID=debian',
      'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"',
    ].join('\n'),
    'hosts': [
      '127.0.0.1\tlocalhost',
      '127.0.1.1\tdvwa-lab',
      '::1\t\tlocalhost ip6-localhost ip6-loopback',
    ].join('\n'),
    'group': [
      'root:x:0:',
      'www-data:x:33:',
      'student:x:1000:',
    ].join('\n'),
  },
  'home': {
    'student': {
      '.bashrc': '# ~/.bashrc\nexport PS1="student@dvwa:~$ "\nexport PATH="/usr/local/bin:/usr/bin:/bin"',
      'notities.txt': 'TODO: DVWA challenges afmaken\n- Brute force: klaar\n- Command injection: bezig\n- Authorization bypass: nog niet begonnen',
    },
  },
  'var': {
    'www': {
      'html': {
        'index.php': '<?php echo "<h1>Welcome to DVWA</h1>"; ?>',
        'login.php': '<?php\n// Vulnerable login - no input sanitization\n$user = $_GET["username"];\n$pass = $_GET["password"];\n?>',
        'config': {
          'config.inc.php': "<?php\n$_DVWA['db_server'] = '127.0.0.1';\n$_DVWA['db_database'] = 'dvwa';\n$_DVWA['db_user'] = 'admin';\n$_DVWA['db_password'] = 'password';\n?>",
        },
        '.htaccess': 'RewriteEngine On\nRewriteRule ^index\\.php$ - [L]',
      },
    },
    'log': {
      'auth.log': [
        'Mar 26 10:15:01 dvwa-lab sshd[1234]: Failed password for admin from 192.168.1.100',
        'Mar 26 10:15:03 dvwa-lab sshd[1234]: Failed password for admin from 192.168.1.100',
        'Mar 26 10:15:04 dvwa-lab sshd[1234]: Failed password for admin from 192.168.1.100',
        'Mar 26 10:15:05 dvwa-lab sshd[1234]: Accepted password for admin from 192.168.1.100',
      ].join('\n'),
      'apache2': {
        'access.log': '192.168.1.100 - - [26/Mar/2026:10:15:01 +0100] "GET /login.php HTTP/1.1" 200 1234',
        'error.log': '',
      },
    },
  },
  'tmp': {},
  'usr': {
    'bin': {},
    'local': { 'bin': {} },
  },
  'bin': {},
  'root': null, // permission denied
};

/**
 * Resolve a path relative to cwd. Returns an absolute path array.
 */
export function resolvePath(cwd, inputPath) {
  let parts;
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
  return '/' + resolved.join('/');
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
  const { node, isDir, permissionDenied } = getNode(fs, absPath);
  if (permissionDenied) return { error: `ls: cannot open directory '${absPath}': Permission denied` };
  if (!isDir) return { error: `ls: cannot access '${absPath}': Not a directory` };

  return {
    entries: Object.keys(node).sort().map(name => {
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
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
        && target[key] && typeof target[key] === 'object') {
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
