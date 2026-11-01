// Zet de service worker voor Pyodide (pyodide-cache/sw.js) in de build als
// <baseUrl>pyodide-sw.js, en meldt hem aan op elke pagina. createConfig voegt
// deze plugin toe voor een site die `pyodide` declareert en geen eigen PWA
// heeft (play wel: zijn src/sw.js cachet Pyodide al, en een tweede service
// worker op dezelfde scope zou die van de PWA vervangen).
//
// Alleen in een productie-build: in `docusaurus start` zou een service worker
// bestanden bewaren die de ontwikkelaar net verandert.

const fs = require('node:fs');
const path = require('node:path');

const BESTAND = 'pyodide-sw.js';
const BRON = path.join(__dirname, '..', 'pyodide-cache', 'sw.js');

/** Het script dat de service worker aanmeldt, na het laden van de pagina. */
function aanmelder(baseUrl) {
  const sw = JSON.stringify(`${baseUrl}${BESTAND}`);
  const scope = JSON.stringify(baseUrl);
  return `(function(){if(!('serviceWorker' in navigator))return;function m(){navigator.serviceWorker.register(${sw},{scope:${scope}}).catch(function(){})}if(document.readyState==='complete')m();else window.addEventListener('load',m,{once:true})})();`;
}

module.exports = function pyodideCachePlugin(context) {
  const productie = process.env.NODE_ENV === 'production';
  return {
    name: 'coderius-pyodide-cache',
    injectHtmlTags() {
      if (!productie) return {};
      return {
        postBodyTags: [
          { tagName: 'script', attributes: {}, innerHTML: aanmelder(context.siteConfig.baseUrl) },
        ],
      };
    },
    async postBuild({ outDir }) {
      fs.copyFileSync(BRON, path.join(outDir, BESTAND));
    },
  };
};

module.exports.BESTAND = BESTAND;
module.exports.aanmelder = aanmelder;
