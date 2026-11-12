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

/**
 * Het label van een stap. De stappen in een tabblad hebben al een nummer:
 * "Stap 2: Kies een pin" heet in de rij "Kies een pin", niet "Stap 2" (het
 * ingebouwde lampje van robotica had zo "1 Stap 1, 2 Stap 2, 3 Stap 3").
 *
 * @param {string} titel
 */
function stapLabel(titel) {
  const na = /^Stap \d+: (.+)$/.exec(titel)?.[1].trim();
  return na ? na[0].toUpperCase() + na.slice(1) : tabLabel(titel);
}

const element = (name, id, titel, kinderen) => ({
  type: 'mdxJsxFlowElement',
  name,
  attributes: [
    attribuut('id', id),
    attribuut('titel', titel),
    attribuut('label', name === 'LesStap' ? stapLabel(titel) : tabLabel(titel)),
  ],
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
const basisLabel = (nodes, kop) => {
  const inhoud = nodes.filter((node) => !zetNietsNeer(node));
  if (inhoud.some(isBlok) && inhoud.every((node) => isBlok(node) || isAlinea(node))) return VOORAF;
  // Een kop met een dubbele punt heeft het stuk ervoor als label van zijn
  // tabblad ("Stap 1"). Het stuk erna zegt waar de stap over gaat, en is dan
  // de naam van het eerste scherm: "Het getal uitlezen" zegt meer dan
  // "De basis".
  const naDubbelePunt = kop ? /^[^:]+:\s+(.+)$/.exec(tekstVan(kop).trim())?.[1] : null;
  if (naDubbelePunt) return naDubbelePunt[0].toUpperCase() + naDubbelePunt.slice(1);
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
      element('LesStap', `${sectieId}-basis`, basisLabel(inleiding, kop), [...rest, ...inleiding]),
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

/** Een programma in blokken (de Golfbot van robotica): `<Blokken programma={…} />`. */
const isBlokprogramma = (node) => node?.type === 'mdxJsxFlowElement' && node.name === 'Blokken';

/**
 * Een onderdeel waar de leerling mee oefent en dat de breedte nodig heeft (de
 * sensorsimulator van de Golfbot). De vragen die erbij horen staan ernaast,
 * in een smallere kolom, ook als het antwoord in een uitklapblok staat.
 */
const BREED_ONDERDEEL = ['SensorSimulator'];
const isBreedOnderdeel = (node) =>
  node?.type === 'mdxJsxFlowElement' && BREED_ONDERDEEL.includes(node.name);
const isUitklapblok = (node) =>
  node?.type === 'mdxJsxFlowElement' && /^details$/i.test(node.name ?? '');

/** Vanaf zoveel regels is een programma lang, en tot zoveel een uitvoer kort. */
const LANG = 12;
const KORT = 5;

/** Een gewone alinea na een voorbeeld, die niets aankondigt. */
const isToelichting = (node) =>
  node !== undefined &&
  isAlinea(node) &&
  !/:$/.test(tekstVan(node).trim()) &&
  !node.children.some((k) => k.type === 'image' || k.name === 'img' || k.type === 'strong');

const regels = (node) => (node.value ?? '').split('\n').length;

/** Vanaf zoveel regels code staat een tabel die hem toelicht ernaast. */
const MET_TABEL = 6;

/** Meer regels dan dit, en een programma schuift in een paneel in zijn eigen vak. */
const EIGEN_VAK = 16;

/**
 * Hoeveel knopen na een codeblok hem toelichten en ernaast kunnen staan:
 * alinea's, een lijst, een tabel, een waarschuwing, hooguit drie. Er moet een
 * lijst, een tabel of een blok bij zijn: code met alleen een alinea eronder is lopende uitleg en
 * blijft onder elkaar. Behalve bij een programma dat in zijn eigen vak
 * schuift: onder elkaar is dat met een alinea al hoger dan het scherm. Een
 * alinea die het volgende aankondigt ("Met een lijst gaat het zo:") telt
 * niet mee als hij de laatste is.
 *
 * @param {object[]} kinderen
 * @param {number} vanaf de eerste knoop na de code
 * @param {number} lengte het aantal regels van de code
 */
function toelichtingNa(kinderen, vanaf, lengte) {
  // Een tabel heeft breedte nodig: naast een fragment van een paar regels
  // wint het scherm niets en breekt elke cel (les 9e van python: twee regels
  // code en een tabel van vier kolommen waren naast elkaar 40 pixels te lang).
  const isPunt = (node) =>
    node.type === 'list' || isBlok(node) || (node.type === 'table' && lengte >= MET_TABEL);
  const hoortErbij = (node) =>
    node !== undefined &&
    !isVraagAlinea(node) &&
    !isUitvoerKop(node) &&
    !isVerwachtKop(node) &&
    !isBestandsnaam(node) &&
    ((isAlinea(node) && !isPlaatjeAlinea(node)) || isPunt(node));
  let aantal = 0;
  while (aantal < 3 && hoortErbij(kinderen[vanaf + aantal])) aantal++;
  // Een aankondiging aan het eind hoort bij wat erna komt.
  while (aantal > 0 && isAankondiging(kinderen[vanaf + aantal - 1])) aantal--;
  if (lengte > EIGEN_VAK) return aantal;
  // Tot en met de laatste lijst of het laatste blok: een alinea daarna is
  // weer lopende tekst.
  while (aantal > 0 && !isPunt(kinderen[vanaf + aantal - 1])) aantal--;
  return aantal;
}

const isAankondiging = (node) => isAlinea(node) && /:$/.test(tekstVan(node).trim());

/** Een alinea die met een vette "Vraag:" begint. */
const isVraagAlinea = (node) =>
  node !== undefined &&
  isAlinea(node) &&
  node.children[0]?.type === 'strong' &&
  /^Vraag\b/.test(tekstVan(node.children[0]).trim());

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
      if (regels(code) >= LANG && regels(uitvoer) <= KORT) {
        while (rechts.length < 4 && isToelichting(kinderen[i + 1])) rechts.push(kinderen[++i]);
      }
      uit.push(jsx('LesVoorbeeld', [code, jsx('div', rechts)]));
    } else if (code.type === 'code' && toelichtingNa(kinderen, i + 1, regels(code)) > 0) {
      // Code met wat hem toelicht (de naslag van robotica: een fragment, en
      // per onderdeel een punt in een lijst of een waarschuwing). Naast
      // elkaar leest de leerling het punt bij de regel, en het scherm is half
      // zo lang.
      const aantal = toelichtingNa(kinderen, i + 1, regels(code));
      const rechts = kinderen.slice(i + 1, i + 1 + aantal);
      uit.push(jsx('LesVoorbeeld', [code, jsx('div', rechts)], [attribuut('toelichting', 'ja')]));
      i += aantal;
    } else if (code.type === 'code' && isVraagAlinea(kop)) {
      // Code met de vraag eronder ("**Vraag:** hoe vaak …?") en de tip en de
      // oplossing in uitklapblokken: de vraag gaat over de code, dus die
      // staat ernaast. Onder elkaar was zo'n opdracht tot 240 pixels te lang.
      const rechts = [kop];
      i += 1;
      while (rechts.length < 4 && isUitklapblok(kinderen[i + 1])) rechts.push(kinderen[++i]);
      // "vraag": het codevak mag hier hoger zijn, want de vraag gaat over het
      // hele programma (zie de opmaak van LesVoorbeeld).
      uit.push(
        jsx('LesVoorbeeld', [code, jsx('div', rechts)], [attribuut('toelichting', 'vraag')]),
      );
    } else if ((code.type === 'code' || isBlokprogramma(code)) && isVoorspel(kop)) {
      uit.push(jsx('LesVoorbeeld', [code, kop], [attribuut('vraag', 'ja')]));
      i += 1;
    } else uit.push(code);
  }
  return uit;
}

/** Een alinea met alleen een vette bestandsnaam (**`rekenen.py`**) of **Code A:**. */
const isBestandsnaam = (node) =>
  isAlinea(node) &&
  node.children.length === 1 &&
  node.children[0].type === 'strong' &&
  /^([\w.-]+\.\w+|Code \w+:?)$/.test(tekstVan(node).trim());

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

/** Vanaf zoveel tabbladen past de rij op 1280 pixels niet meer op één regel. */
const VEEL_TABS = 9;
/** En meer stappen dan dit passen in een tabblad niet op één regel. */
const MEESTE_STAPPEN = 8;
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
 * tabbladen. Ook een les waarvan de uitleg samen meer dan acht stappen heeft.
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
  // Samen meer stappen dan er op één regel passen, terwijl de tabbladen los
  // wel op één regel staan: dan blijven het tabbladen. Het ingebouwde lampje
  // van robotica (aanzetten, knipperen, een kleur) had één tabblad Uitleg
  // met twaalf stappen op twee regels.
  const stappen = delen.reduce((som, d) => som + d.stappen.length, 0);
  if (stappen > MEESTE_STAPPEN && tabs.length < VEEL_TABS) return { tabs, vormen };
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
 * Een bestand of map met een `_` vooraan is een deel dat een pagina
 * importeert (`docs/onderdelen/_delen/dc-motor/pinnen.md` bij robotica), geen
 * pagina. Docusaurus bouwt het met dezelfde stappen als een les; met eigen
 * tabbladen stonden die midden in de pagina die het deel gebruikt.
 *
 * @param {string | undefined} pad
 */
const isDeel = (pad) => /(^|[\\/])_[^\\/]*([\\/]|$)/.test(pad ?? '');

/**
 * De namen waaronder een pagina een deel importeert: een bestand of map met
 * een `_` vooraan (`import ShieldRijen from '…/_delen/shield/rijen.md'`). Zo'n
 * element is tekst van de pagina zelf; een ander onderdeel (een oefenveld,
 * een 3D-model) is dat niet.
 *
 * @param {object[]} kinderen
 * @returns {Set<string>}
 */
function deelNamen(kinderen) {
  const namen = new Set();
  for (const node of kinderen) {
    if (node.type !== 'mdxjsEsm') continue;
    for (const [, naam, pad] of (node.value ?? '').matchAll(
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    )) {
      if (isDeel(pad)) namen.add(naam);
    }
  }
  return namen;
}

/** Tekst die bij een plaatje hoort: alinea's, lijsten, een tabel, een blok. */
const isTekstblok = (node, delen) =>
  (isAlinea(node) && !isPlaatjeAlinea(node) && !isVerwachtKop(node)) ||
  node.type === 'list' ||
  node.type === 'table' ||
  isBlok(node) ||
  (node.type === 'mdxJsxFlowElement' && delen.has(node.name));

/** Vanaf zoveel plaatjes achter elkaar is het een reeks. */
const REEKS_VANAF = 3;
/**
 * Een plaatje met de tekst die erop volgt staat naast elkaar: het plaatje
 * links, de tekst rechts. Bij robotica is dat het aansluitschema met de
 * pinnen eronder. Onder elkaar was zo'n scherm tot tweehonderd pixels te
 * lang, en een plaatje in een paneel is dan hooguit een derde van het scherm
 * hoog: de legenda van het schema was niet meer te lezen. Naast de tekst mag
 * het plaatje zo hoog zijn als de tekst lang is.
 *
 * Hetzelfde voor een programma in blokken met de tekst erna. Een plaatje waar
 * geen tekst op volgt (het volgende is een kop, code of nog een plaatje)
 * blijft staan, en het doelplaatje van een opdracht staat al in
 * zijn veld (doelNaastVeld).
 *
 * @param {object[]} kinderen
 */
function plaatjesNaastTekst(kinderen) {
  const delen = deelNamen(kinderen);
  const uit = [];
  for (let i = 0; i < kinderen.length; i++) {
    const node = kinderen[i];
    const breed = isBreedOnderdeel(node);
    // Drie of meer foto's in één alinea zijn een reeks (zie reeksen), geen
    // plaatje met tekst ernaast.
    const eenPlaatje =
      isAlinea(node) &&
      isPlaatjeAlinea(node) &&
      node.children.filter(isPlaatje).length < REEKS_VANAF;
    if (!eenPlaatje && !isBlokprogramma(node) && !breed) {
      uit.push(node);
      continue;
    }
    // Commentaar (`{/* stijl-uitzondering: … */}`) zet niets neer en breekt
    // de rij dus niet af.
    // Een kort codeblok na de tekst hoort erbij ("In het scherm verschijnt:"
    // met één regel uitvoer): onder het plaatje stond het los van zijn zin.
    const tekst = [];
    const hoortErbij = (n) =>
      isTekstblok(n, delen) ||
      zetNietsNeer(n) ||
      (breed && isUitklapblok(n)) ||
      (n.type === 'code' && regels(n) <= KORT && tekst.some(isAlinea));
    while (i + 1 < kinderen.length && hoortErbij(kinderen[i + 1])) tekst.push(kinderen[++i]);
    if (!tekst.some((n) => !zetNietsNeer(n))) uit.push(node, ...tekst);
    else {
      uit.push(
        jsx(
          'LesVoorbeeld',
          [node, jsx('div', tekst)],
          [attribuut('beeld', breed ? 'breed' : 'ja')],
        ),
      );
    }
  }
  return uit;
}

// Een plaatje met een onderschrift, of een los `<img>` op een eigen regel.
const isFiguur = (node) =>
  node.type === 'mdxJsxFlowElement' && (node.name === 'figure' || node.name === 'img');

/**
 * Een rij plaatjes met een onderschrift (`<figure>`) direct na elkaar is een
 * reeks bouwstappen: de toren van de Golfbot heeft er tien, de arm vijftien.
 * Onder elkaar was dat tabblad tot 4100 pixels te lang. In een <LesReeks>
 * staat er één tegelijk, met Vorige en Volgende, zoals in een bouwboekje.
 * Drie of meer foto's in één alinea zijn ook een reeks.
 *
 * @param {object[]} kinderen
 */
function reeksen(kinderen) {
  const uit = [];
  let i = 0;
  while (i < kinderen.length) {
    let j = i;
    while (j < kinderen.length && isFiguur(kinderen[j])) j++;
    const fotos = isPlaatjeAlinea(kinderen[i]) ? kinderen[i].children.filter(isPlaatje) : [];
    if (j - i >= REEKS_VANAF) {
      uit.push(jsx('LesReeks', kinderen.slice(i, j)));
      i = j;
    } else if (fotos.length >= REEKS_VANAF) {
      // Foto's zonder onderschrift in één alinea (de drie stappen van de
      // IR-sensor in zijn adapter): elk een eigen plek in de reeks.
      uit.push(
        jsx(
          'LesReeks',
          fotos.map((foto) => ({ type: 'paragraph', children: [foto] })),
        ),
      );
      i += 1;
    } else uit.push(kinderen[i++]);
  }
  return uit;
}

/** Werkvormen waarin de leerling nog niets zelf doet. */
const LEZEN = ['leerdoel', 'uitleg', 'voorspellen'];

/**
 * Er gaat iets mis staat na de opdrachten, als de bron hem tussen de uitleg en
 * de eerste opdracht heeft. In de lessen van de Python-cursus bracht de knop
 * Volgende een leerling daar langs fouten die hij nog niet had kunnen maken.
 *
 * Alleen in die vorm. Staat er vóór de fouten al een tabblad waarin de
 * leerling iets doet (de stappen en Test het van de Lego-auto, de opdracht
 * van een projectstap), dan gaan de fouten over dat werk en blijven ze staan.
 * En het tabblad komt direct na de rij opdrachten, niet na wat daarop volgt:
 * een afsluiter als Maak het je eigen of Verder bouwen blijft het laatste.
 *
 * @param {object[]} tabs
 * @param {string[]} vormen
 */
function foutenNaOpdrachten(tabs, vormen) {
  const fout = vormen.indexOf('fouten');
  if (fout < 0 || !vormen.slice(0, fout).every((vorm) => LEZEN.includes(vorm)))
    return { tabs, vormen };
  let laatste = fout;
  while (OPDRACHT.includes(vormen[laatste + 1])) laatste++;
  if (laatste === fout) return { tabs, vormen };
  const schuif = (lijst) => [
    ...lijst.slice(0, fout),
    ...lijst.slice(fout + 1, laatste + 1),
    lijst[fout],
    ...lijst.slice(laatste + 1),
  ];
  return { tabs: schuif(tabs), vormen: schuif(vormen) };
}

/**
 * Wat naast elkaar past, naast elkaar: bestanden, een voorbeeld met zijn
 * uitvoer of zijn toelichting, het doel in het veld, een plaatje met zijn
 * tekst, en een rij plaatjes als reeks. Voor een les en voor een deel.
 *
 * @param {object[]} alles de kinderen van de mdast-root
 */
const naastElkaar = (alles) =>
  reeksen(
    plaatjesNaastTekst(
      doelNaastVeld(voorbeeldenNaastElkaar(bestandenNaastElkaar(zonderDubbeleCode(alles)))),
    ),
  );

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
  const kinderen = naastElkaar(alles);
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
  const kort =
    (uitleg.length === 1 && isAlinea(uitleg[0])) ||
    (uitleg.length > 0 &&
      secties.length >= 2 &&
      alineas <= 2 &&
      uitleg.filter(isBlok).length === 1 &&
      uitleg.some(isInfo) &&
      uitleg.every((node) => isBlok(node) || isAlinea(node) || zetNietsNeer(node)));
  const isLeerdoelSectie = ({ kop, kinderen: inhoud }, i) =>
    werkvormenVan([tekstVan(kop)])[0] === LEERDOEL &&
    i < secties.length - 1 &&
    inhoud.length <= 3 &&
    inhoud.slice(1).every(isAlinea);
  // Een les die met een inleiding én een leerdoel begint (de Lego-auto: waar
  // de les over gaat, en dan Wat je nu gaat toevoegen), heeft die twee samen
  // als eerste tabblad. Bij de eerste stap erbij was dat scherm tot 270
  // pixels te lang.
  const opening = uitleg.length > 0 && secties.length >= 3 && isLeerdoelSectie(secties[0], 0);
  const korteUitleg = !opening && kort;
  // Wat bij het eerstvolgende tabblad komt te staan.
  let vooraf = korteUitleg ? [...uitleg] : [];
  const tabs = [];
  secties.forEach((sectie, i) => {
    const { kop, kinderen: inhoud } = sectie;
    if (isLeerdoelSectie(sectie, i)) {
      // De kop gaat mee: hij is het doel van een link en zegt een schermlezer
      // wat de zin is.
      const leerdoel = {
        type: 'mdxJsxFlowElement',
        name: 'LesLeerdoel',
        attributes: [],
        children: inhoud,
      };
      if (opening && i === 0) uitleg.push(leerdoel);
      else vooraf.push(leerdoel);
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
  korteOpdrachten(geordend.tabs);
  return [
    ...boven,
    { type: 'mdxJsxFlowElement', name: 'LesTabs', attributes: [], children: geordend.tabs },
    ...esm,
  ];
}

/** En zoveel opdrachten achter elkaar zijn een reeks. */
const REEKS_OPDRACHTEN = 4;
const GENUMMERD = /^Opdracht (\d[\w.]*)$/;

/**
 * In een lange rij tabbladen met een reeks opdrachten ("Opdracht 5.7.a" tot en
 * met "5.7.h" in Code beter begrijpen: tien tabbladen op twee regels) staat
 * het woord Opdracht alleen op de eerste; de volgende tonen hun nummer
 * (`kort`). Het label blijft voor een schermlezer en de knop Volgende.
 *
 * @param {object[]} tabs
 */
function korteOpdrachten(tabs) {
  if (tabs.length < VEEL_TABS) return;
  const nummer = (tab) => GENUMMERD.exec(eigenschap(tab, 'label') ?? '')?.[1];
  let begin = 0;
  while (begin < tabs.length) {
    let eind = begin;
    while (eind < tabs.length && nummer(tabs[eind])) eind++;
    if (eind - begin >= REEKS_OPDRACHTEN) {
      for (const tab of tabs.slice(begin + 1, eind)) {
        tab.attributes.push(attribuut('kort', nummer(tab)));
      }
    }
    begin = Math.max(eind, begin + 1);
  }
}

/**
 * Een deel heeft geen tabbladen, wel stappen: zijn `###`-koppen, net als in
 * een sectie van een les. Het deel staat in een tabblad van de pagina die het
 * importeert (MicroPython kiezen bij robotica: zes koppen, duizend pixels te
 * lang), of op een pagina die verder alleen een titel heeft.
 *
 * @param {object[]} kinderen de kinderen van de mdast-root van het deel
 * @param {string} naam voor het id van de eerste stap
 */
function deelMetStappen(kinderen, naam) {
  const isEsm = (node) => node.type === 'mdxjsEsm';
  const inhoud = kinderen.filter((node) => !isEsm(node));
  // metStappen verwacht de `##` van de sectie vooraan; een deel heeft er geen.
  const kop = { type: 'paragraph', children: [] };
  const [, ...rest] = metStappen([kop, ...inhoud], `deel-${naam}`);
  if (!rest.some((node) => node.name === 'LesStappen')) return null;
  return [...kinderen.filter(isEsm), ...rest];
}

const HIDDEN = { type: 'mdxJsxAttribute', name: 'hidden', value: null };

/** De remark-stap. */
function remarkLesTabs() {
  return (tree, file) => {
    if (file?.data?.frontMatter?.les_tabs === false) return;
    if (isDeel(file?.path)) {
      const naam = (file.path.split(/[\\/]/).pop() ?? '').replace(/\.mdx?$/, '');
      // Ook in een deel staat naast elkaar wat naast elkaar past: het bord
      // met zijn uitleg op de installatiepagina van robotica was anders 72
      // pixels te lang.
      const naast = naastElkaar(tree.children);
      tree.children = deelMetStappen(naast, naam) ?? naast;
      return;
    }
    const nieuw = groepeer(tree.children);
    if (nieuw) tree.children = nieuw;
    // Geen tabbladen (één sectie, of een pagina met alleen een deel): een
    // marker, zodat de pagina dezelfde kop en breedte krijgt als de lessen
    // eromheen (zie de opmaak van LesTabs).
    else tree.children.push(jsx('div', [], [attribuut('data-les-zonder-tabs', ''), HIDDEN]));
  };
}

module.exports = {
  remarkLesTabs,
  groepeer,
  metStappen,
  tabLabel,
  tekstVan,
  isDeel,
  deelMetStappen,
};
