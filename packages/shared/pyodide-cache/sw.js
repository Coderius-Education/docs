// Service worker voor de Pyodide van een site: <baseUrl>pyodide-sw.js.
//
// Python in de browser laadt bij elke paginalading de runtime van Pyodide
// (wasm, standaardbibliotheek, 12 MB, met brotli 5 MB). Of de browser die
// bewaart, hangt af van de headers van de hosting: met `no-store`, of zonder
// ETag en Last-Modified, kwam hij bij elke les opnieuw over de lijn. Play had
// al een eigen service worker en was daardoor na het eerste bezoek snel; de
// andere sites niet. Deze service worker bewaart wat onder <baseUrl>pyodide/
// staat in een eigen cache, wat de hosting ook stuurt.
//
// Alleen wat klopt. De build zet hieronder in INHOUD de sha256 van elk
// bestand onder pyodide/ (plugins/pyodide-cache.js). Een bewaard bestand gaat
// alleen naar de pagina als het die vingerafdruk heeft, en een bestand van
// het netwerk gaat alleen de cache in als het die heeft. Leerlingcode draait
// in python, ctf, ide en algorithms op de origin van de site en kan via
// `import js` in Cache Storage schrijven: zonder deze controle draaide een
// vervalste pyodide.asm.js na één run bij elk volgend bezoek mee, en dat
// bleef zo tot de volgende Pyodide. Hetzelfde houdt na een upgrade een oude
// wasm-lijm uit de HTTP-cache van de browser buiten de cache.
//
// Eén versie per keer. Elke versie van INHOUD heeft een eigen cache; bij het
// activeren gaan de caches van eerdere versies van deze cursus weg. Heeft de
// server al een andere pyodide.js dan deze service worker kent (er is net een
// nieuwe Pyodide uitgerold en de browser heeft de nieuwe service worker nog
// niet), dan komt voor die pagina alles van het netwerk, en niets uit de
// cache: zo laadt hij nooit een mix van twee versies. Elke lader (getPyodide,
// die van algorithms) haalt eerst pyodide.js, dus dat weet hij op tijd.
//
// Alles buiten <baseUrl>pyodide/, en wat niet in INHOUD staat, gaat er
// ongemoeid langs. Weghalen: zet hier een versie neer die zichzelf afmeldt
// (self.registration.unregister()) en zijn caches wist.
//
// Gewoon JavaScript zonder bundler: dit bestand gaat, met INHOUD ingevuld,
// naar de build. De logica staat in maakAfhandeling, zodat
// pyodide-cache.test.ts hem in node kan naspelen.

// Bij de build vervangen door plugins/pyodide-cache.js: { bestandsnaam: sha256 }.
const INHOUD = {};

async function sha256(buffer) {
  const som = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(som), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** De caches van deze cursus heten `coderius-pyodide <pad> <versie>`. */
function cacheNamen(scope, inhoud) {
  const basis = new URL('pyodide/', scope);
  const voorvoegsel = `coderius-pyodide ${basis.pathname}`;
  const versie = Object.keys(inhoud)
    .sort()
    .map((n) => `${n}=${inhoud[n]}`)
    .join(',');
  // Een korte, vaste naam per INHOUD (geen crypto nodig: hoeft niet geheim).
  let h = 0;
  for (let i = 0; i < versie.length; i++) h = (Math.imul(31, h) + versie.charCodeAt(i)) | 0;
  return { basis, voorvoegsel, naam: `${voorvoegsel} ${(h >>> 0).toString(16)}` };
}

/** Gooit de caches van eerdere versies van deze cursus weg, en alleen die. */
async function ruimOp({ caches, scope, inhoud }) {
  const { voorvoegsel, naam } = cacheNamen(scope, inhoud);
  for (const sleutel of await caches.keys()) {
    const vanDezeCursus = sleutel === voorvoegsel || sleutel.startsWith(`${voorvoegsel} `);
    if (vanDezeCursus && sleutel !== naam) await caches.delete(sleutel);
  }
}

/**
 * @param {{ caches: CacheStorage, fetch: typeof fetch, scope: string, inhoud: Record<string, string> }} omgeving
 * @returns {(request: Request, client?: string, wachtOp?: (p: Promise<unknown>) => void) =>
 *   Promise<Response> | null} null: niet voor ons. wachtOp: event.waitUntil, zodat
 *   de service worker het bewaren afmaakt.
 */
function maakAfhandeling({ caches, fetch, scope, inhoud }) {
  const { basis, naam } = cacheNamen(scope, inhoud);
  // Pagina's die een andere versie op de server zagen dan INHOUD: die krijgen
  // alles van het netwerk. In het geheugen: een pagina laadt Pyodide binnen
  // een paar seconden, zolang draait de service worker.
  const andereVersie = new Set();

  /** Het netwerk, buiten de HTTP-cache van de browser om (304 als niets veranderde). */
  const netwerk = (request) => fetch(request, { cache: 'no-cache' });

  /** Het bewaarde bestand, als het de vingerafdruk uit INHOUD heeft. */
  async function uitCache(cache, sleutel, som) {
    const bewaard = await cache.match(sleutel);
    if (!bewaard) return null;
    const inhoudBuffer = await bewaard.arrayBuffer();
    if ((await sha256(inhoudBuffer)) !== som) {
      await cache.delete(sleutel);
      return null;
    }
    const kop = new Headers(bewaard.headers);
    kop.delete('content-encoding');
    kop.delete('content-length');
    return new Response(inhoudBuffer, { status: 200, headers: kop });
  }

  async function afhandelen(request, client, wachtOp, bestand, sleutel, som) {
    const ingang = bestand === 'pyodide.js';
    if (!ingang && andereVersie.has(client)) return netwerk(request);
    const cache = await caches.open(naam);

    // De ingang altijd eerst aan het netwerk: zo zien we een nieuwe versie.
    // Al het andere eerst uit de cache.
    if (!ingang) {
      const bewaard = await uitCache(cache, sleutel, som);
      if (bewaard) return bewaard;
    }
    let antwoord;
    try {
      antwoord = await netwerk(request);
    } catch (fout) {
      // Offline: de bewaarde, als die klopt.
      const bewaard = await uitCache(cache, sleutel, som);
      if (bewaard) return bewaard;
      throw fout;
    }
    if (antwoord.status !== 200) return antwoord;
    const klopt = (await sha256(await antwoord.clone().arrayBuffer())) === som;
    if (klopt) {
      wachtOp(cache.put(sleutel, antwoord.clone()).catch(() => {}));
    } else if (ingang && client) {
      andereVersie.add(client);
    }
    return antwoord;
  }

  return (request, client = '', wachtOp = () => {}) => {
    if (request.method !== 'GET' || request.headers.has('range')) return null;
    const url = new URL(request.url);
    if (url.origin !== basis.origin || !url.pathname.startsWith(basis.pathname)) return null;
    const bestand = url.pathname.slice(basis.pathname.length);
    const som = Object.hasOwn(inhoud, bestand) ? inhoud[bestand] : null;
    if (!som) return null;
    // Gaat er iets mis met de cache (vol, geblokkeerd), dan het netwerk.
    return afhandelen(request, client, wachtOp, bestand, url.origin + url.pathname, som).catch(() =>
      fetch(request),
    );
  };
}

if (typeof module !== 'undefined') {
  module.exports = { INHOUD, cacheNamen, maakAfhandeling, ruimOp, sha256 };
} else if (typeof self !== 'undefined' && self.registration) {
  const omgeving = { caches: self.caches, scope: self.registration.scope, inhoud: INHOUD };
  const afhandeling = maakAfhandeling({ ...omgeving, fetch: self.fetch.bind(self) });
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) =>
    event.waitUntil(ruimOp(omgeving).then(() => self.clients.claim())),
  );
  self.addEventListener('fetch', (event) => {
    const antwoord = afhandeling(event.request, event.clientId, (p) => event.waitUntil(p));
    if (antwoord) event.respondWith(antwoord);
  });
}
