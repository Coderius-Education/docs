// Bouwt één zelfstandig HTML-document uit de projectbestanden voor de
// preview-iframe: gelinkte stylesheets, scripts en afbeeldingen uit het
// project worden ge-inline'd, en console-output gaat via postMessage naar de
// host. (Gegeneraliseerde port van web-docs' CodeEditor/buildDoc.ts: werkt
// met willekeurige bestandsnamen en mappen in plaats van vaste
// style.css/script.js.)

export const MESSAGE_SOURCE = 'coderius-editor';

function consoleInterceptor(token: string): string {
  return `<script>
(function(){
  var send = function(level, args) {
    window.parent.postMessage({
      source: '${MESSAGE_SOURCE}',
      token: '${token}',
      type: 'console',
      level: level,
      text: Array.prototype.slice.call(args).map(function(a) {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }
        return String(a);
      }).join(' ')
    }, '*');
  };
  ['log', 'warn', 'error', 'info'].forEach(function(m) {
    console[m] = function() { send(m, arguments); };
  });
  window.addEventListener('error', function(e) {
    send('error', ['JavaScript fout: ' + e.message]);
  });
})();
<\/script>`;
}

// Pad-resolutie relatief aan het entry-bestand: "./stijl.css", "map/app.js",
// "../style.css" worden allemaal teruggebracht naar een projectpad.
export function resolvePath(baseDir: string, href: string): string {
  const raw = href.startsWith('./') ? href.slice(2) : href;
  const joined = raw.startsWith('/') ? raw.slice(1) : baseDir ? `${baseDir}/${raw}` : raw;
  const parts: string[] = [];
  for (const part of joined.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

function escapeForInline(code: string, tag: string): string {
  // Voorkom dat een letterlijke sluittag in leerlingcode het document breekt.
  return code.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}

function isExternalRef(ref: string): boolean {
  return /^(https?:)?\/\//.test(ref) || ref.startsWith('data:');
}

// Afbeeldingen komen als data:-URL binnen (zie readFiles.ts in de
// website-checker) — die herkennen we zo, in plaats van ze als platte
// tekst te behandelen zoals CSS/JS.
function isAssetDataUrl(content: string): boolean {
  return content.startsWith('data:');
}

// url(...) in geïnlinede CSS is relatief aan de map van dát CSS-bestand,
// niet aan de HTML-entry — dus baseDir hier is per stylesheet anders.
function rewriteCssUrls(
  css: string,
  cssBaseDir: string,
  files: Readonly<Record<string, string>>,
): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (full, _quote: string, ref: string) => {
    if (isExternalRef(ref)) return full;
    const path = resolvePath(cssBaseDir, ref);
    const asset = files[path];
    if (asset === undefined || !isAssetDataUrl(asset)) return full;
    return `url(${asset})`;
  });
}

export function buildDoc(
  files: Readonly<Record<string, string>>,
  entry: string,
  token: string,
): string {
  let result = files[entry] ?? '';
  const baseDir = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/')) : '';

  // <link rel="stylesheet" href="..."> -> <style> met de projectinhoud
  // (met url(...) daarbinnen herschreven naar data-URL's van bekende
  // afbeeldingen).
  result = result.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*\/?>/gi, (linkTag) => {
    const href = linkTag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || isExternalRef(href)) return linkTag;
    const path = resolvePath(baseDir, href);
    const css = files[path];
    if (css === undefined) return linkTag;
    const cssBaseDir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
    return `<style>\n${escapeForInline(rewriteCssUrls(css, cssBaseDir, files), 'style')}\n</style>`;
  });

  // <script src="..."></script> -> inline script met foutafhandeling.
  // defer/async betekent normaal "voer pas uit ná het parsen van de hele
  // pagina" — een inline script kan dat niet nabootsen, dus zulke scripts
  // worden apart verzameld en pas vlak vóór </body> ingevoegd (in
  // volgorde van voorkomen), net als bij een echte uitgestelde load. Zonder
  // dit breekt elk project dat de in de cheatsheet aangeraden
  // `<script src="script.js" defer>`-in-<head>-conventie volgt: DOM-elementen
  // bestaan dan nog niet op het moment dat het script anders inline zou
  // draaien.
  const deferredScripts: string[] = [];
  result = result.replace(
    /<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (scriptTag, src: string) => {
      if (isExternalRef(src)) return scriptTag;
      const path = resolvePath(baseDir, src);
      const js = files[path];
      if (js === undefined) return scriptTag;
      const inline = `<script>
try {
${escapeForInline(js, 'script')}
} catch (e) {
  console.error('JavaScript fout: ' + e.message);
}
<\/script>`;
      if (/\b(defer|async)\b/i.test(scriptTag)) {
        deferredScripts.push(inline);
        return '';
      }
      return inline;
    },
  );

  if (deferredScripts.length > 0) {
    const block = deferredScripts.join('\n');
    result = result.includes('</body>')
      ? result.replace('</body>', `${block}\n</body>`)
      : `${result}\n${block}`;
  }

  // <img src="..."> -> data-URL van het bekende bestand, want de
  // preview-iframe heeft geen echte bestandslocatie (alleen srcDoc) waar een
  // relatief pad ooit naar zou kunnen wijzen.
  result = result.replace(
    /<img\b([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
    (imgTag, before: string, src: string, after: string) => {
      if (isExternalRef(src)) return imgTag;
      const path = resolvePath(baseDir, src);
      const asset = files[path];
      if (asset === undefined || !isAssetDataUrl(asset)) return imgTag;
      return `<img${before} src="${asset}"${after}>`;
    },
  );

  // Console-interceptor als allereerste script, zodat ook inline <script>-tags
  // en laadfouten in de console van de editor terechtkomen.
  const interceptor = consoleInterceptor(token);
  result = result.includes('<head>')
    ? result.replace('<head>', `<head>\n${interceptor}`)
    : `${interceptor}\n${result}`;

  return result;
}
