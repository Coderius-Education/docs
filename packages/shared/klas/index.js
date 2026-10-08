// Klassen: een docent stelt in docs-management een klasweergave samen en geeft
// leerlingen de link <vak-host>/klas/<code>. Die zet het cookie `cdx_klas`;
// zolang het er is tonen de cursussen van dat vak hun navigatie zoals de klas
// het wil: hoofdstukken verborgen of in een andere volgorde.
//
// Verborgen is alleen uit de navigatie: de lessen blijven openbaar en bereikbaar
// via zoeken, vorige/volgende en directe links.
//
// Hoofdstukken heten naar een sleutel die build (sidebar-manifest.json, voor
// docs-management) en browser (de sidebar-props) op dezelfde manier berekenen:
//  - categorie → `cat:<gedeelde map van de lessen erin>`, bv. `cat:basis`, met
//    het label als terugval (`cat:~<label>`) als de lessen geen map delen;
//  - les       → `doc:<doc-id>`;
//  - link      → `link:<href>`.
// Een sleutel overleeft dus een ander label of nummer-voorvoegsel.
//
// CommonJS, net als sites.js: bruikbaar vanuit de plugin (node), de theme-
// componenten en de tests.

const COOKIE = 'cdx_klas';
const CODE_RE = /^[a-z0-9]{6,16}$/;

function slug(tekst) {
  return String(tekst || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Doc-ids onder een item, in de vorm van de sidebar-props (browser) én van de
// verwerkte sidebars (build): `docId` op een link, `id` op een doc of ref.
function docIds(item) {
  if (!item || typeof item !== 'object') return [];
  if (item.type === 'category') return (item.items || []).flatMap(docIds);
  if (item.type === 'link' && item.docId) return [item.docId];
  if ((item.type === 'doc' || item.type === 'ref') && item.id) return [item.id];
  return [];
}

// Geen for…of hier: babel zet daar een ESM-helper voor in, en dit bestand is
// CommonJS (de browserbundel kan die twee niet mengen).
function gedeeldeMap(ids) {
  const mappen = ids.map((id) => id.split('/').slice(0, -1));
  if (mappen.length === 0) return '';
  const gedeeld = mappen.reduce((voorvoegsel, map) => {
    let i = 0;
    while (i < voorvoegsel.length && i < map.length && voorvoegsel[i] === map[i]) i++;
    return voorvoegsel.slice(0, i);
  });
  return gedeeld.join('/');
}

/** De sleutel van een sidebar-item, of null voor iets zonder (html). */
function hoofdstukSleutel(item) {
  if (!item || typeof item !== 'object') return null;
  if (item.type === 'category') {
    const map = gedeeldeMap(docIds(item));
    if (map) return `cat:${map}`;
    const label = slug(item.label);
    return label ? `cat:~${label}` : null;
  }
  if (item.type === 'link' && item.docId) return `doc:${item.docId}`;
  if ((item.type === 'doc' || item.type === 'ref') && item.id) return `doc:${item.id}`;
  if (item.type === 'link' && item.href) return `link:${item.href}`;
  return null;
}

/**
 * De bovenste laag van een sidebar zoals de klas hem wil: verborgen
 * hoofdstukken eruit, de rest in `volgorde`. Wat niet in `volgorde` staat
 * (nieuw sinds de docent keek) komt erachter, in de oorspronkelijke volgorde.
 * Onbekende sleutels doen niets.
 */
function pasKlasToe(items, instelling) {
  if (!Array.isArray(items) || !instelling) return items;
  const verborgen = new Set(instelling.verborgen || []);
  const volgorde = instelling.volgorde || [];
  const plek = new Map(volgorde.map((sleutel, i) => [sleutel, i]));
  const zichtbaar = items
    .map((item, i) => ({ item, i, sleutel: hoofdstukSleutel(item) }))
    .filter(({ sleutel }) => !sleutel || !verborgen.has(sleutel));
  const rang = ({ sleutel, i }) =>
    sleutel && plek.has(sleutel) ? plek.get(sleutel) : volgorde.length + i;
  return zichtbaar.sort((a, b) => rang(a) - rang(b)).map(({ item }) => item);
}

/** De klascode uit `document.cookie`, of null. */
function leesKlasCookie(cookies) {
  const match = String(cookies || '').match(/(?:^|;\s*)cdx_klas=([^;]*)/);
  const code = match ? decodeURIComponent(match[1]) : '';
  return CODE_RE.test(code) ? code : null;
}

/** Cookie-string die het klas-cookie wist (zelfde Path als de delivery zet). */
const VERLAAT_COOKIE = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;

module.exports = { COOKIE, hoofdstukSleutel, pasKlasToe, leesKlasCookie, VERLAAT_COOKIE, slug };
