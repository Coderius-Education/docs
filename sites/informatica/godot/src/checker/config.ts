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

// Wat de leerling niet zelf maakt, heeft een eigen soort in het overzicht:
// een addon, een export van de game, en de .import- en .uid-bestanden die
// Godot naast elk bestand zet. Eerst telde het overzicht ze als GDScript,
// scènes en Overig ("174 bestanden", waarvan 10 van de leerling), las de
// nakijker de scripts van een addon vóór de eigen scripts, en opende Code
// bekijken in de addon.
const EXPORT = /\.(?:pck|exe|x86_64|x86_32|arm64|apk|aab|wasm|dmg|app)$/i;

function classify(path: string): string {
  const lower = path.toLowerCase();
  if (isAddon(path)) return 'addon';
  if (EXPORT.test(lower)) return 'export';
  if (/\.(?:import|uid)$/.test(lower)) return 'intern';
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
 * van het bestand wordt spaties. `\"` in de string wordt `"`, zodat het weer
 * gewone code is; elke regel krijgt aan het eind spaties tot zijn oude lengte.
 * Eerst werd `\"` een spatie en `"`: dan stond er `play( "run ")`, en telde
 * `run ` niet als de animatie uit de cursus (issue 227).
 */
export function ingebouwdeScripts(tscn: string): string {
  let uit = tscn.replace(/[^\n]/g, ' ');
  for (const m of tscn.matchAll(/script\/source = "((?:\\.|[^"\\])*)"/g)) {
    const start = (m.index ?? 0) + m[0].indexOf('"') + 1;
    const ontsnapt = m[1]
      .split('\n')
      .map((regel) => {
        const kaal = regel.replace(/\\(["\\])/g, '$1');
        return kaal + ' '.repeat(regel.length - kaal.length);
      })
      .join('\n');
    const code = zonderCommentaar(ontsnapt, 'gdscript');
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
  // Een autoload uit een addon (Dialogic) is niet van de leerling.
  return Array.from(sectie.matchAll(/^(\w+)\s*=\s*"([^"\n]*)"/gm))
    .filter((m) => !/(?:^|\/)addons\//.test(m[2]))
    .map((m) => m[1]);
}

// De nodes die de cursus zelf aanleert, geteld uit de lessen en de
// nodes-cheatsheet. Alles daarbuiten telt als "zelf ontdekt" — dat is het
// enige concept dat niet naar iets bekends zoekt maar naar iets onbekends.
// StaticBody2D en HBoxContainer stonden er ook in, maar geen les en de
// cheatsheet ook niet noemt ze: wie ze gebruikt, heeft ze zelf gevonden.
const BEKENDE_NODES = [
  'Node',
  'Node2D',
  'CharacterBody2D',
  'Sprite2D',
  'AnimatedSprite2D',
  'CollisionShape2D',
  'Camera2D',
  'Area2D',
  'TileMapLayer',
  // De tilemap van vóór Godot 4.3; Godot-versies zegt dat je de cursus
  // daarmee kunt volgen. Eerst telde hij als zelf ontdekte node.
  'TileMap',
  'CanvasLayer',
  'Label',
  'Control',
  'VBoxContainer',
  'Button',
  'TextureRect',
  'Timer',
];

// Een node die alleen onder een andere bestaat, is met die andere één
// ontdekking: Path2D met zijn PathFollow2D, een parallax met zijn laag. Voor
// "drie soorten" telden ze eerst als twee.
const HULPNODES = ['PathFollow2D', 'ParallaxLayer'];

// De waardes die in de cursus staan. Wie ze laat staan heeft overgetypt; wie
// er iets anders neerzet heeft zijn spel van zichzelf gemaakt, en dát is wat
// "snelheid veranderen" en "sprongkracht veranderen" in de tabel betekenen.
// "Animatie veranderen" is anders: dat is een animatie wisselen in code, ook
// met de namen uit de les (zie ANIMATIE).
// De power-up van hoofdstuk 7 zet de sprongkracht op -1300.0, en de oplossing
// van zijn opdracht de snelheid op 600.0; config.test.ts eist dat elke waarde
// uit de lessen hier staat.
export const CURSUS_SNELHEID = ['300.0', '300', '600.0', '600'];
export const CURSUS_SPRONG = ['-800.0', '-800', '-400.0', '-400', '-1300.0', '-1300'];
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

// De namen: alles met speed of snelheid erin (SPRINT_SPEED, LOOPSNELHEID),
// maar niet de snelheid van een animatie (speed_scale), van de camera
// (position_smoothing_speed) of van een sprong. Voor een sprong: de kracht of
// snelheid ervan (JUMP_VELOCITY, SPRINGKRACHT), niet een teller als
// jump_count of MAX_JUMPS. Eerst telden alleen SPEED, snelheid en vier namen
// voor de sprong.
const SNELHEID_NAAM = '(?!\\w*(?:jump|sprong|spring|_scale|smoothing))\\w*(?:speed|snelheid)\\w*';
const SPRONG_NAAM =
  '\\w*(?:jump|sprong|spring)_?(?:velocity|force|speed|power|strength|impulse|kracht|snelheid)\\w*';

// Een eigen waarde: een getal dat niet uit de les komt, of een getal met een
// berekening erachter (`300.0 * 1.5`). Niet keer of gedeeld door twee: de
// power-up uit les 7.6 verdubbelt de snelheid, en de oplossing (600.0) telt
// ook niet.
const eigenWaarde = (cursus: string[]) =>
  `(?:(?!(?:${alt(cursus)})(?![\\d.]))-?\\d|-?\\d[\\d.]*\\s*[*/+-]\\s*(?!2(?:\\.0*)?(?![\\d.]))\\d)`;

/**
 * Een eigen waarde voor een naam: in een script na `const` of `var` (ook met
 * een type en @export), of ingesprongen in een functie; in een scène alleen
 * voor een `@export`-naam uit een script (`speed = 450.0` onder de node). Een
 * instelling van Godot zelf in een scène telt niet:
 * `position_smoothing_speed = 3.0` uit de les over de camera gaf eerst
 * "snelheid veranderen".
 */
function eigenWaardeVoor(naam: string, cursus: string[], exports: string[]): ConceptDetect {
  const inScript = `(?:\\b(?:const|var)\\s+|^[ \\t]+)${naam}\\s*(?::\\s*\\w+\\s*)?(?::=|=)\\s*${eigenWaarde(cursus)}`;
  const inScene = exports.length ? `|^(?:${exports.join('|')})\\s*=\\s*${eigenWaarde(cursus)}` : '';
  return {
    type: 'regex',
    pattern: new RegExp(`${inScript}${inScene}`, 'gim'),
    in: ['gd', 'tscn-gd', 'tscn'],
  };
}

/** De `@export`-namen in de scripts die bij een naam passen. */
export function exportNamen(files: ProjectFiles, naam: string): string[] {
  const re = new RegExp(`@export\\w*(?:\\([^)]*\\))?\\s+var\\s+(${naam})\\b`, 'gi');
  return [
    ...new Set(
      Object.values(files)
        .filter((f) => f.kind === 'gd' && f.content)
        .flatMap((f) => Array.from((f.content ?? '').matchAll(re), (m) => m[1])),
    ),
  ];
}

// Animatie veranderen: in code een animatie wisselen of spiegelen (issue
// 227). Dat is wat les 6.2 leert, en het telt ook met de namen uit de les
// (idle, run, jump): de docent bedoelt "via code een animatie aanpassen", niet
// "een eigen naam". Eerst telde alleen een eigen naam, letterlijk in
// `play("lopen")`. Nu telt elke manier waarop een script een animatie kiest:
// - een naam ergens in `play`, `play_backwards`, `travel` of `queue`, ook na
//   een aanroep (`play("idle" if is_on_floor() else "vallen")`) en als
//   `StringName("…")`;
// - `animation = …`, `current_animation = …`, `flip_h = …` of `flip_v = …`;
// - een naam in een variabele, een lijst of een dictionary die naar zo'n
//   aanroep gaat (`play(naam)`, `play(ANIMATIES[richting])`), in welke
//   volgorde ook in het script;
// - een naam als argument van een eigen functie die hem doorgeeft
//   (`speel("run")` met `func speel(naam):` en daarin `play(naam)`).
// Een geluid telt niet: `$Geluid.play()` en `play(1.5)` hebben geen naam.
// Een variabele kijkt niet naar zijn bereik: `var naam = "Sam"` voor een
// Label en een parameter `naam` die naar `play(naam)` gaat, tellen samen ook.
const NAAM = `(?:StringName\\s*\\(\\s*)?&?(?:"[^"\\n]+"|'[^'\\n]+')`;
const AFSPELEN = '\\b(?:play|play_backwards|set_animation|travel|queue)\\s*\\(\\s*';
// Niet `var animation = 0`: dat is een eigen variabele die zo heet.
const ZETTEN = '(?<!\\b(?:var|const)\\s+)\\b(?:current_)?animation\\s*=\\s*';
// Spiegelen, zoals les 6.2 bij naar links lopen; `==` is een vergelijking.
const SPIEGELEN = '\\bflip_[hv]\\s*=(?!=)';
const TEKST = `"[^"\\n]*"|'[^'\\n]*'`;
const BINNEN = `\\((?:[^()"'\\n]|${TEKST})*\\)`;
const IN_AANROEP = `(?:[^()"'\\n]|${TEKST}|${BINNEN})*?`;
// Na de naam van een variabele: het eind van een argument.
const EINDE = '\\s*[,)]';
const KRIJGT = '\\s*(?::\\s*[\\w\\[\\]]+\\s*)?:?=\\s*';
// Een lijst met een naam erin, of een dictionary met een naam als waarde.
const LIJST = `(?:\\[[^\\]]*?|\\{[^}]*?:\\s*)${NAAM}`;
const ERNA = '(?=[\\s\\S]*?';
const ANIMATIE = new RegExp(
  [
    `${AFSPELEN}${IN_AANROEP}${NAAM}`,
    // Elke waarde telt, ook een variabele; `==` is een vergelijking.
    `${ZETTEN}(?!=)\\S`,
    SPIEGELEN,
    `\\b(\\w+)${KRIJGT}${NAAM}${ERNA}${AFSPELEN}\\1${EINDE})`,
    `${AFSPELEN}(\\w+)${EINDE}${ERNA}\\b\\2${KRIJGT}${NAAM})`,
    `\\b(\\w+)${KRIJGT}${LIJST}${ERNA}${AFSPELEN}\\3\\s*\\[)`,
    `${AFSPELEN}(\\w+)\\s*\\[${ERNA}\\b\\4${KRIJGT}${LIJST})`,
    `\\b(\\w+)\\s*\\(\\s*${NAAM}${ERNA}\\bfunc\\s+\\5\\s*\\(\\s*(\\w+)[^)]*\\)[\\s\\S]*?${AFSPELEN}\\6${EINDE})`,
    `\\bfunc\\s+(\\w+)\\s*\\(\\s*(\\w+)[^)]*\\)${ERNA}${AFSPELEN}\\8${EINDE})${ERNA}\\b\\7\\s*\\(\\s*${NAAM})`,
  ].join('|'),
  'g',
);

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

/**
 * Eigen functies, zonder de callbacks van Godot, de handlers (`_on_…` en
 * elke functie die in een scène aan een signal hangt: les 8.2 leert die een
 * eigen naam te geven) en wat de cursus voorzegt.
 */
function modulaireFuncties(handlers: string[]): ConceptDetect {
  const niet = [...CURSUS_FUNCTIES, ...handlers];
  return gd(
    new RegExp(
      `^[ \\t]*func\\s+(?!_on_|_(?:${CALLBACKS.join('|')})\\s*\\(|(?:${alt(niet)})\\s*\\()\\w+`,
      'gm',
    ),
    2,
  );
}

/** De functies die in een scène aan een signal hangen (`[connection … method="x"]`). */
export function koppelingen(files: ProjectFiles): string[] {
  const namen = new Set<string>();
  for (const f of Object.values(files)) {
    if (f.kind !== 'tscn' || !f.content) continue;
    for (const m of f.content.matchAll(/^\[connection [^\]\n]*\bmethod="(\w+)"/gm)) namen.add(m[1]);
  }
  return [...namen];
}

/**
 * Een lijst of dictionary in een autoload, gebruikt in een ander script
 * (`Global.level_volgorde.find(…)`, les 10.2). Per script kon de nakijker dat
 * niet zien: de lijst staat in global.gd en het gebruik in vlag.gd.
 */
function overScripts(files: ProjectFiles, autoloadNamen: string[]): Record<string, ConceptDetect> {
  const scripts = Object.values(files).filter((f) => f.kind === 'gd' && f.content);
  const namenVan = (soort: '[' | '{') =>
    scripts.flatMap((f) =>
      Array.from(
        (f.content ?? '').matchAll(
          soort === '['
            ? /\b(?:var|const)\s+(\w+)\b(?:[^\n=]*=\s*\[|\s*:\s*Array\b)/g
            : /\b(?:var|const)\s+(\w+)\b(?:[^\n=]*=\s*\{|\s*:\s*Dictionary\b)/g,
        ),
        (m) => m[1],
      ),
    );
  const uit: Record<string, ConceptDetect> = {};
  const auto = autoloadNamen.join('|');
  for (const [id, soort, basis] of [
    ['gd-lijsten', '[', LIJSTEN],
    ['gd-dictionaries', '{', DICTIONARIES],
  ] as const) {
    const namen = [...new Set(namenVan(soort))];
    if (namen.length === 0) continue;
    const via = `\\b(?:${auto})\\.(?:${namen.join('|')})\\s*(?:\\[|\\.\\w+)|\\bin\\s+(?:${auto})\\.(?:${namen.join('|')})\\b`;
    uit[id] = gd(new RegExp(`${basis.source}|${via}`, 'g'));
  }
  return uit;
}

const LIJSTEN =
  /\b(?:var|const)\s+(\w+)\b(?:[^\n=]*=\s*\[|\s*:\s*Array\b)[\s\S]*?(?:\b\1\s*(?:\[|\.\w+\s*\()|\bin\s+\1\b)/g;
const DICTIONARIES =
  /\b(?:var|const)\s+(\w+)\b(?:[^\n=]*=\s*\{|\s*:\s*Dictionary\b)[\s\S]*?(?:\b\1\s*(?:\[|\.\w+)|\bin\s+\1\b)/g;

const DETECTIE: Record<string, ConceptDetect> = {
  // --- 2D: nodes uit de scene-bestanden ---
  '2d-tilemaplayer': node('(?:TileMapLayer|TileMap)'),
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
      /\[node name="(?![^"]*(?:hud|pauze|pause))[^"]*" type="(?:Control|CanvasLayer)"(?![^\]]*\bparent=)[^\]]*\][\s\S]*?\[node [^\]]*type="(?:Button|TextureButton)"/gi,
    in: ['tscn'],
  },
  '2d-nieuwe-nodes': {
    type: 'regex',
    pattern: new RegExp(`\\[node [^\\]]*type="(?!(?:${BEKENDE_NODES.join('|')})")\\w+"`, 'g'),
    in: ['tscn'],
  },
  // Dezelfde nodes, maar dan drie verschillende soorten: op niveau 3 en 4 is
  // één nieuwe node de basis, en drie ontdekken gevorderd. De namen van de
  // twee rijen noemen dat aantal (1 en 3). Drie keer een
  // Marker2D is één soort; daarom minDelen en niet minCount.
  '2d-nieuwe-nodes-meer': {
    type: 'regex',
    pattern: new RegExp(
      `\\[node [^\\]]*type="(?!(?:${[...BEKENDE_NODES, ...HULPNODES].join('|')})")(\\w+)"`,
      'g',
    ),
    in: ['tscn'],
    delen: true,
    minDelen: 3,
  },

  // --- GDScript: je game eigen maken ---
  // De negatieve lookahead is het hele punt: `SPEED = 300.0` telt niet mee,
  // `SPEED = 450.0` wel.
  // Ook in een scène: een @export-waarde die je in de Inspector aanpast,
  // staat als `speed = 450.0` onder de node. En de snelheid keer iets in de
  // regel met velocity (sprinten).
  'gd-snelheid': eigenWaardeVoor(SNELHEID_NAAM, CURSUS_SNELHEID, []),
  'gd-sprongkracht': eigenWaardeVoor(SPRONG_NAAM, CURSUS_SPRONG, []),
  // Eigen toetsen staan als [input]-sectie in project.godot, met per actie
  // de toetsen (`"events": [Object(InputEventKey, …`). Les 5.7 zet W, A en D
  // aan ui_accept, ui_left en ui_right: wie de les volgt, heeft dit. Een
  // [input] met alleen lege acties telde eerst ook.
  'gd-keybindings': {
    type: 'regex',
    pattern: /^\[input\](?:(?!^\[)[\s\S])*?"events":\s*\[\s*Object\(/gm,
    in: ['godot'],
  },
  // `&"zwemmen"` is een StringName; dat schrijft Godot zelf als je een
  // animatie uit de lijst sleept. Zie ANIMATIE hieronder.
  'gd-animatie': gd(ANIMATIE),
  // Een signal dat ergens aan hangt: in de editor gekoppeld (een
  // [connection] in de scène, ook met een eigen naam voor de functie), in
  // code met .connect, of een eigen signal dat je uitzendt. Een _on_-functie
  // die nergens aan hangt, telde eerst ook, en dat is de fout uit les 7.1.
  'gd-signal': {
    type: 'regex',
    pattern: /^\[connection signal=|\.connect\s*\(|\.emit\s*\(|\bemit_signal\s*\(/gm,
    in: ['gd', 'tscn-gd', 'tscn'],
  },
  // Een scène wisselen, ook uitgesteld (call_deferred). Niet vanuit een knop
  // (`_on_start_pressed`): de knop Start van het menu laadt level 1, en dat is
  // geen volgend level. Eerst haalde een startmenu alleen deze rij al.
  'gd-volgend-level': gd(
    /^func\s+(?!\w*pressed\b)\w+[^\n]*\n(?:[ \t][^\n]*\n|[ \t]*\n)*?[ \t][^\n]*\bchange_scene_to_(?:file|packed)\b/gm,
  ),

  // --- GDScript: verder met code ---
  // Of iets nuttig gebruikt is, kan een regex niet zien. Wat hij wél kan: het
  // verschil tussen één keer toevallig en er echt mee werken. Daarom een
  // drempel van twee bij globals, loops en eigen functies. De tabel zei hier
  // eerst "nuttig gebruik"; die woorden zijn in november 2026 uit de namen
  // gehaald, en de herkenning is gebleven.
  'gd-globals': gd(/\bGlobal\.\w+/g, 2),
  'gd-instantiate': gd(/\.instantiate\s*\(/g),
  'gd-groups': gd(
    /\b(?:add_to_group|get_nodes_in_group|get_first_node_in_group|call_group|is_in_group)\s*\(/g,
  ),
  // Eigen functies, dus niet de functies die Godot zelf aanroept (_ready,
  // _process, _physics_process, _input), niet de signal-handlers (_on_…),
  // want die staan al als eigen concept in de tabel, en niet de functies die
  // de cursus voorzegt (CURSUS_FUNCTIES).
  'gd-modulaire-functies': modulaireFuncties([]),
  // Nuttig gebruik: een lijst die je maakt én daarna gebruikt, in hetzelfde
  // script. Een `var v: Array[Node] = []` die nergens meer voorkomt, telt
  // niet; een `.has()` op iets anders ook niet.
  // Ook een lijst uit de Inspector (`@export var v: Array[PackedScene]`).
  // Een lijst in de global die een ander script gebruikt (les 10.2), voegt
  // detectieVoor toe.
  'gd-lijsten': gd(LIJSTEN),
  // Hetzelfde voor een dictionary: maken en er iets uit halen, zoals
  // `WAARDES[soort]` in de les, of `speler.score`.
  'gd-dictionaries': gd(DICTIONARIES),
  // JSON, niet elk bestand: FileAccess op een .txt is geen JSON. Lezen én
  // schrijven, zoals de rij zegt: alleen de print van stringify uit de
  // voorspelvraag van les 10.4 telde eerst al.
  // Lezen ook met een JSON-object, zoals de documentatie van Godot het doet
  // (`var json = JSON.new()` en `json.parse(tekst)`).
  'gd-json': {
    type: 'regex',
    pattern:
      /\b(?:(?<d0>JSON\.stringify)|(?<d1>JSON\.parse(?:_string)?|JSON\.new\s*\(\s*\)[\s\S]*?\.parse))\s*\(/g,
    in: ['gd', 'tscn-gd'],
    delen: ['schrijven', 'lezen'],
    minDelen: 2,
  },
  'gd-loops': gd(/^[ \t]*(?:for|while)\s/gm, 2),
  // Een tween die je maakt of iets laat doen; `var t: Tween` of het woord
  // in een print telde eerst ook.
  'gd-tweens': gd(/\bcreate_tween\s*\(|\.tween_(?:property|callback|interval|method)\s*\(/g),
  // Een Timer is er in twee smaken: de node in je scène, en de stopwatch die
  // je in code maakt met create_timer. Allebei tellen, de node als zijn
  // timeout ergens aan hangt (les 8.4): een losse Timer-node telde eerst ook.
  'gd-timers': {
    type: 'regex',
    pattern:
      /\bcreate_timer\s*\(|\bTimer\.new\s*\(|\.timeout\.connect\s*\(|\bawait\b[^\n]*\.timeout\b|\[connection signal="timeout"/g,
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
    // Niet in een addon: die scènes zijn niet van de leerling.
    detect: { type: 'path', pattern: /^(?!(?:.*\/)?addons\/).*\/[^/]+\.tscn$/i },
  },
];

/**
 * Een upload waar de nakijker weinig mee kan: alleen project.godot, alleen
 * scripts, of alleen een export. Eerst kwam er dan geen melding, en zag de
 * leerling alleen tellers.
 */
export function waarschuwingen(files: ProjectFiles): string[] {
  const van = (kind: string) => Object.values(files).filter((f) => f.kind === kind);
  const exports = van('export').map((f) => f.path);
  const scripts = van('gd').length;
  const scenes = van('tscn').length;
  if (scripts === 0 && scenes === 0) {
    if (exports.length > 0) {
      return [
        `Dit lijkt een export van je game (${exports.slice(0, 2).join(', ')}). Die telt niet mee: de nakijker leest je scripts en scènes. Upload de map waarin project.godot staat.`,
      ];
    }
    if (van('godot').length > 0) {
      return [
        'Er staat geen script (.gd) en geen scène (.tscn) in de upload. Upload de hele map waarin project.godot staat.',
      ];
    }
    return [];
  }
  if (scenes === 0) {
    return [
      'Er staat geen scène (.tscn) in de upload, dus de nodes (2D) kunnen niet meetellen. Upload de hele map waarin project.godot staat.',
    ];
  }
  return [];
}

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
    { id: 'addon', label: 'Addons (telt niet)' },
    { id: 'export', label: 'Export (telt niet)' },
    { id: 'intern', label: 'Van Godot (.import, .uid)' },
  ],

  classify,
  // project.godot wordt nu als tekst gelezen, want daar staan de eigen
  // keybindings in.
  textKinds: ['gd', 'tscn', 'godot'],
  commentaar: { gd: 'gdscript' },
  afgeleid: [{ kind: 'tscn-gd', van: ['tscn'], maak: ingebouwdeScripts }],
  bibliotheek: isAddon,
  waarschuwingen,
  // Een autoload heet niet altijd Global; de namen staan in project.godot.
  detectieVoor: (files) => {
    const namen = [...new Set(['Global', ...autoloads(files)])];
    return {
      'gd-globals': gd(new RegExp(`\\b(?:${namen.join('|')})\\.\\w+`, 'g'), 2),
      ...overScripts(files, namen),
      'gd-snelheid': eigenWaardeVoor(
        SNELHEID_NAAM,
        CURSUS_SNELHEID,
        exportNamen(files, SNELHEID_NAAM),
      ),
      'gd-sprongkracht': eigenWaardeVoor(
        SPRONG_NAAM,
        CURSUS_SPRONG,
        exportNamen(files, SPRONG_NAAM),
      ),
      'gd-modulaire-functies': modulaireFuncties(koppelingen(files)),
    };
  },
  accept: '.zip,.gd,.tscn,.godot,.tres,.import,.png,.jpg,.jpeg,.gif,.svg,.webp',

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('godot', 'godotChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Godot Project - ${todayStamp(d)}.pdf`,
};
