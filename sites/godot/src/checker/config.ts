import type { CheckerConfig } from '@coderius/checker/types';

// Conceptenlijst voor de godot-nakijker, afgeleid van src/pages/gdscript-tips.md
// (GDScript-concepten) en de node-cheatsheet. GDScript-keywords/methoden zijn
// Engels, dus regex-detectie is betrouwbaar. Scene- en projectbestanden worden
// via hun pad herkend.

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

export const godotConfig: CheckerConfig = {
  subjects: [
    { id: 'gdscript', label: 'GDScript' },
    { id: 'beweging', label: 'Beweging & fysica' },
    { id: 'input', label: 'Input' },
    { id: 'nodes', label: 'Nodes & signals' },
    { id: 'scene', label: 'Scene-nodes' },
  ],

  fileKinds: [
    { id: 'gd', label: 'GDScript' },
    { id: 'tscn', label: 'Scenes' },
    { id: 'godot', label: 'Project' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['gd', 'tscn'],
  accept: '.zip,.gd,.tscn,.godot,.tres,.import,.png,.jpg,.jpeg,.gif,.svg,.webp',

  teacher: { password: 'coderius-docent', storageKey: 'godotChecker.docentUnlocked' },
  pdfFilename: (d) => `Beoordeling Godot Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',

  concepts: [
    // --- GDScript ---
    {
      id: 'gd-extends',
      subject: 'gdscript',
      group: 'Basis',
      label: 'extends',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bextends\s+\w+/g, in: ['gd'] },
    },
    {
      id: 'gd-var',
      subject: 'gdscript',
      group: 'Basis',
      label: 'var',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bvar\s+\w+/g, in: ['gd'] },
    },
    {
      id: 'gd-const',
      subject: 'gdscript',
      group: 'Basis',
      label: 'const',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bconst\s+\w+/g, in: ['gd'] },
    },
    {
      id: 'gd-func',
      subject: 'gdscript',
      group: 'Basis',
      label: 'eigen functie (func)',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bfunc\s+\w+/g, in: ['gd'] },
    },
    {
      id: 'gd-if',
      subject: 'gdscript',
      group: 'Basis',
      label: 'if / elif / else',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bif\b/g, in: ['gd'] },
    },
    {
      id: 'gd-print',
      subject: 'gdscript',
      group: 'Basis',
      label: 'print()',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bprint\s*\(/g, in: ['gd'] },
    },
    {
      id: 'gd-ready',
      subject: 'gdscript',
      group: 'Functies',
      label: '_ready()',
      level: 'basis',
      detect: { type: 'regex', pattern: /\b_ready\s*\(/g, in: ['gd'] },
    },
    {
      id: 'gd-process',
      subject: 'gdscript',
      group: 'Functies',
      label: '_process(delta)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\b_process\s*\(/g, in: ['gd'] },
    },
    {
      id: 'gd-physics-process',
      subject: 'gdscript',
      group: 'Functies',
      label: '_physics_process(delta)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\b_physics_process\s*\(/g, in: ['gd'] },
    },

    // --- Beweging & fysica ---
    {
      id: 'mv-velocity',
      subject: 'beweging',
      group: 'Beweging',
      label: 'velocity',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bvelocity\b/g, in: ['gd'] },
    },
    {
      id: 'mv-move-and-slide',
      subject: 'beweging',
      group: 'Beweging',
      label: 'move_and_slide()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bmove_and_slide\s*\(/g, in: ['gd'] },
    },
    {
      id: 'mv-is-on-floor',
      subject: 'beweging',
      group: 'Beweging',
      label: 'is_on_floor()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bis_on_floor\s*\(/g, in: ['gd'] },
    },
    {
      id: 'mv-gravity',
      subject: 'beweging',
      group: 'Beweging',
      label: 'get_gravity()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bget_gravity\s*\(/g, in: ['gd'] },
    },
    {
      id: 'mv-move-toward',
      subject: 'beweging',
      group: 'Beweging',
      label: 'move_toward()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bmove_toward\s*\(/g, in: ['gd'] },
    },

    // --- Input ---
    {
      id: 'in-pressed',
      subject: 'input',
      group: 'Input',
      label: 'is_action_pressed()',
      level: 'basis',
      detect: { type: 'regex', pattern: /is_action_pressed\s*\(/g, in: ['gd'] },
    },
    {
      id: 'in-just-pressed',
      subject: 'input',
      group: 'Input',
      label: 'is_action_just_pressed()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /is_action_just_pressed\s*\(/g, in: ['gd'] },
    },
    {
      id: 'in-get-axis',
      subject: 'input',
      group: 'Input',
      label: 'Input.get_axis()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /get_axis\s*\(/g, in: ['gd'] },
    },

    // --- Nodes & signals ---
    {
      id: 'nd-node-access',
      subject: 'nodes',
      group: 'Nodes',
      label: 'node opzoeken ($ of get_node)',
      level: 'basis',
      detect: { type: 'regex', pattern: /\$\w+|get_node\s*\(/g, in: ['gd'] },
    },
    {
      id: 'nd-queue-free',
      subject: 'nodes',
      group: 'Nodes',
      label: 'queue_free()',
      level: 'basis',
      detect: { type: 'regex', pattern: /\bqueue_free\s*\(/g, in: ['gd'] },
    },
    {
      id: 'nd-preload',
      subject: 'nodes',
      group: 'Nodes',
      label: 'preload()',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bpreload\s*\(/g, in: ['gd'] },
    },
    {
      id: 'nd-change-scene',
      subject: 'nodes',
      group: 'Nodes',
      label: 'scene wisselen (change_scene_to_file)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /change_scene_to_file/g, in: ['gd'] },
    },
    {
      id: 'nd-signal-connect',
      subject: 'nodes',
      group: 'Signals',
      label: 'signal koppelen (.connect())',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\.connect\s*\(/g, in: ['gd'] },
    },
    {
      id: 'nd-signal-handler',
      subject: 'nodes',
      group: 'Signals',
      label: 'signal-functie (_on_…)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bfunc\s+_on_\w+/g, in: ['gd'] },
    },
    {
      id: 'nd-global',
      subject: 'nodes',
      group: 'Signals',
      label: 'Autoload/global (Global.…)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bGlobal\.\w+/g, in: ['gd'] },
    },
    {
      id: 'nd-scene-file',
      subject: 'nodes',
      group: 'Scene-bestanden',
      label: 'scene-bestand (.tscn)',
      level: 'basis',
      detect: { type: 'path', pattern: /(^|\/)[^/]+\.tscn$/ },
    },
    {
      id: 'nd-project-file',
      subject: 'nodes',
      group: 'Scene-bestanden',
      label: 'project.godot',
      level: 'basis',
      detect: { type: 'path', pattern: /(^|\/)project\.godot$/ },
    },

    // --- Scene-nodes ---
    // Het tekstuele .tscn-formaat schrijft elke node als
    // [node name="Speler" type="CharacterBody2D" parent="."]. Het patroon eist
    // "[node " plus de sluitquote na de typenaam, zodat "RichTextLabel" niet
    // als Label telt en [ext_resource ...]-regels niets triggeren.
    {
      id: 'sc-characterbody2d',
      subject: 'scene',
      group: 'Speler',
      label: 'CharacterBody2D',
      level: 'basis',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="CharacterBody2D"/g, in: ['tscn'] },
    },
    {
      id: 'sc-sprite',
      subject: 'scene',
      group: 'Speler',
      label: 'Sprite2D / AnimatedSprite2D',
      level: 'basis',
      detect: {
        type: 'regex',
        pattern: /\[node [^\]]*type="(?:Sprite2D|AnimatedSprite2D)"/g,
        in: ['tscn'],
      },
    },
    {
      id: 'sc-collisionshape2d',
      subject: 'scene',
      group: 'Speler',
      label: 'CollisionShape2D',
      level: 'basis',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="CollisionShape2D"/g, in: ['tscn'] },
    },
    {
      id: 'sc-camera2d',
      subject: 'scene',
      group: 'Speler',
      label: 'Camera2D',
      level: 'basis',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="Camera2D"/g, in: ['tscn'] },
    },
    {
      id: 'sc-tilemaplayer',
      subject: 'scene',
      group: 'Wereld',
      label: 'TileMapLayer',
      level: 'basis',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="TileMapLayer"/g, in: ['tscn'] },
    },
    {
      id: 'sc-area2d',
      subject: 'scene',
      group: 'Gameplay',
      label: 'Area2D',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="Area2D"/g, in: ['tscn'] },
    },
    {
      id: 'sc-timer',
      subject: 'scene',
      group: 'Gameplay',
      label: 'Timer',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="Timer"/g, in: ['tscn'] },
    },
    {
      id: 'sc-canvaslayer',
      subject: 'scene',
      group: 'UI',
      label: 'CanvasLayer',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="CanvasLayer"/g, in: ['tscn'] },
    },
    {
      id: 'sc-label',
      subject: 'scene',
      group: 'UI',
      label: 'Label',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="Label"/g, in: ['tscn'] },
    },
    {
      id: 'sc-button',
      subject: 'scene',
      group: 'UI',
      label: 'Button',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\[node [^\]]*type="Button"/g, in: ['tscn'] },
    },
  ],
};
