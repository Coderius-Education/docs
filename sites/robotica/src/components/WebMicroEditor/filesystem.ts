// High-level filesystem operations on a connected MicroPython board.
// Each op runs a small Python snippet via raw-paste.

import type { SerialClient } from './serial';

function b64encode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pyStr(s: string): string {
  // safely quote as a python single-quoted string
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

const BINASCII_IMPORT = `
try:
    import binascii as _b
except ImportError:
    import ubinascii as _b
`;

export class BoardFS {
  constructor(private serial: SerialClient) {}

  /** Make sure every parent directory of `path` exists. */
  async ensureParents(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) return;
    const dirs: string[] = [];
    let cur = '';
    for (let i = 0; i < parts.length - 1; i++) {
      cur += '/' + parts[i];
      dirs.push(cur);
    }
    const code = `
import os
for d in [${dirs.map(pyStr).join(', ')}]:
    try:
        os.mkdir(d)
    except OSError:
        pass
print('OK')
`;
    const { stdout, stderr } = await this.serial.runCode(code);
    if (stderr.trim()) throw new Error(`mkdir failed: ${stderr.trim()}`);
    if (!stdout.includes('OK')) throw new Error('mkdir kreeg geen OK');
  }

  async mkdir(path: string): Promise<void> {
    const code = `
import os
try:
    os.mkdir(${pyStr(path)})
except OSError as e:
    if e.args[0] != 17:
        raise
print('OK')
`;
    const { stdout, stderr } = await this.serial.runCode(code);
    if (stderr.trim()) throw new Error(`mkdir(${path}): ${stderr.trim()}`);
    if (!stdout.includes('OK')) throw new Error('mkdir kreeg geen OK');
  }

  async writeFile(path: string, content: Uint8Array | string): Promise<void> {
    await this.ensureParents(path);
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    const b64 = b64encode(bytes);
    // chunk so we don't blow up MicroPython's parser on huge literals
    const CHUNK = 1024;
    const chunks: string[] = [];
    for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));

    const code =
      BINASCII_IMPORT +
      `f = open(${pyStr(path)}, 'wb')\n` +
      chunks.map((c) => `f.write(_b.a2b_base64(${pyStr(c)}))\n`).join('') +
      `f.close()\nprint('OK')\n`;
    const { stdout, stderr } = await this.serial.runCode(code, 60000);
    if (stderr.trim()) throw new Error(`writeFile(${path}): ${stderr.trim()}`);
    if (!stdout.includes('OK')) throw new Error('writeFile kreeg geen OK');
  }

  async readFile(path: string): Promise<Uint8Array> {
    const code =
      BINASCII_IMPORT +
      `
with open(${pyStr(path)}, 'rb') as f:
    data = f.read()
print(_b.b2a_base64(data).decode().strip())
`;
    const { stdout, stderr } = await this.serial.runCode(code);
    if (stderr.trim()) throw new Error(`readFile(${path}): ${stderr.trim()}`);
    return b64decode(stdout.trim());
  }

  /** List the immediate children of `path`. Returns [{name, isDir}]. */
  async listdir(path = '/'): Promise<Array<{ name: string; isDir: boolean }>> {
    const code = `
import os
p = ${pyStr(path)}
for name in os.listdir(p):
    full = (p + '/' + name) if not p.endswith('/') else (p + name)
    try:
        st = os.stat(full)
        is_dir = (st[0] & 0x4000) != 0
    except OSError:
        is_dir = False
    print(name + '\\t' + ('d' if is_dir else 'f'))
`;
    const { stdout, stderr } = await this.serial.runCode(code);
    if (stderr.trim()) throw new Error(`listdir(${path}): ${stderr.trim()}`);
    return stdout
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => {
        const [name, kind] = line.split('\t');
        return { name, isDir: kind === 'd' };
      });
  }

  async remove(path: string): Promise<void> {
    const code = `
import os
def _rm(p):
    try:
        os.remove(p)
        return
    except OSError:
        pass
    for name in os.listdir(p):
        sub = (p + '/' + name) if not p.endswith('/') else (p + name)
        _rm(sub)
    os.rmdir(p)
_rm(${pyStr(path)})
print('OK')
`;
    const { stdout, stderr } = await this.serial.runCode(code, 30000);
    if (stderr.trim()) throw new Error(`remove(${path}): ${stderr.trim()}`);
    if (!stdout.includes('OK')) throw new Error('remove kreeg geen OK');
  }
}
