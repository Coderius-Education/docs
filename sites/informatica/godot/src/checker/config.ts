import { zonderCommentaar } from '@coderius/checker/commentaar';
import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type {
  CheckerConfig,
  ConceptDetect,
  ExtraConcept,
  ProjectFiles,
} from '@coderius/checker/types';
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
// gevorderd is, is op niveau 3 en 4 basis, en op niveau 3 zijn vijf
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

// Een script kan ook ín een scène staan (Built-in Script): dan staat de code
// als `script/source = "…"` in de .tscn. Die code telt net zo goed; eerst
// zag de nakijker er niets van.
function gd(pattern: RegExp, minCount?: number): ConceptDetect {
  return { type: 'regex', pattern, in: ['gd', 'tscn-gd'], ...(minCount ? { minCount } : {}) };
}

/**
 * De ingebouwde scripts uit een .tscn, als GDScript zonder commentaar; de rest
 * van het bestand wordt spaties. `\"` in de string wordt ` "`, zodat het weer
 * gewone code is, even lang.
 */
export function ingebouwdeScripts(tscn: string): string {
  let uit = tscn.replace(/[^\n]/g, ' ');
  for (const m of tscn.matchAll(/script\/source = "((?:\\.|[^"\\])*)"/g)) {
    const start = (m.index ?? 0) + m[0].indexOf('"') + 1;
    const code = zonderCommentaar(m[1].replace(/\\(["\\])/g, ' $1'), 'gdscript');
    uit = uit.slice(0, start) + code + uit.slice(start + code.length);
  }
  return uit;
}

// Godot-plugins uit de Asset Library staan in addons/. Die code is van een
// ander: een dialoog-addon gaf eerst lijsten, loops, JSON en tweens, en tilde
// een nagedane cursus van basis naar expert.
const isAddon = (path: string) => /(?:^|\/)addons\//.test(path);

/** De namen van de autoloads in project.godot, zoals `Global` of `Spel`. */
export function autoloads(files: ProjectFiles): string[] {
  const project = Object.values(files).find((f) => f.kind === 'godot')?.content ?? '';
  const sectie = /^\[autoload\]\s*\n([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(project)?.[1] ?? '';
  return Array.from(sectie.matchAll(/^(\w+)\s*=/gm), (m) => m[1]);
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
// De power-up van hoofdstuk 7 zet de sprongkracht op -1300.0, en de oplossing
// van zijn opdracht de snelheid op 600.0; config.test.ts eist dat elke waarde
// uit de lessen hier staat.
export const CURSUS_SNELHEID = ['300.0', '300', '600.0', '600'];
export const CURSUS_SPRONG = ['-800.0', '-800', '-400.0', '-400', '-1300.0', '-1300'];
const CURSUS_ANIMATIES = ['idle', 'run', 'jump'];
// De eigen functies die hoofdstuk 1 tot en met 9 voorzegt. Wie ze overtypt
// heeft geen code opgeknipt, en zo telde een nagedane cursus (reset() in de
// global en spawn_muntje() in het level) al als "modulaire eigen functies".
// Hoofdstuk 10 leert het opknippen zelf; die functies tellen dus wel.
export const CURSUS_FUNCTIES = [
  'geef_snelheidsboost',
  'geef_sprongboost',
  'is_game_over',
  'reset',
  'spawn_muntje',
  'spawn_vijand',
  'stop',
  'verlies_leven',
];

// De waardes worden in een negatieve lookahead gezet. `\b` volstaat daar niet:
// achter de `300` in `300.5` staat óók een woordgrens, waardoor een eigen
// waarde ten onrechte als cursuswaarde zou tellen. Vandaar `(?![\d.])`.
const alt = (waardes: string[]) => waardes.map((w) => w.replace(/[.\-]/g, '\\$&')).join('|');

// Een toekenning aan een van deze namen, ook met een type (`const SPEED: float
// = 450.0`) en met @export ervoor; het getal komt na de lookahead.
const toekenning = (namen: string) => `\\b(?:${namen})\\s*(?::\\s*\\w+\\s*)?(?::=|=)\\s*`;

// De callbacks die Godot zelf aanroept. Een eigen functie met een _ ervoor
// (zoals de stijlgids van Godot voor een private functie voorschrijft) telt
// wel; eerst telde geen enkele functie met een _.
const CALLBACKS = [
  'ready',
  'process',
  'physics_process',
  'input',
  'unhandled_input',
  'unhandled_key_input',
  'shortcut_input',
  'gui_input',
  'enter_tree',
  'exit_tree',
  'init',
  'draw',
  'notification',
  'to_string',
  'get_configuration_warnings',
];

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
  // met een knop ernaast is geen startscherm. Godot 4.6 en nieuwer zetten
  // er een unique_id achter ([node name="Menu" type="Control"
  // unique_id=810606303]), dus na het type mag er meer staan, maar geen parent.
  // Een menu op een CanvasLayer telt ook; een losse HUD- of pauzescène met een
  // knop erin niet (aan de naam van de bovenste node).
  '2d-startscherm': {
    type: 'regex',
    pattern:
      /\[node name="(?![^"]*(?:hud|pauze|pause))[^"]*" type="(?:Control|CanvasLayer)"(?![^\]]*\bparent=)[^\]]*\][\s\S]*?\[node [^\]]*type="Button"/gi,
    in: ['tscn'],
  },
  '2d-nieuwe-nodes': {
    type: 'regex',
    pattern: new RegExp(`\\[node [^\\]]*type="(?!(?:${BEKENDE_NODES.join('|')})")\\w+"`, 'g'),
    in: ['tscn'],
  },
  // Dezelfde nodes, maar dan drie verschillende soorten: op niveau 3 en 4 is
  // één nieuwe node de basis, en meer ontdekken gevorderd. Drie keer een
  // Marker2D is één soort; daarom minDelen en niet minCount.
  '2d-nieuwe-nodes-meer': {
    type: 'regex',
    pattern: new RegExp(`\\[node [^\\]]*type="(?!(?:${BEKENDE_NODES.join('|')})")(\\w+)"`, 'g'),
    in: ['tscn'],
    delen: true,
    minDelen: 3,
  },

  // --- GDScript: je game eigen maken ---
  // De negatieve lookahead is het hele punt: `SPEED = 300.0` telt niet mee,
  // `SPEED = 450.0` wel.
  'gd-snelheid': gd(
    new RegExp(
      `${toekenning('SPEED|speed|snelheid|SNELHEID')}(?!(?:${alt(CURSUS_SNELHEID)})(?![\\d.]))-?\\d`,
      'g',
    ),
  ),
  'gd-sprongkracht': gd(
    new RegExp(
      `${toekenning('JUMP_VELOCITY|jump_velocity|JUMP_FORCE|jump_force|sprongkracht|SPRONGKRACHT')}(?!(?:${alt(CURSUS_SPRONG)})(?![\\d.]))-?\\d`,
      'g',
    ),
  ),
  // Eigen toetsen staan als [input]-sectie in project.godot; zonder die
  // sectie gebruikt het project alleen de ingebouwde ui_*-acties.
  'gd-keybindings': { type: 'regex', pattern: /^\[input\]/gm, in: ['godot'] },
  // `&"zwemmen"` is een StringName; dat schrijft Godot zelf als je een
  // animatie uit de lijst sleept.
  'gd-animatie': gd(
    new RegExp(`play\\s*\\(\\s*&?["'](?!(?:${CURSUS_ANIMATIES.join('|')})["'])[^"']+["']`, 'g'),
  ),
  // Een handler die de editor maakt (_on_…), of een eigen signal dat je in
  // code verbindt.
  'gd-signal': gd(/\bfunc\s+_on_\w+|^[ \t]*signal\s+\w+|\.connect\s*\(/gm),
  'gd-volgend-level': gd(/change_scene_to_(?:file|packed)\s*\(/g),

  // --- GDScript: verder met code ---
  // "Nuttig gebruik" is een oordeel dat een regex niet kan vellen. Wat hij
  // wél kan: het verschil tussen één keer toevallig en er echt mee werken.
  // Daarom een drempel van twee op de concepten waar de tabel "nuttig" zegt.
  'gd-globals': gd(/\bGlobal\.\w+/g, 2),
  'gd-instantiate': gd(/\.instantiate\s*\(/g),
  'gd-groups': gd(/\b(?:add_to_group|get_nodes_in_group|call_group|is_in_group)\s*\(/g),
  // Eigen functies, dus niet de functies die Godot zelf aanroept (_ready,
  // _process, _physics_process, _input), niet de signal-handlers (_on_…),
  // want die staan al als eigen concept in de tabel, en niet de functies die
  // de cursus voorzegt (CURSUS_FUNCTIES).
  'gd-modulaire-functies': gd(
    new RegExp(
      `^[ \\t]*func\\s+(?!_on_|_(?:${CALLBACKS.join('|')})\\s*\\(|(?:${alt(CURSUS_FUNCTIES)})\\s*\\()\\w+`,
      'gm',
    ),
    2,
  ),
  // Nuttig gebruik: een lijst die je maakt én daarna gebruikt, in hetzelfde
  // script. Een `var v: Array[Node] = []` die nergens meer voorkomt, telt
  // niet; een `.has()` op iets anders ook niet.
  'gd-lijsten': gd(
    /\b(?:var|const)\s+(\w+)\b[^\n=]*=\s*\[[\s\S]*?(?:\b\1\s*(?:\[|\.\w+\s*\()|\bin\s+\1\b)/g,
  ),
  // Hetzelfde voor een dictionary: maken en er iets uit halen, zoals
  // `WAARDES[soort]` in de les.
  'gd-dictionaries': gd(
    /\b(?:var|const)\s+(\w+)\b[^\n=]*=\s*\{[\s\S]*?(?:\b\1\s*(?:\[|\.\w+\s*\()|\bin\s+\1\b)/g,
  ),
  // JSON, niet elk bestand: FileAccess op een .txt is geen JSON.
  'gd-json': gd(/\bJSON\.(?:stringify|parse_string|parse)\s*\(|\bJSON\.new\s*\(/g),
  'gd-loops': gd(/^[ \t]*(?:for|while)\s/gm, 2),
  'gd-tweens': gd(/\bcreate_tween\s*\(|\bTween\b/g),
  // Een Timer is er in twee smaken: de node in je scène, en de stopwatch die
  // je in code maakt met create_timer. Allebei tellen.
  'gd-timers': {
    type: 'regex',
    pattern: /\bcreate_timer\s*\(|\bTimer\.new\s*\(|\[node [^\]]*type="Timer"/g,
    in: ['gd', 'tscn-gd', 'tscn'],
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
    detect: {
      type: 'regex',
      pattern: /#[^\n]*\b(?:omdat|zodat|want|daarom|hierdoor|anders)\b/gi,
      in: ['gd'],
      minCount: 2,
      metCommentaar: true,
    },
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

  // De leerroutes van vóór de drie niveaus. Start was de eerste kolom van het
  // blad en is niveau 1; verdieping was de tweede, en dat is nu niveau 3.
  oudeLeerroutes: { start: '1', verdieping: '3' },

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
  commentaar: { gd: 'gdscript' },
  afgeleid: [{ kind: 'tscn-gd', van: ['tscn'], maak: ingebouwdeScripts }],
  bibliotheek: isAddon,
  // Een autoload heet niet altijd Global; de namen staan in project.godot.
  detectieVoor: (files) => {
    const namen = [...new Set(['Global', ...autoloads(files)])];
    return { 'gd-globals': gd(new RegExp(`\\b(?:${namen.join('|')})\\.\\w+`, 'g'), 2) };
  },
  accept: '.zip,.gd,.tscn,.godot,.tres,.import,.png,.jpg,.jpeg,.gif,.svg,.webp',

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('godot', 'godotChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Godot Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
