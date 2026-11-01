// Gecomprimeerde kopieën naast de bestanden van een gebouwde site.
//
//   node scripts/comprimeer.mjs <map-van-de-build>
//
// De grootste bestanden van een site met Python zijn die van Pyodide: de wasm
// is 8,2 MB, en gaat met gzip naar 2,7 MB en met brotli naar 2,0 MB. Gemeten
// op 20 Mbit/s met 40 ms vertraging laadde een python-les in 8,6 s zonder
// compressie en in 5,5 s met gzip. Een webserver die zelf comprimeert, doet
// dat bij elke aanvraag en op een laag niveau; dit script doet het één keer
// bij de build, op het hoogste niveau, en zet `<bestand>.gz` en `<bestand>.br`
// naast het origineel. Een server met gzip_static/brotli_static (nginx),
// `precompressed` (Caddy) of iets vergelijkbaars stuurt die dan mee aan een
// browser die erom vraagt, met `Content-Encoding` en het Content-Type van het
// origineel. Het origineel blijft staan, voor wie geen compressie aanvraagt.
//
// De job `build` in CI draait het na elke site-build, vóór de upload: zo zit
// het in `<site>-static`. Niet in een postBuild van Docusaurus: die draaien
// voor alle plugins tegelijk, en dan kan dit script een bestand missen dat
// een andere plugin (de sitemap, omleidingen, de service worker van play) nog
// schrijft.

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

/**
 * Wat comprimeert: tekst en wasm. Niet wat al gecomprimeerd is (zip, whl,
 * woff2, plaatjes, video): python_stdlib.zip ging van 2,31 naar 2,27 MB.
 */
const TE_COMPRIMEREN = /\.(html|js|mjs|cjs|css|json|map|svg|xml|txt|wasm|ico|webmanifest|py)$/;

/** Kleiner dan dit levert het minder op dan een extra aanvraag-header kost. */
const MIN_BYTES = 1024;

/**
 * Brotli 11 is het hoogste niveau, en het traagst: 30 s voor de wasm van
 * Pyodide, tegen 17 s voor niveau 10. Het verschil is 80 kB op 2 MB (32 ms op
 * 20 Mbit/s). Boven deze grens dus niveau 10, eronder 11 (de hele rest van de
 * python-site kost op niveau 11 samen 18 s).
 */
const GROOT_BYTES = 4 * 1024 * 1024;

/** Alle bestanden onder `map`, als absolute paden. */
function bestanden(map) {
  const uit = [];
  for (const item of fs.readdirSync(map, { withFileTypes: true })) {
    const pad = path.join(map, item.name);
    if (item.isDirectory()) uit.push(...bestanden(pad));
    else if (item.isFile()) uit.push(pad);
  }
  return uit;
}

function moetComprimeren(pad, grootte) {
  return TE_COMPRIMEREN.test(pad) && grootte >= MIN_BYTES;
}

const gzip = (inhoud) =>
  new Promise((klaar, fout) =>
    // Node zet geen tijd en geen bestandsnaam in de gzip-header: dezelfde
    // invoer geeft byte voor byte dezelfde .gz, net als de build zelf.
    zlib.gzip(inhoud, { level: 9 }, (f, uit) => (f ? fout(f) : klaar(uit))),
  );

const brotli = (inhoud) =>
  new Promise((klaar, fout) =>
    zlib.brotliCompress(
      inhoud,
      {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_GENERIC,
          [zlib.constants.BROTLI_PARAM_QUALITY]: inhoud.length > GROOT_BYTES ? 10 : 11,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: inhoud.length,
        },
      },
      (f, uit) => (f ? fout(f) : klaar(uit)),
    ),
  );

/**
 * Comprimeert elk geschikt bestand onder `map` naar `.gz` en `.br`. Levert
 * een kopie niets op (niet kleiner dan het origineel), dan komt hij er niet,
 * en een oude kopie van een vorige run gaat dan weg. De zlib-functies draaien
 * in de threadpool van libuv, dus de bestanden gaan tegelijk.
 *
 * @returns {Promise<{ bestanden: number, voor: number, gz: number, br: number }>}
 */
async function comprimeerMap(map) {
  const alles = bestanden(map).filter((p) => !/\.(gz|br)$/.test(p));
  const totaal = { bestanden: 0, voor: 0, gz: 0, br: 0 };

  // De grootste eerst: die bepalen hoe lang het duurt.
  const werk = alles
    .map((pad) => ({ pad, grootte: fs.statSync(pad).size }))
    .filter(({ pad, grootte }) => moetComprimeren(pad, grootte))
    .sort((a, b) => b.grootte - a.grootte);

  await Promise.all(
    werk.map(async ({ pad }) => {
      const inhoud = fs.readFileSync(pad);
      const [gz, br] = await Promise.all([gzip(inhoud), brotli(inhoud)]);
      totaal.bestanden++;
      totaal.voor += inhoud.length;
      for (const [ext, uit] of [
        ['.gz', gz],
        ['.br', br],
      ]) {
        if (uit.length < inhoud.length) {
          fs.writeFileSync(pad + ext, uit);
          totaal[ext.slice(1)] += uit.length;
        } else {
          fs.rmSync(pad + ext, { force: true });
          totaal[ext.slice(1)] += inhoud.length;
        }
      }
    }),
  );
  return totaal;
}

module.exports = { GROOT_BYTES, MIN_BYTES, TE_COMPRIMEREN, comprimeerMap };
