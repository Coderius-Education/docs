/**
 * Pure helpers van de speeltuin-engine: functies zonder DOM, zonder Pyodide en
 * zonder module-state, zodat ze in vitest (node) te testen zijn. engine.js
 * re-exporteert alles wat callers al kenden (ensureAsync, detectMode), dus die
 * hoeven niet te veranderen.
 *
 * Twee helpers draaien óók bínnen de srcdoc-iframe. Die kan niets importeren,
 * dus staan ze hier daarnaast als string (`*_SNIPPET`) die de srcdoc-bouwers
 * letterlijk inplakken. De test in puur.test.ts evalueert elke snippet en legt
 * hem naast de functie hieronder, zodat de twee niet uit elkaar kunnen lopen.
 */

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

  if (!importLines.some((l) => /\basyncio\b/.test(l))) {
    importLines.push('import asyncio');
  }

  // Indent body and inject `await asyncio.sleep(0)` after while-loop headers.
  const indentedBody = [];
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    indentedBody.push(`    ${line}`);

    if (/^\s*while\s+.+:\s*(#.*)?$/.test(line)) {
      const nextLine = bodyLines[i + 1] || '';
      const match = nextLine.match(/^(\s+)/);
      const loopBodyIndent = match ? match[1] : '    ';
      indentedBody.push(`    ${loopBodyIndent}await asyncio.sleep(0)`);
    }
  }

  // The first body line lands at line (importLines.length + 3) in the
  // wrapped output (importLines + blank + 'async def main():' + body).
  // So a traceback line N maps back to user-code line (N - lineOffset).
  // Note: this is approximate — if the user had imports, they were hoisted
  // and the mapping for non-import lines is offset by (importLines + 2).
  const lineOffset = importLines.length + 2;

  return {
    code: [...importLines, '', 'async def main():', ...indentedBody, '', 'await main()'].join('\n'),
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
 * Map traceback line numbers back to the editor's line numbers. For play mode
 * is lineOffset 0 (geen herschrijving); voor pygame mode is het het aantal
 * regels dat ensureAsync vóór de gebruikerscode zet. Alleen regels van
 * `<jouw_code>` schuiven; regels uit `<bootstrap>` of de stdlib blijven staan.
 */
export function rewriteTraceback(msg, lineOffset) {
  if (!lineOffset) return msg;
  return msg.replace(/File "<jouw_code>", line (\d+)/g, (m, n) => {
    const corrected = Math.max(1, Number.parseInt(n, 10) - lineOffset);
    return `File "<jouw_code>", line ${corrected}`;
  });
}

/**
 * Dezelfde functie als JS-tekst voor in de srcdoc. Let op de dubbele backslash:
 * dit is een gewone string, dus `\\d` komt als `\d` in het document terecht.
 */
export const REWRITE_TRACEBACK_SNIPPET = `function rewriteTraceback(msg, lineOffset) {
  if (!lineOffset) return msg;
  return msg.replace(/File "<jouw_code>", line (\\d+)/g, (m, n) => {
    const corrected = Math.max(1, Number.parseInt(n, 10) - lineOffset);
    return 'File "<jouw_code>", line ' + corrected;
  });
}`;

/**
 * Accepteert alleen berichten die uit het venster komen dat de iframe host.
 * Een srcdoc-iframe heeft een opaque origin, dus `event.origin` is daar
 * nutteloos ('null'); `event.source` is wél betrouwbaar: het is het window-
 * object dat postMessage aanriep, en dat moet `window.parent` zijn. Elk ander
 * venster (een andere iframe op de pagina, een geopend tabblad) kon vóór deze
 * check willekeurige Python laten draaien.
 */
export function isBerichtVanOuder(event, parentWindow) {
  return !!event && !!parentWindow && event.source === parentWindow;
}

export const IS_BERICHT_VAN_OUDER_SNIPPET = `function isBerichtVanOuder(event, parentWindow) {
  return !!event && !!parentWindow && event.source === parentWindow;
}`;
