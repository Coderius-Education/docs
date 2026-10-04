// Elk bericht draagt de id van het veld waar de pagina bij hoort. Er staan
// meerdere velden op een lespagina, en `e.source` vergelijken met de
// contentWindow van de iframe werkt niet altijd: navigeert de leerling naar
// een andere site, dan wisselt Chromium de iframe van proces en is het
// bericht van pagehide al van een "ander" window tegen de tijd dat het
// aankomt. De id zit in de srcDoc en is voor een vreemde pagina onbekend.
const CONSOLE_INTERCEPTOR = (veld: string) => `<script>
(function(){
  var veld = ${JSON.stringify(veld)};
  // Alleen de eigen pagina van de leerling draagt dit script; een gevolgde
  // link niet. Zo weet de les dat het voorbeeld zijn eigen pagina toont, en
  // hoort hij het meteen als die pagina verlaten wordt (de leerling klikte
  // op een link): dan komt er een knop om terug te komen. De iframe zelf
  // verraadt niets, want hij heeft een eigen origin.
  window.parent.postMessage({ source: 'code-editor', veld: veld, type: 'eigen' }, '*');
  window.addEventListener('pagehide', function() {
    window.parent.postMessage({ source: 'code-editor', veld: veld, type: 'verlaten' }, '*');
  });
  // Een anker (href="#" of "#boven") of een lege href zou de hele lessite in
  // het voorbeeld laden, want een srcdoc-document erft de basis-URL van de
  // pagina eromheen. Een anker scrolt daarom hier, een lege href herlaadt
  // het voorbeeld: precies wat een browser op een echte pagina doet.
  document.addEventListener('click', function(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '') { e.preventDefault(); window.location.reload(); return; }
    if (href === null || href.charAt(0) !== '#') return;
    e.preventDefault();
    var doel = href.length > 1 ? document.getElementById(href.slice(1)) : null;
    if (doel) { doel.scrollIntoView(); } else if (href.length === 1) { window.scrollTo(0, 0); }
  });
  var send = function(level, args) {
    window.parent.postMessage({
      source: 'code-editor',
      veld: veld,
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
  // Het voorbeeld is een gesandboxte iframe met een eigen origin: een toets
  // hierbinnen bereikt het window van de les nooit. Klikt de leerling in zijn
  // eigen pagina en drukt hij dan op Escape, dan gebeurde er niets terwijl de
  // knop "Sluiten (Esc)" beloofde. Daarom melden we die toets zelf.
  window.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    window.parent.postMessage({ source: 'code-editor', veld: veld, type: 'escape' }, '*');
  });
})();
<\/script>`;

// Meldt de hoogte van de inhoud aan het veld eromheen, zodat het voorbeeld
// in de gestapelde vorm kan eindigen waar de inhoud eindigt. body.scrollHeight
// is onafhankelijk van scrollen; de body-marges tellen we er zelf bij op.
const HEIGHT_REPORTER = (veld: string) => `<script>
(function(){
  var veld = ${JSON.stringify(veld)};
  var meld = function() {
    var b = document.body;
    if (!b) return;
    var stijl = getComputedStyle(b);
    var h = Math.ceil(b.scrollHeight + parseFloat(stijl.marginTop) + parseFloat(stijl.marginBottom));
    window.parent.postMessage({ source: 'code-editor', veld: veld, type: 'height', height: h }, '*');
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

const JS_WRAPPER = (js: string, veld: string) => `
<script>
try {
${js}
} catch (e) {
  const pre = document.createElement('pre');
  pre.style.cssText = 'color:red;background:#fff3f3;padding:8px;border:1px solid red;border-radius:4px;margin:0';
  pre.textContent = 'JavaScript fout: ' + e.message;
  document.body.prepend(pre);
  window.parent.postMessage({ source: 'code-editor', veld: ${JSON.stringify(veld)}, type: 'console', level: 'error', text: 'JavaScript fout: ' + e.message }, '*');
}
<\/script>`;

/** `veld`: de id van het oefenveld; elk bericht uit de pagina draagt hem. */
export function buildDoc(html: string, css: string, js: string, veld = ''): string {
  let result = html;

  // Inject console interceptor as the very first script in <head> (always, so inline <script> tags also reach the console)
  const kopScripts = `${CONSOLE_INTERCEPTOR(veld)}\n${HEIGHT_REPORTER(veld)}`;
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
    const scriptTag = JS_WRAPPER(js, veld);
    result = result.replace(scriptSrcRegex, '');
    result = result.includes('</body>')
      ? result.replace('</body>', `${scriptTag}\n</body>`)
      : `${result}\n${scriptTag}`;
  }

  return result;
}
