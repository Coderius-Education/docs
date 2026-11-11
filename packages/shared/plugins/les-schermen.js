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

/**
 * Wat er in een scherm staat, in volgorde. Een blok heeft een soort:
 *  - tekst    een alinea
 *  - code     een codeblok (de code staat in `tekst`)
 *  - veld     een oefenveld
 *  - tabel, lijst
 *  - antwoord het begin van een uitklapblok: wat erna komt, ziet de leerling
 *             pas als hij het opent
 *
 * @param {object[]} nodes
 * @param {string[]} velden de namen van de onderdelen die een oefenveld zijn
 */
function blokken(nodes, velden, uit = []) {
  for (const n of nodes) {
    if (n.type === 'paragraph') uit.push({ soort: 'tekst', tekst: tekstVan(n) });
    else if (n.type === 'code') uit.push({ soort: 'code', tekst: n.value ?? '' });
    else if (n.type === 'table') uit.push({ soort: 'tabel', tekst: tekstVan(n) });
    else if (n.type === 'list') uit.push({ soort: 'lijst', tekst: tekstVan(n) });
    else if (velden.includes(n.name)) uit.push({ soort: 'veld', tekst: tekstVan(n) });
    else if (n.name === 'LesStappen') continue;
    else if (n.name === 'details') {
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
 * @param {{ velden?: string[] }} [opties]
 * @returns {{ tab: string, naam: string, blokken: { soort: string, tekst: string }[] }[]}
 */
function schermenVan(bron, parse, { velden = ['CodeEditor'] } = {}) {
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
  const tabs = (groepeer(tree.children) ?? []).find((k) => k.name === 'LesTabs');
  return (tabs?.children ?? []).flatMap((tab) => {
    const label = eigenschap(tab, 'label') ?? '';
    const stappen = tab.children?.find((k) => k.name === 'LesStappen');
    if (!stappen)
      return [{ tab: label, naam: label, blokken: blokken(tab.children ?? [], velden) }];
    // Wat in de rij stappen geen stap is (het leerdoel), staat bij de eerste.
    const boven = blokken(
      (stappen.children ?? []).filter((k) => k.name !== 'LesStap'),
      velden,
    );
    return (stappen.children ?? [])
      .filter((k) => k.name === 'LesStap')
      .map((stap, i) => ({
        tab: label,
        naam: `${label} › ${eigenschap(stap, 'label')}`,
        blokken: [...(i === 0 ? boven : []), ...blokken(stap.children ?? [], velden)],
      }));
  });
}

module.exports = { schermenVan, blokken };
