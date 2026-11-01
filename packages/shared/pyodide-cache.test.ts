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
function nepServer(bestanden: Record<string, string>) {
  const gevraagd: string[] = [];
  const fetch = (async (request: Request, init?: RequestInit) => {
    const pad = new URL(request.url).pathname;
    gevraagd.push(init?.cache ? `${pad} (${init.cache})` : pad);
    if (!(pad in bestanden)) return new Response('weg', { status: 404 });
    return new Response(bestanden[pad], { status: 200 });
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

function opstelling(bestanden: Record<string, string>) {
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
  it('meldt de service worker aan op de baseUrl, met die baseUrl als scope', () => {
    const script = aanmelder('/python/');
    expect(script).toContain('register("/python/pyodide-sw.js",{scope:"/python/"})');
    // Pas na het laden: de aanmelding concurreert niet met de pagina zelf.
    expect(script).toContain("addEventListener('load'");
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
    // Twee service workers op één scope: de tweede vervangt de eerste.
    expect(heeftCache('sites/informatica/play', [['@docusaurus/plugin-pwa', {}]])).toBe(false);
    expect(heeftCache('sites/informatica/web')).toBe(false);
  });
});
