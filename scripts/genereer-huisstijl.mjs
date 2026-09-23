#!/usr/bin/env node
// Maakt uit packages/shared/huisstijl/ de logo's en de huisstijl-CSS:
//
//   packages/shared/static/img/merk/<id>.svg          merk, licht thema
//   packages/shared/static/img/merk/<id>-donker.svg   merk, donker thema
//   packages/shared/static/img/merk/<id>-tegel.svg    merk op tegel (favicon)
//   packages/shared/static/img/merk/woordmerk-<id>.svg (+ -donker)
//   packages/shared/static/img/logo.svg               = merk/home.svg
//   packages/shared/css/huisstijl.css                 neutralen en letters
//   packages/shared/css/cursus/<id>.css               primary per cursus
//   sites/home/src/lib/assets/favicon.svg              = merk/home-tegel.svg
//   sites/home/src/lib/assets/woordmerk(-donker).svg   = het woordmerk van home
//   sites/home/src/lib/assets/merk/<id>(-donker).svg   merken op de cursuskaarten
//
// Draai na elke wijziging aan huisstijl/: `node scripts/genereer-huisstijl.mjs`.
// huisstijl.test.ts valt om zolang de uitvoer niet bij de bron past.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = path.join(ROOT, 'packages', 'shared');
const require = createRequire(path.join(SHARED, 'package.json'));
const { parse } = require('opentype.js');
const { NEUTRAAL, GRIJS, MARKEER, CURSUSSEN, CURSUS_KLEUREN, LETTERS } = require('./huisstijl');
const { merk, tegel, xml } = require('./huisstijl/merk');

const lees = (pkg, bestand) => {
  const buf = fs.readFileSync(
    path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'files', bestand),
  );
  return parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const MONO = lees(
  '@fontsource/atkinson-hyperlegible-mono',
  'atkinson-hyperlegible-mono-latin-700-normal.woff',
);
const SERIF = lees('@fontsource/literata', 'literata-latin-700-normal.woff');
const SERIF_600 = lees('@fontsource/literata', 'literata-latin-600-normal.woff');

// Paden in `uit` zijn relatief aan de repo-root.
const uit = new Map();
const zet = (rel, inhoud) => uit.set(path.join('packages', 'shared', rel), inhoud);
const zetHome = (rel, inhoud) =>
  uit.set(path.join('sites', 'home', 'src', 'lib', 'assets', rel), inhoud);

// ---- Woordmerk: "code" in de mono, "rius" in de serif, op gelijke x-hoogte.
// Het is dezelfde naam als Corderius, met code waar "cor" stond.
const X_HOOGTE = 22;
const grootte = (font) => (X_HOOGTE * font.unitsPerEm) / font.tables.os2.sxHeight;
function tekstPad(font, tekst, x, basislijn) {
  const size = grootte(font);
  const p = font.getPath(tekst, x, basislijn, size);
  return { d: p.toPathData(2), breedte: font.getAdvanceWidth(tekst, size) };
}

// Het boek zelf is in beide thema's gelijk: wit papier, donkere inkt, een
// geel lint. Alleen de kaft volgt het thema.
const PAPIER = '#ffffff';
const boekKleuren = (glyph, kaft) => ({
  glyph,
  kaft,
  inkt: NEUTRAAL.licht.inkt,
  papier: PAPIER,
  markeer: MARKEER,
});

function woordmerk({ id, label, glyph }, thema) {
  const k = CURSUS_KLEUREN[id][thema];
  const inkt = NEUTRAAL[thema].inkt;
  const basis = 43;
  let x = 84;
  const code = tekstPad(MONO, 'code', x, basis);
  x += code.breedte - 1;
  const rius = tekstPad(SERIF, 'rius', x, basis);
  x += rius.breedte;
  let extra = '';
  if (id !== 'home') {
    x += 14;
    const lab = tekstPad(SERIF_600, label, x, basis);
    extra = `<path d="${lab.d}" fill="${k.primary}"/>`;
    x += lab.breedte;
  }
  const breedte = Math.ceil(x + 4);
  const titel = id === 'home' ? 'Coderius' : `Coderius ${label}`;
  const m = merk({ ...boekKleuren(glyph, k.primary), titel })
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\n$/, '')
    .replace(/<title>.*?<\/title>/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${breedte} 64" width="${breedte}" height="64" role="img" aria-label="${xml(titel)}"><title>${xml(titel)}</title>${m}<path d="${code.d}" fill="${inkt}"/><path d="${rius.d}" fill="${inkt}"/>${extra}</svg>\n`;
}

// ---- Merken per cursus
for (const c of CURSUSSEN) {
  const titel = c.id === 'home' ? 'Coderius' : `Coderius ${c.label}`;
  for (const thema of ['licht', 'donker']) {
    const k = CURSUS_KLEUREN[c.id][thema];
    const achter = thema === 'licht' ? '' : '-donker';
    zet(
      `static/img/merk/${c.id}${achter}.svg`,
      merk({ ...boekKleuren(c.glyph, k.primary), titel }),
    );
    zet(`static/img/merk/woordmerk-${c.id}${achter}.svg`, woordmerk(c, thema));
  }
  zet(
    `static/img/merk/${c.id}-tegel.svg`,
    tegel({
      ...boekKleuren(c.glyph, CURSUS_KLEUREN[c.id].licht['primary-darkest']),
      tegelkleur: CURSUS_KLEUREN[c.id].licht.primary,
      titel,
    }),
  );
}
const gedeeld = (rel) => uit.get(path.join('packages', 'shared', rel));
zet('static/img/logo.svg', gedeeld('static/img/merk/home.svg'));
zetHome('favicon.svg', gedeeld('static/img/merk/home-tegel.svg'));
zetHome('woordmerk.svg', gedeeld('static/img/merk/woordmerk-home.svg'));
zetHome('woordmerk-donker.svg', gedeeld('static/img/merk/woordmerk-home-donker.svg'));
for (const c of CURSUSSEN.filter((c) => c.id !== 'home')) {
  for (const achter of ['', '-donker']) {
    zetHome(`merk/${c.id}${achter}.svg`, gedeeld(`static/img/merk/${c.id}${achter}.svg`));
  }
}

// ---- CSS
const KOP =
  '/* Gegenereerd door scripts/genereer-huisstijl.mjs uit packages/shared/huisstijl/. Niet met de hand aanpassen. */\n';

// Met future.v4 zet Docusaurus Infima in een cascade layer en bootst die in de
// build na door Infima's selectors op te hogen tot :root:not(#\#):not(#\#).
// Een kale :root verliest daarvan, hoe laat hij ook komt: zo heeft het oude
// Coderius-groen nooit op een site gestaan. Daarom dezelfde ophoging hier;
// gelijke specificiteit en later in de bundel, dus de huisstijl wint.
const OPHOGING = ':not(#\\#):not(#\\#)';
const LICHT = `:root${OPHOGING}`;
const DONKER = `html[data-theme="dark"]${OPHOGING}`;
const blok = (sel, vars) =>
  `${sel} {\n${Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')}\n}\n`;
const primaryVars = (k) => ({
  ...Object.fromEntries(
    [
      'primary',
      'primary-dark',
      'primary-darker',
      'primary-darkest',
      'primary-light',
      'primary-lighter',
      'primary-lightest',
    ].map((n) => [`--ifm-color-${n}`, k[n]]),
  ),
  '--coderius-on-primary': k['on-primary'],
});

zet(
  'css/huisstijl.css',
  [
    KOP,
    blok(LICHT, {
      '--ifm-font-family-base': LETTERS.tekst,
      '--ifm-heading-font-family': LETTERS.koppen,
      '--ifm-font-family-monospace': LETTERS.code,
      '--coderius-font-koppen': LETTERS.koppen,
      '--ifm-background-color': NEUTRAAL.licht.achtergrond,
      '--ifm-background-surface-color': NEUTRAAL.licht.oppervlak,
      '--ifm-color-content': NEUTRAAL.licht.inkt,
      '--ifm-heading-color': NEUTRAAL.licht.inkt,
      ...Object.fromEntries(Object.entries(GRIJS).map(([s, v]) => [`--ifm-color-gray-${s}`, v])),
      '--coderius-markeer': MARKEER,
      '--docusaurus-highlighted-code-line-bg': `color-mix(in srgb, ${MARKEER} 38%, transparent)`,
      ...primaryVars(CURSUS_KLEUREN.home.licht),
    }),
    '\n',
    blok(DONKER, {
      '--ifm-background-color': NEUTRAAL.donker.achtergrond,
      '--ifm-background-surface-color': NEUTRAAL.donker.oppervlak,
      '--ifm-color-content': NEUTRAAL.donker.inkt,
      '--ifm-heading-color': NEUTRAAL.donker.inkt,
      '--docusaurus-highlighted-code-line-bg': `color-mix(in srgb, ${MARKEER} 20%, transparent)`,
      ...primaryVars(CURSUS_KLEUREN.home.donker),
    }),
  ].join(''),
);

for (const c of CURSUSSEN) {
  zet(
    `css/cursus/${c.id}.css`,
    [
      KOP,
      blok(LICHT, primaryVars(CURSUS_KLEUREN[c.id].licht)),
      '\n',
      blok(DONKER, primaryVars(CURSUS_KLEUREN[c.id].donker)),
    ].join(''),
  );
}

// ---- Wegschrijven, of met --check alleen vergelijken.
const check = process.argv.includes('--check');
const verschil = [];
for (const [rel, inhoud] of uit) {
  const doel = path.join(ROOT, rel);
  const nu = fs.existsSync(doel) ? fs.readFileSync(doel, 'utf8') : null;
  if (nu === inhoud) continue;
  verschil.push(rel);
  if (!check) {
    fs.mkdirSync(path.dirname(doel), { recursive: true });
    fs.writeFileSync(doel, inhoud);
  }
}
if (check && verschil.length) {
  console.error(
    `Huisstijl-uitvoer loopt achter op de bron:\n  ${verschil.join('\n  ')}\nDraai: node scripts/genereer-huisstijl.mjs`,
  );
  process.exit(1);
}
console.log(
  check
    ? 'Huisstijl-uitvoer is actueel.'
    : `${verschil.length} bestand(en) bijgewerkt, ${uit.size} in totaal.`,
);
