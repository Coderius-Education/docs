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
//   browser      de speeltuin van python in Chromium: als de python-site
//                gebouwd wordt, of scripts/rooktest-speeltuin.mjs verandert
//   terminal     de oefenterminal van linux in Chromium: als de linux-site
//                gebouwd wordt, of scripts/rooktest-linux.mjs verandert
//   schermen     de schermen van elke gebouwde cursus met tabbladen
//                (meet-selectie.js kiest daarin de lessen). Verandert de
//                meting zelf, dan elke cursus met tabbladen, helemaal; een
//                cursus die niet gebouwd wordt, komt dan uit de cache. Een
//                hele cursus meten meer runners naast elkaar (schermenMatrix).
//
// Vorm van changed.json (versie 1):
//
//   { versie, base, volledig, reden,
//     bestanden: { 'pad/van/bestand': [[start, eind], ...] },
//     sites: [id], ongewijzigd: [id], pakketten: ['sites/informatica/python'],
//     jobs: { test, checks, lint, tekst, crosslinks, browser, terminal },
//     schermen: { sites: [id], alles, viaPakket: { id: 'pad' } },
//     runners: { python: { draaien, alles }, ... },
//     tekst: { alles, bestanden: [pad] },
//     vitest: { alles, bestanden: [pad] } }
//
// Regelbereiken zijn 1-gebaseerd en inclusief. Een verwijderd bestand staat
// erin met een lege lijst; een binair bestand met HEEL_BESTAND.

const { heleSite } = require('./meet-selectie.js');

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
  // Welke browsers babel en autoprefixer bedienen: raakt de build van elke site.
  '.browserslistrc',
  '.gitignore',
  '.github/',
  'scripts/wijzigingen.mjs',
  'scripts/site-hash.mjs',
  'scripts/sites-json.mjs',
  'scripts/sites_registry.py',
  // Draait na elke site-build (de .gz en .br voor de hostingbackend).
  'scripts/comprimeer.mjs',
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
    'scripts/tekst-argumenten.mjs',
    'packages/shared/stijl.js',
  ],
  crosslinks: ['scripts/controleer-cross-links.mjs', 'scripts/links-in-bron.mjs'],
  // De rooktest van de speeltuin in Chromium (job `browser`). Die draait ook
  // als de python-site gebouwd wordt, dus bij elke wijziging aan de site of
  // aan packages/python-runner.
  browser: ['scripts/rooktest-speeltuin.mjs'],
  // De rooktest van de oefenterminal van linux in Chromium (job `terminal`):
  // ook als de linux-site gebouwd wordt.
  terminal: ['scripts/rooktest-linux.mjs'],
  // De meting van de schermen (job `schermen`). Verandert hij, dan meet hij
  // in elke cursus met tabbladen alle lessen, ook in een cursus die deze
  // wijziging niet bouwt: de job haalt die build uit de cache. Eerst mat hij
  // dan alleen de geraakte cursussen, en met alleen het script gewijzigd
  // geen enkele: de job viel weg en de check build was groen.
  schermen: [
    'scripts/meet-les-tabs.mjs',
    'scripts/meet-les-tabs-uitzonderingen.json',
    'packages/shared/meet-selectie.js',
  ],
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
    // De hulppagina loopt het blokken-script ook na (SITES in het script).
    leest: ['{site}/docs/', '{site}/src/pages/hulp.mdx'],
    alles: [
      'scripts/draai-python-blokken.py',
      'scripts/alleen.py',
      'packages/python-runner/src/turtle/module.ts',
      // Een andere Pyodide komt via de catalog en de lockfile (globaal).
      // Na CPython haalt de runner elk blok ook door de speeltuin zelf
      // (lessen-in-pyodide.test.ts); verandert die, dan alle blokken opnieuw.
      'packages/python-runner/src/PyodideProvider.ts',
      'packages/python-runner/src/pyodide-in-node.ts',
      'packages/python-runner/src/lessen-in-pyodide.test.ts',
    ],
  },
  algorithms: {
    site: 'algorithms',
    leest: ['{site}/docs/', '{site}/src/components/PyRunner/verborgen/'],
    alles: [
      'scripts/draai-python-blokken.py',
      'scripts/alleen.py',
      'packages/python-runner/src/turtle/module.ts',
      // De wheels bepalen de pins (numpy, matplotlib) en de Python-versie.
      '{site}/static/pyodide/',
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
    // Naast compileren draait elk blok met de echte leaphymicropython
    // (scripts/draai-leaphy-blokken.py); de commit staat in leaphy-api.json.
    alles: [
      ...COMPILEER,
      '{site}/src/lego-tests/schrijf.ts',
      '{site}/src/lego-tests/extract.ts',
      '{site}/src/lego-tests/leaphy-api.json',
      'scripts/draai-leaphy-blokken.py',
      'scripts/leaphy_nep/',
    ],
  },
  fullstack: {
    site: 'fullstack',
    // Naast de codeblokken draait de job het controlescript voor leerlingen
    // tegen het referentieproject en kapotte kopieën (src/controle/draai.py)
    // en de Gelukt-blokken van Veiligheid (src/gelukt/draai.py);
    // het eindproject met de uitbreidingen neemt static/htmx/htmx.min.js mee,
    // en sidebars.ts zegt welke les bij welk hoofdstuk hoort.
    leest: [
      '{site}/docs/',
      '{site}/sidebars.ts',
      '{site}/static/controleer.py',
      '{site}/static/htmx/',
      '{site}/src/controle/',
      '{site}/src/gelukt/',
    ],
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

// Runners met een eigen job in build.yml. De rest draait samen in de job
// `blokken`: vijf losse jobs maakten de eerste golf van een brede run groter
// dan de twintig runners die GitHub tegelijk geeft. Fullstack houdt een eigen
// job: zijn controlescript start twee processen per core, en naast de andere
// runners duurde het 90 s in plaats van een kleine minuut.
const EIGEN_JOB = ['fullstack'];

/** Moet de job `blokken` draaien: is een runner zonder eigen job nodig? */
const blokkenNodig = (p) =>
  Object.entries(p.runners).some(([naam, r]) => !EIGEN_JOB.includes(naam) && r.draaien);

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

/** Boven dit aantal gewijzigde bestanden draait alles (zie volledigOpNamen). */
const MAX_BESTANDEN = 400;

/**
 * Beslist op alleen de bestandsnamen of de run volledig moet: een globaal
 * bestand, of zoveel bestanden dat selecteren niets scheelt. Zo hoeft de
 * -U0-diff van een grote verhuizing (duizenden bestanden, honderden MB)
 * nooit ingelezen te worden; die liep eerder tegen de buffer van
 * execFileSync aan (ENOBUFS).
 *
 * @param {string[]} namen
 * @param {number} [max]
 * @returns {string | null} reden voor een volledige run, of null
 */
function volledigOpNamen(namen, max = MAX_BESTANDEN) {
  const globaal = namen.find(isGlobaal);
  if (globaal) return `globale wijziging (${globaal})`;
  if (namen.length > max) return `${namen.length} bestanden gewijzigd (meer dan ${max})`;
  return null;
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
 * Per geraakte cursus met tabbladen het eerste gewijzigde bestand in een
 * workspace-package waar hij van afhangt (niet de cursus zelf), zoals pnpm
 * hem geraakt noemt: elk bestand in zo'n package telt. Een package kan elke
 * les raken (de opmaak van de tabbladen, speling.ts), dus dan meet de job
 * `schermen` de hele cursus, ook als er daarnaast een les veranderde.
 *
 * @returns {Record<string, string>}
 */
function viaPakket({ paden, alleMappen, geraakt, sites, afhankelijkheden, metTabbladen }) {
  const siteMappen = new Set(sites.map((s) => s.dir));
  const uit = {};
  for (const { id, dir } of sites) {
    if (!metTabbladen.includes(id) || !geraakt.includes(dir)) continue;
    const deps = afhankelijkheden?.[id] ?? alleMappen.filter((d) => !siteMappen.has(d));
    const pad = paden.find((p) => {
      const pakket = pakketVan(p, alleMappen);
      return pakket && pakket !== dir && deps.includes(pakket) && geraakt.includes(pakket);
    });
    if (pad) uit[id] = pad;
  }
  return uit;
}

/** Een waarde van lesTabs die de tabbladen uit laat (createConfig kijkt of hij waar is). */
const ONWAAR = /^(?:false|null|undefined|0|''|""|``|void 0)$/;

/**
 * Zet deze docusaurus.config.ts de les-tabbladen aan? `createConfig` zet ze
 * aan bij elke ware `lesTabs` (`true`, `{ eenScherm: true }`); `lesTabs:
 * false` niet. De vorm `{ ...basis, lesTabs }` leest de waarde van de
 * variabele `lesTabs`. Een waarde die hier niet te lezen is (een
 * voorwaarde), telt als aan: een meting te veel is beter dan een cursus
 * waarvan de schermen stil niet gemeten worden.
 *
 * @param {string} bron
 * @returns {boolean}
 */
function heeftLesTabs(bron) {
  const code = bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const aan = (waarde) => !ONWAAR.test(waarde.trim().replace(/[,;]$/, '').trim());
  const sleutel = code.match(/\blesTabs\s*:\s*([^,}\n]*)/);
  if (sleutel) return aan(sleutel[1] || '{');
  // Verkort: `lesTabs,` of `lesTabs }` in een object.
  if (/[{,]\s*lesTabs\s*(?=[,}])/.test(code)) {
    const variabele = code.match(/\b(?:const|let|var)\s+lesTabs\s*=\s*([^;\n]*)/);
    return variabele ? aan(variabele[1] || '{') : true;
  }
  return false;
}

/**
 * De cursussen met les-tabbladen, in de volgorde van het register.
 *
 * @param {{id: string, dir: string}[]} sites
 * @param {(dir: string) => string | null} leesConfig  de docusaurus.config.ts
 *   van de map, of null als die er niet is (sites/home)
 * @returns {string[]}
 */
function cursussenMetTabbladen(sites, leesConfig) {
  return sites
    .filter(({ dir }) => {
      const bron = leesConfig(dir);
      return bron !== null && heeftLesTabs(bron);
    })
    .map(({ id }) => id);
}

/**
 * @param {object} invoer
 * @param {Record<string, [number, number][]>} invoer.bestanden  uit parseDiff
 * @param {string[]} invoer.geraakt  mappen van de packages die pnpm geraakt
 *   noemt (`--filter "...[base]"`): gewijzigd, of hangt af van iets gewijzigds
 * @param {string[]} invoer.alleMappen  mappen van alle workspace-packages
 * @param {{id: string, dir: string}[]} invoer.sites  alle sites uit de registry
 * @param {{pad: string, tekst: string}[]} invoer.tests  alle *.test.ts en *.test.tsx
 * @param {boolean} [invoer.volledig]  alles draaien (nightly, handmatig, geen base)
 * @param {string} [invoer.reden]
 * @param {string | null} [invoer.base]
 * @param {string[]} [invoer.metTabbladen]  de cursussen met les-tabbladen
 *   (cursussenMetTabbladen): hun schermen meet de job `schermen`
 * @param {Record<string, string[]>} [invoer.afhankelijkheden]  per cursus met
 *   tabbladen de workspace-packages waar hij van afhangt
 *   (workspaceAfhankelijkheden). Zonder: elk package dat geen site is.
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
  metTabbladen = [],
  afhankelijkheden,
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
      jobs: {
        test: true,
        checks: true,
        lint: true,
        tekst: true,
        crosslinks: true,
        browser: true,
        terminal: true,
      },
      schermen: {
        sites: alleIds.filter((id) => metTabbladen.includes(id)),
        alles: true,
        viaPakket: {},
      },
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

  // Python in scripts/ (ook in een submap, zoals scripts/leaphy_nep) en in de
  // scripts/ van een site: hun unittests (scripts/test_*.py) draaien in `test`.
  const pythonScripts = paden.some((p) =>
    /^(scripts\/.+|sites\/[^/]+\/[^/]+\/scripts\/[^/]+)\.py$/.test(p),
  );
  const crosslinks = geraakteSites.length > 0 || paden.some((p) => past(p, PER_JOB.crosslinks));
  const lint = paden.some((p) => past(p, PER_JOB.lint));
  const browser = geraakteSites.includes('python') || paden.some((p) => past(p, PER_JOB.browser));
  const terminal = geraakteSites.includes('linux') || paden.some((p) => past(p, PER_JOB.terminal));
  // De schermen van elke gebouwde cursus met tabbladen (meet-selectie.js
  // kiest daarin de lessen). Verandert de meting zelf, dan elke cursus met
  // tabbladen: ook een die deze wijziging niet bouwt (uit de cache).
  const schermenAlles = paden.some((p) => past(p, PER_JOB.schermen));
  const schermen = {
    sites: alleIds.filter(
      (id) => metTabbladen.includes(id) && (schermenAlles || geraakteSites.includes(id)),
    ),
    alles: schermenAlles,
    viaPakket: viaPakket({ paden, alleMappen, geraakt, sites, afhankelijkheden, metTabbladen }),
  };

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
      browser,
      terminal,
    },
    schermen,
    runners,
    tekst: { alles: tekstAlles, bestanden: tekstBestanden },
    vitest: { alles: vitestAlles, bestanden: [...vitestBestanden].sort() },
  };
}

/**
 * Zoveel lespagina's meet één runner van de job `schermen` in een paar
 * minuten. Een hele cursus op één runner kostte tot zestien minuten
 * (algoritmes, 284 pagina's), en de rest van CI was na drie minuten klaar.
 */
const LESSEN_PER_DEEL = 40;
/** Meer runners voor één cursus niet. */
const MAX_DELEN = 6;
/**
 * Meer delen samen niet: GitHub geeft twintig runners tegelijk, en naast de
 * delen draaien dan nog cross-links, browser, terminal en de staart van test.
 * Met 23 delen wachtte een deel van algoritmes anderhalve minuut op een
 * runner, en werd het het langste pad van de run.
 */
const MAX_SCHERMEN = 18;

/**
 * De matrix van de job `schermen`: per cursus één of meer delen. Een cursus
 * die helemaal gemeten wordt (heleSite in meet-selectie.js: het meetscript
 * veranderde, een package, een onderdeel, de nachtelijke run), verdeelt zijn
 * lessen over `delen` runners, elk met `--deel=<deel>/<delen>`. Wie alleen
 * een paar lessen veranderde, krijgt één runner. Zijn het samen meer dan
 * MAX_SCHERMEN, dan levert de cursus met de meeste delen er een in; de
 * grootste cursussen staan vooraan, zodat GitHub die het eerst start.
 *
 * @param {ReturnType<typeof plan>} p
 * @param {object} opties
 * @param {Record<string, string>} opties.siteMappen per id de map van de site
 * @param {Record<string, number>} opties.lesAantallen per id het aantal
 *   lespagina's (.md en .mdx in de docs-mappen)
 * @param {(pad: string) => string | null} [opties.leesBron]
 * @returns {{ site: string, deel: number, delen: number }[]}
 */
function schermenMatrix(p, { siteMappen, lesAantallen, leesBron }) {
  const per = p.schermen.sites.map((site) => {
    const heel = heleSite({ plan: p, site, siteMap: siteMappen[site], leesBron });
    const delen = heel
      ? Math.min(MAX_DELEN, Math.max(1, Math.ceil((lesAantallen[site] ?? 0) / LESSEN_PER_DEEL)))
      : 1;
    return { site, delen, lessen: lesAantallen[site] ?? 0 };
  });
  const totaal = () => per.reduce((som, c) => som + c.delen, 0);
  while (totaal() > MAX_SCHERMEN) {
    // De cursus met de meeste lessen per runner na het inleveren blijft het
    // langst bezig: lever in waar dat het minst kost.
    const kandidaten = per.filter((c) => c.delen > 1);
    if (!kandidaten.length) break;
    const kosten = (c) => c.lessen / (c.delen - 1);
    kandidaten.sort((a, b) => kosten(a) - kosten(b));
    kandidaten[0].delen -= 1;
  }
  return per
    .slice()
    .sort((a, b) => b.lessen / b.delen - a.lessen / a.delen)
    .flatMap(({ site, delen }) =>
      Array.from({ length: delen }, (_, i) => ({ site, deel: i + 1, delen })),
    );
}

/**
 * De sites waarvan de job `voorraad` de build in de cache zet: voor
 * cross-links elke ongewijzigde site, en voor `schermen` elke cursus die hij
 * meet maar die deze run niet bouwt. Zonder dat bouwde bij een cache-misser
 * elk deel van `schermen` de cursus zelf: zes keer algoritmes.
 *
 * @param {ReturnType<typeof plan>} p
 * @returns {string[]}
 */
function voorraadSites(p) {
  return p.ongewijzigd.filter((id) => p.jobs.crosslinks || p.schermen.sites.includes(id));
}

module.exports = {
  HEEL_BESTAND,
  GLOBAAL,
  PER_JOB,
  RUNNERS,
  EIGEN_JOB,
  blokkenNodig,
  parseDiff,
  overlapt,
  binnenWijziging,
  opGewijzigdeRegels,
  runnerAlles,
  isGlobaal,
  MAX_BESTANDEN,
  volledigOpNamen,
  workspaceAfhankelijkheden,
  heeftLesTabs,
  cursussenMetTabbladen,
  plan,
  LESSEN_PER_DEEL,
  MAX_DELEN,
  MAX_SCHERMEN,
  schermenMatrix,
  voorraadSites,
};
