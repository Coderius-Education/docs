// Verhuist een les naar een ander adres, dan wijst een oude link (een
// werkblad, een bladwijzer, een zoekresultaat) nergens meer heen. Deze plugin
// schrijft na de build op elk oud adres een kleine pagina die meteen
// doorstuurt naar het nieuwe, zonder extra dependency. Geef de lijst mee als
// `omleidingen` aan createConfig: [{ van: '/docs/oud', naar: '/docs/nieuw' }].

const fs = require('node:fs');
const path = require('node:path');

function ontsnap(tekst) {
  return tekst.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function omleidingHtml(naar, canoniek = naar) {
  const doel = ontsnap(naar);
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Deze les is verhuisd</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${ontsnap(canoniek)}">
<meta http-equiv="refresh" content="0; url=${doel}">
<script>location.replace(${JSON.stringify(naar)} + location.hash);</script>
</head>
<body>
<p>Deze les is verhuisd naar <a href="${doel}">${doel}</a>.</p>
</body>
</html>
`;
}

function controleer(omleidingen) {
  const gezien = new Set();
  for (const { van, naar } of omleidingen) {
    for (const pad of [van, naar]) {
      if (typeof pad !== 'string' || !pad.startsWith('/') || pad.includes('..')) {
        throw new Error(`omleidingen: ongeldig pad ${JSON.stringify(pad)}`);
      }
    }
    if (van === naar) throw new Error(`omleidingen: ${van} wijst naar zichzelf`);
    if (gezien.has(van)) throw new Error(`omleidingen: ${van} staat er twee keer in`);
    gezien.add(van);
  }
}

function schrijfOmleidingen(outDir, baseUrl, omleidingen, url = '') {
  controleer(omleidingen);
  const basis = baseUrl.replace(/\/$/, '');
  for (const { van, naar } of omleidingen) {
    const bestand = path.join(outDir, van.replace(/\/$/, ''), 'index.html');
    // Een oud adres dat weer een echte pagina is, overschrijven we niet: dan
    // is de omleiding verouderd en moet hij uit de lijst.
    if (fs.existsSync(bestand)) {
      throw new Error(`omleidingen: op ${van} staat weer een echte pagina; haal hem uit de lijst`);
    }
    fs.mkdirSync(path.dirname(bestand), { recursive: true });
    fs.writeFileSync(bestand, omleidingHtml(basis + naar, url.replace(/\/$/, '') + basis + naar));
  }
}

module.exports = function omleidingenPlugin(_context, { omleidingen = [] } = {}) {
  controleer(omleidingen);
  return {
    name: 'coderius-omleidingen',
    async postBuild({ outDir, siteConfig }) {
      schrijfOmleidingen(outDir, siteConfig.baseUrl, omleidingen, siteConfig.url);
    },
  };
};
module.exports.schrijfOmleidingen = schrijfOmleidingen;
module.exports.omleidingHtml = omleidingHtml;
