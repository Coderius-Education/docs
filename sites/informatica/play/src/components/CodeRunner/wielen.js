// De runner-iframes van play draaien leerlingcode (Python met `import js`,
// dus volledige toegang tot hun eigen document). Sinds alle informatica-
// cursussen één origin delen (informatica.coderius.nl/<pad>/), mogen die
// iframes geen allow-same-origin meer hebben: anders leest leerlingcode de
// localStorage, IndexedDB en cookies van élke cursus. Zonder allow-same-origin
// heeft de iframe een opaque origin en kan hij /play/whl/*.whl niet zelf
// ophalen (geen CORS). Daarom haalt de pagina de wheels op (zelfde origin,
// ook uit de service-worker-cache) en geeft ze als bytes door; de iframe
// installeert ze met pyodide.unpackArchive.

import { siteBasis } from './sitebasis';

/** Alleen wheels uit /play/whl/ van deze site; de iframe vraagt, wij kiezen. */
export function isToegestaanWiel(url, basis = siteBasis()) {
  if (typeof url !== 'string' || !basis) return false;
  if (!url.startsWith(`${basis}/whl/`) || !url.endsWith('.whl')) return false;
  const rest = url.slice(`${basis}/whl/`.length);
  return /^[A-Za-z0-9._-]+\.whl$/.test(rest);
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
  if (!d.urls.every((u) => isToegestaanWiel(u))) {
    antwoord({ fout: 'wiel buiten /whl/ geweigerd' });
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
 * JS voor in de srcdoc: vraagt de wheels aan de ouder en installeert ze.
 * Vervangt `pyodide.loadPackage(WHEELS)` voor de URL-wheels.
 */
export const LAAD_WIELEN_SNIPPET = `
async function laadWielen(pyodide, urls) {
  const id = Math.random().toString(36).slice(2);
  const buffers = await new Promise((resolve, reject) => {
    function op(e) {
      if (e.source !== window.parent || !e.data || e.data.type !== 'wielen' || e.data.id !== id) return;
      window.removeEventListener('message', op);
      if (e.data.fout) reject(new Error(e.data.fout));
      else resolve(e.data.buffers);
    }
    window.addEventListener('message', op);
    window.parent.postMessage({ type: 'wielen-nodig', id, urls }, '*');
  });
  for (const buffer of buffers) pyodide.unpackArchive(buffer, 'wheel');
}
`;
