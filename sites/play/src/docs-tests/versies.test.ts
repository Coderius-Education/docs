import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

// Drie plekken in de lessen beloofden een pygame-ce-banner als uitvoer, met
// drie verschillende versies (2.5.3, 2.5.5), en geen ervan was de versie die
// de gebundelde wheel pint. De installatiepagina eiste "Python 3.10" terwijl
// de wheel 3.10 of nieuwer vraagt. Versienummers in beloofde uitvoer
// verouderen stil; deze test legt ze naast de METADATA van de wheel.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const WHL = join(SITE, 'static', 'whl');

/** Een bestand uit een zip (wheel), zonder extra afhankelijkheden. */
function uitZip(zip: Buffer, eindigtOp: string): string {
  let i = 0;
  while (zip.readUInt32LE(i) === 0x04034b50) {
    const methode = zip.readUInt16LE(i + 8);
    const grootte = zip.readUInt32LE(i + 18);
    const naamLengte = zip.readUInt16LE(i + 26);
    const extraLengte = zip.readUInt16LE(i + 28);
    const naam = zip.toString('utf8', i + 30, i + 30 + naamLengte);
    const begin = i + 30 + naamLengte + extraLengte;
    const data = zip.subarray(begin, begin + grootte);
    if (naam.endsWith(eindigtOp)) {
      return (methode === 8 ? inflateRawSync(data) : data).toString('utf8');
    }
    i = begin + grootte;
  }
  throw new Error(`${eindigtOp} niet gevonden`);
}

const wheel = readdirSync(WHL).find((n) => /^coderius_play-.*\.whl$/.test(n));
const METADATA = uitZip(readFileSync(join(WHL, wheel ?? '')), '.dist-info/METADATA');

function lessen(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lessen(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}
const DOCS = lessen(join(SITE, 'docs'));

// 'Python 3.10' of 'Python 3.10 of nieuwer', maar niet 'Python 3.12.10' uit
// een banner: zonder de ? viel het patroon daar een cijfer terug en las het
// 'Python 3.1'.
const PYTHON_EIS = /Python (3\.\d+)(?!\.?\d)( of nieuwer)?/g;

describe('versies in de lessen', () => {
  it('de wheel pint pygame-ce en noemt een minimale Python', () => {
    expect(METADATA).toMatch(/^Requires-Dist: pygame-ce==/m);
    expect(METADATA).toMatch(/^Requires-Python: >=3\.\d+/m);
  });

  it('elke genoemde pygame-ce-versie is die van de wheel', () => {
    const gepind = METADATA.match(/^Requires-Dist: pygame-ce==([\d.]+)/m)?.[1];
    const fout = DOCS.flatMap((pad) =>
      [...readFileSync(pad, 'utf8').matchAll(/pygame-ce (\d+\.\d+\.\d+)/g)]
        .filter((m) => m[1] !== gepind)
        .map((m) => `${pad}: ${m[0]}`),
    );
    expect(fout).toEqual([]);
  });

  it('een volledige versie als 3.12.10 telt niet als eis', () => {
    const eisen = (t: string) => [...t.matchAll(PYTHON_EIS)].map((m) => m[0]);
    expect(eisen('(SDL 2.32.6, Python 3.12.10)')).toEqual([]);
    expect(eisen('Python 3.10 of nieuwer')).toEqual(['Python 3.10 of nieuwer']);
  });

  it('een Python-eis in de lessen is de minimale versie "of nieuwer"', () => {
    const minimaal = METADATA.match(/^Requires-Python: >=(3\.\d+)/m)?.[1];
    const fout = DOCS.flatMap((pad) =>
      [...readFileSync(pad, 'utf8').matchAll(PYTHON_EIS)]
        .filter((m) => m[1] !== minimaal || !m[2])
        .map((m) => `${pad}: ${m[0]}`),
    );
    expect(fout).toEqual([]);
  });
});
