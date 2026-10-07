const path = require('node:path');

// Klassen in de cursussen: theme-wikkels voor de sidebar en een balk boven de
// les (packages/shared/theme), plus een head-script dat de sidebar verbergt tot
// de klas geladen is, zodat leerlingen niet eerst alle hoofdstukken zien
// flitsen. Na 3 s verschijnt hij hoe dan ook. Zie klas/index.js.

const VOOR_HYDRATIE = `(function(){try{if(/(?:^|;\\s*)cdx_klas=[a-z0-9]/.test(document.cookie)){var d=document.documentElement;d.setAttribute('data-klas','');setTimeout(function(){d.setAttribute('data-klas-klaar','')},3000)}}catch(e){}})();`;

module.exports = function klasPlugin() {
  return {
    name: 'coderius-klas',
    getThemePath() {
      return path.join(__dirname, '..', 'theme');
    },
    injectHtmlTags() {
      return { headTags: [{ tagName: 'script', attributes: {}, innerHTML: VOOR_HYDRATIE }] };
    },
  };
};

module.exports.VOOR_HYDRATIE = VOOR_HYDRATIE;
