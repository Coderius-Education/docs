import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConfig } from './config';
import pyodideCachePlugin, { aanmelder, serviceWorker } from './plugins/pyodide-cache';
import { cacheNamen, maakAfhandeling, ruimOp } from './pyodide-cache/sw';

// De service worker die de Pyodide van een site bewaart (pyodide-cache/sw.js).
// Hij geeft en bewaart alleen bestanden met de vingerafdruk die de build in
// INHOUD zette. Dat de browser hem aanmeldt, en dat een vervalste
// pyodide.asm.js in Cache Storage niet meer draait, toetst de rooktest in
// Chromium (scripts/rooktest-speeltuin.mjs).

const som = (tekst: string) => createHash('sha256').update(tekst).digest('hex');

/** Een Cache Storage in het geheugen, met wat de service worker gebruikt. */
function nepCaches(winkels = new Map<string, Map<string, Response>>()) {
  const open = async (naam: string) => {
    if (!winkels.has(naam)) winkels.set(naam, new Map());
    const winkel = winkels.get(naam) as Map<string, Response>;
    return {
      match: async (sleutel: string) => winkel.get(sleutel)?.clone(),
      put: async (sleutel: string, r: Response) => {
        winkel.set(sleutel, r);
      },
      delete: async (sleutel: string) => winkel.delete(sleutel),
    };
  };
  const caches = {
    open,
    keys: async () => [...winkels.keys()],
    delete: async (naam: string) => winkels.delete(naam),
  } as unknown as CacheStorage;
  return { winkels, caches };
}

/** Een server met per pad een inhoud; telt wat hij uitlevert, en hoe. */
function nepServer(bestanden: Record<string, string | undefined>) {
  const gevraagd: string[] = [];
  const fetch = (async (request: Request, init?: RequestInit) => {
    const pad = new URL(request.url).pathname;
    gevraagd.push(init?.cache ? `${pad} (${init.cache})` : pad);
    const inhoud = bestanden[pad];
    if (inhoud === undefined) return new Response('weg', { status: 404 });
    return new Response(inhoud, { status: 200, headers: { 'content-type': 'text/javascript' } });
  }) as typeof globalThis.fetch;
  return { bestanden, gevraagd, fetch };
}

const SCOPE = 'https://informatica.coderius.nl/python/';
const ORIGIN = 'https://informatica.coderius.nl';
const vraag = (pad: string, init?: RequestInit) => new Request(new URL(pad, ORIGIN).href, init);
const NAMEN = ['pyodide.js', 'pyodide.asm.wasm', 'python_stdlib.zip'] as const;

/** De bestanden van een Pyodide-versie, en de INHOUD die de build daarvan maakt. */
function versie(n: number) {
  const bestanden = Object.fromEntries(
    NAMEN.map((naam) => [`/python/pyodide/${naam}`, `${naam} ${n}`]),
  );
  const inhoud = Object.fromEntries(NAMEN.map((naam) => [naam, som(`${naam} ${n}`)]));
  return { bestanden, inhoud };
}

/** Laadt Pyodide zoals een lader dat doet: eerst pyodide.js, dan de rest. */
async function laad(
  afhandeling: ReturnType<typeof maakAfhandeling>,
  client = 'tabblad',
): Promise<Record<string, string>> {
  const uit: Record<string, string> = {};
  for (const naam of NAMEN) {
    const wachten: Promise<unknown>[] = [];
    const antwoord = afhandeling(vraag(`/python/pyodide/${naam}`), client, (p) => wachten.push(p));
    if (!antwoord) throw new Error(`${naam} ging er langs`);
    uit[naam] = await (await antwoord).text();
    await Promise.all(wachten);
  }
  return uit;
}

/** Een service worker met INHOUD van versie `n`, tegen een server en een cache. */
function opstelling(n = 1, server = nepServer(versie(n).bestanden), opslag = nepCaches()) {
  const afhandeling = maakAfhandeling({
    caches: opslag.caches,
    fetch: server.fetch,
    scope: SCOPE,
    inhoud: versie(n).inhoud,
  });
  return { server, ...opslag, afhandeling, laad: (client?: string) => laad(afhandeling, client) };
}

const uitkomst = (n: number) =>
  Object.fromEntries(NAMEN.map((naam) => [naam, `${naam} ${n}`])) as Record<string, string>;

describe('de service worker voor Pyodide', () => {
  it('haalt de runtime bij een tweede bezoek uit de cache, op de ingang na', async () => {
    const o = opstelling();
    expect(await o.laad()).toEqual(uitkomst(1));
    o.server.gevraagd.length = 0;

    expect(await o.laad('tweede')).toEqual(uitkomst(1));
    // Alleen de ingang, buiten de HTTP-cache om (een 304 als hij niet
    // veranderde): zo ziet hij een nieuwe versie op de server.
    expect(o.server.gevraagd).toEqual(['/python/pyodide/pyodide.js (no-cache)']);
  });

  it('geeft een vervalst bestand in de cache niet door, en haalt het echte', async () => {
    // Leerlingcode op de origin van de site kan via `import js` in Cache
    // Storage schrijven. In Chromium nagespeeld: een pyodide.asm.js met eigen
    // JavaScript ervoor draaide daarna bij elk bezoek mee.
    const o = opstelling();
    await o.laad();
    const [naam] = [...o.winkels.keys()];
    const wasm = `${ORIGIN}/python/pyodide/pyodide.asm.wasm`;
    o.winkels.get(naam)?.set(wasm, new Response('kwaadaardig'));

    expect(await o.laad('volgend bezoek')).toEqual(uitkomst(1));
    // En het vervalste is vervangen door het echte.
    expect(await o.winkels.get(naam)?.get(wasm)?.clone().text()).toBe('pyodide.asm.wasm 1');
  });

  it('bewaart van het netwerk alleen wat de vingerafdruk heeft', async () => {
    // Bijvoorbeeld een oude wasm-lijm die de HTTP-cache van de browser na een
    // upgrade nog gaf: die mag de cache niet in.
    const server = nepServer({ ...versie(1).bestanden, '/python/pyodide/pyodide.asm.wasm': 'oud' });
    const o = opstelling(1, server);
    await o.laad();
    const [naam] = [...o.winkels.keys()];
    expect([...(o.winkels.get(naam)?.keys() ?? [])].sort()).toEqual([
      `${ORIGIN}/python/pyodide/pyodide.js`,
      `${ORIGIN}/python/pyodide/python_stdlib.zip`,
    ]);
  });

  it('laadt alles van het netwerk als de server al een nieuwere Pyodide heeft', async () => {
    // Net uitgerold: de server heeft versie 2, de browser nog de service
    // worker van versie 1. Uit de cache zou dan een wasm van 1 naast een
    // pyodide.js van 2 komen, en Python start niet.
    const o = opstelling(1);
    await o.laad();
    Object.assign(o.server.bestanden, versie(2).bestanden);

    expect(await o.laad('na de uitrol')).toEqual(uitkomst(2));
    // Een ander tabblad dat nog niets laadde, ook.
    expect(await o.laad('nog een tabblad')).toEqual(uitkomst(2));
  });

  it('gooit bij het activeren de caches van eerdere versies van deze cursus weg', async () => {
    const opslag = nepCaches();
    await opstelling(1, undefined, opslag).laad();
    await opstelling(2, nepServer(versie(2).bestanden), opslag).laad();
    // Van een andere cursus op dezelfde vak-host, en van vóór de versies.
    const ctf = cacheNamen('https://informatica.coderius.nl/ctf/', versie(1).inhoud).naam;
    opslag.winkels.set(ctf, new Map());
    opslag.winkels.set('coderius-pyodide /python/pyodide/', new Map());

    await ruimOp({ caches: opslag.caches, scope: SCOPE, inhoud: versie(2).inhoud });
    expect([...opslag.winkels.keys()].sort()).toEqual(
      [ctf, cacheNamen(SCOPE, versie(2).inhoud).naam].sort(),
    );
  });

  it('geeft elke versie en elke cursus een eigen cache', () => {
    const python1 = cacheNamen(SCOPE, versie(1).inhoud).naam;
    expect(cacheNamen(SCOPE, versie(2).inhoud).naam).not.toBe(python1);
    expect(cacheNamen('https://informatica.coderius.nl/ctf/', versie(1).inhoud).naam).not.toBe(
      python1,
    );
    expect(python1.startsWith('coderius-pyodide /python/pyodide/ ')).toBe(true);
  });

  it('geeft offline de bewaarde ingang en de bewaarde runtime, als die kloppen', async () => {
    const o = opstelling();
    await o.laad();
    const offline = maakAfhandeling({
      caches: nepCaches(o.winkels).caches,
      fetch: (async () => {
        throw new TypeError('Failed to fetch');
      }) as typeof fetch,
      scope: SCOPE,
      inhoud: versie(1).inhoud,
    });
    expect(await laad(offline)).toEqual(uitkomst(1));
  });

  it('bewaart een 404 niet, en laat een bestand buiten INHOUD met rust', async () => {
    const o = opstelling();
    o.server.bestanden['/python/pyodide/python_stdlib.zip'] = undefined;
    await o.laad();
    o.server.bestanden['/python/pyodide/python_stdlib.zip'] = 'python_stdlib.zip 1';
    expect(await o.laad('daarna')).toEqual(uitkomst(1));
    // Een wheel die de build niet kent (of een bestand van een leerling).
    expect(o.afhandeling(vraag('/python/pyodide/onbekend.whl'))).toBeNull();
  });

  it('valt terug op het netwerk als de cache het niet doet', async () => {
    // Cache Storage kan vol zijn of geblokkeerd (privévenster in sommige
    // browsers); Python moet dan gewoon laden, alleen zonder bewaren.
    const server = nepServer(versie(1).bestanden);
    const kapot = {
      open: async () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    } as unknown as CacheStorage;
    const afhandeling = maakAfhandeling({
      caches: kapot,
      fetch: server.fetch,
      scope: SCOPE,
      inhoud: versie(1).inhoud,
    });
    expect(await laad(afhandeling)).toEqual(uitkomst(1));
  });

  it('laat alles buiten pyodide/ met rust, en ook wat geen GET is', () => {
    const o = opstelling();
    expect(o.afhandeling(vraag('/python/docs/basis/'))).toBeNull();
    expect(o.afhandeling(vraag('/python/assets/js/main.js'))).toBeNull();
    // Een andere cursus op dezelfde vak-host heeft zijn eigen Pyodide.
    expect(o.afhandeling(vraag('/ctf/pyodide/pyodide.js'))).toBeNull();
    expect(o.afhandeling(vraag('/python/pyodide/pyodide.js', { method: 'POST' }))).toBeNull();
    expect(
      o.afhandeling(vraag('/python/pyodide/pyodide.asm.wasm', { headers: { range: 'bytes=0-9' } })),
    ).toBeNull();
  });
});

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

  it("zet de service worker met de vingerafdrukken naast de pagina's van de build", async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'pyodide-sw-'));
    try {
      mkdirSync(join(outDir, 'pyodide'));
      writeFileSync(join(outDir, 'pyodide', 'pyodide.js'), 'ingang');
      writeFileSync(join(outDir, 'pyodide', 'numpy.whl'), 'wheel');
      // De kopieën van comprimeer.mjs tellen niet: de browser krijgt ze uitgepakt.
      writeFileSync(join(outDir, 'pyodide', 'pyodide.js.br'), 'kopie');
      await pyodideCachePlugin(context).postBuild({ outDir });
      const sw = readFileSync(join(outDir, 'pyodide-sw.js'), 'utf8');
      const inhoud = { 'numpy.whl': som('wheel'), 'pyodide.js': som('ingang') };
      expect(sw).toBe(serviceWorker(inhoud));
      expect(sw).toContain(`const INHOUD = ${JSON.stringify(inhoud)};`);
      // In de browser is er geen `module`: dan moet hij zich aanmelden voor fetch.
      const luister = vi.fn();
      new Function('self', sw)({
        registration: { scope: SCOPE },
        addEventListener: luister,
        fetch: () => {},
        caches: {},
      });
      expect(luister.mock.calls.map((c) => c[0])).toEqual(['install', 'activate', 'fetch']);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('weigert een build zonder pyodide.js', async () => {
    // Dan staat er een service worker zonder INHOUD, die niets bewaart.
    const outDir = mkdtempSync(join(tmpdir(), 'pyodide-sw-'));
    try {
      await expect(pyodideCachePlugin(context).postBuild({ outDir })).rejects.toThrow(
        /pyodide\.js ontbreekt/,
      );
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
