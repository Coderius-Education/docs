// Les-tabbladen (zie de root-CLAUDE.md): elke `##`-sectie van een les
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

/** Het label van die stap als er alleen voorkennis in staat (zie basisLabel). */
const VOORAF = 'Vooraf';

/** Het label van die stap als de les met de voorspelvraag opent. */
const VOORSPEL = 'Voorspel';

const isBlok = (node) =>
  node.type === 'containerDirective' ||
  (node.type === 'mdxJsxFlowElement' && node.name === 'admonition');

/** Een `:::info`: in deze cursussen het blok met wat je al moet kennen. */
const isInfo = (node) =>
  isBlok(node) &&
  (node.type === 'containerDirective'
    ? node.name === 'info'
    : node.attributes?.some((a) => a.name === 'type' && a.value === 'info'));

/**
 * "De basis" is de kern van de uitleg. Staat er vóór de eerste `###` alleen
 * een blok als "Deze stap gebruikt …" met hooguit wat tekst, dan is dat geen
 * basis maar wat je vooraf moet weten: de stap heet dan Vooraf.
 *
 * @param {object[]} nodes
 */
const basisLabel = (nodes) => {
  const inhoud = nodes.filter((node) => !zetNietsNeer(node));
  if (inhoud.some(isBlok) && inhoud.every((node) => isBlok(node) || isAlinea(node))) return VOORAF;
  // Opent de les met de voorspelvraag (de code met <Voorspel> ernaast), dan
  // heet die stap Voorspel, zoals in de lessen waar de vraag verderop staat.
  const eerste = inhoud.find(
    (node) => !isBlok(node) && !isAlinea(node) && node.name !== 'Voorkennis',
  );
  return eerste?.name === 'LesVoorbeeld' && eerste.attributes.some((a) => a.name === 'vraag')
    ? VOORSPEL
    : BASIS;
};

const isAlinea = (node) => node.type === 'paragraph';
const isLeerdoel = (node) => node.name === 'LesLeerdoel';
const isStap = (node) => node.name === 'LesStap';
const isStappen = (node) => node.name === 'LesStappen';

const stappenlijst = (kinderen) => ({
  type: 'mdxJsxFlowElement',
  name: 'LesStappen',
  attributes: [],
  children: kinderen,
});

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
 * scherm van het tabblad. Het leerdoel staat daar bóven de rij stappen (een
 * kind van <LesStappen> dat geen stap is; het onderdeel toont het alleen bij
 * de eerste stap): onder de rij las het als een deel van stap 1.
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
  const leerdoel = vooraf.filter(isLeerdoel);
  const rest = vooraf.filter((node) => !isLeerdoel(node));
  // Het eerste scherm begint met wat vooraf komt, en bij een korte inleiding
  // ook daarmee.
  if (kort) stappen[0].kinderen.unshift(...rest, ...inleiding);
  const lesStappen = stappen.map(({ kop: h3, kinderen: inhoud }) =>
    element('LesStap', idVan(h3), tekstVan(h3), inhoud),
  );
  if (!kort) {
    lesStappen.unshift(
      element('LesStap', `${sectieId}-basis`, basisLabel(inleiding), [...rest, ...inleiding]),
    );
  }
  return [kop, stappenlijst([...leerdoel, ...lesStappen])];
}

/** De werkvorm van een sectie die naar zijn onderwerp heet. */
const UITLEG_VORM = 'uitleg';

const isUitvoerKop = (node) => isAlinea(node) && /^Uitvoer\b[^.]*:$/.test(tekstVan(node).trim());

const jsx = (name, children, attributes = []) => ({
  type: 'mdxJsxFlowElement',
  name,
  attributes,
  children,
});

const isVoorspel = (node) => node?.type === 'mdxJsxFlowElement' && node.name === 'Voorspel';

/** Vanaf zoveel regels is een programma lang, en tot zoveel een uitvoer kort. */
const LANG = 12;
const KORT = 5;

/** Een gewone alinea na een voorbeeld, die niets aankondigt. */
const isToelichting = (node) =>
  node !== undefined &&
  isAlinea(node) &&
  !/:$/.test(tekstVan(node).trim()) &&
  !node.children.some((k) => k.type === 'image' || k.name === 'img' || k.type === 'strong');

/**
 * Een codeblok dat direct door "Uitvoer:" en een uitvoerblok wordt gevolgd,
 * komt in een <LesVoorbeeld>: de code links, de uitvoer rechts (in een eigen
 * <div>). Onder elkaar kost zo'n voorbeeld honderd pixels meer, en in de
 * Python-cursus staan er 225. Ook "Uitvoer bij 50:" telt.
 *
 * Hetzelfde voor een codeblok met de voorspelvraag eronder (<Voorspel>): de
 * code links, de vraag rechts. Onder elkaar waren die twee samen al hoger dan
 * het scherm.
 *
 * @param {object[]} kinderen
 */
function voorbeeldenNaastElkaar(kinderen) {
  const uit = [];
  for (let i = 0; i < kinderen.length; i++) {
    const [code, kop, uitvoer] = kinderen.slice(i, i + 3);
    if (code.type === 'code' && kop && isUitvoerKop(kop) && uitvoer?.type === 'code') {
      const rechts = [kop, uitvoer];
      i += 2;
      // Naast een lang programma met een korte uitvoer is rechts ruimte over:
      // de alinea's die het programma toelichten, staan daar. Een zin die het
      // volgende blok aankondigt ("Met een lijst gaat het zo:") niet.
      const regels = (node) => (node.value ?? '').split('\n').length;
      if (regels(code) >= LANG && regels(uitvoer) <= KORT) {
        while (rechts.length < 4 && isToelichting(kinderen[i + 1])) rechts.push(kinderen[++i]);
      }
      uit.push(jsx('LesVoorbeeld', [code, jsx('div', rechts)]));
    } else if (code.type === 'code' && isVoorspel(kop)) {
      uit.push(jsx('LesVoorbeeld', [code, kop], [attribuut('vraag', 'ja')]));
      i += 1;
    } else uit.push(code);
  }
  return uit;
}

/** Een alinea met alleen een vette bestandsnaam: **`rekenen.py`**. */
const isBestandsnaam = (node) =>
  isAlinea(node) &&
  node.children.length === 1 &&
  node.children[0].type === 'strong' &&
  /^[\w.-]+\.\w+$/.test(tekstVan(node).trim());

/**
 * Twee of meer bestanden onder elkaar, elk met zijn naam erboven
 * (**`rekenen.py`** en **`main.py`**), staan naast elkaar: een programma dat
 * een module importeert lees je met de module ernaast. Staat er direct een
 * voorspelvraag onder, dan is die de laatste kolom: de vraag gaat over beide
 * bestanden, en onder elkaar pasten de drie niet op het scherm.
 *
 * @param {object[]} kinderen
 */
function bestandenNaastElkaar(kinderen) {
  const uit = [];
  let i = 0;
  // Een bestand: de naam, een commentaar (`{/* niet-draaien: … */}`), de code.
  const bestandOp = (plek) => {
    if (!kinderen[plek] || !isBestandsnaam(kinderen[plek])) return null;
    let k = plek + 1;
    while (k < kinderen.length && zetNietsNeer(kinderen[k])) k++;
    return kinderen[k]?.type === 'code' ? { tot: k + 1 } : null;
  };
  while (i < kinderen.length) {
    const groepen = [];
    let k = i;
    for (let b = bestandOp(k); b; b = bestandOp(k)) {
      groepen.push(jsx('div', kinderen.slice(k, b.tot)));
      k = b.tot;
    }
    if (groepen.length < 2) {
      uit.push(kinderen[i]);
      i += 1;
      continue;
    }
    if (isVoorspel(kinderen[k])) {
      groepen.push(kinderen[k]);
      k += 1;
    }
    uit.push(jsx('LesVoorbeeld', groepen, [attribuut('bestanden', 'ja')]));
    i = k;
  }
  return uit;
}

/** De oefenvelden die een doel naast hun uitvoer kunnen tonen (useLesDoel). */
const VELDEN_MET_DOEL = ['CodeExercise'];

const isVeld = (node) => node.type === 'mdxJsxFlowElement' && VELDEN_MET_DOEL.includes(node.name);

// "Verwachte uitvoer (bij cijfer = 4.0):", "Uitvoer als je 4 en 10 typt:", en
// bij een spel met een geheim getal "Een spel kan zo gaan:".
const isVerwachtKop = (node) =>
  isAlinea(node) &&
  /^(Verwachte uitvoer|Uitvoer|Een spel kan)\b[\s\S]{0,160}:$/.test(tekstVan(node).trim());

const isPlaatje = (node) => node.type === 'image' || node.name === 'img';

/** Een alinea met alleen een plaatje: het doelplaatje van een turtle-opdracht. */
const isPlaatjeAlinea = (node) => {
  if (!isAlinea(node)) return false;
  const inhoud = node.children.filter((k) => !(k.type === 'text' && !k.value.trim()));
  return inhoud.length > 0 && inhoud.every(isPlaatje);
};

/** Wat er boven een doelplaatje in de uitvoerkolom staat. */
const DOEL_PLAATJE = 'Zo moet het worden:';

/** De startcode van een oefenveld: `<CodeExercise>{\`…\`}</CodeExercise>`. */
function startcode(veld) {
  const kind = (veld.children ?? []).find((k) => /Expression$/.test(k.type));
  const m = /^`([\s\S]*)`$/.exec((kind?.value ?? '').trim());
  return m ? m[1].replace(/\\([\\`$])/g, '$1') : null;
}

// MDX eet inspringing van een expressie op (zie mdx-inspringing.js): alleen
// de tekst van de regels telt.
const plat = (code) =>
  code
    .trim()
    .split('\n')
    .map((regel) => regel.trim())
    .join('\n');

/**
 * Een codeblok met daaronder een oefenveld met dezelfde code: het blok
 * vervalt. In twintig projectstappen van de Python-cursus stond de code zo
 * twee keer onder elkaar, het voorbeeld en het veld om het te proberen;
 * samen waren die hoger dan het scherm. Het veld laat dezelfde code zien.
 *
 * Tussen de twee mag een alinea staan ("Druk op Uitvoeren en kijk wat er
 * gebeurt."): het veld komt dan op de plek van het blok, en de alinea
 * eronder.
 *
 * @param {object[]} kinderen
 */
function zonderDubbeleCode(kinderen) {
  const uit = [];
  for (let i = 0; i < kinderen.length; i++) {
    const node = kinderen[i];
    uit.push(node);
    if (node.type !== 'code') continue;
    let k = i + 1;
    let alineas = 0;
    while (
      k < kinderen.length &&
      (zetNietsNeer(kinderen[k]) || (isToelichting(kinderen[k]) && alineas++ < 1))
    )
      k++;
    const veld = kinderen[k];
    if (!veld || !isVeld(veld)) continue;
    const start = startcode(veld);
    if (start === null || plat(start) !== plat(node.value ?? '')) continue;
    uit.pop();
    uit.push(veld, ...kinderen.slice(i + 1, k));
    i = k;
  }
  return uit;
}

/**
 * Wat een opdracht moet opleveren, staat in de uitvoerkolom van het oefenveld:
 * de verwachte uitvoer ("Verwachte uitvoer:" met een blok) of het doelplaatje
 * van een turtle-opdracht. Boven het veld kostte dat tot driehonderd pixels,
 * en het veld stond dan onder de rand van het scherm; in de kolom staat het
 * naast wat de leerling zelf krijgt.
 *
 * Het doel staat vlak voor het veld: er mogen een commentaar en hooguit twee
 * alinea's tussen staan. Het veld en zijn doel komen in een <LesVeld>, met
 * het doel in een <LesDoel> vooraan.
 *
 * @param {object[]} kinderen
 */
function doelNaastVeld(kinderen) {
  const uit = [];
  for (const node of kinderen) {
    if (!isVeld(node)) {
      uit.push(node);
      continue;
    }
    // Terug vanaf het veld, langs commentaar en hooguit twee alinea's.
    let i = uit.length - 1;
    let alineas = 0;
    const tussen = (n) =>
      zetNietsNeer(n) || (isAlinea(n) && !isPlaatjeAlinea(n) && !isVerwachtKop(n));
    while (i >= 0 && tussen(uit[i]) && (zetNietsNeer(uit[i]) || alineas++ < 2)) i--;
    // Van daar verder terug: elk doelplaatje en elke "Verwachte uitvoer (bij
    // …):" met zijn blok. Een opdracht die twee gevallen toont, heeft er twee;
    // een turtle-opdracht met input() heeft een uitvoer én een plaatje.
    const delen = [];
    let vanaf = i + 1;
    for (let k = i; k >= 0; ) {
      while (k >= 0 && zetNietsNeer(uit[k])) k--;
      if (k < 0) break;
      if (isPlaatjeAlinea(uit[k])) {
        const kopje = { type: 'paragraph', children: [{ type: 'text', value: DOEL_PLAATJE }] };
        delen.unshift(kopje, uit[k]);
        vanaf = k;
        k -= 1;
        continue;
      }
      if (uit[k].type !== 'code') break;
      let kop = k - 1;
      while (kop >= 0 && zetNietsNeer(uit[kop])) kop--;
      if (kop < 0 || !isVerwachtKop(uit[kop])) break;
      delen.unshift(uit[kop], uit[k]);
      vanaf = kop;
      k = kop - 1;
    }
    const doel = delen.length ? delen : null;
    if (!doel) {
      uit.push(node);
      continue;
    }
    // Het commentaar tussen de kop en het blok blijft staan: het zet niets neer.
    const weg = new Set(doel);
    const rest = uit.splice(vanaf).filter((n) => !weg.has(n));
    uit.push(...rest, jsx('LesVeld', [jsx('LesDoel', doel), node]));
  }
  return uit;
}

/** Het label van het tabblad met wat vóór de eerste `##` staat. */
const UITLEG = 'Uitleg';

/** De werkvorm van een sectie die geen eigen tabblad krijgt (zie groepeer). */
const LEERDOEL = 'leerdoel';

const eigenschap = (node, naam) => node.attributes.find((a) => a.name === naam)?.value;

/**
 * De stappen die één uitleg-tabblad oplevert als het opgaat in het tabblad
 * Uitleg (zie voegUitlegSamen), en wat daar boven de rij stappen hoort.
 *
 * @param {object} tab een <LesTab>
 * @param {string} uitlegId het id van het tabblad met wat vóór de eerste `##` staat
 */
function alsStappen(tab, uitlegId) {
  const id = eigenschap(tab, 'id');
  const titel = eigenschap(tab, 'titel');
  // Uitleg vóór de eerste `##` heeft geen kop: het is de eerste stap, De basis.
  const lijst = tab.children.find(isStappen);
  if (id === uitlegId) {
    // Heeft die uitleg zelf stappen (uitlegMetStappen), dan zijn dat ze al.
    if (lijst) return { boven: [], stappen: lijst.children.filter(isStap) };
    return {
      boven: [],
      stappen: [element('LesStap', `${id}-basis`, basisLabel(tab.children), tab.children)],
    };
  }
  if (!lijst) return { boven: [], stappen: [element('LesStap', id, titel, tab.children)] };
  // Een sectie die zelf al stappen had: die schuiven een niveau op. De `##`
  // en wat ervoor stond gaan mee in de eerste, zodat een link naar de `##`
  // daar uitkomt.
  const voor = tab.children.filter((node) => node !== lijst);
  const [eerste, ...rest] = lijst.children.filter(isStap);
  const inhoud = [...voor, ...eerste.children];
  const isBasis = eigenschap(eerste, 'id') === `${id}-basis`;
  return {
    boven: lijst.children.filter((node) => !isStap(node)),
    stappen: [
      isBasis ? element('LesStap', id, titel, inhoud) : { ...eerste, children: inhoud },
      ...rest,
    ],
  };
}

/**
 * De uitleg vóór de eerste `##` heeft geen kop, maar kan wel stappen hebben:
 * elke `###` is er een (in de Python-cursus de voorspelvraag, `### Voorspel`).
 * Wat vóór de eerste `###` staat, is De basis.
 *
 * @param {object[]} uitleg
 * @param {string} id het id van het tabblad Uitleg
 */
function uitlegMetStappen(uitleg, id) {
  const eerste = uitleg.findIndex(isH3);
  if (eerste < 0) return uitleg;
  const stappen = [];
  for (const node of uitleg.slice(eerste)) {
    if (isH3(node)) stappen.push({ kop: node, kinderen: [node] });
    else stappen.at(-1).kinderen.push(node);
  }
  const lesStappen = stappen.map(({ kop, kinderen }) =>
    element('LesStap', idVan(kop), tekstVan(kop), kinderen),
  );
  const basis = uitleg.slice(0, eerste);
  const inhoud = basis.filter((node) => !zetNietsNeer(node));
  // Eén losse alinea is geen scherm: hij opent de eerste stap (zie metStappen).
  const kort = inhoud.length === 0 || (inhoud.length === 1 && isAlinea(inhoud[0]));
  if (kort) lesStappen[0].children.unshift(...basis);
  else lesStappen.unshift(element('LesStap', `${id}-basis`, basisLabel(basis), basis));
  if (lesStappen.length < 2) return uitleg;
  return [stappenlijst(lesStappen)];
}

/**
 * Een les over JavaScript begint met drie of vier secties uitleg, elk naar
 * zijn onderwerp genoemd ("Een item ophalen", "Combineren met een loop").
 * Als losse tabbladen maakten die de rij te lang: in acht van de zestien
 * lessen stond hij op 1280 pixels op twee regels. Ze worden daarom samen één
 * tabblad, Uitleg, met elke sectie als stap; zo heeft een les over JavaScript
 * dezelfde vorm als een les over HTML, met zijn Theorie in stappen.
 *
 * Alleen de uitleg waar de les mee begint, en alleen als er daarna nog een
 * ander tabblad komt: een les die helemaal uit uitleg bestaat, houdt zijn
 * tabbladen.
 *
 * @param {object[]} tabs de <LesTab>-elementen
 * @param {string[]} vormen de werkvorm van elk tabblad
 * @param {string | null} uitlegId het id van het tabblad Uitleg, als dat er is
 */
function voegUitlegSamen(tabs, vormen, uitlegId) {
  let aantal = 0;
  while (aantal < tabs.length && vormen[aantal] === UITLEG_VORM) aantal++;
  if (aantal < 2 || aantal === tabs.length) return { tabs, vormen };
  const delen = tabs.slice(0, aantal).map((tab) => alsStappen(tab, uitlegId));
  const bezet = new Set(tabs.map((tab) => eigenschap(tab, 'id')));
  const id = uitlegId ?? (bezet.has('uitleg') ? 'les-uitleg' : 'uitleg');
  const samen = element('LesTab', id, UITLEG, [
    stappenlijst([...delen.flatMap((d) => d.boven), ...delen.flatMap((d) => d.stappen)]),
  ]);
  return {
    tabs: [samen, ...tabs.slice(aantal)],
    vormen: [UITLEG_VORM, ...vormen.slice(aantal)],
  };
}

const OPDRACHT = ['aanpassen', 'maken'];
const vindVeld = (node) =>
  isVeld(node) ? node : (node.children ?? []).map(vindVeld).find(Boolean);

/**
 * Een opdracht op code die er al staat is aanpassen, een opdracht vanaf een
 * leeg veld zelf maken. Aan de kop "Opdracht 3.2" is dat niet te zien, en de
 * regel "de laatste van de rij is zelf maken" klopte in de Python-cursus voor
 * de helft: 66 van de 132 opdrachten beginnen met een leeg veld. Heeft het
 * tabblad een oefenveld waarvan de startcode te lezen is, dan beslist die:
 * alleen commentaar (of niets) is een leeg veld.
 *
 * @param {object} tab een <LesTab>
 * @param {string} vorm de werkvorm naar de kop
 */
function vormNaarStartcode(tab, vorm) {
  if (!OPDRACHT.includes(vorm) || !/^Opdracht\b/.test(eigenschap(tab, 'titel'))) return vorm;
  const veld = vindVeld(tab);
  const start = veld ? startcode(veld) : null;
  if (start === null) return vorm;
  const code = start.split('\n').some((regel) => regel.trim() && !regel.trim().startsWith('#'));
  return code ? 'aanpassen' : 'maken';
}

/**
 * Er gaat iets mis staat na de opdrachten, ook als de bron hem ervoor heeft.
 * In de lessen van de Python-cursus stond hij tussen de uitleg en de eerste
 * opdracht, en bracht de knop Volgende een leerling langs fouten die hij nog
 * niet had kunnen maken; in de projecten en bij web staat hij erna.
 *
 * @param {object[]} tabs
 * @param {string[]} vormen
 */
function foutenNaOpdrachten(tabs, vormen) {
  const fout = vormen.indexOf('fouten');
  const laatste = vormen.findLastIndex((vorm) => OPDRACHT.includes(vorm));
  if (fout < 0 || laatste < fout) return { tabs, vormen };
  const schuif = (lijst) => [
    ...lijst.slice(0, fout),
    ...lijst.slice(fout + 1, laatste + 1),
    lijst[fout],
    ...lijst.slice(laatste + 1),
  ];
  return { tabs: schuif(tabs), vormen: schuif(vormen) };
}

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
 * De uitleg waar een les mee begint, wordt één tabblad met stappen (zie
 * voegUitlegSamen).
 *
 * Twee dingen krijgen geen eigen tabblad, want dat was een scherm met één
 * zin en een knop Volgende:
 *  - het leerdoel van de les ("Wat ga je leren?", een of twee alinea's): het
 *    staat in een <LesLeerdoel> bovenaan het tabblad erna;
 *  - uitleg vóór de eerste `##` van één alinea: die opent het eerste tabblad.
 *
 * @param {object[]} kinderen de kinderen van de mdast-root
 */
function groepeer(alles) {
  const kinderen = doelNaastVeld(
    voorbeeldenNaastElkaar(bestandenNaastElkaar(zonderDubbeleCode(alles))),
  );
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

  // Uitleg van één alinea, of van een blok als "Deze stap gebruikt …" met een
  // of twee alinea's, is geen eigen scherm: hij opent het eerste tabblad. Maar
  // alleen als er daarna nog twee tabbladen zijn; anders bleef er één over en
  // had de pagina geen tabbladen meer.
  const alineas = uitleg.filter(isAlinea).length;
  const korteUitleg =
    (uitleg.length === 1 && isAlinea(uitleg[0])) ||
    (uitleg.length > 0 &&
      secties.length >= 2 &&
      alineas <= 2 &&
      uitleg.filter(isBlok).length === 1 &&
      uitleg.some(isInfo) &&
      uitleg.every((node) => isBlok(node) || isAlinea(node) || zetNietsNeer(node)));
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
  let uitlegId = null;
  if (uitleg.length && !korteUitleg) {
    // Een id dat geen kop van de les al heeft.
    const bezet = new Set(tabs.map((t) => eigenschap(t, 'id')));
    uitlegId = bezet.has('uitleg') ? 'les-uitleg' : 'uitleg';
    tabs.unshift(element('LesTab', uitlegId, UITLEG, uitlegMetStappen(uitleg, uitlegId)));
  }
  if (tabs.length < 2) return null;
  // Elk tabblad krijgt zijn werkvorm (../werkvormen): het icoon op het
  // tabblad, en de schakel naar de tip van vakdidactiek die hem onderbouwt.
  const samen = voegUitlegSamen(
    tabs,
    werkvormenVan(tabs.map((t) => eigenschap(t, 'titel'))),
    uitlegId,
  );
  const geordend = foutenNaOpdrachten(
    samen.tabs,
    samen.tabs.map((tab, i) => vormNaarStartcode(tab, samen.vormen[i])),
  );
  geordend.tabs.forEach((t, i) => t.attributes.push(attribuut('werkvorm', geordend.vormen[i])));
  return [
    ...boven,
    { type: 'mdxJsxFlowElement', name: 'LesTabs', attributes: [], children: geordend.tabs },
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
