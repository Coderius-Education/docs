import type { CheckerConfig, Concept, ConceptDetect, Level } from '@coderius/checker/types';
import niveaus from './niveaus.json';

// De nakijker voor Godot-projecten. Wélke concepten er zijn en op welk niveau
// ze per leerroute tellen staat in `niveaus.json` — dat bestand is de tabel
// van de docent, in dezelfde volgorde en met dezelfde woorden. Hier staat
// alleen hóé je elk concept in de bestanden terugvindt.
//
// De tweedeling basis/gevorderd hing eerder los van de cursus: het hele
// bewegingsscript van hoofdstuk 5 (velocity, move_and_slide, is_on_floor,
// get_gravity, _physics_process) stond op "gevorderd", net als _process. Een
// leerling die de cursus afmaakte zag daardoor de helft van zijn eigen werk
// als gevorderd staan, en het onderscheid zei niets meer. De niveaus komen nu
// uit de tabel, en verschillen per route: wat in Start nog gevorderd is, is in
// Verdieping gewoon basis.
//
// Naast basis/gevorderd heeft elk concept een denkvaardigheid van Bloom. Dat
// is een tweede as, geen derde niveau: basis/gevorderd zegt wélke concepten
// tellen, Bloom zegt hoe diep een leerling ze beheerst. Dezelfde SPEED is op
// 300.0 "nadoen" (onthouden) en op 450.0 "manipuleren" (toepassen) — en dat
// tweede is precies wat het concept "snelheid veranderen" meet. Wat de
// bestanden niet kunnen bewijzen (voorspellen, betogen, doceren) staat als
// gespreksvraag in de tabel: een handmatig concept dat de docent tijdens het
// mondeling aanvinkt.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function classify(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.gd')) return 'gd';
  if (lower.endsWith('.tscn')) return 'tscn';
  if (lower.endsWith('project.godot')) return 'godot';
  const dot = lower.lastIndexOf('.');
  const ext = dot === -1 ? '' : lower.slice(dot);
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Een node in een .tscn staat als `[node name="X" type="Speler" parent="."]`. */
function node(type: string): ConceptDetect {
  return { type: 'regex', pattern: new RegExp(`\\[node [^\\]]*type="${type}"`, 'g'), in: ['tscn'] };
}

function gd(pattern: RegExp, minCount?: number): ConceptDetect {
  return { type: 'regex', pattern, in: ['gd'], ...(minCount ? { minCount } : {}) };
}

// De nodes die de cursus zelf aanleert, geteld uit de lessen en de
// nodes-cheatsheet. Alles daarbuiten telt als "zelf ontdekt" — dat is het
// enige concept dat niet naar iets bekends zoekt maar naar iets onbekends.
const BEKENDE_NODES = [
  'Node',
  'Node2D',
  'CharacterBody2D',
  'StaticBody2D',
  'Sprite2D',
  'AnimatedSprite2D',
  'CollisionShape2D',
  'Camera2D',
  'Area2D',
  'TileMapLayer',
  'CanvasLayer',
  'Label',
  'Control',
  'VBoxContainer',
  'HBoxContainer',
  'Button',
  'TextureRect',
  'Timer',
];

// De waardes die in de cursus staan. Wie ze laat staan heeft overgetypt; wie
// er iets anders neerzet heeft zijn spel van zichzelf gemaakt, en dát is wat
// "snelheid veranderen" en "sprongkracht veranderen" in de tabel betekenen.
// Hetzelfde geldt voor de drie animatienamen uit hoofdstuk 6.
const CURSUS_SNELHEID = ['300.0', '300'];
const CURSUS_SPRONG = ['-800.0', '-800', '-400.0', '-400'];
const CURSUS_ANIMATIES = ['idle', 'run', 'jump'];

// De waardes worden in een negatieve lookahead gezet. `\b` volstaat daar niet:
// achter de `300` in `300.5` staat óók een woordgrens, waardoor een eigen
// waarde ten onrechte als cursuswaarde zou tellen. Vandaar `(?![\d.])`.
const alt = (waardes: string[]) => waardes.map((w) => w.replace(/[.\-]/g, '\\$&')).join('|');

const HANDMATIG: ConceptDetect = { type: 'handmatig' };

const DETECTIE: Record<string, ConceptDetect> = {
  // --- 2D: nodes uit de scene-bestanden ---
  '2d-tilemaplayer': node('TileMapLayer'),
  '2d-texturerect': node('TextureRect'),
  '2d-characterbody2d': node('CharacterBody2D'),
  '2d-animatedsprite2d': node('AnimatedSprite2D'),
  '2d-collisionshape2d': node('CollisionShape2D'),
  '2d-camera2d': node('Camera2D'),
  '2d-area2d': node('Area2D'),
  '2d-canvaslayer': node('CanvasLayer'),
  '2d-label': node('Label'),
  '2d-control': node('Control'),
  '2d-vboxcontainer': node('VBoxContainer'),
  '2d-button': node('Button'),
  '2d-nieuwe-nodes': {
    type: 'regex',
    pattern: new RegExp(`\\[node [^\\]]*type="(?!(?:${BEKENDE_NODES.join('|')})")\\w+"`, 'g'),
    in: ['tscn'],
  },

  // --- GDScript: je game eigen maken ---
  // De negatieve lookahead is het hele punt: `SPEED = 300.0` telt niet mee,
  // `SPEED = 450.0` wel.
  'gd-snelheid': gd(
    new RegExp(
      `\\b(?:SPEED|snelheid)\\s*(?::=|=)\\s*(?!(?:${alt(CURSUS_SNELHEID)})(?![\\d.]))-?\\d`,
      'g',
    ),
  ),
  'gd-sprongkracht': gd(
    new RegExp(
      `\\b(?:JUMP_VELOCITY|sprongkracht)\\s*(?::=|=)\\s*(?!(?:${alt(CURSUS_SPRONG)})(?![\\d.]))-?\\d`,
      'g',
    ),
  ),
  // Eigen toetsen staan als [input]-sectie in project.godot; zonder die
  // sectie gebruikt het project alleen de ingebouwde ui_*-acties.
  'gd-keybindings': { type: 'regex', pattern: /^\[input\]/gm, in: ['godot'] },
  'gd-animatie': gd(
    new RegExp(`play\\s*\\(\\s*["'](?!(?:${CURSUS_ANIMATIES.join('|')})["'])[^"']+["']`, 'g'),
  ),
  'gd-signal': gd(/\bfunc\s+_on_\w+/g),
  'gd-volgend-level': gd(/change_scene_to_file/g),

  // --- GDScript: verder met code ---
  // "Nuttig gebruik" is een oordeel dat een regex niet kan vellen. Wat hij
  // wél kan: het verschil tussen één keer toevallig en er echt mee werken.
  // Daarom een drempel van twee op de concepten waar de tabel "nuttig" zegt.
  'gd-globals': gd(/\bGlobal\.\w+/g, 2),
  'gd-instantiate': gd(/\.instantiate\s*\(/g),
  'gd-groups': gd(/\b(?:add_to_group|get_nodes_in_group|call_group|is_in_group)\s*\(/g),
  // Eigen functies, dus niet de functies die Godot zelf aanroept (_ready,
  // _process, _physics_process, _input) en niet de signal-handlers (_on_…),
  // want die staan al als eigen concept in de tabel.
  'gd-modulaire-functies': gd(/^[ \t]*func\s+(?!_)\w+/gm, 2),
  'gd-lijsten': gd(/\.append\s*\(|\.size\s*\(\)|\bArray\b|=\s*\[/g, 2),
  'gd-dictionaries': gd(/\.keys\s*\(\)|\.values\s*\(\)|\.has\s*\(|=\s*\{/g, 2),
  'gd-json': gd(/\bJSON\.\w+|\bFileAccess\./g),
  // Begrijpen — toelichten. De tabel zegt zelf hoe je dat aantoont: "via
  // comments in code". Niet elke comment is een toelichting; `# beweging`
  // benoemt alleen. Een reden herken je aan een redengevend woord. Twee keer,
  // want één zo'n comment kan uit de les zijn overgetypt.
  'gd-toelichting': gd(/#[^\n]*\b(?:omdat|zodat|want|daarom|hierdoor|anders)\b/gi, 2),
  'gd-loops': gd(/^[ \t]*(?:for|while)\s/gm, 2),
  'gd-tweens': gd(/\bcreate_tween\s*\(|\bTween\b/g),
  // Een Timer is er in twee smaken: de node in je scène, en de stopwatch die
  // je in code maakt met create_timer. Allebei tellen.
  'gd-timers': {
    type: 'regex',
    pattern: /\bcreate_timer\s*\(|\[node [^\]]*type="Timer"/g,
    in: ['gd', 'tscn'],
  },

  // --- Project: analyseren — ordenen ---
  // "Inrichting van project, bestanden" uit de tabel. Een `assets`-map en een
  // `scripts`-map schrijft de cursus zelf voor (hoofdstuk 2), dus die bewijzen
  // nadoen, geen ordenen. Scènes in een eigen map noemt de cursus alleen als
  // mogelijkheid; wie dat doet heeft zelf over de indeling nagedacht. De
  // uploader haalt de gedeelde bovenmap er al af, dus `mijn-game/wereld.tscn`
  // telt niet als submap.
  'project-inrichting': { type: 'path', pattern: /\/[^/]+\.tscn$/i },

  // --- Gesprek: wat alleen in het mondeling zichtbaar is ---
  // analyze() laat deze op used: false; de docentweergave maakt er een
  // vinkvakje van dat mee de PDF in gaat. De vraag staat in het label.
  'gesprek-voordragen': HANDMATIG,
  'gesprek-voorspellen': HANDMATIG,
  'gesprek-vragen': HANDMATIG,
  'gesprek-uitleggen': HANDMATIG,
  'gesprek-integreren': HANDMATIG,
  'gesprek-beredeneren': HANDMATIG,
  'gesprek-betogen': HANDMATIG,
  'gesprek-doceren': HANDMATIG,
  'gesprek-creëren': HANDMATIG,
  'gesprek-optimaliseren': HANDMATIG,
};

const NIVEAUS: Record<string, Level> = { basis: 'basis', gevorderd: 'gevorderd' };

function niveau(waarde: string, waar: string): Level {
  const n = NIVEAUS[waarde];
  if (!n) throw new Error(`niveaus.json: onbekend niveau '${waarde}' bij ${waar}`);
  return n;
}

const BLOOM = new Set(niveaus.bloom.map((b) => b.id));

const concepts: Concept[] = niveaus.concepten.map((c) => {
  const detect = DETECTIE[c.id];
  if (!detect) throw new Error(`niveaus.json: geen detectie voor concept '${c.id}'`);
  if (!BLOOM.has(c.bloom)) {
    throw new Error(`niveaus.json: onbekende denkvaardigheid '${c.bloom}' bij ${c.id}`);
  }
  return {
    id: c.id,
    subject: c.onderwerp,
    group: c.groep,
    label: c.concept,
    bloom: c.bloom,
    level: {
      start: niveau(c.start, `${c.id}.start`),
      verdieping: niveau(c.verdieping, `${c.id}.verdieping`),
    },
    detect,
  };
});

export const godotConfig: CheckerConfig = {
  subjects: niveaus.onderwerpen,
  tracks: niveaus.tracks,
  concepts,

  fileKinds: [
    { id: 'gd', label: 'GDScript' },
    { id: 'tscn', label: 'Scenes' },
    { id: 'godot', label: 'Project' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  // project.godot wordt nu als tekst gelezen, want daar staan de eigen
  // keybindings in.
  textKinds: ['gd', 'tscn', 'godot'],
  accept: '.zip,.gd,.tscn,.godot,.tres,.import,.png,.jpg,.jpeg,.gif,.svg,.webp',

  teacher: { password: 'coderius-docent', storageKey: 'godotChecker.docentUnlocked' },
  pdfFilename: (d) => `Beoordeling Godot Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
