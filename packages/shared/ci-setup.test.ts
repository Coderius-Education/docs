import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Hoe build.yml Node en pnpm opzet. De stappen van een job worden als tekst
// gelezen, zonder YAML-parser, net als in ci-poort.test.ts.

type Stap = { tekst: string; name: string; uses: string; if: string };

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
      /key: pnpm-store-\$\{\{ runner\.os \}\}-node22-\$\{\{ hashFiles\('pnpm-lock\.yaml'\) \}\}/,
    );
    expect(actie).toContain('pnpm install --frozen-lockfile --filter "$FILTER"');
  });

  it('een site-build installeert alleen die site en zijn packages', () => {
    const s = stappen('build');
    expect(s[plek(s, 'Install dependencies')].tekst).toContain(
      'pnpm install --frozen-lockfile --filter "./${{ steps.map.outputs.dir }}..."',
    );
    const v = stappen('voorraad');
    expect(v[plek(v, 'Install dependencies')].tekst).toContain(
      'filter: ./${{ steps.map.outputs.dir }}...',
    );
  });
});
