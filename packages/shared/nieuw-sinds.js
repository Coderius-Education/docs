// Welke regels van een codeblok nieuw of veranderd zijn sinds het blok
// ervoor, en hoe een les dat markeert: de metastring `{2-3,6}` op de fence.
// Een les met een voorbeeld dat in stappen groeit (python), een bestand dat
// per les groeit (fullstack) of een script tot nu toe (Godot) markeert zo wat
// er bij kwam; de tests van die cursussen rekenen het hiermee na.

/**
 * Koppelt de regels van `vorige` aan die van `nu`, en geeft de regels van
 * `nu` (vanaf 1) die er bij kwamen of veranderden, en die van `vorige` die
 * weg zijn. Lege regels tellen niet.
 *
 * Het zoekt de koppeling van oude aan nieuwe regels met de minste nieuwe
 * regels, zoals een langste gemeenschappelijke reeks. Zijn er meer zulke
 * koppelingen, dan wint die met de minste aaneengesloten stukken nieuw: een
 * endpoint dat onderaan bij komt en eindigt zoals het endpoint erboven
 * (`db.commit()`, `return …`), is één stuk, en niet het staartje van het oude
 * endpoint plus het begin van het nieuwe. Is het dan nog gelijk, dan blijven
 * de oude regels zo hoog mogelijk staan: wat er bij komt, komt eronder. Komt
 * er een regel bij die gelijk is aan een regel eronder, dan is de bovenste de
 * nieuwe, als dat de enige koppeling met zo weinig nieuwe regels is.
 *
 * @param {string[]} vorige
 * @param {string[]} nu
 * @returns {{ nieuw: number[], weg: number[] }}
 */
function koppel(vorige, nu) {
  const n = vorige.length;
  const m = nu.length;
  // kost[i][j][f]: het beste voor vorige vanaf i en nu vanaf j, met f = 1 als
  // de regel vóór j nieuw was. Een kost is [nieuwe regels, stukken].
  const kost = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => [null, null]),
  );
  const beter = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const plus = (k, nieuw, stuk) => [k[0] + nieuw, k[1] + stuk];
  const stappen = (i, j, f) => {
    const uit = [];
    if (i < n && j < m && vorige[i] === nu[j]) uit.push(['gelijk', i + 1, j + 1, 0, 0, 0]);
    if (i < n) uit.push(['oud weg', i + 1, j, f, 0, 0]);
    if (j < m) {
      if (nu[j].trim()) uit.push(['nieuw', i, j + 1, 1, 1, f ? 0 : 1]);
      else uit.push(['nieuw', i, j + 1, f, 0, 0]);
    }
    return uit;
  };
  for (let i = n; i >= 0; i--)
    for (let j = m; j >= 0; j--)
      for (const f of [0, 1]) {
        if (i === n && j === m) {
          kost[i][j][f] = [0, 0];
          continue;
        }
        let best = null;
        for (const [, i2, j2, f2, nieuw, stuk] of stappen(i, j, f)) {
          const k = plus(kost[i2][j2][f2], nieuw, stuk);
          if (!best || beter(k, best)) best = k;
        }
        kost[i][j][f] = best;
      }
  // Terug van voren: de eerste stap die het beste geeft, in de volgorde
  // gelijk, oud weg, nieuw. Zo komt wat nieuw is zo laag mogelijk.
  const nieuw = [];
  const weg = [];
  let i = 0;
  let j = 0;
  let f = 0;
  while (i < n || j < m) {
    const doel = kost[i][j][f];
    const stap = stappen(i, j, f).find(([, i2, j2, f2, erbij, stuk]) => {
      const k = plus(kost[i2][j2][f2], erbij, stuk);
      return k[0] === doel[0] && k[1] === doel[1];
    });
    if (stap[0] === 'nieuw' && nu[j].trim()) nieuw.push(j + 1);
    if (stap[0] === 'oud weg' && vorige[i].trim()) weg.push(i + 1);
    [, i, j, f] = stap;
  }
  return { nieuw, weg };
}

/**
 * De regels van `nu` (vanaf 1) die er sinds `vorige` bij kwamen of
 * veranderden; zie `koppel`.
 *
 * @param {string[]} vorige
 * @param {string[]} nu
 * @returns {number[]}
 */
function nieuwSinds(vorige, nu) {
  return koppel(vorige, nu).nieuw;
}

/**
 * Hoeveel regels er sinds `vorige` weg zijn: de oude regels die nergens meer
 * staan, min de regels die ervoor in de plaats kwamen. Een veranderde regel
 * telt dus niet als weg. Een markering laat zien wat er bij kwam; wat weg is,
 * zie je er niet aan, en in fullstack haalde een les zo stil een heel
 * endpoint weg.
 *
 * @param {string[]} vorige
 * @param {string[]} nu
 * @returns {number}
 */
function wegSinds(vorige, nu) {
  const { nieuw, weg } = koppel(vorige, nu);
  return Math.max(0, weg.length - nieuw.length);
}

/**
 * `{2-3,6}` als regelnummers. Een andere metastring (`showLineNumbers`,
 * `title="main.py"`) is geen markering, en `{2, 4}` met een spatie ook niet:
 * Docusaurus leest alleen cijfers, komma's en streepjes tussen de accolades
 * (`codeBlockUtils.js` van theme-common), en toont zo'n blok zonder markering.
 *
 * @param {string} meta wat er achter de taal op de fence staat
 * @returns {number[]}
 */
function uitMeta(meta) {
  const tussen = /\{([\d,-]+)\}/.exec(meta)?.[1];
  if (!tussen) return [];
  return tussen.split(',').flatMap((deel) => {
    const [van, tot = van] = deel.split('-').map(Number);
    return Array.from({ length: tot - van + 1 }, (_, k) => van + k);
  });
}

/**
 * Regelnummers als metastring: `[2, 3, 6]` wordt `{2-3,6}`, een lege lijst
 * een lege tekst.
 *
 * @param {number[]} nummers oplopend
 * @returns {string}
 */
function alsMeta(nummers) {
  if (nummers.length === 0) return '';
  const delen = [];
  let van = nummers[0];
  let tot = nummers[0];
  for (const n of nummers.slice(1)) {
    if (n === tot + 1) tot = n;
    else {
      delen.push(van === tot ? `${van}` : `${van}-${tot}`);
      van = n;
      tot = n;
    }
  }
  delen.push(van === tot ? `${van}` : `${van}-${tot}`);
  return `{${delen.join(',')}}`;
}

/**
 * Bouwt `nu` voort op `vorige`? Dan staat minstens de helft van de regels
 * van `vorige` ook in `nu`, waarbij inspringen niet telt, en is er iets bij
 * gekomen of veranderd. Inspringen telt niet, omdat dat juist de gewone stap
 * is: een regel die in een loop of functie komt, is veranderd en blijft
 * dezelfde regel. Eerst telde een ingesprongen regel niet als gedeeld, en
 * hoefde een blok waarin alles in een `while` kwam geen markering.
 *
 * @param {string[]} vorige
 * @param {string[]} nu
 * @returns {boolean}
 */
function bouwtVoortOp(vorige, nu) {
  const kaal = (regels) => regels.map((r) => r.trim()).filter(Boolean);
  const oud = kaal(vorige);
  const over = new Set(kaal(nu));
  const gedeeld = oud.filter((r) => over.has(r)).length;
  return oud.length > 0 && gedeeld * 2 >= oud.length && nieuwSinds(vorige, nu).length > 0;
}

/**
 * De zin boven een stand die een test markeert (het tabblad `main.py` van
 * fullstack, Je script tot nu toe van Godot): wat de markering betekent, en
 * hoeveel regels er weg zijn. Een markering is een kleur; op papier en voor
 * een schermlezer zegt de zin het.
 *
 * @param {number[]} nieuw de gemarkeerde regels
 * @param {number} weg hoeveel regels er weg zijn (`wegSinds`)
 * @returns {string} leeg als er niets veranderde
 */
function zinOverStand(nieuw, weg) {
  const regels = (n) => (n === 1 ? 'is 1 regel' : `zijn ${n} regels`);
  if (nieuw.length && weg)
    return `De gemarkeerde regels zijn nieuw of veranderd in deze les. Er ${regels(weg)} weg.`;
  if (nieuw.length) return 'De gemarkeerde regels zijn nieuw of veranderd in deze les.';
  if (weg) return `In deze les ${regels(weg)} weg; er kwam niets bij.`;
  return '';
}

/** Een zin die `zinOverStand` schreef, met de witregel erna. */
const ZIN_OVER_STAND =
  /(?:De gemarkeerde regels zijn nieuw of veranderd in deze les\.(?: Er (?:is|zijn) \d+ regels? weg\.)?|In deze les (?:is|zijn) \d+ regels? weg; er kwam niets bij\.)\n\n/;

/**
 * Waar de zin komt in de tekst vóór de fence: vóór het label van het bestand
 * (`<Bestand … />`) en vóór markers in commentaar (`{/* onveilig-voorbeeld: … *\/}`),
 * want een marker hoort direct boven zijn fence.
 *
 * @param {string} tussen de tekst tussen de kop of summary en de fence
 * @returns {number}
 */
function plekVoorZin(tussen) {
  return tussen.search(/(?:<Bestand\b[^\n]*\/>\s*)?(?:\{\/\*[\s\S]*?\*\/\}\s*)*$/);
}

module.exports = {
  nieuwSinds,
  wegSinds,
  uitMeta,
  alsMeta,
  bouwtVoortOp,
  zinOverStand,
  ZIN_OVER_STAND,
  plekVoorZin,
};
