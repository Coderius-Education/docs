import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { comprimeerMap } from './comprimeer';

// .gz en .br naast de bestanden van een build, voor een server die vooraf
// gecomprimeerde bestanden serveert (zie comprimeer.js). Dat de browser ze
// ook echt slikt, met Pyodide en al, toetst de job `browser` in CI: de
// rooktest serveert ze daar (scripts/rooktest-speeltuin.mjs).

const mappen: string[] = [];
afterEach(() => {
  for (const map of mappen.splice(0)) rmSync(map, { recursive: true, force: true });
});

function build(bestanden: Record<string, Buffer | string>): string {
  const map = mkdtempSync(join(tmpdir(), 'comprimeer-'));
  mappen.push(map);
  for (const [naam, inhoud] of Object.entries(bestanden)) {
    mkdirSync(join(map, naam, '..'), { recursive: true });
    writeFileSync(join(map, naam), inhoud);
  }
  return map;
}

const tekst = '<p>Leuk dat je er bent.</p>\n'.repeat(200);
// Een wasm-kop met daarachter iets wat goed comprimeert.
const wasm = Buffer.concat([Buffer.from([0, 0x61, 0x73, 0x6d]), Buffer.alloc(20_000, 0x20)]);

describe('comprimeerMap', () => {
  it('zet .gz en .br naast tekst en wasm, en die pakken uit tot het origineel', async () => {
    const map = build({ 'index.html': tekst, 'pyodide/pyodide.asm.wasm': wasm });
    await comprimeerMap(map);
    for (const [naam, inhoud] of [
      ['index.html', Buffer.from(tekst)],
      ['pyodide/pyodide.asm.wasm', wasm],
    ] as const) {
      const pad = join(map, naam);
      expect(gunzipSync(readFileSync(`${pad}.gz`))).toEqual(inhoud);
      expect(brotliDecompressSync(readFileSync(`${pad}.br`))).toEqual(inhoud);
      // Het origineel blijft, voor een browser die geen compressie vraagt.
      expect(readFileSync(pad)).toEqual(inhoud);
    }
  });

  it('slaat over wat al gecomprimeerd of te klein is', async () => {
    const namen = [
      'pyodide/python_stdlib.zip',
      'pyodide/numpy-2.2.5-cp313-cp313-pyemscripten_2025_0_wasm32.whl',
      'img/logo.png',
      'fonts/letter.woff2',
    ];
    const map = build({
      ...Object.fromEntries(namen.map((n) => [n, tekst])),
      // Kleiner dan 1 kB, maar wel goed te comprimeren: dan beslist alleen de
      // ondergrens, niet de regel dat een kopie kleiner moet zijn.
      'klein.js': 'console.log(1);\n'.repeat(40),
    });
    await comprimeerMap(map);
    for (const naam of [...namen, 'klein.js']) {
      expect(existsSync(join(map, `${naam}.gz`)), naam).toBe(false);
      expect(existsSync(join(map, `${naam}.br`)), naam).toBe(false);
    }
  });

  it('zet geen kopie neer die groter is dan het origineel, en ruimt een oude op', async () => {
    // Ruis comprimeert niet; een .gz die groter is, zou de server toch sturen.
    const map = build({ 'data.json': randomBytes(4096), 'data.json.gz': 'oud' });
    await comprimeerMap(map);
    expect(existsSync(join(map, 'data.json.gz'))).toBe(false);
    expect(existsSync(join(map, 'data.json.br'))).toBe(false);
  });

  it('geeft bij dezelfde build byte voor byte dezelfde kopieën', async () => {
    // De build zelf is deterministisch (Rspack); een gzip-header met een
    // tijd erin zou dat breken voor elke build-vergelijking.
    const a = build({ 'index.html': tekst });
    const b = build({ 'index.html': tekst });
    await comprimeerMap(a);
    await new Promise((r) => setTimeout(r, 1100));
    await comprimeerMap(b);
    for (const ext of ['.gz', '.br']) {
      expect(readFileSync(join(a, `index.html${ext}`))).toEqual(
        readFileSync(join(b, `index.html${ext}`)),
      );
    }
  });

  it('verandert bij een tweede run niets', async () => {
    // De job `browser` kan een build comprimeren die al gecomprimeerd uit de
    // cache kwam; dan geen .gz.gz, en dezelfde bestanden.
    const map = build({ 'index.html': tekst, 'data.json': randomBytes(4096) });
    await comprimeerMap(map);
    const inhoud = () =>
      Object.fromEntries(
        readdirSync(map).map((n) => [n, readFileSync(join(map, n)).toString('hex')]),
      );
    const eerste = inhoud();
    await comprimeerMap(map);
    expect(inhoud()).toEqual(eerste);
    expect(Object.keys(eerste).sort()).toEqual([
      'data.json',
      'index.html',
      'index.html.br',
      'index.html.gz',
    ]);
  });
});
