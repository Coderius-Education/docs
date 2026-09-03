import { describe, expect, it } from 'vitest';
import {
  PYODIDE_VERSION,
  buildPrewarmSrcDoc,
  buildSharedRunnerSrcDoc,
  buildSrcDoc,
} from './engine';
import {
  IS_BERICHT_VAN_OUDER_SNIPPET,
  REWRITE_TRACEBACK_SNIPPET,
  detectMode,
  ensureAsync,
  isBerichtVanOuder,
  rewriteTraceback,
} from './puur';

// De engine-helpers zaten tot nu toe ongetest in engine.js, en het script in
// de gedeelde iframe accepteerde elk `message`-event: niets keek naar
// `event.source`, dus elk venster op de pagina (een andere iframe, een
// geopend tabblad) kon `{type: 'run', code: …}` sturen en willekeurige Python
// laten draaien. De ontvanger staat in een srcdoc-string en kan niets
// importeren; daarom staat het predicaat in puur.js als functie én als
// snippet, en legt deze test die twee naast elkaar. Dezelfde constructie
// geldt voor de traceback-herschrijver. Verder pint dit bestand het gedrag
// van ensureAsync en detectMode, en dat elke srcdoc-bouwer Pyodide van de
// CDN met PYODIDE_VERSION laadt en de wheels via loadPackage binnenhaalt.

/** Evalueert een snippet zoals de iframe dat doet en geeft de functie terug. */
function uitSnippet<T>(snippet: string, naam: string): T {
  return new Function(`${snippet}\nreturn ${naam};`)() as T;
}

describe('isBerichtVanOuder', () => {
  const ouder = { naam: 'parent' };
  const vreemd = { naam: 'ander venster' };

  it('accepteert een bericht waarvan source het oudervenster is', () => {
    expect(isBerichtVanOuder({ source: ouder }, ouder)).toBe(true);
  });

  it('weigert een bericht uit een ander venster', () => {
    expect(isBerichtVanOuder({ source: vreemd }, ouder)).toBe(false);
  });

  it('weigert zonder event, zonder source of zonder oudervenster', () => {
    expect(isBerichtVanOuder(undefined, ouder)).toBe(false);
    expect(isBerichtVanOuder({}, ouder)).toBe(false);
    expect(isBerichtVanOuder({ source: null }, null)).toBe(false);
  });

  it('de snippet voor de iframe gedraagt zich als de functie', () => {
    const vanSnippet = uitSnippet<typeof isBerichtVanOuder>(
      IS_BERICHT_VAN_OUDER_SNIPPET,
      'isBerichtVanOuder',
    );
    for (const [event, parent] of [
      [{ source: ouder }, ouder],
      [{ source: vreemd }, ouder],
      [{}, ouder],
      [undefined, ouder],
    ] as const) {
      expect(vanSnippet(event, parent)).toBe(isBerichtVanOuder(event, parent));
    }
  });

  it('de gedeelde iframe neemt het nieuwe requestId pas aan ná het afbreken van de vorige run', () => {
    // Anders krijgt wat het oude programma tijdens __pygbag_reset() nog print
    // het id van de nieuwe run en belandt het alsnog in de verkeerde console.
    const doc = buildSharedRunnerSrcDoc(['import play']);
    const runHandler = doc.slice(doc.indexOf("if (type === 'run')"));
    const reset = runHandler.indexOf("runPythonAsync('__pygbag_reset()')");
    const overname = runHandler.indexOf('CURRENT_REQUEST = requestId');
    expect(reset).toBeGreaterThan(-1);
    expect(overname).toBeGreaterThan(reset);
  });

  it('de gedeelde iframe controleert de afzender vóór hij naar e.data kijkt', () => {
    const doc = buildSharedRunnerSrcDoc(['import play']);
    expect(doc).toContain(IS_BERICHT_VAN_OUDER_SNIPPET);
    const controle = doc.indexOf('if (!isBerichtVanOuder(e, window.parent)) return;');
    const lezen = doc.indexOf('if (!e.data || !e.data.type) return;');
    expect(controle).toBeGreaterThan(-1);
    expect(lezen).toBeGreaterThan(controle);
  });
});

describe('ensureAsync', () => {
  const pygameCode = ['import pygame', '', 'pygame.init()', 'while True:', '    x = 1'].join('\n');

  it('zet pygame-code in een async main met imports bovenaan', () => {
    const { code } = ensureAsync(pygameCode);
    const regels = code.split('\n');
    expect(regels.slice(0, 4)).toEqual([
      'import pygame',
      'import asyncio',
      '',
      'async def main():',
    ]);
    expect(regels.at(-1)).toBe('await main()');
    expect(code).toContain('    pygame.init()');
  });

  it('voegt await asyncio.sleep(0) toe direct na een while-kop, op de diepte van de lus', () => {
    const regels = ensureAsync(pygameCode).code.split('\n');
    const kop = regels.indexOf('    while True:');
    expect(kop).toBeGreaterThan(-1);
    expect(regels[kop + 1]).toBe('        await asyncio.sleep(0)');
    expect(regels[kop + 2]).toBe('        x = 1');
  });

  it('lineOffset groeit niet mee met het aantal eigen imports', () => {
    // De eigen imports verhuizen naar boven, maar het zijn regels van de
    // gebruiker zelf: alleen de witregel, 'async def main():' en de
    // toegevoegde asyncio-import schuiven de rest op. De oude formule telde
    // de eigen imports mee, zodat een fout op regel 3 bij één import als
    // regel 2 werd gemeld, bij twee als regel 1.
    expect(ensureAsync('x = 1\ny = 2').lineOffset).toBe(3);
    expect(ensureAsync('x = 1\ny = 2').code.split('\n')[4]).toBe('    y = 2');
    expect(ensureAsync(pygameCode).lineOffset).toBe(3);
    const twee = ensureAsync('import pygame\nimport random\nx = 1');
    expect(twee.lineOffset).toBe(3);
    // Regel 3 van de gebruiker staat op omhulde regel 3 + 3 = 6.
    expect(twee.code.split('\n')[5]).toBe('    x = 1');
    // Staat asyncio er al, dan komt er geen import bij en is de offset 2.
    expect(ensureAsync('import asyncio\nx = 1').lineOffset).toBe(2);
  });

  it('laat code die al asyncio en await gebruikt met rust, op asyncio.run na', () => {
    const code =
      'import asyncio\nasync def main():\n    await asyncio.sleep(0)\nasyncio.run(main())';
    const uit = ensureAsync(code);
    expect(uit.lineOffset).toBe(0);
    expect(uit.code).toBe(code.replace('asyncio.run(main())', 'await main()'));
  });

  it('hijst alleen top-level imports, niet die in een functie', () => {
    const { code } = ensureAsync('def f():\n    import random\n    return random.random()');
    expect(code.split('\n')[0]).toBe('import asyncio');
    expect(code).toContain('        import random');
  });

  it('lege code geeft lege code met offset 0', () => {
    expect(ensureAsync('')).toEqual({ code: '', lineOffset: 0 });
  });
});

describe('rewriteTraceback', () => {
  const traceback = [
    'Traceback (most recent call last):',
    '  File "/lib/python313.zip/_pyodide/_base.py", line 597, in eval_code_async',
    '  File "<jouw_code>", line 7, in <module>',
    '  File "<jouw_code>", line 12, in main',
    '  File "<bootstrap>", line 9, in _browser_start_program',
    'NameError: name "scherm" is not defined',
  ].join('\n');

  it('schuift alleen de regelnummers van <jouw_code> met lineOffset terug', () => {
    const uit = rewriteTraceback(traceback, 4);
    expect(uit).toContain('File "<jouw_code>", line 3, in <module>');
    expect(uit).toContain('File "<jouw_code>", line 8, in main');
    expect(uit).toContain('File "/lib/python313.zip/_pyodide/_base.py", line 597');
    expect(uit).toContain('File "<bootstrap>", line 9');
    expect(uit).toContain('NameError: name "scherm" is not defined');
  });

  it('komt nooit onder regel 1 en laat de tekst bij offset 0 ongemoeid', () => {
    expect(rewriteTraceback('File "<jouw_code>", line 2', 10)).toBe('File "<jouw_code>", line 1');
    expect(rewriteTraceback(traceback, 0)).toBe(traceback);
  });

  it('de snippet voor de iframe gedraagt zich als de functie', () => {
    const vanSnippet = uitSnippet<typeof rewriteTraceback>(
      REWRITE_TRACEBACK_SNIPPET,
      'rewriteTraceback',
    );
    for (const offset of [0, 3, 4, 10]) {
      expect(vanSnippet(traceback, offset)).toBe(rewriteTraceback(traceback, offset));
    }
  });

  it('beide iframe-documenten bevatten de snippet en geven de offset door', () => {
    expect(buildSrcDoc({ code: 'import pygame', mode: 'pygame' })).toContain(
      REWRITE_TRACEBACK_SNIPPET,
    );
    expect(buildSrcDoc({ code: 'import pygame', mode: 'pygame' })).toContain(
      'const LINE_OFFSET = 3;',
    );
    const gedeeld = buildSharedRunnerSrcDoc(['import pygame']);
    expect(gedeeld).toContain(REWRITE_TRACEBACK_SNIPPET);
    expect(gedeeld).toContain('rewriteTraceback(msg, CURRENT_OFFSET)');
  });
});

describe('detectMode', () => {
  it('herkent play aan import play of from play import', () => {
    expect(detectMode('import play\n')).toBe('play');
    expect(detectMode('from play import new_circle')).toBe('play');
  });

  it('herkent pygame en valt daar ook op terug', () => {
    expect(detectMode('import pygame\n')).toBe('pygame');
    expect(detectMode('print("hoi")')).toBe('pygame');
  });

  it('laat zich niet foppen door een langere naam', () => {
    expect(detectMode('import playground')).toBe('pygame');
  });
});

describe('srcdoc-bouwers', () => {
  const cdn = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;
  const bouwers: Array<[string, () => string]> = [
    ['buildPrewarmSrcDoc', () => buildPrewarmSrcDoc(['import play'])],
    ['buildSrcDoc', () => buildSrcDoc({ code: 'import play', mode: 'play' })],
    ['buildSharedRunnerSrcDoc', () => buildSharedRunnerSrcDoc(['import play'])],
  ];

  for (const [naam, bouw] of bouwers) {
    it(`${naam} laadt Pyodide ${PYODIDE_VERSION} van de CDN en installeert de wheels`, () => {
      const doc = bouw();
      expect(doc).toContain(`await import('${cdn}')`);
      expect(doc).toMatch(
        /const WHEELS = \[[^\]]*\/whl\/pymunk-[^\]]*\/whl\/coderius_play-[^\]]*\];/,
      );
      expect(doc).toContain('await pyodide.loadPackage(WHEELS)');
    });
  }

  it('zonder play in de code blijft de play-wheel weg', () => {
    expect(buildPrewarmSrcDoc(['import pygame'])).not.toContain('/whl/coderius_play-');
    expect(buildPrewarmSrcDoc(['import pygame'])).not.toContain('/whl/pymunk-');
  });
});
