// Service worker voor de Pyodide van een site: <baseUrl>pyodide-sw.js.
//
// Python in de browser laadt bij elke paginalading de runtime van Pyodide
// (wasm, standaardbibliotheek, 12 MB, met brotli 5 MB). Of de browser die
// bewaart, hangt af van de headers van de hosting: met `no-store`, of zonder
// ETag en Last-Modified, kwam hij bij elke les opnieuw over de lijn. Play had
// al een eigen service worker en was daardoor na het eerste bezoek snel; de
// andere sites niet. Deze service worker bewaart alles onder <baseUrl>pyodide/
// in een eigen cache, wat de hosting ook stuurt.
//
// Eén regel houdt een upgrade veilig. Elke lader (getPyodide, die van
// algorithms) haalt eerst pyodide.js op, en daarna pas de rest. Die ene
// ingang vraagt de service worker altijd aan het netwerk (no-cache: een 304
// als niets veranderde, en offline de bewaarde). Is hij anders dan de
// bewaarde, dan is er een nieuwe Pyodide en gaat de hele cache weg, vóór de
// browser de rest vraagt. Zonder bewaarde ingang (de pagina laadde Pyodide al
// voor de service worker er was) bewaart hij niets: dan weet hij niet bij
// welke versie de bestanden horen. Zo komt een oude wasm nooit naast een
// nieuwe pyodide.js, en hoeft geen lader een versie mee te geven.
//
// Alles buiten <baseUrl>pyodide/ (pagina's, scripts van de site) gaat er
// ongemoeid langs. Weghalen: zet hier een versie neer die zichzelf
// afmeldt (self.registration.unregister()) en zijn cache wist.
//
// Gewoon JavaScript zonder bundler: dit bestand gaat zoals het is naar de
// build (plugins/pyodide-cache.js). De logica staat in maakAfhandeling, zodat
// pyodide-cache.test.ts hem in node kan naspelen.

/**
 * @param {{ caches: CacheStorage, fetch: typeof fetch, scope: string, wachtOp?: (p: Promise<unknown>) => void }} omgeving
 * @returns {(request: Request) => Promise<Response> | null} null: niet voor ons
 */
function maakAfhandeling({ caches, fetch, scope, wachtOp = () => {} }) {
  const basis = new URL('pyodide/', scope);
  // Alle cursussen van een vak delen één origin, en dus één Cache Storage:
  // elke site een eigen cache.
  const naam = `coderius-pyodide ${basis.pathname}`;
  const ingang = new URL('pyodide.js', basis).href;
  const sleutel = (url) => url.origin + url.pathname;

  function gelijk(a, b) {
    if (a.byteLength !== b.byteLength) return false;
    const x = new Uint8Array(a);
    const y = new Uint8Array(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }

  async function haalIngang(request) {
    let netwerk;
    try {
      netwerk = await fetch(request, { cache: 'no-cache' });
    } catch (fout) {
      const bewaard = await (await caches.open(naam)).match(ingang);
      if (bewaard) return bewaard;
      throw fout;
    }
    if (netwerk.status !== 200) return netwerk;
    const nieuw = await netwerk.clone().arrayBuffer();
    const cache = await caches.open(naam);
    const oud = await cache.match(ingang);
    if (!oud || !gelijk(await oud.arrayBuffer(), nieuw)) {
      await caches.delete(naam);
      await (await caches.open(naam)).put(ingang, netwerk.clone());
    }
    return netwerk;
  }

  async function haalBestand(request, url) {
    const cache = await caches.open(naam);
    const bewaard = await cache.match(sleutel(url));
    if (bewaard) return bewaard;
    // Ook hier no-cache: een gewone fetch mag uit de HTTP-cache van de
    // browser antwoorden, en die kan na een upgrade nog de oude wasm-lijm
    // of standaardbibliotheek hebben. Bewaard naast de nieuwe pyodide.js
    // bleef die mix staan tot de volgende versie, en dan laadt Python niet.
    // Met no-cache vraagt de browser de server; die zegt 304 als het bestand
    // niet veranderde.
    const netwerk = await fetch(request, { cache: 'no-cache' });
    if (netwerk.status === 200 && (await cache.match(ingang))) {
      wachtOp(cache.put(sleutel(url), netwerk.clone()).catch(() => {}));
    }
    return netwerk;
  }

  return (request) => {
    if (request.method !== 'GET' || request.headers.has('range')) return null;
    const url = new URL(request.url);
    if (url.origin !== basis.origin || !url.pathname.startsWith(basis.pathname)) return null;
    const antwoord = sleutel(url) === ingang ? haalIngang(request) : haalBestand(request, url);
    // Gaat er iets mis met de cache (vol, geblokkeerd), dan het netwerk.
    return antwoord.catch(() => fetch(request));
  };
}

if (typeof module !== 'undefined') {
  module.exports = { maakAfhandeling };
} else if (typeof self !== 'undefined' && self.registration) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', (event) => {
    const afhandeling = maakAfhandeling({
      caches: self.caches,
      fetch: self.fetch.bind(self),
      scope: self.registration.scope,
      wachtOp: (p) => event.waitUntil(p),
    });
    const antwoord = afhandeling(event.request);
    if (antwoord) event.respondWith(antwoord);
  });
}
