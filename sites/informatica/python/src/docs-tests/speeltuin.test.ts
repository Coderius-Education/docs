import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Beloftes over de speeltuin (<CodeExercise>) die de leerling niet kan
// nagaan. Vijf pagina's zeiden bij een oneindige loop "druk op Stop", maar
// de speeltuin heeft alleen Reset, Stap voor stap en Uitvoeren, en die staan
// uit zolang Python draait. Wie de beschreven fout maakte, zag zijn tabblad
// vastlopen en raakte zijn code kwijt.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function lesbestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return lesbestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

const STOPKNOP = /stop-?knop|(?:druk|klik)(?: dan)? op (?:de )?stop\b/i;

describe('beloftes over de speeltuin', () => {
  it('geen pagina belooft een stopknop die er niet is', () => {
    const fout = lesbestanden(DOCS).flatMap((pad) =>
      readFileSync(pad, 'utf8')
        .split('\n')
        .map((regel, i) => ({ regel, nr: i + 1 }))
        .filter(({ regel }) => STOPKNOP.test(regel) && !/geen stopknop/i.test(regel))
        .map(({ nr }) => `${relative(DOCS, pad)}:${nr}`),
    );
    expect(fout).toEqual([]);
  });

  it('de regel herkent de oude zinnen', () => {
    expect(STOPKNOP.test('Klik dan op de Stop-knop.')).toBe(true);
    expect(STOPKNOP.test('**Oplossing:** druk op Stop, en zet')).toBe(true);
    expect(STOPKNOP.test('de loop stopt nooit')).toBe(false);
  });
});
