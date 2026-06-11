/**
 * Shared execution engine for running Python code in the browser via Pyodide.
 * Supports two modes: "pygame" (pure pygame-ce) and "play" (coderius-play library).
 */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.mjs';
const PYMUNK_WHEEL = '/whl/pymunk-7.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl';
const PLAY_WHEEL = '/whl/coderius_play-3.3.3-py3-none-any.whl';

/**
 * Ensure code has an async main loop for Pyodide compatibility.
 * Pyodide's webloop requires async code with `await asyncio.sleep(0)` in loops
 * so the browser event loop stays responsive.
 */
export function ensureAsync(code) {
  if (!code) return { code: '', lineOffset: 0 };

  // If the code already uses asyncio + await, assume it is ready.
  // But replace asyncio.run(main()) with await main() since
  // Pyodide's runPythonAsync already runs inside an asyncio event loop.
  if (code.includes('asyncio') && code.includes('await')) {
    return {
      code: code.replace(/asyncio\.run\s*\(\s*main\s*\(\s*\)\s*\)/, 'await main()'),
      lineOffset: 0,
    };
  }

  const lines = code.split('\n');
  const importLines = [];
  const bodyLines = [];

  // Only hoist top-level imports (no leading whitespace) to avoid
  // pulling imports from inside functions or conditionals.
  for (const line of lines) {
    if (/^(import |from )/.test(line)) {
      importLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  if (!importLines.some(l => /\basyncio\b/.test(l))) {
    importLines.push('import asyncio');
  }

  // Indent body and inject `await asyncio.sleep(0)` after while-loop headers.
  const indentedBody = [];
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    indentedBody.push('    ' + line);

    if (/^\s*while\s+.+:\s*(#.*)?$/.test(line)) {
      const nextLine = bodyLines[i + 1] || '';
      const match = nextLine.match(/^(\s+)/);
      const loopBodyIndent = match ? match[1] : '    ';
      indentedBody.push('    ' + loopBodyIndent + 'await asyncio.sleep(0)');
    }
  }

  // The first body line lands at line (importLines.length + 3) in the
  // wrapped output (importLines + blank + 'async def main():' + body).
  // So a traceback line N maps back to user-code line (N - lineOffset).
  // Note: this is approximate — if the user had imports, they were hoisted
  // and the mapping for non-import lines is offset by (importLines + 2).
  const lineOffset = importLines.length + 2;

  return {
    code: [
      ...importLines,
      '',
      'async def main():',
      ...indentedBody,
      '',
      'await main()',
    ].join('\n'),
    lineOffset,
  };
}

/**
 * Auto-detect execution mode from code content.
 */
export function detectMode(code) {
  if (/\bimport\s+play\b|from\s+play\s+import\b/.test(code)) return 'play';
  if (/\bimport\s+pygame\b|from\s+pygame\s+import\b/.test(code)) return 'pygame';
  return 'pygame';
}

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
 * Build the Python bootstrap that patches coderius-play's start_program
 * to work cooperatively with the browser event loop.
 */
function buildPlayBootstrap() {
  return `
import asyncio

# Patch play's event loop management BEFORE importing play.
# The play library calls asyncio.new_event_loop() in play/loop.py,
# which fails in Pyodide because socket.socketpair() is unsupported.
# We patch get_loop() to return Pyodide's existing webloop instead.
import play.loop as _play_loop
_original_loop = asyncio.get_event_loop()
_play_loop._loop = _original_loop
_play_loop._creator_pid = __import__('os').getpid()

import play
import importlib.metadata as _meta
print("coderius-play", _meta.version("coderius-play"))

def _browser_start_program():
    from play.callback import callback_manager, CallbackType
    from play.core import game_loop as _game_loop
    from play.globals import globals_list
    if globals_list.program_started:
        return
    globals_list.program_started = True
    globals_list.should_auto_start = False
    callback_manager.run_callbacks(CallbackType.WHEN_PROGRAM_START)
    # Keep a handle on the task so __pygbag_reset can cancel it between runs.
    globals_list._pygbag_task = asyncio.ensure_future(_game_loop())

play.start_program = _browser_start_program
play.api.utils.start_program = _browser_start_program
from play.globals import globals_list as _gl
_gl.start_program_fn = _browser_start_program
_gl.should_auto_start = False
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
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const combined = codes.join('\n');
  const { pyodidePackages, micropipNoDepsPackages } = detectPackages(combined, siteOrigin);
  const pyodidePackagesCode = pyodidePackages.map(p => `'${p}'`).join(', ');
  const wheelsCode = micropipNoDepsPackages.map(p => `'${p}'`).join(', ');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
<script type="module">
try {
  const { loadPyodide } = await import('${PYODIDE_CDN}');
  // Parallel-load Pyodide's own packages with the WASM init.
  const pyodide = await loadPyodide({ packages: [${pyodidePackagesCode}] });
  const WHEELS = [${wheelsCode}];
  if (WHEELS.length) {
    await pyodide.loadPackage(WHEELS);
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
 */
export function buildSrcDoc({ code, mode = 'pygame', canvasWidth, canvasHeight }) {
  // Normalize line endings to LF and sanitize code.
  const sanitized = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/<\/script>/gi, '<\\/script>');

  // Split bootstrap and user-code so each gets its own runPythonAsync call
  // with a meaningful filename — that way Python tracebacks show line numbers
  // relative to the user-code (matching the editor) instead of the combined
  // exec-string. For pygame mode the wrap shifts line numbers by lineOffset,
  // which we hand to the iframe so the traceback rewriter can correct them.
  let bootstrapCode = '';
  let userPythonCode = '';
  let lineOffset = 0;

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
  }

  // Escape backticks and backslashes for embedding in JS template literal
  const escapeForJs = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedBootstrap = escapeForJs(bootstrapCode);
  const escapedUserCode = escapeForJs(userPythonCode);

  // Determine which packages to install. Resolve origin now (in the parent
  // frame) since srcdoc iframes have an opaque origin (null).
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const { pyodidePackages, micropipNoDepsPackages } = detectPackages(sanitized, siteOrigin);
  // Pyodide's own packages can be loaded in parallel with the WASM init via
  // the `packages` option of loadPyodide() — saves ~1-2 sec per cold start.
  // URL wheels (pymunk, play) still need loadPackage() after init.
  const pyodidePackagesCode = pyodidePackages.map(p => `'${p}'`).join(', ');
  const wheelsCode = micropipNoDepsPackages.map(p => `'${p}'`).join(', ');

  const canvasStyle = canvasWidth && canvasHeight
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
function rewriteTraceback(msg) {
  if (!LINE_OFFSET) return msg;
  return msg.replace(/File "<jouw_code>", line (\\d+)/g, (m, n) => {
    const corrected = Math.max(1, parseInt(n, 10) - LINE_OFFSET);
    return 'File "<jouw_code>", line ' + corrected;
  });
}

try {
  loading.textContent = 'Runtime laden...';
  const { loadPyodide } = await import('${PYODIDE_CDN}');
  // Load Pyodide's own packages in parallel with the WASM init.
  const pyodide = await loadPyodide({ packages: [${pyodidePackagesCode}] });

  // Capture print() output and show it in the visible console panel
  pyodide.setStdout({ batched: (msg) => appendConsole(msg + '\\n') });
  pyodide.setStderr({ batched: (msg) => appendConsole(rewriteTraceback(msg) + '\\n', 'err') });

  // Wire canvas for SDL2/Emscripten rendering
  pyodide.canvas.setCanvas2D(canvas);

  const WHEELS = [${wheelsCode}];
  if (WHEELS.length) {
    loading.textContent = 'Pakketten installeren...';
    await pyodide.loadPackage(WHEELS);
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
  appendConsole(rewriteTraceback(rawMessage) + '\\n', 'err');
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
def __pygbag_reset():
    """Cancel the running game loop and reset play state between runs.

    No-op on fresh state (first run) — globals_list.reset() would otherwise
    overwrite display dimensions before play has a chance to initialise.
    """
    import gc
    try:
        from play.globals import globals_list
        if not globals_list.program_started:
            return
        task = getattr(globals_list, '_pygbag_task', None)
        if task is not None and not task.done():
            task.cancel()
        globals_list._pygbag_task = None
        # Clear pymunk Space — play.globals.reset() does NOT do this and the
        # Space is a module-level singleton in play.physics. Without this,
        # bodies from previous runs accumulate and corrupt the simulation.
        try:
            from play.physics import physics_space
            for shape in list(physics_space.shapes):
                try: physics_space.remove(shape)
                except Exception: pass
            for body in list(physics_space.bodies):
                try: physics_space.remove(body)
                except Exception: pass
        except Exception: pass
        # play's own reset() empties sprites_group/walls/controllers, resets backdrop, etc.
        globals_list.reset()
        # Walls were created once at module-import time and removed by the
        # shape/body cleanup above. Re-create them so the next run still has
        # invisible screen-edge walls to bounce off.
        try:
            from play.io.screen import create_walls
            create_walls()
        except Exception: pass
    except Exception: pass
    try:
        from play.callback import callback_manager
        if hasattr(callback_manager, 'callbacks'):
            cbs = callback_manager.callbacks
            if isinstance(cbs, dict):
                for v in cbs.values():
                    if hasattr(v, 'clear'): v.clear()
                    elif isinstance(v, list): v.clear()
    except Exception: pass
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
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const combined = codes.join('\n');
  const { pyodidePackages, micropipNoDepsPackages } = detectPackages(combined, siteOrigin);
  const pyodidePackagesCode = pyodidePackages.map(p => `'${p}'`).join(', ');
  const wheelsCode = micropipNoDepsPackages.map(p => `'${p}'`).join(', ');

  // Pre-bake the play bootstrap if any of the codes need it. Avoids paying
  // its ~1s import cost on the first click.
  const needsPlay = /\bimport\s+play\b|from\s+play\s+import\b/.test(combined);
  const bootstrap = needsPlay ? buildPlayBootstrap() : '';
  const escape = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedBootstrap = escape(bootstrap);
  const escapedReset = escape(PYTHON_RESET);

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
const loading = document.getElementById('loading');
const canvas = document.getElementById('canvas');

let CURRENT_OFFSET = 0;
function rewriteTraceback(msg) {
  if (!CURRENT_OFFSET) return msg;
  return msg.replace(/File "<jouw_code>", line (\\d+)/g, (m, n) => {
    const corrected = Math.max(1, parseInt(n, 10) - CURRENT_OFFSET);
    return 'File "<jouw_code>", line ' + corrected;
  });
}
function post(type, extra) { parent.postMessage(Object.assign({ type }, extra || {}), '*'); }

let pyodide = null;
let booting = (async () => {
  try {
    loading.textContent = 'Runtime laden...';
    const { loadPyodide } = await import('${PYODIDE_CDN}');
    pyodide = await loadPyodide({ packages: [${pyodidePackagesCode}] });

    pyodide.setStdout({ batched: (msg) => post('stdout', { text: msg + '\\n' }) });
    pyodide.setStderr({ batched: (msg) => post('stderr', { text: rewriteTraceback(msg) + '\\n' }) });
    pyodide.canvas.setCanvas2D(canvas);

    const WHEELS = [${wheelsCode}];
    if (WHEELS.length) {
      loading.textContent = 'Pakketten installeren...';
      await pyodide.loadPackage(WHEELS);
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
    loading.textContent = 'Fout - zie console';
    loading.style.color = '#f44';
    post('error', { message: msg, fatal: true });
    console.error(err);
  }
})();

window.addEventListener('message', async (e) => {
  if (!e.data || !e.data.type) return;
  const { type } = e.data;

  await booting;
  if (!pyodide) return;

  if (type === 'run') {
    const { code, lineOffset, requestId } = e.data;
    CURRENT_OFFSET = lineOffset || 0;
    try {
      try { await pyodide.runPythonAsync('__pygbag_reset()'); } catch (e) {}
      await pyodide.runPythonAsync(code, { filename: '<jouw_code>' });
      post('run-done', { requestId });
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      post('error', { requestId, message: rewriteTraceback(msg) });
      console.error(err);
    }
  } else if (type === 'stop') {
    try { await pyodide.runPythonAsync('__pygbag_reset()'); } catch (e) {}
    post('stopped', { requestId: e.data.requestId });
  }
});
</script>
</body>
</html>`;
}
