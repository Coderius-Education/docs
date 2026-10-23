import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Hoe build.yml Node en pnpm opzet. De stappen van een job worden als tekst
// gelezen, zonder YAML-parser, net als in ci-poort.test.ts.

type Stap = { tekst: string; name: string; uses: string; if: string };

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const workflow = readFileSync(
  new URL('../../.github/workflows/build.yml', import.meta.url),
  'utf8',
);

/** De stappen van een job, als tekst, met naam, uses en if eruit gelezen. */
function stappen(job: string): Stap[] {
  const begin = workflow.indexOf(`\n  ${job}:\n`);
  expect(begin, `job ${job} in build.yml`).toBeGreaterThan(-1);
  const rest = workflow.slice(begin + job.length + 4);
  const eind = rest.search(/\n {2}[a-z-]+:\n/);
  const blok = eind === -1 ? rest : rest.slice(0, eind);
  return blok
    .split('\n      - ')
    .slice(1)
    .map((tekst) => ({
      tekst,
      name: tekst.match(/^(?:\s*)name: (.+)$/m)?.[1] ?? '',
      uses: tekst.match(/^(?:\s*)uses: (.+)$/m)?.[1] ?? '',
      if: tekst.match(/^\s*if: (.+)$/m)?.[1] ?? '',
    }));
}

const plek = (lijst: Stap[], deel: string) =>
  lijst.findIndex((s) => (s.name || s.uses).includes(deel));

// Een bundler-cache tussen runs maakte webpack sneller, maar zag een gewijzigde
// remark-plugin niet (0 van 248 pagina's opnieuw gebouwd). Rspack bouwt koud
// sneller dan webpack warm, en elke koude build is byte voor byte gelijk.
describe('geen bundler-cache tussen runs', () => {
  it('build.yml bewaart node_modules/.cache en .docusaurus niet', () => {
    expect(workflow).not.toContain('node_modules/.cache');
    expect(workflow).not.toContain('.docusaurus');
    expect(workflow).not.toMatch(/actions: write/);
  });
});

// Elke job zette Node en pnpm zelf op (pnpm/action-setup kostte 4 tot 8 s);
// nu doet .github/actions/node-pnpm dat, met pnpm via corepack. Een
// site-build installeert alleen zijn eigen site.
describe('Node en pnpm via .github/actions/node-pnpm', () => {
  const actie = readFileSync(
    new URL('../../.github/actions/node-pnpm/action.yml', import.meta.url),
    'utf8',
  );

  it('geen job zet pnpm of de store-cache nog zelf op', () => {
    expect(workflow).not.toContain('pnpm/action-setup');
    expect(workflow).not.toContain('cache: pnpm');
    // setup-node alleen in de gedeelde actie.
    expect(workflow).not.toContain('actions/setup-node');
  });

  it('elke job die pnpm gebruikt, haalt de actie op met pnpm aan', () => {
    for (const naam of [
      'plan',
      'test',
      'godot',
      'robotica',
      'fullstack',
      'tekst',
      'checks',
      'build',
      'voorraad',
    ]) {
      const s = stappen(naam);
      const eerste = s.findIndex((stap) => stap.uses === './.github/actions/node-pnpm');
      expect(eerste, naam).toBeGreaterThan(-1);
      expect(s[eerste].tekst, naam).not.toContain("pnpm: 'false'");
    }
  });

  it('de actie: corepack zonder vraag, de store zelf, setup-node zonder eigen cache', () => {
    expect(actie).toContain('package-manager-cache: false');
    expect(actie).toContain('corepack enable');
    expect(actie).toContain("COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'");
    expect(actie).toMatch(
      /key: pnpm-store-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('\.nvmrc'\) \}\}-\$\{\{ hashFiles\('pnpm-lock\.yaml'\) \}\}/,
    );
  });

  // Een install van één site heeft maar een deel van de pnpm-store nodig.
  // Haalt hij de store op, dan kost dat meer dan downloaden (8 s tegen 7 s in
  // CI), en bewaart hij hem als eerste, dan krijgt elke job daarna een halve
  // store: bij een treffer op de sleutel bewaart actions/cache niets meer.
  // site-hash.mjs telt .nvmrc mee in de sleutel van een gebouwde site. CI
  // gebruikte Node 22 uit de action terwijl .nvmrc 20 zei: een andere Node
  // veranderde die sleutel dan niet, en voorraad gaf oude builds door.
  it('Node komt uit .nvmrc, het bestand dat site-hash meetelt', () => {
    expect(actie).toContain('node-version-file: .nvmrc');
    expect(actie).not.toMatch(/^\s*node-version:/m);
    expect(workflow).not.toMatch(/node-version/);
    const nvmrc = readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim();
    expect(nvmrc).toMatch(/^\d+$/);
    expect(Number(nvmrc)).toBeGreaterThanOrEqual(22);
  });

  it('een install van één site haalt de pnpm-store niet op en bewaart hem niet', () => {
    const storeStappen = actie
      .split('\n    - ')
      .filter((stap) => /pnpm store path|actions\/cache@/.test(stap));
    expect(storeStappen).toHaveLength(2);
    for (const stap of storeStappen) expect(stap).toContain("inputs.map == ''");

    for (const naam of ['build', 'voorraad']) {
      for (const stap of stappen(naam)) {
        if (stap.uses !== './.github/actions/node-pnpm') continue;
        const eigenInstall = !/^\s*map: /m.test(stap.tekst);
        if (eigenInstall) expect(stap.tekst, naam).toContain("store: 'false'");
      }
    }
  });

  // Eerst stond er --filter "./<map>...". Voor pnpm is dat alleen de map,
  // zonder de workspace-packages ervan: elke site-build viel om op de letters
  // van packages/shared. Daarom laat deze test pnpm zelf kiezen.
  it('een site-build installeert de site en elk workspace-package dat hij gebruikt', () => {
    const s = stappen('build');
    const install = s[plek(s, 'Install dependencies')].tekst;
    expect(install).toContain('MAP: ${{ steps.map.outputs.dir }}');
    const inBuild = install.match(/pnpm install --frozen-lockfile --filter "([^"]+)"/)?.[1];
    const inActie = actie.match(/pnpm install --frozen-lockfile --filter "([^"]+)"/)?.[1];
    expect(inBuild).toBe('{./$MAP}...');
    expect(inActie).toBe(inBuild);
    const v = stappen('voorraad');
    expect(v[plek(v, 'Install dependencies')].tekst).toContain('map: ${{ steps.map.outputs.dir }}');

    for (const id of ['python', 'ctf', 'fullstack', 'home']) {
      const map = execFileSync('node', ['scripts/sites-json.mjs', id], {
        cwd: ROOT,
        encoding: 'utf8',
      }).trim();
      const filter = (inBuild ?? '').replace('$MAP', map);
      const gekozen = JSON.parse(
        execFileSync('pnpm', ['list', '--json', '--depth', '-1', '--filter', filter], {
          cwd: ROOT,
          encoding: 'utf8',
        }),
      ).map((p: { name: string }) => p.name);
      const pakket = JSON.parse(readFileSync(join(ROOT, map, 'package.json'), 'utf8'));
      const workspace = Object.entries({ ...pakket.dependencies, ...pakket.devDependencies })
        .filter(([, versie]) => String(versie).startsWith('workspace:'))
        .map(([naam]) => naam);
      expect(workspace, id).toContain('@coderius/shared');
      for (const naam of [pakket.name, ...workspace]) expect(gekozen, id).toContain(naam);
    }
  }, 30_000);
});
