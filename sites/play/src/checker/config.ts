import type { CheckerConfig } from '@coderius/checker/types';

// Conceptenlijst voor de play-nakijker, één op één afgeleid van de hoofdstukken
// van deze cursus: 1 Vormen tot en met 9 Levels, met pygame-ce (10) als
// verdieping. Elk concept is een API-aanroep die in de lesstof voorkomt, dus
// regex-detectie op de Python-broncode is betrouwbaar — anders dan bij robotica
// hoeft hier niets handmatig, want alles wat de leerling maakt staat in de code.
//
// Het niveau volgt de leerlijn: wat in de eerste zes hoofdstukken staat is
// basis, wat daarna komt (UI, media, levels, pygame-ce) is gevorderd. Zo ziet
// een docent in één oogopslag of een project alleen de basis raakt of verder
// gaat.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg']);
const VIDEO_EXT = new Set(['.mp4']);

function classify(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.py')) return 'py';
  if (lower.endsWith('.json')) return 'json';
  const dot = lower.lastIndexOf('.');
  const ext = dot === -1 ? '' : lower.slice(dot);
  if (IMAGE_EXT.has(ext)) return 'image';
  if (AUDIO_EXT.has(ext)) return 'audio';
  if (VIDEO_EXT.has(ext)) return 'video';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Kortere schrijfwijze: elk concept kijkt naar de Python-bestanden. */
function py(pattern: RegExp, minCount?: number) {
  return { type: 'regex' as const, pattern, in: ['py'], ...(minCount ? { minCount } : {}) };
}

export const playConfig: CheckerConfig = {
  subjects: [
    { id: 'python', label: 'Basis-Python' },
    { id: 'play', label: 'coderius-play' },
  ],

  fileKinds: [
    { id: 'py', label: 'Python' },
    { id: 'json', label: 'Database' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'audio', label: 'Geluid' },
    { id: 'video', label: "Video's" },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['py', 'json'],
  imageKinds: ['image'],
  accept: '.zip,.py,.json,.png,.jpg,.jpeg,.gif,.webp,.bmp,.mp3,.wav,.ogg,.mp4',

  teacher: { password: 'coderius-docent', storageKey: 'playChecker.docentUnlocked' },
  pdfFilename: (d) => `Beoordeling play-project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',

  concepts: [
    // ── Basis-Python ────────────────────────────────────────────────────────
    {
      id: 'py-variabele',
      subject: 'python',
      group: 'Basis',
      label: 'een variabele gebruiken',
      level: 'basis',
      detect: py(/(?<![=!<>])\s*\b\w+\s*=\s*[^=]/g),
    },
    {
      id: 'py-if',
      subject: 'python',
      group: 'Basis',
      label: 'if / else',
      level: 'basis',
      detect: py(/(?<!\w)if\s+.+:/g),
    },
    {
      id: 'py-vergelijken',
      subject: 'python',
      group: 'Basis',
      label: 'vergelijken (==, <, >)',
      level: 'basis',
      detect: py(/[=!<>]=|(?<!<)>(?!=)|(?<!>)<(?!=)/g),
    },
    {
      id: 'py-functie',
      subject: 'python',
      group: 'Basis',
      label: 'een eigen functie (def)',
      level: 'basis',
      detect: py(/^\s*(async\s+)?def\s+\w+/gm),
    },
    {
      id: 'py-global',
      subject: 'python',
      group: 'Basis',
      label: 'global',
      level: 'basis',
      detect: py(/^\s*global\s+\w+/gm),
    },
    {
      id: 'py-lijst',
      subject: 'python',
      group: 'Verder',
      label: 'een lijst',
      level: 'gevorderd',
      detect: py(/=\s*\[|\.append\s*\(/g),
    },
    {
      id: 'py-dict',
      subject: 'python',
      group: 'Verder',
      label: 'een dictionary',
      level: 'gevorderd',
      detect: py(/=\s*\{|\.get\s*\(\s*['"]/g),
    },
    {
      id: 'py-for',
      subject: 'python',
      group: 'Verder',
      label: 'een for-loop',
      level: 'gevorderd',
      detect: py(/^\s*for\s+\w+\s+in\b/gm),
    },
    {
      id: 'py-import-extra',
      subject: 'python',
      group: 'Verder',
      label: 'een tweede module importeren',
      level: 'gevorderd',
      detect: py(/^\s*(import|from)\s+(?!play\b)\w+/gm),
    },

    // ── 1 Vormen ────────────────────────────────────────────────────────────
    {
      id: 'play-circle',
      subject: 'play',
      group: '1 Vormen',
      label: 'play.new_circle',
      level: 'basis',
      detect: py(/\bplay\.new_circle\s*\(/g),
    },
    {
      id: 'play-box',
      subject: 'play',
      group: '1 Vormen',
      label: 'play.new_box',
      level: 'basis',
      detect: py(/\bplay\.new_box\s*\(/g),
    },
    {
      id: 'play-text',
      subject: 'play',
      group: '1 Vormen',
      label: 'play.new_text',
      level: 'basis',
      detect: py(/\bplay\.new_text\s*\(/g),
    },
    {
      id: 'play-image',
      subject: 'play',
      group: '1 Vormen',
      label: 'play.new_image',
      level: 'basis',
      detect: py(/\bplay\.new_image\s*\(/g),
    },
    {
      id: 'play-backdrop',
      subject: 'play',
      group: '1 Vormen',
      label: 'de achtergrond aanpassen',
      level: 'basis',
      detect: py(/\bplay\.set_backdrop\w*\s*\(/g),
    },
    {
      id: 'play-vorm-aanpassen',
      subject: 'play',
      group: '1 Vormen',
      label: 'een vorm aanpassen na het maken',
      level: 'basis',
      detect: py(/\b\w+\.(color|radius|words|size|angle|transparency|x|y)\s*=/g),
    },

    // ── 2 Fysica ────────────────────────────────────────────────────────────
    {
      id: 'play-physics',
      subject: 'play',
      group: '2 Fysica',
      label: 'start_physics',
      level: 'basis',
      detect: py(/\.start_physics\s*\(/g),
    },
    {
      id: 'play-physics-type',
      subject: 'play',
      group: '2 Fysica',
      label: 'bewust een fysica-type kiezen',
      level: 'gevorderd',
      detect: py(/\b(can_move|obeys_gravity|stable)\s*=/g),
    },
    {
      id: 'play-physics-eigenschap',
      subject: 'play',
      group: '2 Fysica',
      label: 'bounciness, mass of sensor',
      level: 'gevorderd',
      detect: py(/\b(bounciness|mass|sensor)\s*=/g),
    },

    // ── 3 Acties ────────────────────────────────────────────────────────────
    {
      id: 'play-clone',
      subject: 'play',
      group: '3 Acties',
      label: 'clone()',
      level: 'gevorderd',
      detect: py(/\.clone\s*\(/g),
    },
    {
      id: 'play-hide-show',
      subject: 'play',
      group: '3 Acties',
      label: 'hide() of show()',
      level: 'basis',
      detect: py(/\.(hide|show)\s*\(/g),
    },
    {
      id: 'play-random',
      subject: 'play',
      group: '3 Acties',
      label: 'iets willekeurigs',
      level: 'basis',
      detect: py(/\bplay\.random_\w+\s*\(/g),
    },
    {
      id: 'play-distance',
      subject: 'play',
      group: '3 Acties',
      label: 'distance_to()',
      level: 'gevorderd',
      detect: py(/\.distance_to\s*\(/g),
    },

    // ── 4 Gebeurtenissen ────────────────────────────────────────────────────
    {
      id: 'play-key',
      subject: 'play',
      group: '4 Gebeurtenissen',
      label: 'reageren op het toetsenbord',
      level: 'basis',
      detect: py(/@play\.(when|while)_(any_)?key_\w+/g),
    },
    {
      id: 'play-mouse',
      subject: 'play',
      group: '4 Gebeurtenissen',
      label: 'reageren op de muis',
      level: 'basis',
      detect: py(/@play\.(when|while)_mouse\w*|\bplay\.mouse\b/g),
    },
    {
      id: 'play-clicked',
      subject: 'play',
      group: '4 Gebeurtenissen',
      label: 'klikken op een vorm',
      level: 'basis',
      detect: py(/@\w+\.when_clicked\b/g),
    },
    {
      id: 'play-touching',
      subject: 'play',
      group: '4 Gebeurtenissen',
      label: 'botsingen tussen vormen',
      level: 'gevorderd',
      detect: py(/@\w+\.when(_stopped)?_touching\w*/g),
    },
    {
      id: 'play-wall',
      subject: 'play',
      group: '4 Gebeurtenissen',
      label: 'een muur raken',
      level: 'gevorderd',
      detect: py(/when_touching_wall|WallSide/g),
    },

    // ── 5 Tijd ──────────────────────────────────────────────────────────────
    {
      id: 'play-timer',
      subject: 'play',
      group: '5 Tijd',
      label: 'await play.timer',
      level: 'gevorderd',
      detect: py(/await\s+play\.timer\s*\(/g),
    },
    {
      id: 'play-repeat',
      subject: 'play',
      group: '5 Tijd',
      label: 'repeat_forever',
      level: 'gevorderd',
      detect: py(/@play\.repeat_forever\b/g),
    },

    // ── 6 Opslaan ───────────────────────────────────────────────────────────
    {
      id: 'play-database',
      subject: 'play',
      group: '6 Opslaan',
      label: 'een database aanmaken',
      level: 'gevorderd',
      detect: py(/\bplay\.new_database\s*\(/g),
    },
    {
      id: 'play-data',
      subject: 'play',
      group: '6 Opslaan',
      label: 'set_data en get_data',
      level: 'gevorderd',
      detect: py(/\.(set|get)_data\s*\(/g),
    },
    {
      id: 'play-database-bestand',
      subject: 'play',
      group: '6 Opslaan',
      label: 'er staat een database.json in het project',
      level: 'gevorderd',
      detect: { type: 'path', pattern: /(^|\/)database\.json$/i },
    },

    // ── 7 Knoppen en UI ─────────────────────────────────────────────────────
    {
      id: 'play-button',
      subject: 'play',
      group: '7 Knoppen en UI',
      label: 'een knop',
      level: 'gevorderd',
      detect: py(/\bplay\.new_button\s*\(/g),
    },
    {
      id: 'play-slider',
      subject: 'play',
      group: '7 Knoppen en UI',
      label: 'een schuifbalk of vinkje',
      level: 'gevorderd',
      detect: py(/\bplay\.new_(slider|checkbox)\s*\(/g),
    },
    {
      id: 'play-keuze',
      subject: 'play',
      group: '7 Knoppen en UI',
      label: 'een uitklapmenu of keuzerondjes',
      level: 'gevorderd',
      detect: py(/\bplay\.new_(dropdown|radio_group|radio_button)\s*\(/g),
    },
    {
      id: 'play-input',
      subject: 'play',
      group: '7 Knoppen en UI',
      label: 'een invoerveld',
      level: 'gevorderd',
      detect: py(/\bplay\.new_text_input\s*\(/g),
    },
    {
      id: 'play-progress',
      subject: 'play',
      group: '7 Knoppen en UI',
      label: 'een voortgangsbalk of zweeftekst',
      level: 'gevorderd',
      detect: py(/\bplay\.new_(progress_bar|tooltip)\s*\(/g),
    },

    // ── 8 Geluid en video ───────────────────────────────────────────────────
    {
      id: 'play-sound',
      subject: 'play',
      group: '8 Geluid en video',
      label: 'geluid afspelen',
      level: 'gevorderd',
      detect: py(/\bplay\.new_sound\s*\(/g),
    },
    {
      id: 'play-sound-bestand',
      subject: 'play',
      group: '8 Geluid en video',
      label: 'er zit een geluidsbestand bij',
      level: 'gevorderd',
      detect: { type: 'path', pattern: /\.(mp3|wav|ogg)$/i },
    },
    {
      id: 'play-video',
      subject: 'play',
      group: '8 Geluid en video',
      label: 'video afspelen',
      level: 'gevorderd',
      detect: py(/\bplay\.new_video\s*\(/g),
    },

    // ── 9 Levels ────────────────────────────────────────────────────────────
    {
      id: 'play-level-instellingen',
      subject: 'play',
      group: '9 Levels',
      label: 'instellingen per level in een lijst',
      level: 'gevorderd',
      detect: py(/\b(levels?|niveaus?)\s*=\s*[[{]/gi),
    },
    {
      id: 'play-level-opruimen',
      subject: 'play',
      group: '9 Levels',
      label: 'een level opruimen met remove()',
      level: 'gevorderd',
      detect: py(/\.remove\s*\(\s*\)/g),
    },
    {
      id: 'play-level-bouwen',
      subject: 'play',
      group: '9 Levels',
      label: 'een functie die een level opbouwt',
      level: 'gevorderd',
      detect: py(/^\s*def\s+\w*(level|scherm|niveau)\w*\s*\(/gim),
    },

    // ── 10 Pygame-ce (verdieping) ───────────────────────────────────────────
    {
      id: 'pygame-import',
      subject: 'play',
      group: '10 Pygame-ce',
      label: 'pygame-ce rechtstreeks gebruiken',
      level: 'gevorderd',
      detect: py(/^\s*import\s+pygame\b/gm),
    },
    {
      id: 'pygame-loop',
      subject: 'play',
      group: '10 Pygame-ce',
      label: 'een eigen game-loop',
      level: 'gevorderd',
      detect: py(/pygame\.display\.(flip|update)\s*\(/g),
    },
    {
      id: 'pymunk',
      subject: 'play',
      group: '10 Pygame-ce',
      label: 'fysica met pymunk',
      level: 'gevorderd',
      detect: py(/^\s*import\s+pymunk\b/gm),
    },
  ],
};
