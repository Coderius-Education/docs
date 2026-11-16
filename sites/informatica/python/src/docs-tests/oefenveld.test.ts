import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startcode } from '@coderius/python-runner/startcode';
import { describe, expect, it } from 'vitest';

// Twee dingen die een leerling in elk oefenveld van de cursus merkt
// (issue 216): het veld onthoudt zijn code, en een veld waarin hij alles zelf
// schrijft is leeg. Wat het veld doet, testen packages/python-runner en
// packages/shared/oefenveld; hier of de cursus het zo gebruikt.

const lees = (pad: string) => readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');
const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function lesbestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lesbestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const velden = lesbestanden(DOCS).flatMap((pad) =>
  [...readFileSync(pad, 'utf8').matchAll(/<CodeExercise>\{`([\s\S]*?)`\}<\/CodeExercise>/g)].map(
    (m) => ({ les: relative(DOCS, pad), code: m[1].trim() }),
  ),
);

describe('het oefenveld van de cursus', () => {
  it('bewaart de code van de leerling: het veld weet welke cursus het is', () => {
    // Zonder `site` bewaart het veld niets, en was het werk weg bij herladen.
    expect(lees('../components/CodeExercise/index.tsx')).toMatch(
      /<CodeExercise \{\.\.\.props\} site="python" \/>/,
    );
  });

  it('de lessen gebruiken dat veld', () => {
    expect(velden.length).toBeGreaterThan(300);
    const anders = lesbestanden(DOCS).filter((pad) => {
      const tekst = readFileSync(pad, 'utf8');
      return (
        /<CodeExercise>/.test(tekst) &&
        !/import CodeExercise from '@site\/src\/components\/CodeExercise'/.test(tekst)
      );
    });
    expect(anders.map((pad) => relative(DOCS, pad))).toEqual([]);
  });

  it('een veld met alleen commentaar is leeg, met één regel als aanwijzing', () => {
    // "# Schrijf hier je code" moest de leerling eerst weghalen. De
    // aanwijzing staat grijs in het lege veld: één korte regel past daar.
    const leeg = velden.filter((v) =>
      v.code.split('\n').every((r) => !r.trim() || r.trim().startsWith('#')),
    );
    expect(leeg.length).toBeGreaterThan(100);
    const fout = leeg
      .map((v) => ({ ...v, ...startcode(v.code) }))
      .filter(
        (v) =>
          v.start !== '' ||
          !v.aanwijzing ||
          v.aanwijzing.includes('\n') ||
          v.aanwijzing.length > 50,
      )
      .map((v) => `${v.les}: ${v.code}`);
    expect(fout).toEqual([]);
  });

  it('de docentenhandleiding zegt niet meer dat het veld niets bewaart', () => {
    const handleiding = lees('../pages/docenten.mdx');
    expect(handleiding).not.toMatch(/bewaart niets/);
    expect(handleiding).toMatch(/bewaart de code in de browser/);
  });

  it('geen les zegt dat de editor het programma niet bewaart', () => {
    const fout = lesbestanden(DOCS)
      .filter((pad) =>
        /editor bewaart het\s+niet|veld bewaart (het|niets|je code niet)/.test(
          readFileSync(pad, 'utf8'),
        ),
      )
      .map((pad) => relative(DOCS, pad));
    expect(fout).toEqual([]);
  });
});
