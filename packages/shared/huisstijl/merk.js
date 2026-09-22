// Het merk als SVG, op een raster van 64: een opengeslagen boek dat in code is
// geschreven.
//
// Het boek komt van Corderius, de schoolmeester naar wie het Corderius College
// heet: zijn Colloquia waren een schoolboek waarin je leerde door te doen. De
// linkerbladzijde is altijd code, ingesprongen zoals Python, met één regel
// gemarkeerd. Op de rechterbladzijde staat wat je in de cursus doet. De kaft
// heeft de kleur van de cursus; het leeslint is markeergeel, bij elke cursus.

// Kaft achter de bladzijden, en de twee bladzijden (gespiegeld om x = 32).
const KAFT =
  'M32 21.5C25.5 17.5 14 16.5 4.5 18.5V51.5C14 49.5 25.5 50.5 32 54.5 38.5 50.5 50 49.5 59.5 51.5V18.5C50 16.5 38.5 17.5 32 21.5Z';
const LINKS = 'M32 18.5C26 14.5 16.5 13.5 8.5 15.5V47.5C16.5 45.5 26 46.5 32 50.5Z';
const RECHTS = 'M32 18.5C38 14.5 47.5 13.5 55.5 15.5V47.5C47.5 45.5 38 46.5 32 50.5Z';

// Linkerbladzijde: vijf regels code; de middelste ligt onder de markeerstift.
const CODE_REGELS = 'M12.5 22.5h11M16 27.5h10M16 32.5h8M12.5 37.5h9.5M16 42.5h7';
const MARKEER_OP_REGEL =
  '<rect x="13.5" y="29.8" width="14" height="5.4" rx="1.4" transform="rotate(-3 20 32.5)"/>';

// Het leeslint hangt aan de rug, iets rechts, en eindigt boven de glyph.
const LINT = 'M34.8 14.6h4.2v8.6l-2.1-1.9-2.1 1.9Z';

// De glyphs staan rond (0,0) binnen x -7..7, y -8..8 en worden naar het
// midden van de rechterbladzijde geschoven. `lijn` is een streek in inkt,
// `vlak` een vulling in inkt, `gat` een uitsparing in de kleur van het papier.
const GLYPHS = {
  cursor: [
    ['lijn', '<path d="M-6.5-4l4 4-4 4" stroke-width="2.8"/>'],
    ['vlak', '<rect x="1" y="-6" width="5.5" height="12" rx="1"/>'],
  ],
  branch: [
    ['lijn', '<path d="M-3.5 6.5v-12M-3.5 2.5c0-5 7.5-3.5 7.5-8"/>'],
    [
      'vlak',
      '<circle cx="-3.5" cy="-6" r="2.5"/><circle cx="4" cy="-6" r="2.5"/><circle cx="-3.5" cy="6.5" r="2.5"/>',
    ],
    [
      'gat',
      '<circle cx="-3.5" cy="-6" r="0.9"/><circle cx="4" cy="-6" r="0.9"/><circle cx="-3.5" cy="6.5" r="0.9"/>',
    ],
  ],
  prompt3: [['lijn', '<path d="M-7-3.5l3 3.5-3 3.5M-1.5-3.5l3 3.5-3 3.5M4-3.5l3 3.5-3 3.5"/>']],
  tags: [['lijn', '<path d="M-3.5-4.5L-7 0l3.5 4.5M3.5-4.5L7 0l-3.5 4.5M1.6-6.5l-3.2 13"/>']],
  play: [
    [
      'vlak',
      '<path d="M-4.5-6.8v13.6a1 1 0 0 0 1.5.9L7.4 1a1.1 1.1 0 0 0 0-1.9L-3-7.7a1 1 0 0 0-1.5.9z"/>',
    ],
  ],
  staven: [
    [
      'vlak',
      '<rect x="-7" y="2" width="3.6" height="6" rx="0.8"/><rect x="-1.8" y="-2.5" width="3.6" height="10.5" rx="0.8"/><rect x="3.4" y="-7.5" width="3.6" height="15.5" rx="0.8"/>',
    ],
  ],
  lagen: [
    [
      'vlak',
      '<rect x="-7" y="-7.5" width="14" height="4.3" rx="1.5"/><rect x="-7" y="-2.15" width="14" height="4.3" rx="1.5"/><rect x="-7" y="3.2" width="14" height="4.3" rx="1.5"/>',
    ],
    [
      'gat',
      '<circle cx="-4.4" cy="-5.35" r="0.9"/><circle cx="-4.4" cy="0" r="0.9"/><circle cx="-4.4" cy="5.35" r="0.9"/>',
    ],
  ],
  robot: [
    [
      'vlak',
      '<rect x="-6" y="-3" width="12" height="10" rx="2.6"/><circle cx="0" cy="-7" r="1.6"/>',
    ],
    ['lijn', '<path d="M0-6v3M-7.3 0v3M7.3 0v3" stroke-width="1.8"/>'],
    [
      'gat',
      '<circle cx="-2.6" cy="1.2" r="1.5"/><circle cx="2.6" cy="1.2" r="1.5"/><rect x="-2.4" y="4.2" width="4.8" height="1.2" rx="0.6"/>',
    ],
  ],
  chip: [
    ['vlak', '<rect x="-5" y="-5" width="10" height="10" rx="1.6"/>'],
    [
      'lijn',
      '<path d="M-2.5-8v2M2.5-8v2M-2.5 6v2M2.5 6v2M-8-2.5h2M-8 2.5h2M6-2.5h2M6 2.5h2" stroke-width="1.8"/>',
    ],
    ['gat', '<circle cx="-2.6" cy="-2.6" r="1"/>'],
  ],
  dpad: [
    [
      'vlak',
      '<path d="M-2.3-7.5h4.6a.8.8 0 0 1 .8.8v4.2h4.2a.8.8 0 0 1 .8.8v4.6a.8.8 0 0 1-.8.8H3.1v4.2a.8.8 0 0 1-.8.8h-4.6a.8.8 0 0 1-.8-.8V3.1h-4.2a.8.8 0 0 1-.8-.8v-4.6a.8.8 0 0 1 .8-.8h4.2v-4.2a.8.8 0 0 1 .8-.8z"/>',
    ],
    ['gat', '<circle r="1.5"/>'],
  ],
  vlag: [
    ['lijn', '<path d="M-5.5 8V-8"/>'],
    [
      'vlak',
      '<path d="M-4.3-7.5c3.4-1.4 5.6 1.2 9.2-.2.8-.3 1.6.2 1.6 1v7.3c0 .5-.3 1-.8 1.2-3.3 1.2-5.6-1.3-8.8.1L-4.3 2z"/>',
    ],
  ],
  slot: [
    ['lijn', '<path d="M-3.5-1v-2.8a3.5 3.5 0 0 1 7 0V-1"/>'],
    ['vlak', '<rect x="-6.5" y="-1.5" width="13" height="9.5" rx="2"/>'],
    ['gat', '<circle cx="0" cy="2.2" r="1.5"/><path d="M-.6 2.8h1.2l.4 2.9h-2z"/>'],
  ],
  terminal: [
    [
      'lijn',
      '<rect x="-7" y="-6" width="14" height="12" rx="2" stroke-width="1.8"/><path d="M-4-2l2.5 2-2.5 2M.5 3h3.5" stroke-width="2"/>',
    ],
  ],
  gesprek: [
    [
      'vlak',
      '<path d="M-4.5-6.5h9a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H0L-4 7V3.5h-.5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"/>',
    ],
    [
      'gat',
      '<rect x="-4.5" y="-3.5" width="9" height="1.4" rx="0.7"/><rect x="-4.5" y="-0.5" width="5.5" height="1.4" rx="0.7"/>',
    ],
  ],
};

// Midden van de rechterbladzijde.
const GLYPH_MIDDEN = [44.5, 33];

function glyphSvg(naam, inkt, papier) {
  const delen = GLYPHS[naam];
  if (!delen) throw new Error(`Onbekende glyph: ${naam}`);
  const inhoud = delen
    .map(([soort, el]) => {
      if (soort === 'lijn')
        return `<g fill="none" stroke="${inkt}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${el}</g>`;
      return `<g fill="${soort === 'gat' ? papier : inkt}">${el}</g>`;
    })
    .join('');
  return `<g transform="translate(${GLYPH_MIDDEN.join(' ')})">${inhoud}</g>`;
}

/** Tekst veilig in een SVG-attribuut of <title> ("VS Code & Git"). */
const xml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function boek({ glyph, kaft, inkt, papier, markeer }) {
  return [
    `<path d="${KAFT}" fill="${kaft}"/>`,
    `<path d="${LINKS}" fill="${papier}"/><path d="${RECHTS}" fill="${papier}"/>`,
    `<g fill="${markeer}">${MARKEER_OP_REGEL}</g>`,
    `<path d="${CODE_REGELS}" fill="none" stroke="${inkt}" stroke-width="2.2" stroke-linecap="round"/>`,
    glyphSvg(glyph, inkt, papier),
    `<path d="${LINKS}" fill="none" stroke="${inkt}" stroke-width="1.6" stroke-linejoin="round"/>`,
    `<path d="${RECHTS}" fill="none" stroke="${inkt}" stroke-width="1.6" stroke-linejoin="round"/>`,
    `<path d="${LINT}" fill="${markeer}" stroke="${inkt}" stroke-width="1.2" stroke-linejoin="round"/>`,
  ].join('');
}

const svg = (titel, inhoud) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${xml(titel)}"><title>${xml(titel)}</title>${inhoud}</svg>\n`;

/** Het merk: kaft in de cursuskleur, papier, inkt en een markeergeel lint. */
function merk({ titel, ...kleuren }) {
  return svg(titel, boek(kleuren));
}

/** Het merk op een tegel in de cursuskleur, voor favicons; de kaft wordt donkerder. */
function tegel({ titel, tegelkleur, ...kleuren }) {
  return svg(
    titel,
    `<rect width="64" height="64" rx="14" fill="${tegelkleur}"/><g transform="translate(32 33) scale(0.86) translate(-32 -34)">${boek(kleuren)}</g>`,
  );
}

module.exports = { merk, tegel, glyphSvg, boek, xml, GLYPHS };
