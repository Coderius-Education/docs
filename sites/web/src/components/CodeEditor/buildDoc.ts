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
  result = result.includes('<head>')
    ? result.replace('<head>', `<head>\n${CONSOLE_INTERCEPTOR}`)
    : CONSOLE_INTERCEPTOR + '\n' + result;

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
      : result + '\n' + scriptTag;
  }

  return result;
}
