// Les-tabbladen (proef, zie de root-CLAUDE.md): elke `##`-sectie van een les
// wordt een tabblad bovenaan de pagina, zodat een leerling niet meer door een
// lange les hoeft te scrollen. Een site zet het aan met `lesTabs: true` in
// createConfig; een pagina zet het uit met `les_tabs: false` in de front matter.
//
// De remark-stap wikkelt bij het bouwen elke `##`-sectie in een <LesTab>
// binnen één <LesTabs> (components/LesTabs). De bron van de les verandert
// niet: die houdt zijn `##`-koppen, en de tests die een les langs `##`
// knippen, lezen wat ze altijd lazen.
//
// Elk tabblad krijgt ook een werkvorm mee (../werkvormen): voorspellen,
// onderzoeken, aanpassen, … Het onderdeel toont daar een icoon bij.
//
// De stap staat achteraan in de docs van het classic preset. Docusaurus heeft
// dan zijn eigen stappen gedaan: elke kop heeft zijn id (`data.id`), en de
// inhoudsopgave is al als export aan de pagina gehangen.

const { werkvormenVan } = require('../werkvormen');

const isH2 = (node) => node.type === 'heading' && node.depth === 2;
const isH3 = (node) => node.type === 'heading' && node.depth === 3;

/** De leesbare tekst van een kop: tekst en `code`, zonder opmaak. */
function tekstVan(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  return (node.children ?? []).map(tekstVan).join('');
}

/**
 * Wat er op het tabblad staat. Een kop als "Opdracht 1: Tel de klikken" is te
 * lang voor een rij tabbladen: het label is het stuk vóór de dubbele punt.
 * De hele kop blijft in het paneel staan.
 *
 * @param {string} titel
 */
function tabLabel(titel) {
  const voor = titel.split(': ')[0].trim();
  return voor && voor !== titel ? voor : titel;
}

const attribuut = (name, value) => ({ type: 'mdxJsxAttribute', name, value });

// De titel van de pagina: Docusaurus heeft de `#`-kop dan al in een <header>
// gezet. Een losse `#`-kop telt ook.
const isTitel = (node) =>
  (node.type === 'mdxJsxFlowElement' && node.name === 'header') ||
  (node.type === 'heading' && node.depth === 1);

// Wat niets op de pagina zet: de front matter, een import of export, en een
// commentaar als `{/* niet-compileren: … */}`. Dat blijft buiten de
// tabbladen staan; alleen was het geen reden voor een tabblad Uitleg (elke
// les van html-css kreeg er een leeg, om zijn front matter).
const zetNietsNeer = (node) =>
  node.type === 'mdxjsEsm' ||
  node.type === 'yaml' ||
  node.type === 'toml' ||
  (node.type === 'mdxFlowExpression' && /^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value ?? ''));

const element = (name, id, titel, kinderen) => ({
  type: 'mdxJsxFlowElement',
  name,
  attributes: [attribuut('id', id), attribuut('titel', titel), attribuut('label', tabLabel(titel))],
  children: kinderen,
});

const idVan = (kop) => {
  const id = kop.data?.id;
  // Zonder id staat de stap vóór die van Docusaurus, en dan heeft geen
  // enkel tabblad een adres.
  if (!id) throw new Error(`les-tabs: de kop "${tekstVan(kop)}" heeft geen id`);
  return id;
};

/** Het label van de stap met wat in een sectie vóór de eerste `###` staat. */
const BASIS = 'De basis';

const isAlinea = (node) => node.type === 'paragraph';

/**
 * Een sectie met `###`-koppen is zelf nog te lang voor één scherm (Theorie in
 * de web-cursus: tot vijf koppen en duizend woorden). Elke `###` wordt daarom
 * een stap binnen het tabblad, één tegelijk in beeld.
 *
 * Wat vóór de eerste `###` staat, is meestal de kern van de uitleg en dan
 * een scherm op zich: het wordt de eerste stap, "De basis". Eén losse alinea
 * ("CSS kent meerdere eenheden:") is als stap een scherm met één zin, en
 * boven de stappen stond hij bij elke stap opnieuw: hij hoort bij de eerste
 * `###`, vóór de kop. Een sectie die zo maar één stap zou krijgen, heeft geen
 * stappen.
 *
 * `vooraf` is wat van vóór dit tabblad komt en erbij hoort: het leerdoel van
 * de les of een uitleg van één alinea (zie groepeer). Het staat op het eerste
 * scherm van het tabblad.
 *
 * @param {object[]} kinderen de kinderen van één sectie, met de `##` vooraan
 * @param {string} sectieId het id van de `##`, voor het id van de eerste stap
 * @param {object[]} [vooraf]
 */
function metStappen(kinderen, sectieId, vooraf = []) {
  const eerste = kinderen.findIndex(isH3);
  const zonderStappen = () => (vooraf.length ? [...vooraf, ...kinderen] : kinderen);
  if (eerste < 0) return zonderStappen();
  const stappen = [];
  for (const node of kinderen.slice(eerste)) {
    if (isH3(node)) stappen.push({ kop: node, kinderen: [node] });
    else stappen.at(-1).kinderen.push(node);
  }
  // De `##` zelf blijft boven de stappen: hij is het doel van een link naar
  // het tabblad.
  const [kop, ...inleiding] = kinderen.slice(0, eerste);
  const kort = inleiding.length === 0 || (inleiding.length === 1 && isAlinea(inleiding[0]));
  if (stappen.length + (kort ? 0 : 1) < 2) return zonderStappen();
  // Het eerste scherm begint met wat vooraf komt, en bij een korte inleiding
  // ook daarmee.
  if (kort) stappen[0].kinderen.unshift(...vooraf, ...inleiding);
  const lesStappen = stappen.map(({ kop: h3, kinderen: inhoud }) =>
    element('LesStap', idVan(h3), tekstVan(h3), inhoud),
  );
  if (!kort) {
    lesStappen.unshift(element('LesStap', `${sectieId}-basis`, BASIS, [...vooraf, ...inleiding]));
  }
  return [
    kop,
    { type: 'mdxJsxFlowElement', name: 'LesStappen', attributes: [], children: lesStappen },
  ];
}

/** Het label van het tabblad met wat vóór de eerste `##` staat. */
const UITLEG = 'Uitleg';

/** De werkvorm van een sectie die geen eigen tabblad krijgt (zie groepeer). */
const LEERDOEL = 'leerdoel';

/**
 * De kinderen van de pagina met elke `##`-sectie in een <LesTab>, of null als
 * er niets te groeperen valt (minder dan twee tabbladen).
 *
 * De titel en de startcode (`export const …`) blijven boven de tabbladen
 * staan. Staat er vóór de eerste `##` ook uitleg, zoals in de lessen over
 * JavaScript, dan wordt die het eerste tabblad, "Uitleg": anders stond hij
 * boven elk tabblad en schoof alles eronder van het scherm. Een import of
 * export verderop blijft op het hoogste niveau: daar hoort hij, en de
 * inhoudsopgave die Docusaurus als laatste export aan de pagina hangt, kwam
 * anders in het laatste paneel.
 *
 * Twee dingen krijgen geen eigen tabblad, want dat was een scherm met één
 * zin en een knop Volgende:
 *  - het leerdoel van de les ("Wat ga je leren?", een of twee alinea's): het
 *    staat in een <LesLeerdoel> bovenaan het tabblad erna;
 *  - uitleg vóór de eerste `##` van één alinea: die opent het eerste tabblad.
 *
 * @param {object[]} kinderen de kinderen van de mdast-root
 */
function groepeer(kinderen) {
  const eerste = kinderen.findIndex(isH2);
  if (eerste < 0) return null;
  const boven = [];
  const uitleg = [];
  for (const node of kinderen.slice(0, eerste)) {
    (zetNietsNeer(node) || isTitel(node) ? boven : uitleg).push(node);
  }
  const secties = [];
  const esm = [];
  for (const node of kinderen.slice(eerste)) {
    if (node.type === 'mdxjsEsm') esm.push(node);
    else if (isH2(node)) secties.push({ kop: node, kinderen: [node] });
    else secties.at(-1).kinderen.push(node);
  }

  const korteUitleg = uitleg.length === 1 && isAlinea(uitleg[0]);
  // Wat bij het eerstvolgende tabblad komt te staan.
  let vooraf = korteUitleg ? [...uitleg] : [];
  const tabs = [];
  secties.forEach(({ kop, kinderen: inhoud }, i) => {
    const tekst = inhoud.slice(1);
    const isLeerdoel =
      werkvormenVan([tekstVan(kop)])[0] === LEERDOEL &&
      i < secties.length - 1 &&
      tekst.length <= 2 &&
      tekst.every(isAlinea);
    if (isLeerdoel) {
      // De kop gaat mee: hij is het doel van een link en zegt een schermlezer
      // wat de zin is.
      vooraf.push({
        type: 'mdxJsxFlowElement',
        name: 'LesLeerdoel',
        attributes: [],
        children: inhoud,
      });
      return;
    }
    tabs.push(element('LesTab', idVan(kop), tekstVan(kop), metStappen(inhoud, idVan(kop), vooraf)));
    vooraf = [];
  });
  if (uitleg.length && !korteUitleg) {
    // Een id dat geen kop van de les al heeft.
    const bezet = new Set(tabs.map((t) => t.attributes[0].value));
    const id = bezet.has('uitleg') ? 'les-uitleg' : 'uitleg';
    tabs.unshift(element('LesTab', id, UITLEG, uitleg));
  }
  if (tabs.length < 2) return null;
  // Elk tabblad krijgt zijn werkvorm (../werkvormen): het icoon op het
  // tabblad, en de schakel naar de tip van vakdidactiek die hem onderbouwt.
  const vormen = werkvormenVan(tabs.map((t) => t.attributes[1].value));
  tabs.forEach((t, i) => t.attributes.push(attribuut('werkvorm', vormen[i])));
  return [
    ...boven,
    { type: 'mdxJsxFlowElement', name: 'LesTabs', attributes: [], children: tabs },
    ...esm,
  ];
}

/** De remark-stap. */
function remarkLesTabs() {
  return (tree, file) => {
    if (file?.data?.frontMatter?.les_tabs === false) return;
    const nieuw = groepeer(tree.children);
    if (nieuw) tree.children = nieuw;
  };
}

module.exports = { remarkLesTabs, groepeer, metStappen, tabLabel, tekstVan };
