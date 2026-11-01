import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De hash van een site is de sleutel van zijn gebouwde versie in de cache,
// waar cross-links een site die niet veranderde uit haalt. Welke browsers de
// build bedient (.browserslistrc) en de pnpm-instellingen raken elke build;
// eerst telden ze niet mee, en kon na zo'n wijziging een oude build terugkomen.

describe('site-hash.mjs', () => {
  it('telt de root-config mee die elke build raakt', () => {
    const uit = execFileSync('node', ['scripts/site-hash.mjs', 'python', '--lijst'], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      encoding: 'utf8',
    });
    for (const bestand of [
      'pnpm-lock.yaml',
      '.browserslistrc',
      '.npmrc',
      '.nvmrc',
      'scripts/comprimeer.mjs',
    ]) {
      expect(uit.split('\n'), bestand).toContain(bestand);
    }
    expect(uit.trim().split('\n').at(-1)).toMatch(/^[0-9a-f]{32}$/);
  }, 20_000);
});
