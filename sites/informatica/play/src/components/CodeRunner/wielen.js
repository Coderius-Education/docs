// De runner-iframes van play draaien leerlingcode (Python met `import js`,
// dus volledige toegang tot hun eigen document). Sinds alle informatica-
// cursussen één origin delen (informatica.coderius.nl/<pad>/), mogen die
// iframes geen allow-same-origin meer hebben: anders leest leerlingcode de
// localStorage, IndexedDB en cookies van élke cursus. Zonder allow-same-origin
// heeft de iframe een opaque origin en kan hij niets van de eigen site ophalen
// (geen CORS). Daarom haalt de pagina de bestanden op (zelfde origin, ook uit
// de service-worker-cache) en geeft ze als bytes door: de wheels uit /whl/, en
// sinds play Pyodide zelf serveert ook de runtime en de Pyodide-pakketten uit
// /pyodide/. De iframe installeert een wheel met pyodide.unpackArchive, en
// laat Pyodide zijn eigen bestanden via een fetch ophalen die bij de pagina
// aanklopt (laadPyodide hieronder).

import { siteBasis } from './sitebasis';

/**
 * Alleen wat de iframe van deze site nodig heeft: een wheel uit /whl/, of een
 * bestand uit /pyodide/ (eventueel met `?v=<versie>`, voor de cache van de
 * service worker). Geen submappen, geen `..`: de iframe vraagt, wij kiezen.
 */
export function isToegestaanBestand(url, basis = siteBasis()) {
  if (typeof url !== 'string' || !basis) return false;
  const whl = `${basis}/whl/`;
  if (url.startsWith(whl)) return /^[A-Za-z0-9_-][A-Za-z0-9._-]*\.whl$/.test(url.slice(whl.length));
  const pyodide = `${basis}/pyodide/`;
  if (url.startsWith(pyodide)) {
    return /^[A-Za-z0-9_-][A-Za-z0-9._-]*(\?v=[0-9A-Za-z.]+)?$/.test(url.slice(pyodide.length));
  }
  return false;
}

/**
 * Beantwoordt een `wielen-nodig`-verzoek van precies deze iframe. Geeft true
 * terug als het bericht hiervoor was.
 * @param {MessageEvent} e
 * @param {Window | null | undefined} iframeWindow
 */
export function beantwoordWielen(e, iframeWindow) {
  if (!iframeWindow || e.source !== iframeWindow) return false;
  const d = e.data;
  if (!d || d.type !== 'wielen-nodig' || typeof d.id !== 'string' || !Array.isArray(d.urls)) {
    return false;
  }
  const antwoord = (extra, transfer) =>
    // Opaque origin: '*' is de enige targetOrigin die aankomt; het zijn
    // openbare wheels, geen geheimen, en e.source is al gecontroleerd.
    iframeWindow.postMessage({ type: 'wielen', id: d.id, ...extra }, '*', transfer);
  if (!d.urls.every((u) => isToegestaanBestand(u))) {
    antwoord({ fout: 'bestand buiten /whl/ en /pyodide/ geweigerd' });
    return true;
  }
  Promise.all(
    d.urls.map((u) =>
      fetch(u).then((r) => {
        if (!r.ok) throw new Error(`${u}: ${r.status}`);
        return r.arrayBuffer();
      }),
    ),
  ).then(
    (buffers) => antwoord({ buffers }, buffers),
    (err) => antwoord({ fout: String(err) }),
  );
  return true;
}

/**
 * JS voor in de srcdoc. `vraagBestanden` haalt bytes via de pagina;
 * `laadWielen` installeert wheels (in plaats van `pyodide.loadPackage(WHEELS)`),
 * en `laadPyodide` start Pyodide uit /pyodide/ van de site.
 *
 * laadPyodide: Pyodide haalt zijn wasm, de standaardbibliotheek, het
 * lock-bestand en elk pakket met de globale `fetch` op `indexURL`. In deze
 * iframe gaat zo'n fetch naar de eigen site, en die faalt zonder CORS; daarom
 * klopt de `fetch` hier voor alles onder `basis` bij de pagina aan, met de
 * versie erachter zodat de cache van de service worker per versie is. De twee
 * scripts (pyodide.js en pyodide.asm.js) komen op dezelfde manier binnen en
 * draaien met een indirecte eval: het zijn klassieke scripts die hun
 * ingang zelf op globalThis zetten, en zo is er geen blob-URL nodig (die gaan
 * vanuit een opaque origin niet in elke browser).
 */
export const LAAD_WIELEN_SNIPPET = `
function vraagBestanden(urls) {
  const id = Math.random().toString(36).slice(2);
  return new Promise((resolve, reject) => {
    function op(e) {
      if (e.source !== window.parent || !e.data || e.data.type !== 'wielen' || e.data.id !== id) return;
      window.removeEventListener('message', op);
      if (e.data.fout) reject(new Error(e.data.fout));
      else resolve(e.data.buffers);
    }
    window.addEventListener('message', op);
    window.parent.postMessage({ type: 'wielen-nodig', id, urls }, '*');
  });
}
async function laadWielen(pyodide, urls) {
  const buffers = await vraagBestanden(urls);
  for (const buffer of buffers) pyodide.unpackArchive(buffer, 'wheel');
}
async function laadPyodide(basis, versie, opties) {
  const metVersie = (url) => url + '?v=' + versie;
  const echteFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (bron, init) => {
    const url = typeof bron === 'string' ? bron : bron instanceof URL ? bron.href : bron.url;
    if (!url.startsWith(basis)) return echteFetch(bron, init);
    const [buffer] = await vraagBestanden([metVersie(url)]);
    const type = url.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream';
    return new Response(buffer, { headers: { 'content-type': type } });
  };
  const [loader, runtime] = await vraagBestanden(
    [metVersie(basis + 'pyodide.js'), metVersie(basis + 'pyodide.asm.js')],
  );
  const tekst = new TextDecoder();
  (0, eval)(tekst.decode(runtime));
  (0, eval)(tekst.decode(loader));
  return globalThis.loadPyodide({ indexURL: basis, ...opties });
}
`;
