// Welke regels van een codeblok nieuw of veranderd zijn sinds het blok
// ervoor, en hoe een les dat markeert: de metastring `{2-3,6}` op de fence.
// Een les met een voorbeeld dat in stappen groeit (python), een bestand dat
// per les groeit (fullstack) of een script tot nu toe (Godot) markeert zo wat
// er bij kwam; de tests van die cursussen rekenen het hiermee na.

/**
 * De regels van `nu` (vanaf 1) die niet in de langste gemeenschappelijke
 * reeks met `vorige` zitten. Lege regels tellen niet. Een reeks en geen losse
 * vergelijking per regel: komt er een regel bij die gelijk is aan een regel
 * verderop, dan is de nieuwe de bovenste.
 *
 * @param {string[]} vorige
 * @param {string[]} nu
 * @returns {number[]}
 */
function nieuwSinds(vorige, nu) {
  // lengte[i][j]: de langste gemeenschappelijke reeks van vorige vanaf i en nu vanaf j.
  const lengte = Array.from({ length: vorige.length + 1 }, () => new Array(nu.length + 1).fill(0));
  for (let i = vorige.length - 1; i >= 0; i--)
    for (let j = nu.length - 1; j >= 0; j--)
      lengte[i][j] =
        vorige[i] === nu[j]
          ? 1 + lengte[i + 1][j + 1]
          : Math.max(lengte[i + 1][j], lengte[i][j + 1]);
  const uit = [];
  let i = 0;
  let j = 0;
  while (j < nu.length) {
    // Kan de reeks zonder deze regel van `nu` even lang blijven, dan is hij
    // nieuw: zo is van twee gelijke regels de bovenste de nieuwe.
    const nieuw = i >= vorige.length || lengte[i][j + 1] === lengte[i][j];
    if (nieuw) {
      if (nu[j].trim()) uit.push(j + 1);
      j++;
    } else if (vorige[i] === nu[j]) {
      i++;
      j++;
    } else i++;
  }
  return uit;
}

/**
 * `{2-3,6}` als regelnummers. Een andere metastring (`showLineNumbers`,
 * `title="main.py"`) is geen markering.
 *
 * @param {string} meta wat er achter de taal op de fence staat
 * @returns {number[]}
 */
function uitMeta(meta) {
  const tussen = /\{([\d,\s-]+)\}/.exec(meta)?.[1];
  if (!tussen) return [];
  return tussen.split(',').flatMap((deel) => {
    const [van, tot = van] = deel.trim().split('-').map(Number);
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

module.exports = { nieuwSinds, uitMeta, alsMeta };
