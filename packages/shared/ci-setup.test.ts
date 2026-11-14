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
      'fullstack',
      'blokken',
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

// Elke site-build in CI krijgt zijn .gz en .br (scripts/comprimeer.mjs) vóór
// hij de cache in gaat of als artifact de deur uit. De cache heeft één sleutel
// per site-hash, en wie hem ook vult (de job `build`, `voorraad` of
// `browser`): de inhoud moet dezelfde zijn. Eerst comprimeerde `voorraad`
// niet, en kon `browser` een build zonder .br uit de cache halen; de rooktest
// sloeg de controle dan stil over.
describe('comprimeren na elke site-build', () => {
  const jobs = [...workflow.matchAll(/^ {2}([a-z-]+):$/gm)].map((m) => m[1]);
  const bouwt = (s: Stap) => /pnpm --filter "[^"]+" build/.test(s.tekst);

  it('er zijn zulke jobs', () => {
    expect(jobs.filter((job) => stappen(job).some(bouwt)).sort()).toEqual([
      'browser',
      'build',
      'schermen',
      'terminal',
      'voorraad',
    ]);
  });

  it('comprimeert na de build, en vóór de cache en de upload', () => {
    const fout: string[] = [];
    for (const job of jobs) {
      const v = stappen(job);
      const build = v.findIndex(bouwt);
      if (build === -1) continue;
      const comprimeer = v.findIndex(
        (s, i) => i >= build && s.tekst.includes('scripts/comprimeer.mjs'),
      );
      const weg = v.findIndex(
        (s, i) => i > build && /actions\/(cache\/save|upload-artifact)@/.test(s.uses),
      );
      if (comprimeer === -1) fout.push(`${job}: geen comprimeer.mjs na de build`);
      else if (weg !== -1 && weg < comprimeer)
        fout.push(`${job}: de build gaat weg vóór het comprimeren`);
    }
    expect(fout).toEqual([]);
  });

  it('de rooktest eist de .br', () => {
    const v = stappen('browser');
    expect(v[plek(v, 'De speeltuin in Chromium')].tekst).toContain('--eis-compressie');
  });

  it('een job die Chromium installeert, draait op een vaste Ubuntu', () => {
    // Playwright installeert Chromium alleen op de Ubuntu-versies die het
    // kent. Toen ubuntu-latest naar 26.04 ging, faalde de job browser op
    // "Playwright does not support chromium on ubuntu26.04-x64".
    const jobs = workflow.split(/\n {2}(?=[a-z-]+:\n)/).slice(1);
    const fout = jobs
      .filter((blok) => blok.includes('playwright install'))
      .filter((blok) => !/^ {4}runs-on: ubuntu-\d{2}\.\d{2}$/m.test(blok))
      .map((blok) => blok.slice(0, blok.indexOf(':')));
    expect(fout).toEqual([]);
  });
});

// Een job die een gebouwde site in Chromium opent, krijgt de build van deze
// run als die site gebouwd is, en anders uit de cache van een eerdere build
// (de sleutel van scripts/site-hash.mjs, dezelfde als in `build`), en anders
// bouwt hij hem zelf. De job `schermen` haalde eerst alleen het artifact op:
// met alleen het meetscript gewijzigd was er geen, en viel de job weg.
describe('een site in de browser: artifact, cache of zelf bouwen', () => {
  const sleutel = (site: string) =>
    `site-\${{ runner.os }}-${site}-$(node scripts/site-hash.mjs ${site})`;
  const s = stappen('build');
  const inBuild = s[plek(s, 'Map en cache-sleutel')].tekst;

  it.each([
    ['browser', 'python'],
    ['terminal', 'linux'],
    ['schermen', '${{ matrix.site }}'],
  ])('%s', (job, site) => {
    const v = stappen(job);
    expect(inBuild).toContain(sleutel('${{ matrix.site }}'));
    const map = plek(v, 'Map en cache-sleutel');
    expect(map, `${job}: de sleutel`).toBeGreaterThan(-1);
    expect(v[map].tekst).toContain(sleutel(site));
    const artifact = v.findIndex(
      (st) => st.uses.startsWith('actions/download-artifact@') && st.tekst.includes('-gebouwd'),
    );
    const cache = v.findIndex((st) => st.uses.startsWith('actions/cache/restore@'));
    const build = v.findIndex((st) => /pnpm --filter "[^"]+" build/.test(st.tekst));
    expect(artifact, `${job}: het artifact`).toBeGreaterThan(map);
    expect(v[artifact].if).toBe("env.GEBOUWD == 'true'");
    expect(cache, `${job}: de cache`).toBeGreaterThan(artifact);
    expect(v[cache].if).toBe("env.GEBOUWD != 'true'");
    expect(v[cache].tekst).toContain('key: ${{ steps.map.outputs.sleutel }}');
    expect(build, `${job}: zelf bouwen`).toBeGreaterThan(cache);
    expect(v[build].if).toBe("env.GEBOUWD != 'true' && steps.cache.outputs.cache-hit != 'true'");
    // GEBOUWD: staat de site in de lijst die de job build bouwt?
    const begin = workflow.indexOf(`\n  ${job}:\n`);
    const kop = workflow.slice(begin, workflow.indexOf('\n    steps:\n', begin));
    expect(kop).toContain(
      `GEBOUWD: \${{ contains(fromJSON(needs.plan.outputs.sites), ${site.startsWith('$') ? 'matrix.site' : `'${site}'`}) }}`,
    );
  });
});

// De git waartegen de git-simulator wordt gelegd (echte-git.test.ts). Zijn
// cache kende het image niet: na de overstap van ubuntu-latest naar een
// nieuwe Ubuntu kwam er een git uit die tegen de bibliotheken van de oude
// gelinkt was. En actions/cache bewaart pas aan het eind van een geslaagde
// job, dus na een rode test bouwde elke run de git opnieuw.
describe('de eigen git van de job test', () => {
  const v = stappen('test');
  const begin = workflow.indexOf('\n  test:\n');
  const kop = workflow.slice(begin, workflow.indexOf('\n    steps:\n', begin));

  it('zet GIT_VERSIE voor de hele job, zodat de test hem ziet', () => {
    expect(kop).toMatch(/^ {4}env:\n(?: {6}#.*\n)* {6}GIT_VERSIE: '\d+\.\d+\.\d+'$/m);
    const test = v[plek(v, 'Test (nakijker')];
    expect(test.tekst).not.toMatch(/GIT_VERSIE:/);
  });

  it('de cache-sleutel noemt het image, niet zijn wekelijkse versie', () => {
    const sleutel = v[plek(v, 'Cache-sleutel van git')];
    expect(sleutel.tekst).toContain(
      'echo "sleutel=git-${RUNNER_OS}-${ImageOS}-${GIT_VERSIE}" >> "$GITHUB_OUTPUT"',
    );
    expect(sleutel.tekst.match(/^\s*run: .*$/m)?.[0]).not.toContain('ImageVersion');
  });

  it('haalt op met cache/restore en bewaart meteen na het bouwen met cache/save', () => {
    const ophalen = plek(v, 'uit de cache');
    const bouwen = plek(v, 'bouwen (niet in de cache)');
    const bewaren = v.findIndex((st) => / in de cache$/.test(st.name) && !st.name.includes('niet'));
    expect(v[ophalen].uses).toBe('actions/cache/restore@v5');
    expect(v[ophalen].tekst).toContain('key: ${{ steps.git-sleutel.outputs.sleutel }}');
    expect(bouwen).toBe(ophalen + 1);
    expect(bewaren).toBe(bouwen + 1);
    expect(v[bewaren].uses).toBe('actions/cache/save@v5');
    expect(v[bewaren].if).toBe("steps.git-cache.outputs.cache-hit != 'true'");
    expect(v[bewaren].tekst).toContain('key: ${{ steps.git-sleutel.outputs.sleutel }}');
    expect(v[bewaren].tekst).toContain('path: ~/git-vast');
    expect(
      v.filter((st) => st.uses === 'actions/cache@v5' && st.tekst.includes('git-vast')),
    ).toEqual([]);
  });
});

// Een hele cursus op één runner meten kostte tot zestien minuten. Het plan
// verdeelt hem in delen (schermenMatrix in wijzigingen.js); zonder `--deel`
// zou elke runner van de matrix toch de hele cursus meten.
describe('de job schermen meet in delen', () => {
  const begin = workflow.indexOf('\n  schermen:\n');
  const job = workflow.slice(begin, workflow.indexOf('\n    steps:\n', begin));

  it('de matrix komt uit het plan, met site, deel en delen', () => {
    expect(job).toContain('include: ${{ fromJSON(needs.plan.outputs.schermen) }}');
    expect(job).toContain('${{ matrix.deel }}/${{ matrix.delen }}');
  });

  it('een cursus uit de cache bouwt voorraad één keer, niet elk deel', () => {
    expect(job).toMatch(/needs: \[plan, build, voorraad\]/);
    const voorraad = workflow.slice(workflow.indexOf('\n  voorraad:\n'));
    expect(voorraad.slice(0, 400)).toContain('fromJSON(needs.plan.outputs.voorraad)');
  });

  it('het meetscript krijgt zijn deel', () => {
    const v = stappen('schermen');
    expect(v[plek(v, 'De schermen van')].tekst).toContain(
      '--deel=${{ matrix.deel }}/${{ matrix.delen }}',
    );
  });
});
