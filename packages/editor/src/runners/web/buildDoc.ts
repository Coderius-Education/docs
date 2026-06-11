// Bouwt één zelfstandig HTML-document uit de projectbestanden voor de
// preview-iframe: gelinkte stylesheets en scripts uit het project worden
// ge-inline'd, en console-output gaat via postMessage naar de host.
// (Gegeneraliseerde port van web-docs' CodeEditor/buildDoc.ts: werkt met
// willekeurige bestandsnamen en mappen in plaats van vaste style.css/script.js.)

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

export function buildDoc(
  files: Readonly<Record<string, string>>,
  entry: string,
  token: string,
): string {
  let result = files[entry] ?? '';
  const baseDir = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/')) : '';

  // <link rel="stylesheet" href="..."> -> <style> met de projectinhoud.
  result = result.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*\/?>/gi, (linkTag) => {
    const href = linkTag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || /^(https?:)?\/\//.test(href)) return linkTag;
    const path = resolvePath(baseDir, href);
    const css = files[path];
    if (css === undefined) return linkTag;
    return `<style>\n${escapeForInline(css, 'style')}\n</style>`;
  });

  // <script src="..."></script> -> inline script met foutafhandeling.
  result = result.replace(
    /<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (scriptTag, src: string) => {
      if (/^(https?:)?\/\//.test(src)) return scriptTag;
      const path = resolvePath(baseDir, src);
      const js = files[path];
      if (js === undefined) return scriptTag;
      return `<script>
try {
${escapeForInline(js, 'script')}
} catch (e) {
  console.error('JavaScript fout: ' + e.message);
}
<\/script>`;
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
