const CONSOLE_INTERCEPTOR = `<script>
(function(){
  var send = function(level, args) {
    window.parent.postMessage({
      source: 'code-editor',
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
  window.addEventListener('unhandledrejection', function(e) {
    var r = e.reason;
    send('error', ['JavaScript fout: ' + (r && r.message ? r.message : String(r))]);
  });
})();
<\/script>`;

// Meldt de hoogte van de inhoud aan het veld eromheen, zodat het voorbeeld
// in de gestapelde vorm kan eindigen waar de inhoud eindigt. body.scrollHeight
// is onafhankelijk van scrollen; de body-marges tellen we er zelf bij op.
const HEIGHT_REPORTER = `<script>
(function(){
  var meld = function() {
    var b = document.body;
    if (!b) return;
    var stijl = getComputedStyle(b);
    var h = Math.ceil(b.scrollHeight + parseFloat(stijl.marginTop) + parseFloat(stijl.marginBottom));
    window.parent.postMessage({ source: 'code-editor', type: 'height', height: h }, '*');
  };
  window.addEventListener('load', meld);
  document.addEventListener('DOMContentLoaded', function() {
    meld();
    if (window.ResizeObserver && document.body) {
      new ResizeObserver(meld).observe(document.body);
    }
  });
})();
<\/script>`;

const JS_WRAPPER = (js: string) => `
<script>
try {
${js}
} catch (e) {
  const pre = document.createElement('pre');
  pre.style.cssText = 'color:red;background:#fff3f3;padding:8px;border:1px solid red;border-radius:4px;margin:0';
  pre.textContent = 'JavaScript fout: ' + e.message;
  document.body.prepend(pre);
  window.parent.postMessage({ source: 'code-editor', type: 'console', level: 'error', text: 'JavaScript fout: ' + e.message }, '*');
}
<\/script>`;

export function buildDoc(html: string, css: string, js: string): string {
  let result = html;

  // Inject console interceptor as the very first script in <head> (always, so inline <script> tags also reach the console)
  const kopScripts = `${CONSOLE_INTERCEPTOR}\n${HEIGHT_REPORTER}`;
  result = result.includes('<head>')
    ? result.replace('<head>', `<head>\n${kopScripts}`)
    : `${kopScripts}\n${result}`;

  // Replace <link rel="stylesheet" ...> with a <style> tag containing the CSS tab content
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*\/?>/i;
  if (linkRegex.test(result)) {
    result = result.replace(linkRegex, `<style>\n${css}\n</style>`);
  }

  // Remove the <script src="script.js"> placeholder (keeps HTML educational but doesn't run here)
  // Then inject actual JS before </body> so the DOM is ready (equivalent to defer)
  const scriptSrcRegex = /<script[^>]*src=["']script\.js["'][^>]*(?:\/>|><\/script>)/i;
  if (js.trim()) {
    const scriptTag = JS_WRAPPER(js);
    result = result.replace(scriptSrcRegex, '');
    result = result.includes('</body>')
      ? result.replace('</body>', `${scriptTag}\n</body>`)
      : `${result}\n${scriptTag}`;
  }

  return result;
}
