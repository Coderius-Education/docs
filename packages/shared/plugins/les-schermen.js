// De schermen van een les met tabbladen, zoals de build ze maakt: elk
// tabblad, of elke stap van een tabblad met stappen. Een tabblad of stap is
// alles wat de leerling op dat moment ziet, en een zin die naar een andere
// plek op de pagina wijst ("de code hierboven") klopt dan niet meer vanzelf.
// De docs-tests van een cursus met tabbladen lezen hun lessen hiermee en
// houden per scherm bij wat er te zien is (web: src/docs-tests/schermen.test.ts).
//
// Dezelfde stap als de build (plugins/les-tabs.js), dus wat een test hier
// ziet, is wat de leerling ziet.

const { groepeer } = require('./les-tabs.js');

/** De leesbare tekst van een node, met code tussen backticks als gewone tekst. */
function tekstVan(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  return (node.children ?? []).map(tekstVan).join(' ');
}

const eigenschap = (node, naam) => node.attributes?.find((a) => a.name === naam)?.value;

/** Wat een plaatje neerzet zonder alinea: `<img>`, `<figure>`, een ingesloten pdf of video. */
const PLAATJE = ['img', 'figure', 'iframe'];

const isPlaatje = (node) => node.type === 'image' || node.name === 'img';

/** Een alinea met alleen plaatjes: die ziet de leerling, het is geen zin. */
const alleenPlaatjes = (node) => {
  const inhoud = (node.children ?? []).filter((k) => !(k.type === 'text' && !k.value.trim()));
  return inhoud.length > 0 && inhoud.every(isPlaatje);
};

/**
 * Wat er in een scherm staat, in volgorde. Een blok heeft een soort:
 *  - tekst    een alinea
 *  - code     een codeblok (de code staat in `tekst`)
 *  - veld     een oefenveld
 *  - tabel, lijst
 *  - plaatje  een plaatje, een reeks plaatjes of een ingesloten pdf of video
 *  - antwoord het begin van een uitklapblok: wat erna komt, ziet de leerling
 *             pas als hij het opent
 *  - vraag    het begin van een voorspelvraag; de keuzes en de uitleg erin
 *             hebben `inVraag`
 *
 * @param {object[]} nodes
 * @param {string[]} velden de namen van de onderdelen die een oefenveld zijn
 */
function blokken(nodes, velden, uit = []) {
  for (const n of nodes) {
    if (n.type === 'paragraph' && alleenPlaatjes(n)) uit.push({ soort: 'plaatje', tekst: '' });
    else if (PLAATJE.includes(n.name)) uit.push({ soort: 'plaatje', tekst: '' });
    else if (n.type === 'paragraph') uit.push({ soort: 'tekst', tekst: tekstVan(n) });
    else if (n.type === 'code') uit.push({ soort: 'code', tekst: n.value ?? '' });
    else if (n.type === 'table') uit.push({ soort: 'tabel', tekst: tekstVan(n) });
    else if (n.type === 'list') uit.push({ soort: 'lijst', tekst: tekstVan(n) });
    else if (velden.includes(n.name)) uit.push({ soort: 'veld', tekst: tekstVan(n) });
    else if (n.name === 'LesStappen') continue;
    else if (n.name === 'Voorspel') {
      uit.push({ soort: 'vraag', tekst: '' });
      for (const b of blokken(n.children ?? [], velden)) uit.push({ ...b, inVraag: true });
    } else if (n.name === 'details') {
      uit.push({ soort: 'antwoord', tekst: '' });
      blokken(n.children ?? [], velden, uit);
    } else if (n.type !== 'heading' && n.children) blokken(n.children, velden, uit);
  }
  return uit;
}

/**
 * De schermen van één les, of een lege lijst als de les geen tabbladen heeft.
 *
 * @param {string} bron de inhoud van het bestand
 * @param {(bron: string) => {children: object[]}} parse de MDX-parser (plugins/werkvormen.js, mdxParser)
 * @param {{ velden?: string[], eenScherm?: boolean }} [opties] `eenScherm` zoals de cursus hem in
 *   `lesTabs` heeft staan (plugins/les-tabs.js)
 * @returns {{ tab: string, opTab: string, naam: string, blokken: { soort: string, tekst: string }[] }[]}
 */
function schermenVan(bron, parse, { velden = ['CodeEditor'], eenScherm = false } = {}) {
  const voorwerk = /^---\r?\n(?:([\s\S]*?)\r?\n)?---\r?\n/.exec(bron);
  if (voorwerk && /^les_tabs:\s*false\s*$/m.test(voorwerk[1] ?? '')) return [];
  const tree = parse(voorwerk ? bron.slice(voorwerk[0].length) : bron);
  // De build geeft elke kop een id; hier doet alleen de tekst ertoe.
  let n = 0;
  const geefId = (node) => {
    if (node.type === 'heading') node.data = { id: `kop-${n++}` };
    for (const kind of node.children ?? []) geefId(kind);
  };
  geefId(tree);
  const tabs = (groepeer(tree.children, { eenScherm }) ?? []).find((k) => k.name === 'LesTabs');
  return (tabs?.children ?? []).flatMap((tab) => {
    // Een vast id achter de kop (`## Lussen \{#lussen}`) haalt de build weg.
    const zonderId = (tekst) => (tekst ?? '').replace(/\s*\\?\{#[\w-]+\}\s*$/, '');
    const label = zonderId(eigenschap(tab, 'label'));
    // Wat er op het tabblad staat: in een lange rij opdrachten alleen het nummer.
    const opTab = eigenschap(tab, 'kort') ?? label;
    const stappen = tab.children?.find((k) => k.name === 'LesStappen');
    if (!stappen)
      return [{ tab: label, opTab, naam: label, blokken: blokken(tab.children ?? [], velden) }];
    // Wat in de rij stappen geen stap is (het leerdoel), staat bij de eerste.
    const boven = blokken(
      (stappen.children ?? []).filter((k) => k.name !== 'LesStap'),
      velden,
    );
    return (stappen.children ?? [])
      .filter((k) => k.name === 'LesStap')
      .map((stap, i) => ({
        tab: label,
        opTab,
        naam: `${label} › ${zonderId(eigenschap(stap, 'label'))}`,
        blokken: [...(i === 0 ? boven : []), ...blokken(stap.children ?? [], velden)],
      }));
  });
}

module.exports = { schermenVan, blokken };
