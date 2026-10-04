// Wat moet CI controleren na deze wijziging? De pure logica achter
// scripts/wijzigingen.mjs (de plan-job), los van git en pnpm zodat hij te
// testen is (wijzigingen.test.ts).
//
// De plan-job zet de uitkomst in changed.json. Elke job leest dat bestand en
// doet alleen wat de wijziging raakt:
//
//   build        alleen de sites die geraakt zijn (de map zelf, of een
//                workspace-package waar de site van afhangt; dat zegt pnpm)
//   test         vitest related op de gewijzigde code, plus de tests die
//                lestekst lezen van een site waarin iets veranderde
//   tekst        alleen gewijzigde lespagina's, en alleen meldingen op
//                gewijzigde regels (`--regels changed.json`)
//   blokrunners  alleen codeblokken waarvan een regel veranderde, plus de
//                blokken die erop doorbouwen (`--alleen changed.json`)
//
// Vorm van changed.json (versie 1):
//
//   { versie, base, volledig, reden,
//     bestanden: { 'pad/van/bestand': [[start, eind], ...] },
//     sites: [id], ongewijzigd: [id], pakketten: ['sites/informatica/python'],
//     jobs: { test, checks, lint, tekst, crosslinks },
//     runners: { python: { draaien, alles }, ... },
//     tekst: { alles, bestanden: [pad] },
//     vitest: { alles, bestanden: [pad] } }
//
// Regelbereiken zijn 1-gebaseerd en inclusief. Een verwijderd bestand staat
// erin met een lege lijst; een binair bestand met HEEL_BESTAND.

/** Een bereik dat elke regel van een bestand dekt. */
const HEEL_BESTAND = [1, 1_000_000_000];

/**
 * Bestanden die alles raken: de toolchain, de workflow zelf, en de scripts
 * waar elke job doorheen loopt (de registry en deze planner). Een fout hier
 * is niet aan één site toe te wijzen, dus dan draait CI volledig.
 */
const GLOBAAL = [
  'pnpm-lock.yaml',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  '.npmrc',
  '.nvmrc',
  '.gitignore',
  '.github/',
  'scripts/wijzigingen.mjs',
  'scripts/site-hash.mjs',
  'scripts/sites-json.mjs',
  'scripts/sites_registry.py',
  'packages/shared/wijzigingen.js',
  'packages/shared/sites.js',
];

/**
 * Bestanden die één job helemaal laten draaien, maar verder niets raken: een
 * nieuw woord in de woordenlijst kan alleen een spelmelding veranderen, niet
 * een build.
 */
const PER_JOB = {
  vitest: ['vitest.config.ts', 'vitest.setup.ts'],
  lint: ['biome.json'],
  tekst: [
    'cspell.json',
    'cspell-woorden.txt',
    'scripts/controleer-tekst.mjs',
    'scripts/controleer-tekst-alles.mjs',
    'packages/shared/stijl.js',
  ],
  crosslinks: ['scripts/controleer-cross-links.mjs'],
};

const COMPILEER = [
  'scripts/compileer-blokken.py',
  'scripts/alleen.py',
  'packages/shared/codeblokken.js',
  'packages/shared/voorkennis.js',
];

/**
 * De codeblok-runners. `leest`: wat de runner uit de site haalt; een wijziging
 * daar laat de runner draaien, beperkt tot de geraakte blokken. `alles`: de
 * runner zelf en zijn extractie; een wijziging daar laat hem elk blok doen.
 * Een pad dat op '/' eindigt is een map. `{site}` is de map van de site.
 */
const RUNNERS = {
  python: {
    site: 'python',
    leest: ['{site}/docs/'],
    alles: [
      'scripts/draai-python-blokken.py',
      'scripts/alleen.py',
      'packages/python-runner/src/turtle/module.ts',
      '{site}/static/pyodide/pyodide-lock.json',
    ],
  },
  algorithms: {
    site: 'algorithms',
    leest: ['{site}/docs/', '{site}/src/components/PyRunner/verborgen/'],
    alles: [
      'scripts/draai-python-blokken.py',
      'scripts/alleen.py',
      'packages/python-runner/src/turtle/module.ts',
      '{site}/static/pyodide/pyodide-lock.json',
    ],
  },
  play: {
    site: 'play',
    leest: ['{site}/docs/'],
    alles: [
      'scripts/draai-play-blokken.py',
      'scripts/alleen.py',
      '{site}/src/components/CodeRunner/engine.js',
      '{site}/static/whl/',
    ],
  },
  robotica: {
    site: 'robotica',
    leest: [
      '{site}/docs/',
      '{site}/src/pages/',
      '{site}/lego_auto/',
      '{site}/src/components/WebMicroEditor/templates.ts',
    ],
    alles: [...COMPILEER, '{site}/src/lego-tests/schrijf.ts', '{site}/src/lego-tests/extract.ts'],
  },
  fullstack: {
    site: 'fullstack',
    leest: ['{site}/docs/'],
    alles: [...COMPILEER, '{site}/src/code-tests/schrijf.ts'],
  },
  godot: {
    site: 'godot',
    leest: ['{site}/docs/', '{site}/src/pages/'],
    alles: [
      'packages/shared/voorkennis.js',
      '{site}/godot-tests/',
      '{site}/src/godot-tests/extract.ts',
      '{site}/src/godot-tests/schrijf.ts',
      '{site}/src/godot-tests/labels.ts',
      // Het Global-autoload komt uit deze les; elk script dat Global gebruikt
      // compileert ertegen.
      '{site}/docs/07-signals-en-score/global_variables.md',
    ],
  },
};

const CODE = /\.(?:[cm]?[jt]sx?)$/;
const LESBESTAND = /^sites\/[^/]+\/[^/]+\/(?:docs|src\/pages)\/.*\.mdx?$/;
const LEEST_BESTANDEN = /readFileSync|readdirSync|readFile\b|readdir\b|globSync|alleLesbestanden/;
const LEEST_ANDERE_SITES =
  /siteDir\(|alleSiteMappen|siteMappenOpSchijf|\bSITES\b|sites\/(?:informatica|wo|home)\b|(?:\.\.\/){3,}/;

// ── Diff ────────────────────────────────────────────────────────────────────

/**
 * `git diff -U0 --no-renames` → { pad: [[start, eind], ...] } in de nieuwe
 * versie van elk bestand.
 *
 * Een hunk die alleen regels weghaalt (`+c,0`) heeft in de nieuwe versie geen
 * regels. Hij ligt tussen regel c en c+1, en die twee buren tellen als
 * gewijzigd: een codeblok waar een regel uit verdween is veranderd. Een
 * verwijderd bestand krijgt een lege lijst, een binair bestand HEEL_BESTAND.
 *
 * @param {string} diff
 * @returns {Record<string, [number, number][]>}
 */
function parseDiff(diff) {
  /** @type {Record<string, [number, number][]>} */
  const uit = {};
  let oud = null;
  let huidig = null;
  for (const regel of diff.split('\n')) {
    if (regel.startsWith('diff --git ')) {
      huidig = null;
      oud = null;
      // Voor bestanden zonder ---/+++ (binair, alleen een modus) staat het pad
      // alleen hier. Zonder renames is a/ gelijk aan b/.
      const m = regel.match(/^diff --git "?a\/(.+?)"? "?b\/(.+?)"?$/);
      if (m) {
        oud = m[2];
        uit[oud] ??= [];
      }
      continue;
    }
    if (regel.startsWith('--- ')) continue;
    if (regel.startsWith('+++ ')) {
      const pad = regel.slice(4);
      if (pad === '/dev/null') {
        // Verwijderd: de lijst blijft leeg.
        huidig = null;
      } else {
        huidig = pad.replace(/^"?b\//, '').replace(/"$/, '');
        uit[huidig] ??= [];
      }
      continue;
    }
    if (regel.startsWith('Binary files ') && oud) {
      if (!/ and \/dev\/null differ$/.test(regel)) uit[oud] = [[...HEEL_BESTAND]];
      continue;
    }
    const hunk = regel.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk && huidig) {
      const start = Number(hunk[1]);
      const aantal = hunk[2] === undefined ? 1 : Number(hunk[2]);
      uit[huidig].push(
        aantal === 0 ? [Math.max(start, 1), start + 1] : [start, start + aantal - 1],
      );
    }
  }
  return uit;
}

// ── Overlap ─────────────────────────────────────────────────────────────────

/** Raakt [start, eind] een van de bereiken? */
function overlapt(bereiken, start, eind = start) {
  return (bereiken ?? []).some(([s, e]) => s <= eind && start <= e);
}

/**
 * Valt [start, eind] van dit bestand binnen een wijziging? Altijd waar als CI
 * volledig draait.
 *
 * @param {{volledig?: boolean, bestanden?: Record<string, [number, number][]>}} gewijzigd
 * @param {string} pad  relatief aan de repo-root, met forward slashes
 */
function binnenWijziging(gewijzigd, pad, start, eind = start) {
  if (gewijzigd.volledig) return true;
  return overlapt(gewijzigd.bestanden?.[pad], start, eind);
}

/**
 * Alleen de meldingen die een gewijzigde regel raken. Een melding over meer
 * regels (`eind`, zoals een lange zin of een alinea) telt als één ervan
 * gewijzigd is. Voor de tekst-job: `--regels` in controleer-tekst.mjs.
 *
 * @template {{regel: number, eind?: number}} M
 * @param {M[]} meldingen
 * @param {[number, number][] | undefined} bereiken
 * @returns {M[]}
 */
function opGewijzigdeRegels(meldingen, bereiken) {
  return meldingen.filter((m) => overlapt(bereiken, m.regel, m.eind ?? m.regel));
}

/** Moet deze runner elk blok doen (volledig, of zijn eigen code veranderde)? */
function runnerAlles(gewijzigd, naam) {
  return Boolean(gewijzigd.volledig || gewijzigd.runners?.[naam]?.alles);
}

/** Zit `pad` onder een van de patronen (een map eindigt op '/')? */
function past(pad, patronen) {
  return patronen.some((p) => (p.endsWith('/') ? pad.startsWith(p) : pad === p));
}

function isGlobaal(pad) {
  return past(pad, GLOBAAL);
}

// ── Workspace-afhankelijkheden ──────────────────────────────────────────────

/**
 * Alle workspace-packages waar `dir` van afhangt, transitief, plus `dir`
 * zelf. `pakketten` is { dir: { naam, deps: [naam] } }; deps zijn de namen
 * van de workspace-dependencies (alles met een `workspace:`-versie).
 *
 * @param {Record<string, {naam: string, deps: string[]}>} pakketten
 * @param {string} dir
 * @returns {string[]} gesorteerde mappen
 */
function workspaceAfhankelijkheden(pakketten, dir) {
  const dirVan = new Map(Object.entries(pakketten).map(([d, p]) => [p.naam, d]));
  const gezien = new Set();
  const stapel = [dir];
  while (stapel.length) {
    const d = stapel.pop();
    if (gezien.has(d)) continue;
    gezien.add(d);
    for (const naam of pakketten[d]?.deps ?? []) {
      const dep = dirVan.get(naam);
      if (dep && !gezien.has(dep)) stapel.push(dep);
    }
  }
  return [...gezien].sort();
}

// ── Het plan ────────────────────────────────────────────────────────────────

function vulSite(patronen, siteMap) {
  return patronen.map((p) => p.replace('{site}', siteMap));
}

function pakketVan(pad, pakketMappen) {
  // De diepste map wint: sites/informatica/python, niet sites/.
  let beste;
  for (const dir of pakketMappen) {
    if ((pad === dir || pad.startsWith(`${dir}/`)) && (!beste || dir.length > beste.length)) {
      beste = dir;
    }
  }
  return beste;
}

/**
 * @param {object} invoer
 * @param {Record<string, [number, number][]>} invoer.bestanden  uit parseDiff
 * @param {string[]} invoer.geraakt  mappen van de packages die pnpm geraakt
 *   noemt (`--filter "...[base]"`): gewijzigd, of hangt af van iets gewijzigds
 * @param {string[]} invoer.alleMappen  mappen van alle workspace-packages
 * @param {{id: string, dir: string}[]} invoer.sites  alle sites uit de registry
 * @param {{pad: string, tekst: string}[]} invoer.tests  alle *.test.ts
 * @param {boolean} [invoer.volledig]  alles draaien (nightly, handmatig, geen base)
 * @param {string} [invoer.reden]
 * @param {string | null} [invoer.base]
 */
function plan({
  bestanden,
  geraakt,
  alleMappen,
  sites,
  tests,
  volledig = false,
  reden = '',
  base = null,
}) {
  const paden = Object.keys(bestanden).sort();
  const bestaat = (p) => bestanden[p].length > 0;

  if (!volledig) {
    const globaal = paden.filter(isGlobaal);
    if (globaal.length) {
      volledig = true;
      reden = `globaal bestand gewijzigd: ${globaal.join(', ')}`;
    }
  }

  // Vangnet: een bestand in een package dat pnpm níet geraakt noemt, is een
  // fout in de planner of in pnpm (bv. een git-worktree, waar pnpm niets
  // vindt). Een gemiste build is erger dan een te veel, dus dan alles.
  if (!volledig) {
    const gemist = paden.filter((p) => {
      const dir = pakketVan(p, alleMappen);
      return dir && !geraakt.includes(dir);
    });
    if (gemist.length) {
      volledig = true;
      reden = `pnpm noemt het package van ${gemist[0]} niet geraakt; voor de zekerheid alles`;
    }
  }

  const alleIds = sites.map((s) => s.id);
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.dir]));

  if (volledig) {
    return {
      versie: 1,
      base,
      volledig: true,
      reden: reden || 'volledige run',
      bestanden,
      sites: alleIds,
      ongewijzigd: [],
      pakketten: [...alleMappen].sort(),
      jobs: { test: true, checks: true, lint: true, tekst: true, crosslinks: true },
      runners: Object.fromEntries(
        Object.keys(RUNNERS).map((n) => [n, { draaien: true, alles: true }]),
      ),
      tekst: { alles: true, bestanden: [] },
      vitest: { alles: true, bestanden: [] },
    };
  }

  const geraakteSites = sites.filter((s) => geraakt.includes(s.dir)).map((s) => s.id);
  const ongewijzigd = alleIds.filter((id) => !geraakteSites.includes(id));

  // ── tekst
  const tekstAlles = paden.some((p) => past(p, PER_JOB.tekst));
  const tekstBestanden = paden.filter((p) => LESBESTAND.test(p) && bestaat(p));

  // ── vitest
  const vitestAlles = paden.some((p) => past(p, PER_JOB.vitest));
  const vitestBestanden = new Set();
  if (!vitestAlles) {
    const leest = tests.filter((t) => LEEST_BESTANDEN.test(t.tekst));
    const kruis = leest.filter((t) => LEEST_ANDERE_SITES.test(t.tekst));
    for (const p of paden) {
      if (CODE.test(p) && bestaat(p)) vitestBestanden.add(p);
      // Tests die bestanden lezen in plaats van ze te importeren, ziet
      // `vitest related` niet: een les is geen import. Die van het package
      // zelf, de guards die over alle sites of de hele repo lopen, en elke
      // test die het bestand bij naam noemt (de schrijfgids, een
      // pyodide-lock), doen dus mee.
      const naam = p.split('/').pop() ?? p;
      if (!CODE.test(p) && naam.length >= 8) {
        for (const t of leest) if (t.tekst.includes(naam)) vitestBestanden.add(t.pad);
      }
      const dir = pakketVan(p, alleMappen);
      if (dir) for (const t of leest) if (t.pad.startsWith(`${dir}/`)) vitestBestanden.add(t.pad);
      if (dir || !CODE.test(p)) for (const t of kruis) vitestBestanden.add(t.pad);
    }
  }

  // ── runners
  const runners = {};
  for (const [naam, r] of Object.entries(RUNNERS)) {
    const map = siteMap[r.site];
    const alles = paden.some((p) => past(p, vulSite(r.alles, map)));
    const leest = vulSite(r.leest, map);
    const raak = paden.some((p) => bestaat(p) && past(p, leest));
    runners[naam] = { draaien: alles || raak, alles };
  }

  const pythonScripts = paden.some((p) => /^scripts\/[^/]+\.py$/.test(p));
  const crosslinks = geraakteSites.length > 0 || paden.some((p) => past(p, PER_JOB.crosslinks));
  const lint = paden.some((p) => past(p, PER_JOB.lint));

  return {
    versie: 1,
    base,
    volledig: false,
    reden: reden || 'incrementeel',
    bestanden,
    sites: geraakteSites,
    ongewijzigd,
    pakketten: alleMappen.filter((d) => geraakt.includes(d)).sort(),
    jobs: {
      test: vitestAlles || vitestBestanden.size > 0 || pythonScripts,
      checks: paden.length > 0,
      lint,
      tekst: tekstAlles || tekstBestanden.length > 0,
      crosslinks,
    },
    runners,
    tekst: { alles: tekstAlles, bestanden: tekstBestanden },
    vitest: { alles: vitestAlles, bestanden: [...vitestBestanden].sort() },
  };
}

module.exports = {
  HEEL_BESTAND,
  GLOBAAL,
  PER_JOB,
  RUNNERS,
  parseDiff,
  overlapt,
  binnenWijziging,
  opGewijzigdeRegels,
  runnerAlles,
  isGlobaal,
  workspaceAfhankelijkheden,
  plan,
};
