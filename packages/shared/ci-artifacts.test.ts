import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// De job cross-links haalt de builds op met download-artifact. Matcht een
// patroon precies één artifact, dan pakt die actie het uit in `path` zelf en
// niet in `path/<naam>`. Een PR die alleen fullstack raakte, faalde daardoor
// met "Geen build van: fullstack": de build stond los in builds/. De stap
// "Eén map per site" zet elke build in builds/<site>-static, ook als er maar
// één is. Deze test draait die stap uit build.yml zelf.

const workflow = readFileSync(
  new URL('../../.github/workflows/build.yml', import.meta.url),
  'utf8',
);

function stap(): string {
  const begin = workflow.indexOf('      - name: Eén map per site');
  expect(begin, 'stap "Eén map per site" in build.yml').toBeGreaterThan(-1);
  const run = workflow.indexOf('        run: |\n', begin) + '        run: |\n'.length;
  const regels: string[] = [];
  for (const regel of workflow.slice(run).split('\n')) {
    if (regel.trim() && !regel.startsWith('          ')) break;
    regels.push(regel.slice(10));
  }
  return regels.join('\n');
}

function draai(opzet: Record<string, string[]>, geraakt: string[], ongewijzigd: string[]) {
  const map = mkdtempSync(join(tmpdir(), 'ci-artifacts-'));
  for (const [pad, bestanden] of Object.entries(opzet)) {
    mkdirSync(join(map, pad), { recursive: true });
    for (const b of bestanden) writeFileSync(join(map, pad, b), '');
  }
  writeFileSync(join(map, 'stap.sh'), stap());
  execFileSync('bash', ['-e', 'stap.sh'], {
    cwd: map,
    env: {
      ...process.env,
      GERAAKT: JSON.stringify(geraakt),
      ONGEWIJZIGD: JSON.stringify(ongewijzigd),
    },
    stdio: 'pipe',
  });
  const builds = join(map, 'builds');
  return Object.fromEntries(readdirSync(builds).map((d) => [d, readdirSync(join(builds, d))]));
}

describe('cross-links: één map per site', () => {
  it('download-artifact krijgt per patroon een eigen map, niet builds/', () => {
    expect(workflow).toMatch(/pattern: '\*-static'\n\s+path: geraakt/);
    expect(workflow).toMatch(/pattern: '\*-voorraad'\n\s+path: voorraad/);
  });

  it('één geraakte site, los uitgepakt, komt in <site>-static', () => {
    const uit = draai(
      { geraakt: ['index.html'], 'voorraad/a-voorraad': ['x'], 'voorraad/b-voorraad': ['y'] },
      ['fullstack'],
      ['a', 'b'],
    );
    expect(uit).toEqual({
      'fullstack-static': ['index.html'],
      'a-static': ['x'],
      'b-static': ['y'],
    });
  });

  it('één ongewijzigde site, los uitgepakt, ook', () => {
    const uit = draai(
      { 'geraakt/p-static': ['i'], 'geraakt/q-static': ['j'], voorraad: ['index.html'] },
      ['p', 'q'],
      ['r'],
    );
    expect(uit).toEqual({ 'p-static': ['i'], 'q-static': ['j'], 'r-static': ['index.html'] });
  });

  it('zonder voorraad blijft het bij de geraakte sites', () => {
    const uit = draai({ 'geraakt/p-static': ['i'], 'geraakt/q-static': ['j'] }, ['p', 'q'], []);
    expect(uit).toEqual({ 'p-static': ['i'], 'q-static': ['j'] });
  });
});
