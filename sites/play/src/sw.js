/**
 * Custom service worker entry — gets concatenated with the auto-generated
 * Docusaurus PWA service worker.
 *
 * Adds runtime caching for:
 *   - Pyodide CDN assets (https://cdn.jsdelivr.net/pyodide/*)
 *   - Local wheel files (/whl/*)
 *
 * Both use CacheFirst so PygbagRunner cold-loads only hit the network once
 * per cache lifetime; subsequent loads come from the SW cache instantly.
 *
 * Note: workbox-* modules are bundled by plugin-pwa via webpack — these ESM
 * imports resolve at build time, not at SW runtime.
 */
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// Pyodide CDN: WASM, Python stdlib zip, package wheels. ~15 MB total.
// Versioned URLs (e.g. /pyodide/v0.27.5/...) so we can cache aggressively.
registerRoute(
  ({ url }) =>
    url.origin === "https://cdn.jsdelivr.net" &&
    url.pathname.startsWith("/pyodide/"),
  new CacheFirst({
    cacheName: "pyodide-cdn",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Local wheels (pymunk, coderius-play). Small but versioned by filename
// (coderius_play-3.3.3-…whl) so old versions safely fall out of cache.
registerRoute(
  ({ url }) => url.pathname.startsWith("/whl/"),
  new CacheFirst({
    cacheName: "play-wheels",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);
