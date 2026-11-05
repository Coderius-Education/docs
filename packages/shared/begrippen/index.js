// Begrippen van een cursus (src/begrippen.json): de moeilijke woorden met een
// korte uitleg. createConfig zet bij zo'n bestand plugins/begrippen.js aan.
// Bij het bouwen krijgt het eerste voorkomen van elk begrip op een pagina een
// tooltip (markeer, als remark-stap), en de woordenlijst toont ze allemaal.
// Hier staat wat de remark-stap, de plugin en de tests gemeen hebben.

const path = require('node:path');

const VELDEN = ['id', 'term', 'vormen', 'kort', 'les', 'anker'];

/** Het pad van het begrippenbestand van een site. */
function begrippenBestand(siteDir) {
  return path.join(siteDir, 'src', 'begrippen.json');
}

/**
 * Controleer het bestand en vul de standaardwaarden in. Alle fouten komen in
 * één melding, met het bestand erbij: een fout stopt de build.
 *
 * @param {unknown} data de inhoud van begrippen.json
 * @param {string} [bron] voor in de foutmelding
 */
function leesBegrippen(data, bron = 'begrippen.json') {
  const fouten = [];
  if (!data || typeof data !== 'object' || !Array.isArray(data.begrippen)) {
    throw new Error(`${bron}: verwacht { "begrippen": [...] }`);
  }
  for (const sleutel of Object.keys(data)) {
    if (!['begrippen', 'overslaan', 'woordenlijst'].includes(sleutel)) {
      fouten.push(`onbekend veld '${sleutel}' (wel: begrippen, overslaan, woordenlijst)`);
    }
  }
  const woordenlijst = data.woordenlijst;
  if (woordenlijst !== undefined && (typeof woordenlijst !== 'string' || !woordenlijst)) {
    fouten.push("'woordenlijst' is het doc-id van de pagina met alle begrippen");
  }
  const overslaan = data.overslaan ?? [];
  if (!Array.isArray(overslaan) || overslaan.some((p) => typeof p !== 'string')) {
    fouten.push("'overslaan' is een lijst doc-ids (een id op '/' is een hele map)");
  }

  const ids = new Set();
  const vormVan = new Map();
  const begrippen = data.begrippen.map((rij, i) => {
    const waar = `begrip ${rij?.id ?? `#${i + 1}`}`;
    for (const sleutel of Object.keys(rij ?? {})) {
      if (!VELDEN.includes(sleutel)) fouten.push(`${waar}: onbekend veld '${sleutel}'`);
    }
    if (typeof rij?.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rij.id)) {
      fouten.push(`${waar}: id in kleine letters met streepjes`);
    } else if (ids.has(rij.id)) {
      fouten.push(`${waar}: staat er twee keer`);
    } else ids.add(rij.id);
    if (typeof rij?.term !== 'string' || !rij.term.trim()) fouten.push(`${waar}: term ontbreekt`);
    if (typeof rij?.kort !== 'string' || !rij.kort.trim()) {
      fouten.push(`${waar}: kort (de uitleg) ontbreekt`);
    } else if (!/[.?]$/.test(rij.kort.trim())) {
      fouten.push(`${waar}: kort is een hele zin, met een punt aan het eind`);
    }
    const vormen = rij?.vormen ?? [rij?.term];
    if (!Array.isArray(vormen) || vormen.some((v) => typeof v !== 'string' || !v.trim())) {
      fouten.push(`${waar}: vormen is een lijst woorden`);
    } else {
      for (const v of vormen) {
        const sleutel = v.toLowerCase();
        const ander = vormVan.get(sleutel);
        if (ander && ander !== rij.id) fouten.push(`${waar}: de vorm '${v}' is ook van ${ander}`);
        vormVan.set(sleutel, rij.id);
      }
    }
    if (rij?.les !== undefined && (typeof rij.les !== 'string' || !rij.les)) {
      fouten.push(`${waar}: les is een doc-id ("terminal/zoeken")`);
    }
    if (rij?.anker !== undefined && rij?.les === undefined) {
      fouten.push(`${waar}: een anker zonder les`);
    }
    return { ...rij, vormen: Array.isArray(vormen) ? vormen : [] };
  });
  if (fouten.length) throw new Error(`${bron}:\n- ${fouten.join('\n- ')}`);
  // Op de woordenlijst zelf staat de uitleg al.
  const alles = woordenlijst ? [...overslaan, woordenlijst] : overslaan;
  return { begrippen, overslaan: alles, woordenlijst };
}

/** Hoort deze pagina bij `overslaan`? Een id op '/' is een hele map. */
function slaOver(docId, overslaan) {
  return overslaan.some((p) => (p.endsWith('/') ? docId.startsWith(p) : docId === p));
}

// Waar geen tooltip in komt: code, koppen (de inhoudsopgave), links (een knop
// in een link werkt niet), en elk element van MDX (een component, een
// <summary>: een klik op een knop daarin klapte ook het blok open), behalve
// een uitklapblok, waarin gewoon lestekst staat. Cursief ook niet: daarin
// zet de cursus de Engelse voluit-vorm van een afkorting (ssh, *secure
// shell*), en dan kreeg "shell" daar een tooltip. Docusaurus maakt van
// <details> al vóór deze stap <Details>. Een admonition (:::tip) is hier nog
// een containerDirective en hoort er gewoon bij.
const OVERSLAAN = new Set([
  'emphasis',
  'code',
  'inlineCode',
  'heading',
  'link',
  'linkReference',
  'definition',
  'image',
  'imageReference',
  'html',
  'yaml',
  'mdxjsEsm',
  'mdxFlowExpression',
  'mdxTextExpression',
]);
const JSX_MET_LESTEKST = new Set(['details', 'Details']);

const ontsnap = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Zet het eerste voorkomen van elk begrip op de pagina in een
 * `<Begrip id="…">`. Alleen in lopende tekst, en niet op de les die het
 * begrip zelf uitlegt: daar staat de uitleg er al.
 *
 * @param {object} tree de mdast van de pagina
 * @param {{id: string, vormen: string[], les?: string}[]} begrippen
 * @param {{ docId?: string }} [opties]
 * @returns {string[]} de ids die een tooltip kregen, in volgorde
 */
function markeer(tree, begrippen, { docId } = {}) {
  const perVorm = new Map();
  for (const b of begrippen) {
    if (b.les && b.les === docId) continue;
    for (const v of b.vormen) perVorm.set(v.toLowerCase(), b);
  }
  if (perVorm.size === 0) return [];
  // De langste vorm eerst: "absoluut pad" gaat voor "pad".
  const vormen = [...perVorm.keys()].sort((a, b) => b.length - a.length);
  const patroon = new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${vormen.map(ontsnap).join('|')})(?![\\p{L}\\p{N}_])`,
    'giu',
  );
  const gehad = new Set();
  const volgorde = [];

  const splits = (tekst) => {
    const delen = [];
    let vanaf = 0;
    for (const m of tekst.matchAll(patroon)) {
      const b = perVorm.get(m[0].toLowerCase());
      if (!b || gehad.has(b.id)) continue;
      gehad.add(b.id);
      volgorde.push(b.id);
      if (m.index > vanaf) delen.push({ type: 'text', value: tekst.slice(vanaf, m.index) });
      delen.push({
        type: 'mdxJsxTextElement',
        name: 'Begrip',
        attributes: [{ type: 'mdxJsxAttribute', name: 'id', value: b.id }],
        children: [{ type: 'text', value: m[0] }],
      });
      vanaf = m.index + m[0].length;
    }
    if (delen.length === 0) return null;
    if (vanaf < tekst.length) delen.push({ type: 'text', value: tekst.slice(vanaf) });
    return delen;
  };

  const bezoek = (node) => {
    if (OVERSLAAN.has(node.type)) return;
    if (
      (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
      !JSX_MET_LESTEKST.has(node.name)
    ) {
      return;
    }
    if (!node.children) return;
    const nieuw = [];
    for (const kind of node.children) {
      if (kind.type === 'text') {
        const delen = splits(kind.value);
        if (delen) nieuw.push(...delen);
        else nieuw.push(kind);
      } else {
        bezoek(kind);
        nieuw.push(kind);
      }
    }
    node.children = nieuw;
  };
  bezoek(tree);
  return volgorde;
}

module.exports = { VELDEN, begrippenBestand, leesBegrippen, slaOver, markeer };
