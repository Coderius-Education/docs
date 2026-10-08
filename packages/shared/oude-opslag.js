// Werk van vóór de verhuizing naar de vak-host overzetten.
//
// Tot oktober 2026 stond elke cursus op een eigen subdomein (web.coderius.nl).
// Wat een leerling daar bewaarde (oefenvelden, editorcode) staat in de
// browseropslag van die oude origin, en de cursus op
// https://informatica.coderius.nl/web/ kan daar niet bij. Een site die zulke
// opslag had, geeft createConfig een `oudeOpslag` mee:
//
//   oudeOpslag: {
//     localStorage: [{ van: 'webMicroEditor.code', label: 'Je code in de editor' }],
//     indexedDB: [{ van: 'coderius-oefenvelden', store: 'velden', naar: 'oefenvelden',
//                   label: 'Je oefenvelden' }],
//   }
//
// `naar` is de sleutel binnen de site; de echte sleutel wordt
// storageKey(siteId, naar), net als in de code van de site zelf (zonder `naar`
// is hij gelijk aan `van`). `prefix: true` neemt alle localStorage-sleutels
// die met `van` beginnen mee, met `naar` als nieuw voorvoegsel.
// `sleutelBegintMetPad: true` (IndexedDB) is voor sleutels die met het pad
// van de pagina beginnen ('/docs/les|zaad|0', zie web/CodeEditor/opslag.ts):
// dat pad kreeg met de verhuizing het pad van de cursus ervoor ('/web/docs/les').
//
// Dan doet de factory twee dingen (plugins/oude-opslag.js):
//  - op het oude subdomein, onder /oud/overzetten/, een losse pagina die de
//    oude opslag leest (docs-management laat dat pad daar staan via
//    legacy_paths in sites.json);
//  - in de cursus een route /overzetten die het werk ontvangt en onder de
//    nieuwe sleutels bewaart. Wat daar al staat, wint: een leerling die op
//    het nieuwe adres verder werkte, raakt niets kwijt.
//
// Het gesprek tussen de twee pagina's, met op elke stap een exacte origin- én
// venstercontrole:
//   1. oude pagina opent de nieuwe (window.open, zonder noopener);
//   2. nieuw -> opener:  { source: BRON_NIEUW, type: 'klaar' }
//   3. oud  -> venster:  { source: BRON_OUD, type: 'gegevens', versie, site,
//                          localStorage: { sleutel: waarde },
//                          indexedDB: [{ van, store, items: [[sleutel, waarde]] }] }
//   4. nieuw -> opener:  { source: BRON_NIEUW, type: 'ontvangen', aantal }
// Dezelfde vorm als bestand is de terugweg als een pop-up wordt tegengehouden.
//
// CommonJS, net als sites.js en opslag.js: bruikbaar vanuit de factory, de
// component en de tests. De losse pagina (oude-opslag/pagina/overzetten.js)
// heeft de wire-waarden letterlijk; oude-opslag.test.ts eist dat ze gelijk zijn.

const { SITES_BY_ID, SUBJECTS_BY_ID } = require('./sites');
const { storageKey } = require('./opslag');

const BRON_OUD = 'coderius-oude-site';
const BRON_NIEUW = 'coderius-overzetten';
const VERSIE = 1;

// Ruim: een oefenveld is een paar kB. De grenzen houden een kapot of vijandig
// bericht uit de opslag van de leerling.
const MAX_SLEUTELS = 5000;
const MAX_TEKENS = 50 * 1024 * 1024;

const isNaam = (s) => typeof s === 'string' && s.length > 0 && s.length <= 200;

/** Gooit bij een regel die niet klopt; geeft de regels terug. */
function controleerRegels(regels) {
  if (typeof regels !== 'object' || regels === null) {
    throw new Error('oudeOpslag: verwacht een object met localStorage en/of indexedDB');
  }
  const ls = regels.localStorage ?? [];
  const idb = regels.indexedDB ?? [];
  if (!Array.isArray(ls) || !Array.isArray(idb)) {
    throw new Error('oudeOpslag: localStorage en indexedDB zijn lijsten');
  }
  if (ls.length + idb.length === 0) throw new Error('oudeOpslag: geen enkele regel');
  // Indexlussen: zie leesBericht (geen for…of in deze module).
  for (let i = 0; i < ls.length; i++) {
    const r = ls[i];
    if (!isNaam(r.van) || !isNaam(r.label) || (r.naar !== undefined && !isNaam(r.naar))) {
      throw new Error(`oudeOpslag.localStorage: ongeldige regel ${JSON.stringify(r)}`);
    }
  }
  for (let i = 0; i < idb.length; i++) {
    const r = idb[i];
    if (
      !isNaam(r.van) ||
      !isNaam(r.store) ||
      !isNaam(r.label) ||
      (r.naar !== undefined && !isNaam(r.naar))
    ) {
      throw new Error(`oudeOpslag.indexedDB: ongeldige regel ${JSON.stringify(r)}`);
    }
  }
  return regels;
}

/** De localStorage-regel die bij een oude sleutel hoort, of undefined. */
function regelVoor(regels, sleutel) {
  return (regels.localStorage ?? []).find((r) =>
    r.prefix ? sleutel.startsWith(r.van) && sleutel.length > r.van.length : sleutel === r.van,
  );
}

/** Nieuwe localStorage-sleutel voor een oude, of null als hij niet meegaat. */
function nieuweSleutel(siteId, regels, sleutel) {
  const r = regelVoor(regels, sleutel);
  if (!r) return null;
  const naar = r.naar ?? r.van;
  return storageKey(siteId, r.prefix ? naar + sleutel.slice(r.van.length) : naar);
}

/** Nieuwe database-naam voor een oude IndexedDB-regel. */
function nieuweDatabase(siteId, regel) {
  return storageKey(siteId, regel.naar ?? regel.van);
}

/**
 * Het bericht van stap 3 (of het gedownloade bestand), teruggebracht tot wat
 * de regels van deze site toestaan. null als het niet het contract volgt of
 * te groot is.
 */
function leesBericht(data, siteId, regels) {
  if (typeof data !== 'object' || data === null) return null;
  if (data.source !== BRON_OUD || data.type !== 'gegevens' || data.versie !== VERSIE) return null;
  if (data.site !== siteId) return null;
  const ls = data.localStorage ?? {};
  const idb = data.indexedDB ?? [];
  if (typeof ls !== 'object' || ls === null || Array.isArray(ls) || !Array.isArray(idb)) {
    return null;
  }
  let sleutels = 0;
  let tekens = 0;
  const tel = (waarde) => {
    sleutels += 1;
    tekens += typeof waarde === 'string' ? waarde.length : JSON.stringify(waarde ?? null).length;
    return sleutels <= MAX_SLEUTELS && tekens <= MAX_TEKENS;
  };

  // Indexlussen in plaats van for…of: deze CommonJS-module gaat ook de
  // browserbundel in, en babel zou voor for…of een ES-module-helper importeren
  // (webpack: "'import' and 'export' may appear only with 'sourceType: module'").
  const localStorage = [];
  const paren = Object.entries(ls);
  for (let i = 0; i < paren.length; i++) {
    const sleutel = paren[i][0];
    const waarde = paren[i][1];
    if (typeof waarde !== 'string' || !regelVoor(regels, sleutel)) continue;
    if (!tel(waarde)) return null;
    localStorage.push([sleutel, waarde]);
  }

  const indexedDB = [];
  for (let b = 0; b < idb.length; b++) {
    const blok = idb[b];
    if (typeof blok !== 'object' || blok === null || !Array.isArray(blok.items)) continue;
    const regel = (regels.indexedDB ?? []).find(
      (r) => r.van === blok.van && r.store === blok.store,
    );
    if (!regel) continue;
    const items = [];
    for (let i = 0; i < blok.items.length; i++) {
      const item = blok.items[i];
      if (!Array.isArray(item) || item.length !== 2) continue;
      const sleutel = item[0];
      const waarde = item[1];
      if (typeof sleutel !== 'string' && typeof sleutel !== 'number') continue;
      if (!tel(waarde)) return null;
      items.push([sleutel, waarde]);
    }
    indexedDB.push({ regel, items });
  }
  return { localStorage, indexedDB };
}

/**
 * '/docs/les|zaad|0' -> '/web/docs/les|zaad|0': het pagina-pad in een sleutel
 * krijgt het pad van de cursus ervoor, zoals location.pathname nu ook doet.
 * De root ('/') wordt '/web', net als veldSleutel() een pad zonder slash
 * aan het eind schrijft.
 */
function sleutelMetPad(sleutel, cursusPad) {
  if (typeof sleutel !== 'string' || !sleutel.startsWith('/')) return sleutel;
  const basis = cursusPad.replace(/\/+$/, '');
  const scheiding = sleutel.indexOf('|');
  const pad = scheiding === -1 ? sleutel : sleutel.slice(0, scheiding);
  const rest = scheiding === -1 ? '' : sleutel.slice(scheiding);
  if (pad === basis || pad.startsWith(`${basis}/`)) return sleutel; // al nieuw
  return (pad === '/' ? basis : basis + pad) + rest;
}

/** Wat er op de nieuwe origin geschreven moet worden. */
function schrijfplan(gelezen, siteId, regels) {
  const cursusPad = new URL(SITES_BY_ID[siteId].url).pathname;
  return {
    localStorage: gelezen.localStorage.map(([sleutel, waarde]) => [
      nieuweSleutel(siteId, regels, sleutel),
      waarde,
    ]),
    indexedDB: gelezen.indexedDB.map(({ regel, items }) => ({
      database: nieuweDatabase(siteId, regel),
      store: regel.store,
      items: regel.sleutelBegintMetPad
        ? items.map(([sleutel, waarde]) => [sleutelMetPad(sleutel, cursusPad), waarde])
        : items,
    })),
  };
}

/**
 * De oude origin van een site, bij de huidige (nieuwe) locatie:
 * informatica.<domein> -> <oud-subdomein>.<domein>, zelfde protocol en poort.
 * In productie is dat de legacyUrl uit de registry.
 */
function oudeOrigin(siteId, nieuw) {
  const site = SITES_BY_ID[siteId];
  if (!site?.legacyUrl) throw new Error(`oudeOrigin: ${siteId} had geen eigen subdomein`);
  const oudLabel = new URL(site.legacyUrl).hostname.split('.')[0];
  const vak = new URL(SUBJECTS_BY_ID[site.subject].url).hostname.split('.')[0];
  const domein = nieuw.hostname.startsWith(`${vak}.`)
    ? nieuw.hostname.slice(vak.length + 1)
    : nieuw.hostname;
  const poort = nieuw.port ? `:${nieuw.port}` : '';
  return `${nieuw.protocol}//${oudLabel}.${domein}${poort}`;
}

/**
 * Wat de losse pagina op het oude subdomein moet weten (regels.json): de site,
 * het vak-label en pad van de nieuwe host, en de regels.
 */
function paginaGegevens(siteId, regels) {
  const site = SITES_BY_ID[siteId];
  const vakHost = new URL(SUBJECTS_BY_ID[site.subject].url).hostname;
  return {
    versie: VERSIE,
    site: siteId,
    naam: site.label,
    vak: vakHost.split('.')[0],
    pad: new URL(site.url).pathname,
    regels,
  };
}

module.exports = {
  BRON_OUD,
  BRON_NIEUW,
  VERSIE,
  MAX_SLEUTELS,
  MAX_TEKENS,
  controleerRegels,
  nieuweSleutel,
  nieuweDatabase,
  leesBericht,
  schrijfplan,
  oudeOrigin,
  paginaGegevens,
  sleutelMetPad,
};
