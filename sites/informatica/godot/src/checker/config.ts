import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type { CheckerConfig, ConceptDetect, ExtraConcept } from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import leerdoelenJson from '../leerdoelen.json';

// De nakijker voor Godot-projecten. Wélke concepten er zijn en op welk niveau
// ze tellen staat in `src/leerdoelen.json`: het tabblad Godot van het
// beoordelingsblad, in dezelfde volgorde en met dezelfde woorden, met de
// niveaus 1, 3 en 4. Hier staat alleen hóé je elk concept in de bestanden
// terugvindt.
//
// De tweedeling basis/gevorderd hing eerder los van de cursus: het hele
// bewegingsscript van hoofdstuk 5 (velocity, move_and_slide, is_on_floor,
// get_gravity, _physics_process) stond op "gevorderd", net als _process. Een
// leerling die de cursus afmaakte zag daardoor de helft van zijn eigen werk
// als gevorderd staan, en het onderscheid zei niets meer. De moeilijkheden
// komen nu uit het blad, en verschillen per niveau: wat op niveau 1 nog
// gevorderd is, is op niveau 3 en 4 basis, en op niveau 3 zijn vier
// concepten expert.
//
// Naast de moeilijkheid heeft elk concept een denkvaardigheid van Bloom. Dat
// is een tweede as, geen extra niveau: de moeilijkheid zegt wélke concepten
// tellen, Bloom zegt hoe diep een leerling ze beheerst. Dezelfde SPEED is op
// 300.0 "nadoen" (onthouden) en op 450.0 "manipuleren" (toepassen) — en dat
// tweede is precies wat het concept "snelheid veranderen" meet. Wat de
// bestanden niet kunnen bewijzen (voorspellen, betogen, doceren) kiest de
// docent in het blok Cijfer van de docentweergave.

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
  // Het startmenu uit hoofdstuk 8: een scène waarvan de bovenste node een
  // Control is, met een Button erin. Alleen de bovenste node heeft geen
  // `parent=`; een Control ergens in een level (een pauzescherm in de HUD)
  // met een knop ernaast is geen startscherm.
  '2d-startscherm': {
    type: 'regex',
    pattern: /\[node name="[^"]*" type="Control"\][\s\S]*?\[node [^\]]*type="Button"/g,
    in: ['tscn'],
  },
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
  'gd-loops': gd(/^[ \t]*(?:for|while)\s/gm, 2),
  'gd-tweens': gd(/\bcreate_tween\s*\(|\bTween\b/g),
  // Een Timer is er in twee smaken: de node in je scène, en de stopwatch die
  // je in code maakt met create_timer. Allebei tellen.
  'gd-timers': {
    type: 'regex',
    pattern: /\bcreate_timer\s*\(|\[node [^\]]*type="Timer"/g,
    in: ['gd', 'tscn'],
  },
};

// Herkend, maar niet in de tabel van de docent: ze staan onder "Ook gebruikt"
// en tellen niet mee voor het niveau.
const OOK_GEBRUIKT: ExtraConcept[] = [
  {
    id: '2d-vboxcontainer',
    subject: '2d',
    group: 'Nodes',
    label: 'VBoxContainer',
    detect: node('VBoxContainer'),
  },
  { id: '2d-button', subject: '2d', group: 'Nodes', label: 'Button', detect: node('Button') },
  {
    id: 'gd-toelichting',
    subject: 'gdscript',
    group: 'Verder met code',
    label: 'toelichting in comments (omdat, zodat, want)',
    // Begrijpen — toelichten. De tabel zegt zelf hoe je dat aantoont: "via
    // comments in code". Niet elke comment is een toelichting; `# beweging`
    // benoemt alleen. Een reden herken je aan een redengevend woord. Twee keer,
    // want één zo'n comment kan uit de les zijn overgetypt.
    detect: gd(/#[^\n]*\b(?:omdat|zodat|want|daarom|hierdoor|anders)\b/gi, 2),
  },
  {
    id: 'project-inrichting',
    subject: 'project',
    group: 'Inrichting',
    label: 'scènes in eigen mappen',
    // "Inrichting van project, bestanden" uit de tabel. Een `assets`-map en een
    // `scripts`-map schrijft de cursus zelf voor (hoofdstuk 2), dus die bewijzen
    // nadoen, geen ordenen. Scènes in een eigen map noemt de cursus alleen als
    // mogelijkheid; wie dat doet heeft zelf over de indeling nagedacht. De
    // uploader haalt de gedeelde bovenmap er al af, dus `mijn-game/wereld.tscn`
    // telt niet als submap.
    detect: { type: 'path', pattern: /\/[^/]+\.tscn$/i },
  },
];

const uitLeerdoelen = leerdoelenNaarConfig(leerdoelenJson, DETECTIE);

export const godotConfig: CheckerConfig = {
  // Project heeft alleen een concept onder Ook gebruikt.
  subjects: [...uitLeerdoelen.subjects, { id: 'project', label: 'Project' }],
  tracks: uitLeerdoelen.tracks,
  concepts: uitLeerdoelen.concepts,
  leerdoelen: uitLeerdoelen.leerdoelen,
  extra: OOK_GEBRUIKT,
  // De Gesprek-vinkjes van vóór de leerdoelen, met hun trede. Een bewaarde
  // beoordeling zonder denkvaardigheid krijgt de hoogste die toen aanstond.
  oudeVinkjes: {
    'gesprek-voordragen': 'onthouden',
    'gesprek-voorspellen': 'begrijpen',
    'gesprek-vragen': 'begrijpen',
    'gesprek-uitleggen': 'toepassen',
    'gesprek-integreren': 'analyseren',
    'gesprek-beredeneren': 'evalueren',
    'gesprek-betogen': 'evalueren',
    'gesprek-doceren': 'evalueren',
    'gesprek-creëren': 'creëren',
    'gesprek-optimaliseren': 'creëren',
  },

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

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('godot', 'godotChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Godot Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
