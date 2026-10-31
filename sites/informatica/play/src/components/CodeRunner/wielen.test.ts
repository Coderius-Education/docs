import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { LAAD_WIELEN_SNIPPET, beantwoordWielen, isToegestaanBestand } from './wielen';

// De runner-iframes van play draaien leerlingcode. Alle informatica-cursussen
// delen één origin, dus de iframes krijgen geen allow-same-origin: anders kan
// leerlingcode bij de opslag van elke cursus. De wheels komen daarom via de
// pagina, en die geeft alleen wheels uit /play/whl/ en Pyodide uit
// /play/pyodide/ van deze site.

const BASIS = 'https://informatica.coderius.nl/play';

describe('isToegestaanBestand', () => {
  it('laat alleen een wheel uit /whl/ van deze site door', () => {
    expect(isToegestaanBestand(`${BASIS}/whl/coderius_play-3.5.0-py3-none-any.whl`, BASIS)).toBe(
      true,
    );
    // Een build uit de play-repo draagt een build-tag in zijn naam.
    expect(
      isToegestaanBestand(
        `${BASIS}/whl/coderius_play-3.5.0-0master7a7db94-py3-none-any.whl`,
        BASIS,
      ),
    ).toBe(true);
    expect(isToegestaanBestand(`${BASIS}/whl/../geheim.whl`, BASIS)).toBe(false);
    expect(isToegestaanBestand(`${BASIS}/whl/x.json`, BASIS)).toBe(false);
    expect(isToegestaanBestand('https://informatica.coderius.nl/ide/whl/x.whl', BASIS)).toBe(false);
    expect(isToegestaanBestand('https://kwaad.nl/whl/x.whl', BASIS)).toBe(false);
  });
});

describe('isToegestaanBestand voor Pyodide', () => {
  it('laat een bestand uit /pyodide/ door, met of zonder versie', () => {
    expect(isToegestaanBestand(`${BASIS}/pyodide/pyodide.asm.wasm`, BASIS)).toBe(true);
    expect(isToegestaanBestand(`${BASIS}/pyodide/pyodide.js?v=0.29.4`, BASIS)).toBe(true);
    expect(
      isToegestaanBestand(
        `${BASIS}/pyodide/pygame_ce-2.5.6.dev2-cp313-cp313-pyemscripten_2025_0_wasm32.whl?v=0.29.4`,
        BASIS,
      ),
    ).toBe(true);
  });

  it('en niets daarbuiten of eronder', () => {
    expect(isToegestaanBestand(`${BASIS}/pyodide/../docs/index.html`, BASIS)).toBe(false);
    expect(isToegestaanBestand(`${BASIS}/pyodide/a/b.js`, BASIS)).toBe(false);
    expect(isToegestaanBestand(`${BASIS}/pyodide/.verborgen`, BASIS)).toBe(false);
    expect(isToegestaanBestand(`${BASIS}/pyodide/pyodide.js?x=1`, BASIS)).toBe(false);
    expect(isToegestaanBestand(`${BASIS}/pyodide/`, BASIS)).toBe(false);
    expect(isToegestaanBestand(`${BASIS}/index.html`, BASIS)).toBe(false);
  });
});

describe('laadPyodide in de iframe', () => {
  // De snippet draait in een srcdoc-iframe zonder eigen origin. Hier speelt een
  // nagemaakte ouder de pagina: hij noteert wat de iframe vraagt en antwoordt
  // met bytes. De "runtime" zet een vlag; de "loader" roept fetch aan zoals
  // Pyodide dat doet, op indexURL en daarbuiten.
  it('haalt alles onder /pyodide/ via de pagina, met de versie erachter', async () => {
    const basis = `${BASIS}/pyodide/`;
    const gevraagd: string[] = [];
    const luisteraars: Array<(e: MessageEvent) => void> = [];
    const ouder = {
      postMessage(d: { type: string; id: string; urls: string[] }) {
        gevraagd.push(...d.urls);
        const buffers = d.urls.map((u) => {
          const pad = u.slice(basis.length).split('?')[0];
          const tekst =
            pad === 'pyodide.asm.js'
              ? 'globalThis.__runtimeGeladen = true;'
              : pad === 'pyodide.js'
                ? `globalThis.loadPyodide = async (opties) => {
                     if (!globalThis.__runtimeGeladen) throw new Error('runtime niet eerst');
                     const wasm = await fetch(opties.indexURL + 'pyodide.asm.wasm');
                     const pakket = await fetch(new URL(opties.indexURL + 'numpy.whl'));
                     const elders = await fetch('https://elders.nl/x');
                     return { opties, type: wasm.headers.get('content-type'),
                       wasm: await wasm.text(), pakket: await pakket.text(), elders: await elders.text() };
                   };`
                : `inhoud van ${pad}`;
          return new TextEncoder().encode(tekst).buffer;
        });
        queueMicrotask(() => {
          for (const l of luisteraars) {
            l({
              source: ouder,
              data: { type: 'wielen', id: d.id, buffers },
            } as unknown as MessageEvent);
          }
        });
      },
    };
    const venster = {
      parent: ouder,
      addEventListener: (_: string, l: (e: MessageEvent) => void) => luisteraars.push(l),
      removeEventListener: (_: string, l: (e: MessageEvent) => void) =>
        luisteraars.splice(luisteraars.indexOf(l), 1),
    };
    const echteFetch = vi.fn(async () => new Response('van het net'));
    const vorigeFetch = globalThis.fetch;
    globalThis.fetch = echteFetch as unknown as typeof fetch;
    try {
      const laadPyodide = new Function('window', `${LAAD_WIELEN_SNIPPET}\nreturn laadPyodide;`)(
        venster,
      ) as (b: string, v: string, o: object) => Promise<Record<string, unknown>>;
      const uit = await laadPyodide(basis, '0.29.4', { packages: ['numpy'] });

      expect(uit.opties).toEqual({ indexURL: basis, packages: ['numpy'] });
      expect(uit.type).toBe('application/wasm');
      expect(uit.wasm).toBe('inhoud van pyodide.asm.wasm');
      expect(uit.pakket).toBe('inhoud van numpy.whl');
      expect(uit.elders).toBe('van het net');
      expect(gevraagd).toEqual([
        `${basis}pyodide.js?v=0.29.4`,
        `${basis}pyodide.asm.js?v=0.29.4`,
        `${basis}pyodide.asm.wasm?v=0.29.4`,
        `${basis}numpy.whl?v=0.29.4`,
      ]);
      // Elk bestand dat de iframe vraagt, komt door de controle van de pagina.
      for (const u of gevraagd) expect(isToegestaanBestand(u, BASIS)).toBe(true);
      expect(echteFetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = vorigeFetch;
      Reflect.deleteProperty(globalThis, '__runtimeGeladen');
      Reflect.deleteProperty(globalThis, 'loadPyodide');
    }
  });
});

describe('de wheels uit engine.js', () => {
  it('komen door de controle', () => {
    const engine = readFileSync(fileURLToPath(new URL('./engine.js', import.meta.url)), 'utf8');
    const wheels = [...engine.matchAll(/^const \w+_WHEEL = '\/whl\/([^']+)';$/gm)].map((m) => m[1]);
    expect(wheels).toHaveLength(2);
    for (const wheel of wheels)
      expect(isToegestaanBestand(`${BASIS}/whl/${wheel}`, BASIS)).toBe(true);
  });
});

describe('beantwoordWielen', () => {
  it('negeert een bericht van een ander venster dan de eigen iframe', () => {
    const iframe = { postMessage: vi.fn() } as unknown as Window;
    const e = { source: {}, data: { type: 'wielen-nodig', id: 'x', urls: [] } } as MessageEvent;
    expect(beantwoordWielen(e, iframe)).toBe(false);
  });

  it('weigert een wheel buiten /whl/ zonder iets op te halen', () => {
    const postMessage = vi.fn();
    const iframe = { postMessage } as unknown as Window;
    const fetch = vi.spyOn(globalThis, 'fetch');
    const e = {
      source: iframe,
      data: { type: 'wielen-nodig', id: 'x', urls: ['https://kwaad.nl/x.whl'] },
    } as unknown as MessageEvent;
    expect(beantwoordWielen(e, iframe)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expect(postMessage.mock.calls[0][0]).toMatchObject({ type: 'wielen', id: 'x' });
    expect(postMessage.mock.calls[0][0].fout).toBeTruthy();
    fetch.mockRestore();
  });
});

describe('de runner-iframes van play', () => {
  it.each(['./Sidebar.js', '../SharedRunner/index.js'])(
    '%s geeft de iframe geen allow-same-origin',
    (bestand) => {
      const bron = readFileSync(fileURLToPath(new URL(bestand, import.meta.url)), 'utf8');
      const waarden = [
        ...bron.matchAll(/sandbox=["']([^"']*)["']|setAttribute\(\s*'sandbox',\s*'([^']*)'/g),
      ].map((m) => m[1] ?? m[2]);
      expect(waarden.length).toBeGreaterThan(0);
      for (const w of waarden) expect(w).not.toContain('allow-same-origin');
    },
  );
});
