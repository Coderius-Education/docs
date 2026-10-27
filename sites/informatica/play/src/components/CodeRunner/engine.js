/**
 * Shared execution engine for running Python code in the browser via Pyodide.
 * Supports two modes: "pygame" (pure pygame-ce) and "play" (coderius-play library).
 */

// Deze versie hoort gelijk te lopen met PYODIDE_VERSION in
// packages/python-runner en met de `pyodide` in de catalog; een test in dat
// package houdt de drie naast elkaar. Play liep hier lang achter op 0.27.x
// (Python 3.12), omdat de physics-wheel alleen als cp312 bestond. Sinds pymunk
// 7.3.0 publiceert het project zelf een wasm-wheel voor Python 3.13, en die
// staat hieronder. Ga je hierin bumpen, dan moet de pymunk-wheel mee: zijn
// ABI-tag (pyemscripten_2025_0) hoort bij de abi_version van de Pyodide-versie.
export const PYODIDE_VERSION = '0.29.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;
// Eén regel per wheel: play-wheels.py, draai-play-blokken.py en de tests
// zoeken ze zo, en een build-tag met een lange branchnaam maakt hem lang.
// biome-ignore format: zie hierboven
const PYMUNK_WHEEL = '/whl/pymunk-7.3.1-cp313-cp313-pyemscripten_2025_0_wasm32.whl';
// biome-ignore format: zie hierboven
const PLAY_WHEEL = '/whl/coderius_play-3.5.0-0claudeinstallrequirementsv6n5yjee8fa53-py3-none-any.whl';

// De pure helpers (geen DOM, geen Pyodide) staan in puur.js zodat ze in node
// te testen zijn; callers importeren ze nog steeds vanaf hier.
import {
  IS_BERICHT_VAN_OUDER_SNIPPET,
  REWRITE_TRACEBACK_SNIPPET,
  detectMode,
  ensureAsync,
} from './puur';

import { siteBasis } from './sitebasis';
import { LAAD_WIELEN_SNIPPET } from './wielen';

export { detectMode, ensureAsync, isBerichtVanOuder, rewriteTraceback } from './puur';

/**
 * Detect which packages the code needs based on imports.
 */
function detectPackages(code, siteOrigin) {
  // pygame-ce and numpy are compiled Pyodide packages — load them via
  // pyodide.loadPackage so we get the exact versions Pyodide ships.
  // Installing them via micropip causes version conflicts because
  // coderius-play declares newer version requirements than Pyodide ships.
  const pyodidePackages = ['pygame-ce'];
  const micropipNoDepsPackages = [];

  const needsPymunk = /\bimport\s+pymunk\b|from\s+pymunk\s+import\b/.test(code);
  const needsPlay = /\bimport\s+play\b|from\s+play\s+import\b/.test(code);

  if (needsPlay) {
    pyodidePackages.push('numpy');
  }

  if (needsPymunk || needsPlay) {
    pyodidePackages.push('cffi');
    micropipNoDepsPackages.push(siteOrigin + PYMUNK_WHEEL);
  }

  if (needsPlay) {
    micropipNoDepsPackages.push(siteOrigin + PLAY_WHEEL);
  }

  return { pyodidePackages, micropipNoDepsPackages };
}

/**
 * Build the Python bootstrap for play mode.
 *
 * Sinds 3.5.0 draait play zelf in de browser: get_loop() neemt de loop van de
 * pagina, en start_program() plant het spel daarop in als taak en keert terug.
 * Tot en met 3.4 patchte deze bootstrap play.loop en verving hij
 * start_program door een eigen versie; daarmee zou hij nu het browserpad van
 * play omzeilen (de taken die stop_program() annuleert, het geluid dat bij
 * het stoppen ophoudt). Hij importeert play alleen nog vooraf, zodat de
 * eerste klik die tijd niet kost.
 */
function buildPlayBootstrap() {
  return `
import play
import importlib.metadata as _meta
print("coderius-play", _meta.version("coderius-play"))
`;
}

/**
 * Build a minimal srcDoc that only loads Pyodide + relevant packages,
 * without running any user code. Used to pre-warm the browser cache
 * (and the service worker cache) so that the first real Run is faster.
 *
 * `codes` is an array of all PygbagRunner code-strings on the current
 * page; the superset of needed packages is computed from them.
 */
export function buildPrewarmSrcDoc(codes) {
  const siteOrigin = siteBasis();
  const combined = codes.join('\n');
  const { pyodidePackages, micropipNoDepsPackages } = detectPackages(combined, siteOrigin);
  const pyodidePackagesCode = pyodidePackages.map((p) => `'${p}'`).join(', ');
  const wheelsCode = micropipNoDepsPackages.map((p) => `'${p}'`).join(', ');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
<script type="module">
${LAAD_WIELEN_SNIPPET}
try {
  const { loadPyodide } = await import('${PYODIDE_CDN}');
  // Parallel-load Pyodide's own packages with the WASM init.
  const pyodide = await loadPyodide({ packages: [${pyodidePackagesCode}] });
  const WHEELS = [${wheelsCode}];
  if (WHEELS.length) {
    await laadWielen(pyodide, WHEELS);
  }
  // Done — assets are now in the browser cache and SW cache.
} catch (err) {
  // Silent: prewarm is a best-effort optimisation.
  console.warn('PygbagRunner prewarm failed:', err);
}
</script>
</body></html>`;
}

/**
 * Build the HTML srcdoc for the execution iframe.
 * Uses Pyodide to run Python code with pygame-ce, pymunk, etc.
 *
 * @param {{ code: string, mode?: string, canvasWidth?: number, canvasHeight?: number }} opties
 */
export function buildSrcDoc({ code, mode = 'pygame', canvasWidth, canvasHeight }) {
  // Normalize line endings to LF and sanitize code.
  const sanitized = code
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<\/script>/gi, '<\\/script>');

  // Split bootstrap and user-code so each gets its own runPythonAsync call
  // with a meaningful filename — that way Python tracebacks show line numbers
  // relative to the user-code (matching the editor) instead of the combined
  // exec-string. For pygame mode the wrap shifts line numbers by lineOffset,
  // which we hand to the iframe so the traceback rewriter can correct them.
  let bootstrapCode = '';
  let userPythonCode = '';
  let lineOffset = 0;
  let ingevoegd = [];

  if (mode === 'play') {
    bootstrapCode = buildPlayBootstrap();
    userPythonCode = sanitized;
    if (!userPythonCode.includes('start_program')) {
      userPythonCode += '\nplay.start_program()';
    }
  } else {
    const wrapped = ensureAsync(sanitized);
    userPythonCode = wrapped.code;
    lineOffset = wrapped.lineOffset;
    ingevoegd = wrapped.ingevoegd;
  }

  // Escape backticks and backslashes for embedding in JS template literal
  const escapeForJs = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedBootstrap = escapeForJs(bootstrapCode);
  const escapedUserCode = escapeForJs(userPythonCode);

  // Determine which packages to install. Resolve origin now (in the parent
  // frame) since srcdoc iframes have an opaque origin (null).
  const siteOrigin = siteBasis();
  const { pyodidePackages, micropipNoDepsPackages } = detectPackages(sanitized, siteOrigin);
  // Pyodide's own packages can be loaded in parallel with the WASM init via
  // the `packages` option of loadPyodide() — saves ~1-2 sec per cold start.
  // URL wheels (pymunk, play) still need loadPackage() after init.
  const pyodidePackagesCode = pyodidePackages.map((p) => `'${p}'`).join(', ');
  const wheelsCode = micropipNoDepsPackages.map((p) => `'${p}'`).join(', ');

  const canvasStyle =
    canvasWidth && canvasHeight
      ? `width: ${canvasWidth}px; height: ${canvasHeight}px;`
      : 'max-height: 100%; width: auto;';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
  body { display: flex; flex-direction: column; }
  #canvas-wrap { flex: 1; min-height: 0; display: flex; justify-content: center; align-items: flex-start; overflow: hidden; }
  canvas { display: block; ${canvasStyle} }
  #console { background: #111; color: #cfc; font-family: monospace; font-size: 12px; padding: 4px 8px; min-height: 1.5em; max-height: 100px; overflow-y: auto; flex-shrink: 0; white-space: pre-wrap; word-break: break-all; }
  #console:empty::before { content: 'Console - output van print() verschijnt hier'; color: #666; font-style: italic; }
  .err { color: #f88; }
  #loading { color: #888; font-family: sans-serif; font-size: 14px; padding: 16px; }
</style>
</head>
<body>
<div id="loading">Python laden...</div>
<div id="canvas-wrap"><canvas id="canvas"></canvas></div>
<div id="console"></div>
<script type="module">
${LAAD_WIELEN_SNIPPET}
const loading = document.getElementById('loading');
const canvas = document.getElementById('canvas');
const consoleEl = document.getElementById('console');

function appendConsole(text, cls) {
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = text;
  consoleEl.appendChild(span);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Map traceback line numbers back to the editor's line numbers.
// For play mode lineOffset=0 (no rewrite). For pygame mode lineOffset
// equals the number of preamble lines added by ensureAsync.
const LINE_OFFSET = ${lineOffset};
const INGEVOEGD = [${ingevoegd.join(', ')}];
${REWRITE_TRACEBACK_SNIPPET}

try {
  loading.textContent = 'Runtime laden...';
  const { loadPyodide } = await import('${PYODIDE_CDN}');
  // Load Pyodide's own packages in parallel with the WASM init.
  const pyodide = await loadPyodide({ packages: [${pyodidePackagesCode}] });

  // Capture print() output and show it in the visible console panel
  pyodide.setStdout({ batched: (msg) => appendConsole(msg + '\\n') });
  pyodide.setStderr({ batched: (msg) => appendConsole(rewriteTraceback(msg, LINE_OFFSET, INGEVOEGD) + '\\n', 'err') });

  // Wire canvas for SDL2/Emscripten rendering
  pyodide.canvas.setCanvas2D(canvas);

  const WHEELS = [${wheelsCode}];
  if (WHEELS.length) {
    loading.textContent = 'Pakketten installeren...';
    await laadWielen(pyodide, WHEELS);
  }

  loading.style.display = 'none';
  window.parent.postMessage({ type: 'pyodide-ready' }, '*');

  const BOOTSTRAP = \`${escapedBootstrap}\`;
  const USER_CODE = \`${escapedUserCode}\`;
  if (BOOTSTRAP) {
    await pyodide.runPythonAsync(BOOTSTRAP, { filename: '<bootstrap>' });
  }
  await pyodide.runPythonAsync(USER_CODE, { filename: '<jouw_code>' });
} catch (err) {
  const rawMessage = String(err && err.message ? err.message : err);
  appendConsole(rewriteTraceback(rawMessage, LINE_OFFSET, INGEVOEGD) + '\\n', 'err');
  if (loading.style.display !== 'none') {
    loading.textContent = 'Fout - zie console';
    loading.style.color = '#f44';
  }
  console.error(err);
}
</script>
</body>
</html>`;
}

// --- Shared runner: one iframe per page, message-driven ---
//
// Instead of spawning a fresh iframe per click, SharedRunner keeps a single
// iframe alive that loads Pyodide once and listens for postMessage commands.
// Each PygbagRunner asks the shared iframe to run its code; subsequent runs
// skip the 5+ second Pyodide init.

const PYTHON_RESET = `\
async def __pygbag_reset():
    """Stop the running program and put play back in its starting state between runs.

    play.reset_program() doet het werk: hij annuleert de taken van play, laat
    ze hun finally afmaken en zet play terug zoals na import play, ook na een
    run die nooit startte. In de browser moet je erop wachten; een volgende
    run die eerder begint, weigert play. Een fout daarin gaat door naar de
    pagina, die hem in de console zet; het canvas wordt hoe dan ook zwart.
    draai-play-blokken.py speelt deze reset na tegen de wheel en controleert
    de eindstand.
    """
    import gc
    try:
        import play
    except ImportError:
        play = None
    try:
        if play is not None:
            await play.reset_program()
    finally:
        try:
            import pygame
            if pygame.display.get_init():
                s = pygame.display.get_surface()
                if s:
                    s.fill((0, 0, 0))
                    pygame.display.flip()
        except Exception: pass
        gc.collect()
`;

export function buildSharedRunnerSrcDoc(codes) {
  const siteOrigin = siteBasis();
  const combined = codes.join('\n');
  const { pyodidePackages, micropipNoDepsPackages } = detectPackages(combined, siteOrigin);
  const pyodidePackagesCode = pyodidePackages.map((p) => `'${p}'`).join(', ');
  const wheelsCode = micropipNoDepsPackages.map((p) => `'${p}'`).join(', ');

  // Pre-bake the play bootstrap if any of the codes need it. Avoids paying
  // its ~1s import cost on the first click.
  const needsPlay = /\bimport\s+play\b|from\s+play\s+import\b/.test(combined);
  const bootstrap = needsPlay ? buildPlayBootstrap() : '';
  const escapeForTemplate = (s) =>
    s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedBootstrap = escapeForTemplate(bootstrap);
  const escapedReset = escapeForTemplate(PYTHON_RESET);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
  body { display: flex; flex-direction: column; }
  #canvas-wrap { flex: 1; min-height: 0; display: flex; justify-content: center; align-items: flex-start; overflow: hidden; }
  canvas { display: block; max-height: 100%; width: auto; }
  #loading { color: #888; font-family: sans-serif; font-size: 14px; padding: 16px; }
</style>
</head>
<body>
<div id="loading">Python laden...</div>
<div id="canvas-wrap"><canvas id="canvas"></canvas></div>
<script type="module">
${LAAD_WIELEN_SNIPPET}
const loading = document.getElementById('loading');
const canvas = document.getElementById('canvas');

let CURRENT_OFFSET = 0;
let CURRENT_INGEVOEGD = [];
// Elk bericht naar de ouder draagt het requestId van de run die nu draait.
// stdout/stderr komen via setStdout/setStderr binnen zonder context, dus die
// krijgen het via deze variabele mee; de ouder negeert alles met een ander id
// (zie SharedRunner/routeer.js). Zonder dit lekte output van een gestopte run
// de console van de runner in die 'm had verdrongen.
let CURRENT_REQUEST = null;
let BOOT_ERROR = null;
${REWRITE_TRACEBACK_SNIPPET}
${IS_BERICHT_VAN_OUDER_SNIPPET}
function post(type, extra) {
  parent.postMessage(Object.assign({ type, requestId: CURRENT_REQUEST }, extra || {}), '*');
}

let pyodide = null;
let booting = (async () => {
  try {
    loading.textContent = 'Runtime laden...';
    const { loadPyodide } = await import('${PYODIDE_CDN}');
    pyodide = await loadPyodide({ packages: [${pyodidePackagesCode}] });

    pyodide.setStdout({ batched: (msg) => post('stdout', { text: msg + '\\n' }) });
    pyodide.setStderr({ batched: (msg) => post('stderr', { text: rewriteTraceback(msg, CURRENT_OFFSET, CURRENT_INGEVOEGD) + '\\n' }) });
    pyodide.canvas.setCanvas2D(canvas);

    const WHEELS = [${wheelsCode}];
    if (WHEELS.length) {
      loading.textContent = 'Pakketten installeren...';
      await laadWielen(pyodide, WHEELS);
    }

    const BOOTSTRAP = \`${escapedBootstrap}\`;
    if (BOOTSTRAP) {
      await pyodide.runPythonAsync(BOOTSTRAP, { filename: '<bootstrap>' });
    }
    await pyodide.runPythonAsync(\`${escapedReset}\`, { filename: '<reset>' });

    loading.style.display = 'none';
    post('iframe-ready');
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    BOOT_ERROR = msg;
    loading.textContent = 'Fout - zie console';
    loading.style.color = '#f44';
    // Nog geen run, dus geen requestId; de ouder negeert dit bericht. Elke
    // latere 'run' krijgt de fout alsnog, mét zijn eigen id (hieronder).
    post('error', { message: msg, fatal: true });
    console.error(err);
  }
})();

// Een pijltje of Page Down dat de iframe niet zelf gebruikt, kan een browser
// doorgeven aan de pagina, en dan scrolt die mee. pygame krijgt de toets toch:
// preventDefault houdt alleen het scrollen tegen. Spatie staat er bewust niet
// bij; zonder keypress krijgt een tekstveld van play geen spaties meer.
const SCROLTOETSEN = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
window.addEventListener('keydown', (e) => {
  if (SCROLTOETSEN.includes(e.key)) e.preventDefault();
}, true);

// Berichten één voor één: een run begint pas als de reset en de code van de
// vorige klaar zijn. Zonder rij liepen twee kliks tijdens het opstarten door
// elkaar, en tekende het tweede programma over het eerste heen.
let rij = Promise.resolve();
window.addEventListener('message', (e) => {
  if (!isBerichtVanOuder(e, window.parent)) return;
  if (!e.data || !e.data.type) return;
  if (e.data.type !== 'run' && e.data.type !== 'stop') return;
  const bericht = e.data;
  rij = rij.then(() => verwerk(bericht)).catch((err) => console.error(err));
});

// Een programma met een eigen lus (pygame) keert niet terug; daar wacht de
// rij niet langer op dan dit. Een play-programma is in milliseconden klaar.
const LANGSTE_WACHT_MS = 2000;

async function verwerk(bericht) {
  const { type, requestId } = bericht;

  await booting;
  if (!pyodide) {
    if (type === 'run') post('error', { requestId, message: BOOT_ERROR, fatal: true });
    return;
  }

  if (type === 'run') {
    const { code } = bericht;
    const offset = bericht.lineOffset || 0;
    const ingevoegd = bericht.ingevoegd || [];
    // Eerst het vorige programma afbreken, dan pas het nieuwe requestId
    // aannemen: wat het oude programma tijdens het afbreken nog print
    // (een finally, een laatste frame) hoort bij de oude run, niet bij
    // de nieuwe console.
    try { await pyodide.runPythonAsync('await __pygbag_reset()'); } catch (e) { console.error('__pygbag_reset:', e); }
    CURRENT_OFFSET = offset;
    CURRENT_INGEVOEGD = ingevoegd;
    CURRENT_REQUEST = requestId;
    const programma = pyodide.runPythonAsync(code, { filename: '<jouw_code>' }).then(
      () => post('run-done', { requestId }),
      (err) => {
        const msg = String(err && err.message ? err.message : err);
        post('error', { requestId, message: rewriteTraceback(msg, offset, ingevoegd) });
        console.error(err);
      },
    );
    await Promise.race([programma, new Promise((klaar) => setTimeout(klaar, LANGSTE_WACHT_MS))]);
  } else if (type === 'stop') {
    try { await pyodide.runPythonAsync('await __pygbag_reset()'); } catch (e) { console.error('__pygbag_reset:', e); }
    post('stopped', { requestId });
  }
}
</script>
</body>
</html>`;
}
