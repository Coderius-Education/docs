import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConfig } from './config';
import pyodideCachePlugin, { aanmelder } from './plugins/pyodide-cache';
import { maakAfhandeling } from './pyodide-cache/sw';

// De service worker die de Pyodide van een site bewaart (pyodide-cache/sw.js).
// Wat hier niet na te spelen is: of de browser hem aanmeldt en of hij echt
// antwoordt. Dat is in Chromium nagelopen (zie de commit).

/** Een Cache Storage in het geheugen, met wat de service worker gebruikt. */
function nepCaches() {
  const winkels = new Map<string, Map<string, Response>>();
  const open = async (naam: string) => {
    if (!winkels.has(naam)) winkels.set(naam, new Map());
    const winkel = winkels.get(naam) as Map<string, Response>;
    return {
      match: async (sleutel: string) => winkel.get(sleutel)?.clone(),
      put: async (sleutel: string, r: Response) => {
        winkel.set(sleutel, r);
      },
    };
  };
  return {
    winkels,
    caches: {
      open,
      delete: async (naam: string) => winkels.delete(naam),
    } as unknown as CacheStorage,
  };
}

/** Een server met per pad een inhoud; telt wat hij uitlevert. */
function nepServer(bestanden: Record<string, string | undefined>) {
  const gevraagd: string[] = [];
  const fetch = (async (request: Request, init?: RequestInit) => {
    const pad = new URL(request.url).pathname;
    gevraagd.push(init?.cache ? `${pad} (${init.cache})` : pad);
    const inhoud = bestanden[pad];
    if (inhoud === undefined) return new Response('weg', { status: 404 });
    return new Response(inhoud, { status: 200 });
  }) as typeof globalThis.fetch;
  return { bestanden, gevraagd, fetch };
}

const SCOPE = 'https://informatica.coderius.nl/python/';
const vraag = (pad: string, init?: RequestInit) =>
  new Request(new URL(pad, 'https://informatica.coderius.nl').href, init);

/** Laadt Pyodide zoals een lader: eerst pyodide.js, dan de rest. */
async function laad(afhandeling: ReturnType<typeof maakAfhandeling>, wachten: Promise<unknown>[]) {
  const uit: Record<string, string> = {};
  for (const naam of ['pyodide.js', 'pyodide.asm.wasm', 'python_stdlib.zip']) {
    const antwoord = afhandeling(vraag(`/python/pyodide/${naam}`));
    if (!antwoord) throw new Error(`${naam} ging er langs`);
    uit[naam] = await (await antwoord).text();
    await Promise.all(wachten.splice(0));
  }
  return uit;
}

function opstelling(bestanden: Record<string, string | undefined>) {
  const server = nepServer(bestanden);
  const { caches, winkels } = nepCaches();
  const wachten: Promise<unknown>[] = [];
  const afhandeling = maakAfhandeling({
    caches,
    fetch: server.fetch,
    scope: SCOPE,
    wachtOp: (p) => wachten.push(p),
  });
  return { server, winkels, afhandeling, laad: () => laad(afhandeling, wachten) };
}

const VERSIE_1 = {
  '/python/pyodide/pyodide.js': 'pyodide 1',
  '/python/pyodide/pyodide.asm.wasm': 'wasm 1',
  '/python/pyodide/python_stdlib.zip': 'stdlib 1',
};

describe('de service worker voor Pyodide', () => {
  it('haalt de runtime bij een tweede bezoek uit de cache, op de ingang na', async () => {
    const o = opstelling({ ...VERSIE_1 });
    await o.laad();
    o.server.gevraagd.length = 0;

    expect(await o.laad()).toEqual({
      'pyodide.js': 'pyodide 1',
      'pyodide.asm.wasm': 'wasm 1',
      'python_stdlib.zip': 'stdlib 1',
    });
    // Alleen de ingang, en die als voorwaardelijk verzoek (een 304 als hij
    // niet veranderde): de wasm en de standaardbibliotheek niet meer.
    expect(o.server.gevraagd).toEqual(['/python/pyodide/pyodide.js (no-cache)']);
  });

  it('gooit de cache weg als pyodide.js verandert, vóór de rest geladen wordt', async () => {
    // Een upgrade: een oude wasm naast een nieuwe pyodide.js start niet.
    const o = opstelling({ ...VERSIE_1 });
    await o.laad();
    Object.assign(o.server.bestanden, {
      '/python/pyodide/pyodide.js': 'pyodide 2',
      '/python/pyodide/pyodide.asm.wasm': 'wasm 2',
      '/python/pyodide/python_stdlib.zip': 'stdlib 2',
    });

    expect(await o.laad()).toEqual({
      'pyodide.js': 'pyodide 2',
      'pyodide.asm.wasm': 'wasm 2',
      'python_stdlib.zip': 'stdlib 2',
    });
    o.server.gevraagd.length = 0;
    expect((await o.laad())['pyodide.asm.wasm']).toBe('wasm 2');
    expect(o.server.gevraagd).toEqual(['/python/pyodide/pyodide.js (no-cache)']);
  });

  it('neemt na een upgrade geen oude bestanden uit de HTTP-cache van de browser over', async () => {
    // De browser bewaart zelf ook (Cache-Control, Last-Modified). Vroeg de
    // service worker na een upgrade de wasm-lijm met een gewone fetch, dan
    // kwam de oude uit die HTTP-cache, en bewaarde hij die naast de nieuwe
    // pyodide.js, tot de volgende versie: Python laadde niet meer. In
    // Chromium nagespeeld met max-age=3600 en met alleen Last-Modified.
    const server = nepServer({ ...VERSIE_1 });
    const httpCache = new Map<string, string>();
    const browser = (async (request: Request, init?: RequestInit) => {
      const pad = new URL(request.url).pathname;
      const vers = init?.cache === 'no-cache' || init?.cache === 'reload';
      if (!vers && httpCache.has(pad)) return new Response(httpCache.get(pad), { status: 200 });
      const antwoord = await server.fetch(request, init);
      if (antwoord.status === 200) httpCache.set(pad, await antwoord.clone().text());
      return antwoord;
    }) as typeof fetch;
    const { caches } = nepCaches();
    const wachten: Promise<unknown>[] = [];
    const afhandeling = () =>
      maakAfhandeling({ caches, fetch: browser, scope: SCOPE, wachtOp: (p) => wachten.push(p) });
    await laad(afhandeling(), wachten);
    Object.assign(server.bestanden, {
      '/python/pyodide/pyodide.js': 'pyodide 2',
      '/python/pyodide/pyodide.asm.wasm': 'wasm 2',
      '/python/pyodide/python_stdlib.zip': 'stdlib 2',
    });

    const verwacht = {
      'pyodide.js': 'pyodide 2',
      'pyodide.asm.wasm': 'wasm 2',
      'python_stdlib.zip': 'stdlib 2',
    };
    expect(await laad(afhandeling(), wachten)).toEqual(verwacht);
    // En wat hij bewaarde: het bezoek daarna komt uit zijn cache.
    expect(await laad(afhandeling(), wachten)).toEqual(verwacht);
  });

  it('bewaart niets zolang hij de ingang niet zag', async () => {
    // De pagina laadde pyodide.js nog zonder service worker, en de rest met:
    // dan is niet te zeggen bij welke versie die bestanden horen.
    const o = opstelling({ ...VERSIE_1 });
    const antwoord = o.afhandeling(vraag('/python/pyodide/pyodide.asm.wasm'));
    expect(await (await antwoord)?.text()).toBe('wasm 1');
    expect([...(o.winkels.values().next().value?.keys() ?? [])]).toEqual([]);
  });

  it('geeft offline de bewaarde ingang en de bewaarde runtime', async () => {
    const o = opstelling({ ...VERSIE_1 });
    await o.laad();
    const offline = maakAfhandeling({
      caches: nepCachesVan(o.winkels) as unknown as CacheStorage,
      fetch: (async () => {
        throw new TypeError('Failed to fetch');
      }) as typeof fetch,
      scope: SCOPE,
    });
    expect(await laad(offline, [])).toEqual({
      'pyodide.js': 'pyodide 1',
      'pyodide.asm.wasm': 'wasm 1',
      'python_stdlib.zip': 'stdlib 1',
    });
  });

  it('bewaart een 404 niet', async () => {
    const o = opstelling({ '/python/pyodide/pyodide.js': 'pyodide 1' });
    await o.afhandeling(vraag('/python/pyodide/pyodide.js'));
    const eerste = await o.afhandeling(vraag('/python/pyodide/matplotlib.whl'));
    expect(eerste?.status).toBe(404);
    o.server.bestanden['/python/pyodide/matplotlib.whl'] = 'wheel';
    expect(await (await o.afhandeling(vraag('/python/pyodide/matplotlib.whl')))?.text()).toBe(
      'wheel',
    );
  });

  it('laat alles buiten pyodide/ met rust, en ook wat geen GET is', () => {
    const o = opstelling({ ...VERSIE_1 });
    expect(o.afhandeling(vraag('/python/docs/basis/'))).toBeNull();
    expect(o.afhandeling(vraag('/python/assets/js/main.js'))).toBeNull();
    // Een andere cursus op dezelfde vak-host heeft zijn eigen Pyodide.
    expect(o.afhandeling(vraag('/ctf/pyodide/pyodide.js'))).toBeNull();
    expect(o.afhandeling(vraag('/python/pyodide/pyodide.js', { method: 'POST' }))).toBeNull();
    expect(
      o.afhandeling(vraag('/python/pyodide/pyodide.asm.wasm', { headers: { range: 'bytes=0-9' } })),
    ).toBeNull();
  });

  it('gooit de cache niet weg als pyodide.js even niet lukt', async () => {
    // Een 500 of 404 op de ingang is geen nieuwe versie; het volgende bezoek
    // moet de bewaarde runtime nog hebben.
    const o = opstelling({ ...VERSIE_1 });
    await o.laad();
    const ingang = o.server.bestanden['/python/pyodide/pyodide.js'];
    o.server.bestanden['/python/pyodide/pyodide.js'] = undefined;
    expect((await o.afhandeling(vraag('/python/pyodide/pyodide.js')))?.status).toBe(404);
    o.server.bestanden['/python/pyodide/pyodide.js'] = ingang;
    o.server.gevraagd.length = 0;
    await o.laad();
    expect(o.server.gevraagd).toEqual(['/python/pyodide/pyodide.js (no-cache)']);
  });

  it('valt terug op het netwerk als de cache het niet doet', async () => {
    // Cache Storage kan vol zijn of geblokkeerd (privévenster in sommige
    // browsers); Python moet dan gewoon laden, alleen zonder bewaren.
    const server = nepServer({ ...VERSIE_1 });
    const kapot = {
      open: async () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
      delete: async () => false,
    } as unknown as CacheStorage;
    const afhandeling = maakAfhandeling({ caches: kapot, fetch: server.fetch, scope: SCOPE });
    expect(await laad(afhandeling, [])).toEqual({
      'pyodide.js': 'pyodide 1',
      'pyodide.asm.wasm': 'wasm 1',
      'python_stdlib.zip': 'stdlib 1',
    });
  });

  it('geeft elke cursus van een vak een eigen cache', async () => {
    // Alle cursussen van informatica delen één origin, en dus één Cache Storage.
    const { caches, winkels } = nepCaches();
    const server = nepServer({
      '/python/pyodide/pyodide.js': 'python',
      '/ctf/pyodide/pyodide.js': 'ctf',
    });
    for (const scope of [SCOPE, 'https://informatica.coderius.nl/ctf/']) {
      const pad = new URL('pyodide/pyodide.js', scope).pathname;
      await maakAfhandeling({ caches, fetch: server.fetch, scope })(vraag(pad));
    }
    expect([...winkels.keys()].sort()).toEqual([
      'coderius-pyodide /ctf/pyodide/',
      'coderius-pyodide /python/pyodide/',
    ]);
  });
});

/** Dezelfde winkels, opnieuw geopend: zoals een service worker na een herstart. */
function nepCachesVan(winkels: Map<string, Map<string, Response>>) {
  return {
    open: async (naam: string) => {
      const winkel = winkels.get(naam) ?? new Map<string, Response>();
      winkels.set(naam, winkel);
      return {
        match: async (sleutel: string) => winkel.get(sleutel)?.clone(),
        put: async (sleutel: string, r: Response) => {
          winkel.set(sleutel, r);
        },
      };
    },
    delete: async (naam: string) => winkels.delete(naam),
  };
}

describe('de aanmelding', () => {
  /** Voert het aanmeldscript uit in een nagemaakte pagina. */
  function draai(script: string, { readyState = 'loading', sw = true } = {}) {
    const register = vi.fn(async () => ({}));
    const luisteraars: Record<string, () => void> = {};
    const navigator = sw ? { serviceWorker: { register } } : {};
    const window = {
      addEventListener: (type: string, f: () => void) => {
        luisteraars[type] = f;
      },
    };
    new Function('navigator', 'document', 'window', script)(navigator, { readyState }, window);
    return { register, laad: () => luisteraars.load?.() };
  }

  it('meldt de service worker pas na het laden aan, op de baseUrl', () => {
    // Na het laden: de aanmelding concurreert niet met de pagina zelf.
    const pagina = draai(aanmelder('/python/'));
    expect(pagina.register).not.toHaveBeenCalled();
    pagina.laad();
    expect(pagina.register).toHaveBeenCalledWith('/python/pyodide-sw.js', { scope: '/python/' });
  });

  it('meteen als de pagina al geladen is, en niet zonder service workers', () => {
    expect(draai(aanmelder('/ctf/'), { readyState: 'complete' }).register).toHaveBeenCalledWith(
      '/ctf/pyodide-sw.js',
      { scope: '/ctf/' },
    );
    // Oude browsers en sommige privévensters: geen fout, geen aanmelding.
    expect(() => draai(aanmelder('/python/'), { sw: false }).laad()).not.toThrow();
  });
});

describe('de plugin', () => {
  const context = { siteConfig: { baseUrl: '/python/' } } as never;
  afterEach(() => vi.unstubAllEnvs());

  it('meldt alleen in een productie-build aan', () => {
    // In `docusaurus start` zou hij bewaren wat de ontwikkelaar net verandert.
    vi.stubEnv('NODE_ENV', 'development');
    expect(pyodideCachePlugin(context).injectHtmlTags()).toEqual({});
    vi.stubEnv('NODE_ENV', 'production');
    const tags = pyodideCachePlugin(context).injectHtmlTags().postBodyTags;
    expect(tags).toEqual([expect.objectContaining({ innerHTML: aanmelder('/python/') })]);
  });

  it("zet de service worker naast de pagina's van de build", async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'pyodide-sw-'));
    try {
      await pyodideCachePlugin(context).postBuild({ outDir });
      const sw = readFileSync(join(outDir, 'pyodide-sw.js'), 'utf8');
      expect(sw).toBe(readFileSync(new URL('./pyodide-cache/sw.js', import.meta.url), 'utf8'));
      // In de browser is er geen `module`: dan moet hij zich aanmelden voor fetch.
      const luister = vi.fn();
      new Function('self', sw)({ registration: { scope: SCOPE }, addEventListener: luister });
      expect(luister.mock.calls.map((c) => c[0])).toEqual(['install', 'activate', 'fetch']);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});

describe('createConfig', () => {
  const ROOT = fileURLToPath(new URL('../..', import.meta.url));
  afterEach(() => vi.restoreAllMocks());

  /** Krijgt de site in deze map de plugin, zoals createConfig hem bouwt? */
  function heeftCache(map: string, plugins: unknown[] = []) {
    vi.spyOn(process, 'cwd').mockReturnValue(join(ROOT, map));
    const config = createConfig({ title: 'x', plugins });
    // Op naam: config/index.js laadt de plugin met require, de test met import,
    // en dat zijn in vitest twee exemplaren van dezelfde functie.
    return (config.plugins as unknown[]).some(
      (p) => typeof p === 'function' && p.name === pyodideCachePlugin.name,
    );
  }

  it('geeft elke site met Pyodide de service worker', () => {
    for (const site of ['python', 'ctf', 'ide', 'algorithms']) {
      expect(heeftCache(`sites/informatica/${site}`), site).toBe(true);
    }
  });

  it('maar niet een site met een eigen PWA, of zonder Pyodide', () => {
    // Twee service workers op één scope: de tweede vervangt de eerste. Play
    // zonder zijn plugins meegegeven: zijn package.json zegt het al.
    expect(heeftCache('sites/informatica/play')).toBe(false);
    expect(heeftCache('sites/informatica/web')).toBe(false);
  });

  it('herkent de PWA ook als opgelost pad in de plugins', () => {
    const pwa = '/repo/node_modules/@docusaurus/plugin-pwa/lib/index.js';
    expect(heeftCache('sites/informatica/python', [[pwa, {}]])).toBe(false);
    expect(heeftCache('sites/informatica/python', [pwa])).toBe(false);
  });
});
