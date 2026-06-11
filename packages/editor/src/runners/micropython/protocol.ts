// Bestanden naar het board schrijven via raw-paste snippets.
// (Port van robotica-docs' WebMicroEditor/filesystem.ts, beperkt tot wat de
// runner nodig heeft: mappen aanmaken en bestanden schrijven.)

import type { SerialClient } from './serial';

function b64encode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function pyStr(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const BINASCII_IMPORT = `
try:
    import binascii as _b
except ImportError:
    import ubinascii as _b
`;

async function ensureParents(serial: SerialClient, path: string): Promise<void> {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return;
  const dirs: string[] = [];
  let cur = '';
  for (let i = 0; i < parts.length - 1; i++) {
    cur += `/${parts[i]}`;
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
  const { stdout, stderr } = await serial.runCode(code);
  if (stderr.trim()) throw new Error(`Map aanmaken mislukt: ${stderr.trim()}`);
  if (!stdout.includes('OK')) throw new Error('Map aanmaken kreeg geen OK');
}

export async function writeBoardFile(
  serial: SerialClient,
  path: string,
  content: string,
): Promise<void> {
  await ensureParents(serial, path);
  const bytes = new TextEncoder().encode(content);
  const b64 = b64encode(bytes);
  // In stukken, anders struikelt MicroPython's parser over enorme literals.
  const CHUNK = 1024;
  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));

  const code = `${BINASCII_IMPORT}f = open(${pyStr(path)}, 'wb')
${chunks.map((c) => `f.write(_b.a2b_base64(${pyStr(c)}))`).join('\n')}
f.close()
print('OK')
`;
  const { stdout, stderr } = await serial.runCode(code, 60000);
  if (stderr.trim()) throw new Error(`Uploaden van ${path} mislukt: ${stderr.trim()}`);
  if (!stdout.includes('OK')) throw new Error(`Uploaden van ${path} kreeg geen OK`);
}
