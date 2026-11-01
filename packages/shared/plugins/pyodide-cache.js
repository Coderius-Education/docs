// Zet de service worker voor Pyodide (pyodide-cache/sw.js) in de build als
// <baseUrl>pyodide-sw.js, en meldt hem aan op elke pagina. createConfig voegt
// deze plugin toe voor een site die `pyodide` declareert en geen eigen PWA
// heeft (play wel: zijn src/sw.js cachet Pyodide al, en een tweede service
// worker op dezelfde scope zou die van de PWA vervangen).
//
// In de service worker komt INHOUD: de sha256 van elk bestand onder pyodide/
// van de build (de runtime uit node_modules en de wheels van de site). Hij
// geeft alleen bestanden die daarmee kloppen; zie sw.js waarom.
//
// Alleen in een productie-build: in `docusaurus start` zou een service worker
// bestanden bewaren die de ontwikkelaar net verandert.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const BESTAND = 'pyodide-sw.js';
const BRON = path.join(__dirname, '..', 'pyodide-cache', 'sw.js');
const PLEK = /^const INHOUD = \{\};$/m;

/** Het script dat de service worker aanmeldt, na het laden van de pagina. */
function aanmelder(baseUrl) {
  const sw = JSON.stringify(`${baseUrl}${BESTAND}`);
  const scope = JSON.stringify(baseUrl);
  return `(function(){if(!('serviceWorker' in navigator))return;function m(){navigator.serviceWorker.register(${sw},{scope:${scope}}).catch(function(){})}if(document.readyState==='complete')m();else window.addEventListener('load',m,{once:true})})();`;
}

/**
 * { bestandsnaam: sha256 } voor elk bestand direct onder `map`, zonder de
 * .gz- en .br-kopieën (die komen er pas na de build bij, en de browser krijgt
 * ze uitgepakt).
 */
function vingerafdrukken(map) {
  if (!fs.existsSync(map)) return {};
  const uit = {};
  for (const naam of fs.readdirSync(map).sort()) {
    const pad = path.join(map, naam);
    if (/\.(gz|br)$/.test(naam) || !fs.statSync(pad).isFile()) continue;
    uit[naam] = crypto.createHash('sha256').update(fs.readFileSync(pad)).digest('hex');
  }
  return uit;
}

/** sw.js met INHOUD ingevuld. */
function serviceWorker(inhoud) {
  const bron = fs.readFileSync(BRON, 'utf8');
  if (!PLEK.test(bron))
    throw new Error(`${BRON}: geen regel \`const INHOUD = {};\` om in te vullen`);
  return bron.replace(PLEK, `const INHOUD = ${JSON.stringify(inhoud)};`);
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
      const inhoud = vingerafdrukken(path.join(outDir, 'pyodide'));
      if (!inhoud['pyodide.js']) {
        throw new Error(
          `${outDir}/pyodide/pyodide.js ontbreekt: de service worker heeft niets te bewaren`,
        );
      }
      fs.writeFileSync(path.join(outDir, BESTAND), serviceWorker(inhoud));
    },
  };
};

module.exports.BESTAND = BESTAND;
module.exports.aanmelder = aanmelder;
module.exports.serviceWorker = serviceWorker;
module.exports.vingerafdrukken = vingerafdrukken;
