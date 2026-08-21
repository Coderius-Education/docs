// Data voor de conceptenkaart (/conceptenkaart): welke concepten uit de drie
// leerlijnen (editor, nodes, GDScript) komen in welke les aan bod. De ankers
// in `to` staan letterlijk als \{#anker} in de lesbestanden;
// src/data/conceptenkaart.test.ts bewaakt dat data en lessen gelijk blijven.

export type Leerlijn = 'editor' | 'nodes' | 'gdscript';

export const LEERLIJNEN: { id: Leerlijn; label: string }[] = [
  { id: 'editor', label: 'Editor-handelingen' },
  { id: 'nodes', label: 'Nodes & scene tree' },
  { id: 'gdscript', label: 'GDScript' },
];

export type GodotConcept = {
  /** Korte sleutel, gebruikt in conceptenPerLes. */
  id: string;
  /** Canoniek Nederlands label. */
  label: string;
  leerlijn: Leerlijn;
  /** Interne link naar de plek waar het concept wordt uitgelegd. */
  to: string;
};

/**
 * De les waar een concept wordt uitgelegd, afgeleid uit `to`. De rest van de
 * lessen waarin het concept voorkomt, gebruikt het alleen.
 * conceptenkaart.test.ts bewaakt dat `to` deze vorm heeft en dat die les het
 * concept ook echt op de kaart heeft staan.
 */
export function uitlegSlug(concept: GodotConcept): string {
  return concept.to.replace(/^\/docs\//, '').replace(/#.*$/, '');
}

export type Les = {
  /** Docusaurus-slug zonder voorloopslash-prefix, bv. 'scene'. */
  slug: string;
  titel: string;
  /** Hoofdstuknummer; moet overeenkomen met de docs-mapnaam (NN-...). */
  hoofdstuk: number;
};

// De kaart toont één hoofdstuk tegelijk. Labels en nummers komen uit de
// _category_.json-bestanden; conceptenkaart.test.ts bewaakt dat.
export const HOOFDSTUKKEN: { nummer: number; label: string }[] = [
  { nummer: 2, label: 'De editor leren kennen' },
  { nummer: 3, label: 'Level bouwen' },
  { nummer: 4, label: 'Je personage' },
  { nummer: 5, label: 'Het bewegingsscript bouwen' },
  { nummer: 6, label: 'Animaties' },
  { nummer: 7, label: 'Signals & score' },
  { nummer: 8, label: 'Meer levels & menu' },
  { nummer: 9, label: 'Uitdagende spel-ideeën' },
];

// Volgorde = leerlijn-groepen, binnen een groep de cursusvolgorde; bepaalt de
// verticale volgorde van de linkerkolom op de kaart.
export const godotConcepten: GodotConcept[] = [
  // Editor-handelingen
  {
    id: 'spel-starten',
    label: 'Spel starten en stoppen',
    leerlijn: 'editor',
    to: '/docs/interface#spel-starten',
  },
  {
    id: 'scene-opslaan',
    label: 'Scene opslaan (.tscn)',
    leerlijn: 'editor',
    to: '/docs/scene#opslaan',
  },
  {
    id: 'node-toevoegen',
    label: 'Node toevoegen en hernoemen',
    leerlijn: 'editor',
    to: '/docs/scene#node-toevoegen',
  },
  {
    id: 'bestanden-importeren',
    label: 'Bestanden in je project',
    leerlijn: 'editor',
    to: '/docs/bestanden-downloaden#projectmap',
  },
  {
    id: 'signal-koppelen',
    label: 'Signal koppelen (Node-tab)',
    leerlijn: 'editor',
    to: '/docs/signals_muntje#signal-koppelen',
  },
  {
    id: 'autoload-instellen',
    label: 'Autoload instellen',
    leerlijn: 'editor',
    to: '/docs/global_variables#autoload-instellen',
  },
  {
    id: 'main-scene',
    label: 'Main Scene kiezen',
    leerlijn: 'editor',
    to: '/docs/start_menu#main-scene',
  },
  // Nodes & scene tree
  { id: 'node2d', label: 'Node2D', leerlijn: 'nodes', to: '/docs/scene#node2d' },
  {
    id: 'texturerect',
    label: 'TextureRect',
    leerlijn: 'nodes',
    to: '/docs/background_image#texturerect',
  },
  {
    id: 'tilemaplayer',
    label: 'TileMapLayer',
    leerlijn: 'nodes',
    to: '/docs/tilemap_opzetten#tilemaplayer',
  },
  {
    id: 'physics-layer',
    label: 'Physics Layer (TileSet)',
    leerlijn: 'nodes',
    to: '/docs/tilemap_collision#physics-layer',
  },
  {
    id: 'characterbody2d',
    label: 'CharacterBody2D',
    leerlijn: 'nodes',
    to: '/docs/sprite#characterbody2d',
  },
  { id: 'sprite2d', label: 'Sprite2D', leerlijn: 'nodes', to: '/docs/sprite#sprite2d' },
  {
    id: 'collisionshape2d',
    label: 'CollisionShape2D',
    leerlijn: 'nodes',
    to: '/docs/sprite#collisionshape2d',
  },
  { id: 'camera2d', label: 'Camera2D', leerlijn: 'nodes', to: '/docs/camera2d#camera2d' },
  {
    id: 'animatedsprite2d',
    label: 'AnimatedSprite2D',
    leerlijn: 'nodes',
    to: '/docs/animaties#animatedsprite2d',
  },
  { id: 'area2d', label: 'Area2D', leerlijn: 'nodes', to: '/docs/signals_muntje#area2d' },
  {
    id: 'canvaslayer-label',
    label: 'CanvasLayer & Label',
    leerlijn: 'nodes',
    to: '/docs/score_op_scherm#canvaslayer-label',
  },
  {
    id: 'control-button',
    label: 'Control, VBox & Button',
    leerlijn: 'nodes',
    to: '/docs/start_menu#control-button',
  },
  { id: 'timer', label: 'Timer', leerlijn: 'nodes', to: '/docs/spawn_timer#timer' },
  // GDScript
  {
    id: 'var-const',
    label: 'var en const',
    leerlijn: 'gdscript',
    to: '/docs/movement-krachten#var-const',
  },
  {
    id: 'func-ready',
    label: 'func en _ready()',
    leerlijn: 'gdscript',
    to: '/docs/start_gdscript#func-ready',
  },
  {
    id: 'physics-process-delta',
    label: '_physics_process en delta',
    leerlijn: 'gdscript',
    to: '/docs/basis_movement_begrijpen#physics-process',
  },
  {
    id: 'velocity-move-and-slide',
    label: 'velocity en move_and_slide()',
    leerlijn: 'gdscript',
    to: '/docs/movement-motor#velocity',
  },
  {
    id: 'input-functies',
    label: 'Input-functies',
    leerlijn: 'gdscript',
    to: '/docs/movement-afsluiter#springen',
  },
  {
    id: 'if-elif',
    label: 'if, elif en else',
    leerlijn: 'gdscript',
    to: '/docs/movement-grond#if-elif',
  },
  {
    id: 'dollar-teken',
    label: 'Het $-teken',
    leerlijn: 'gdscript',
    to: '/docs/animaties_code#dollar-teken',
  },
  {
    id: 'signal-functie',
    label: 'Signal-functie (_on_...)',
    leerlijn: 'gdscript',
    to: '/docs/signals_muntje#signal-functie',
  },
  {
    id: 'queue-free',
    label: 'queue_free()',
    leerlijn: 'gdscript',
    to: '/docs/signals_muntje#signal-functie',
  },
  {
    id: 'global-autoload',
    label: 'Global-variabelen',
    leerlijn: 'gdscript',
    to: '/docs/global_variables#global-score',
  },
  { id: 'groups', label: 'Groups', leerlijn: 'gdscript', to: '/docs/groups#group' },
  {
    id: 'change-scene',
    label: 'change_scene_to_file()',
    leerlijn: 'gdscript',
    to: '/docs/tweede_level#change-scene',
  },
  {
    id: 'preload-instantiate',
    label: 'preload() en instantiate()',
    leerlijn: 'gdscript',
    to: '/docs/spawnen#preload',
  },
  {
    id: 'foutmelding-lezen',
    label: 'Een foutmelding lezen',
    leerlijn: 'gdscript',
    to: '/docs/fouten-zoeken#foutmelding-lezen',
  },
  {
    id: 'print-debuggen',
    label: 'Debuggen met print()',
    leerlijn: 'gdscript',
    to: '/docs/fouten-zoeken#print-drie',
  },
  {
    id: 'runtime-meldingen',
    label: 'Meldingen tijdens het spelen (null, property)',
    leerlijn: 'gdscript',
    to: '/docs/fouten-zoeken#runtime-meldingen',
  },
];

// Volgorde = cursusvolgorde; bepaalt de rechterkolom op de kaart.
export const lessen: Les[] = [
  { slug: 'interface', titel: 'De Godot-interface', hoofdstuk: 2 },
  { slug: 'scene', titel: 'Je eerste 2D-scène', hoofdstuk: 2 },
  { slug: 'bestanden-downloaden', titel: 'Bestanden downloaden', hoofdstuk: 2 },
  { slug: 'background_image', titel: 'Achtergrond', hoofdstuk: 3 },
  { slug: 'tilemap_opzetten', titel: 'Level tekenen met een TileMap', hoofdstuk: 3 },
  { slug: 'tilemap_collision', titel: 'Collision op je tegels', hoofdstuk: 3 },
  { slug: 'sprite', titel: 'Een speelbaar karakter', hoofdstuk: 4 },
  { slug: 'sprite_movement', titel: 'Je eerste eigen script', hoofdstuk: 4 },
  { slug: 'start_gdscript', titel: 'Je eerste regels code', hoofdstuk: 4 },
  {
    slug: 'basis_movement_begrijpen',
    titel: 'Bewegingsscript 1: een script dat draait',
    hoofdstuk: 5,
  },
  { slug: 'movement-motor', titel: 'Bewegingsscript 2: vallen', hoofdstuk: 5 },
  { slug: 'movement-delta', titel: 'Bewegingsscript 3: delta', hoofdstuk: 5 },
  { slug: 'movement-grond', titel: 'Bewegingsscript 4: je eerste if', hoofdstuk: 5 },
  { slug: 'movement-krachten', titel: 'Bewegingsscript 5: lopen', hoofdstuk: 5 },
  { slug: 'movement-remmen', titel: 'Bewegingsscript 6: stoppen', hoofdstuk: 5 },
  { slug: 'movement-afsluiter', titel: 'Bewegingsscript 7: springen', hoofdstuk: 5 },
  { slug: 'fouten-zoeken', titel: 'Fouten zoeken', hoofdstuk: 5 },
  { slug: 'camera2d', titel: 'Camera die de speler volgt', hoofdstuk: 5 },
  { slug: 'animaties', titel: 'Animaties maken', hoofdstuk: 6 },
  { slug: 'animaties_code', titel: 'Animaties in code', hoofdstuk: 6 },
  { slug: 'signals_muntje', titel: 'Signals & een muntje oppakken', hoofdstuk: 7 },
  { slug: 'score_in_karakter', titel: 'Score bijhouden', hoofdstuk: 7 },
  { slug: 'global_variables', titel: 'Global variables', hoofdstuk: 7 },
  { slug: 'score_op_scherm', titel: 'Score op het scherm', hoofdstuk: 7 },
  { slug: 'groups', titel: 'Groups', hoofdstuk: 7 },
  { slug: 'tweede_level', titel: 'Een tweede level', hoofdstuk: 8 },
  { slug: 'start_menu', titel: 'Een startmenu', hoofdstuk: 8 },
  { slug: 'spawnen', titel: 'Spawnen: nodes maken in code', hoofdstuk: 8 },
  { slug: 'spawn_timer', titel: 'Automatisch spawnen met een Timer', hoofdstuk: 8 },
  { slug: 'spel-flappy_bird', titel: 'Spelidee: Flappy Bird', hoofdstuk: 9 },
  { slug: 'spel-top_down', titel: 'Spelidee: top-down crawler', hoofdstuk: 9 },
  { slug: 'spel-endless_runner', titel: 'Spelidee: endless runner', hoofdstuk: 9 },
];

// Gesleuteld op Les.slug; waarden zijn concept-id's uit godotConcepten.
export const conceptenPerLes: Record<string, string[]> = {
  interface: ['spel-starten'],
  scene: ['node2d', 'scene-opslaan', 'node-toevoegen'],
  'bestanden-downloaden': ['bestanden-importeren'],
  background_image: ['texturerect', 'node-toevoegen'],
  tilemap_opzetten: ['tilemaplayer', 'node-toevoegen'],
  tilemap_collision: ['physics-layer', 'tilemaplayer'],
  sprite: ['characterbody2d', 'sprite2d', 'collisionshape2d', 'node-toevoegen', 'scene-opslaan'],
  sprite_movement: ['characterbody2d', 'spel-starten'],
  start_gdscript: ['var-const', 'func-ready'],
  basis_movement_begrijpen: ['physics-process-delta', 'characterbody2d', 'func-ready'],
  'movement-motor': ['velocity-move-and-slide'],
  'movement-delta': ['physics-process-delta'],
  'movement-grond': ['if-elif', 'velocity-move-and-slide'],
  'movement-krachten': ['var-const', 'input-functies'],
  'movement-remmen': ['if-elif', 'velocity-move-and-slide'],
  'movement-afsluiter': ['input-functies', 'if-elif', 'var-const'],
  'fouten-zoeken': [
    'foutmelding-lezen',
    'runtime-meldingen',
    'print-debuggen',
    'if-elif',
    'input-functies',
  ],
  camera2d: ['camera2d', 'node-toevoegen'],
  animaties: ['animatedsprite2d'],
  animaties_code: [
    'dollar-teken',
    'if-elif',
    'var-const',
    'velocity-move-and-slide',
    'animatedsprite2d',
  ],
  signals_muntje: [
    'area2d',
    'sprite2d',
    'collisionshape2d',
    'signal-koppelen',
    'signal-functie',
    'queue-free',
    'scene-opslaan',
  ],
  score_in_karakter: ['var-const', 'signal-functie', 'queue-free'],
  global_variables: ['autoload-instellen', 'global-autoload', 'var-const'],
  score_op_scherm: ['canvaslayer-label', 'global-autoload'],
  groups: ['groups'],
  tweede_level: ['change-scene', 'area2d', 'signal-koppelen', 'signal-functie', 'scene-opslaan'],
  start_menu: [
    'control-button',
    'main-scene',
    'signal-koppelen',
    'change-scene',
    'global-autoload',
  ],
  spawnen: ['preload-instantiate', 'func-ready'],
  spawn_timer: ['timer', 'preload-instantiate', 'signal-koppelen'],
  'spel-flappy_bird': [
    'characterbody2d',
    'animatedsprite2d',
    'collisionshape2d',
    'area2d',
    'timer',
    'canvaslayer-label',
    'preload-instantiate',
    'input-functies',
    'velocity-move-and-slide',
    'queue-free',
    'signal-functie',
  ],
  'spel-top_down': [
    'characterbody2d',
    'animatedsprite2d',
    'collisionshape2d',
    'tilemaplayer',
    'physics-layer',
    'camera2d',
    'area2d',
    'input-functies',
    'velocity-move-and-slide',
    'dollar-teken',
    'if-elif',
    'change-scene',
    'signal-koppelen',
  ],
  'spel-endless_runner': [
    'characterbody2d',
    'animatedsprite2d',
    'timer',
    'area2d',
    'canvaslayer-label',
    'preload-instantiate',
    'queue-free',
    'velocity-move-and-slide',
  ],
};
