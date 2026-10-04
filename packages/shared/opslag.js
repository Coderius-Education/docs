// Sleutels voor browseropslag, per site.
//
// Sinds de cursussen onder een pad van de host van hun vak staan
// (https://informatica.coderius.nl/python/), delen alle cursussen van een vak
// één origin, en dus één localStorage, sessionStorage, IndexedDB, Cache
// Storage en cookie-jar. Een sleutel als 'webMicroEditor.code' was op
// robotica.coderius.nl vanzelf van robotica; op de gedeelde origin kan elke
// andere cursus hem lezen en overschrijven. Elke sleutel, database-naam of
// BroadcastChannel-naam van een cursus gaat daarom door storageKey().
//
// Bewust gedeeld (geen storageKey): de kleurmodus van Docusaurus ('theme') en
// zijn tab-keuzes ('docusaurus.tab.*'), want die horen voor de leerling over
// alle cursussen gelijk te zijn.
//
// CommonJS, net als sites.js: bruikbaar vanuit TS-componenten, tests en node.

const PREFIX = 'coderius';

/**
 * @param {string} siteId registry-id van de site, bv. 'robotica'
 * @param {string} key de sleutel binnen die site, bv. 'webMicroEditor.code'
 * @returns {string} bv. 'coderius:robotica:webMicroEditor.code'
 */
function storageKey(siteId, key) {
  if (!siteId || !/^[a-z0-9-]+$/.test(siteId)) {
    throw new Error(`storageKey: ongeldige site-id ${JSON.stringify(siteId)}`);
  }
  if (!key) throw new Error('storageKey: lege sleutel');
  return `${PREFIX}:${siteId}:${key}`;
}

module.exports = { storageKey };
