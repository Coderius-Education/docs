import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
/**
 * Custom service worker entry — gets concatenated with the auto-generated
 * Docusaurus PWA service worker.
 *
 * Adds runtime caching for:
 *   - de eigen Pyodide (<baseUrl>pyodide/*, bv. /play/pyodide/*)
 *   - Local wheel files (<baseUrl>whl/*, bv. /play/whl/*)
 *
 * Both use CacheFirst so PygbagRunner cold-loads only hit the network once
 * per cache lifetime; subsequent loads come from the SW cache instantly.
 *
 * Note: workbox-* modules are bundled by plugin-pwa via webpack — these ESM
 * imports resolve at build time, not at SW runtime.
 */
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

// De site staat onder een pad van de vak-host (/play/), en de scope van de
// service worker is precies die baseUrl.
const SCOPE = new URL(self.registration.scope).pathname;

// Pyodide van de site zelf: wasm, standaardbibliotheek, pakketten. ~15 MB.
// De pagina haalt ze op voor de iframe (wielen.js) met ?v=<versie> erachter;
// die zit in de cachesleutel, dus een nieuwe Pyodide komt niet achter de oude
// in de cache te zitten. Een oude versie (een stuk of negen bestanden) valt er
// na 30 dagen uit (maxAgeSeconds); maxEntries is alleen een bovengrens.
// De precache van de PWA laat pyodide/ bewust links liggen: zie
// injectManifestConfig in docusaurus.config.ts.
const PYODIDE_PREFIX = `${SCOPE}pyodide/`;
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith(PYODIDE_PREFIX),
  new CacheFirst({
    cacheName: 'play-pyodide',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

// Local wheels (pymunk, coderius-play). Small but versioned by filename
// (coderius_play-3.5.0-…whl, pymunk-7.3.1-…whl) so old versions safely fall out of cache.
// Een play-wheel die nog niet op PyPI staat, draagt daarom een build-tag in zijn
// naam (scripts/play-wheels.py): de release krijgt zo een andere naam en komt
// niet achter de oude build in de cache te zitten.
const WHL_PREFIX = `${SCOPE}whl/`;
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith(WHL_PREFIX),
  new CacheFirst({
    cacheName: 'play-wheels',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);
