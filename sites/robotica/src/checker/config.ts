import type { CheckerConfig, Concept } from '@coderius/checker/types';

// Conceptenlijst voor de robotica-nakijker, afgeleid van de vastgestelde
// leerlijntabel (kolommen Onderwerp / Concept / Niveau start / Niveau
// Verdieping). De twee onderwerpen hieronder zijn precies die eerste kolom.
//
// Wat deze nakijker anders maakt dan die van web, fullstack en godot: een
// robotica-project is één `main.py` plus foto's van een fysiek ding. De
// scheidslijn tussen automatisch en handmatig loopt daarom niet langs "wel of
// niet in code te vinden", maar langs iets scherpers:
//
//   staat het in het bestand  -> regex of pad
//   doet de robot het         -> handmatig, de docent kijkt naar de foto's
//
// `forward()` en `stop()` bewijzen niet dat een robot om een obstakel heen
// rijdt; diezelfde twee aanroepen staan in elk script van de cursus. Zulke
// concepten als regex opnemen zou een score opleveren die niets meet.
//
// De twee leerroutes (start en verdieping) geven per concept een eigen niveau.
// Waar dat gelijk is staat er één waarde; waar het verschilt een record.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);

function classify(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  if (ext === '.py') return 'py';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Korter dan het hele object uitschrijven; alle python-concepten lezen `py`. */
function py(pattern: RegExp, minCount?: number): Concept['detect'] {
  return minCount === undefined
    ? { type: 'regex', pattern, in: ['py'] }
    : { type: 'regex', pattern, in: ['py'], minCount };
}

const HANDMATIG = { type: 'handmatig' } as const;

const pythonConcepts: Concept[] = [
  {
    id: 'py-print',
    group: 'Basis',
    label: 'print',
    level: 'basis',
    detect: py(/\bprint\s*\(/g),
  },
  {
    id: 'py-variabele',
    group: 'Basis',
    label: 'Variabele',
    level: 'basis',
    detect: py(/^[ \t]*[a-z_]\w*\s*=\s*[^=\s]/gm),
  },
  {
    id: 'py-rekenen',
    group: 'Basis',
    label: 'Rekenen (+, -, *, /)',
    level: 'basis',
    // Bewust smal: een operator tússen twee getallen of variabelen, met
    // spaties eromheen zoals de cursus het schrijft. Een kale `+` zou net zo
    // vaak tekst plakken als rekenen.
    detect: py(/[\w)]\s[-*/]\s[\w(]|[\w)]\s\+\s[\w(]/g),
  },
  {
    id: 'py-fstring',
    group: 'Tekst',
    label: 'f-strings',
    level: 'basis',
    detect: py(/\bf["']/g),
  },
  {
    id: 'py-string-methoden',
    group: 'Tekst',
    label: 'String-methoden',
    level: 'basis',
    detect: py(/\.(upper|lower|strip|replace|split|join|startswith|endswith|title|format)\s*\(/g),
  },
  {
    id: 'py-boolean',
    group: 'Beslissen',
    label: 'Booleans',
    level: 'basis',
    detect: py(/\b(True|False)\b|[=!<>]=/g),
  },
  {
    id: 'py-if-else',
    group: 'Beslissen',
    label: 'if / else',
    level: 'basis',
    detect: py(/^[ \t]*if\b/gm),
  },
  {
    id: 'py-elif',
    group: 'Beslissen',
    label: 'if / elif / else',
    level: 'basis',
    detect: py(/^[ \t]*elif\b/gm),
  },
  {
    id: 'py-and-or',
    group: 'Beslissen',
    label: 'and / or',
    level: 'gevorderd',
    detect: py(/\s(and|or)\s/g),
  },
  {
    id: 'py-for',
    group: 'Herhalen',
    label: 'for-loop',
    level: 'basis',
    detect: py(/^[ \t]*for\b/gm),
  },
  {
    id: 'py-range',
    group: 'Herhalen',
    label: 'range',
    level: 'basis',
    detect: py(/\brange\s*\(/g),
  },
  {
    id: 'py-continue',
    group: 'Herhalen',
    label: 'continue',
    level: 'gevorderd',
    detect: py(/^[ \t]*continue\b/gm),
  },
  {
    id: 'py-break',
    group: 'Herhalen',
    label: 'break',
    level: 'gevorderd',
    detect: py(/^[ \t]*break\b/gm),
  },
  {
    id: 'py-while',
    group: 'Herhalen',
    label: 'while-loop',
    level: 'basis',
    detect: py(/^[ \t]*while\b/gm),
  },
  {
    id: 'py-functie',
    group: 'Functies',
    label: 'Functie zonder parameters',
    level: 'basis',
    detect: py(/^[ \t]*def\s+\w+\s*\(\s*\)/gm),
  },
  {
    id: 'py-functie-parameters',
    group: 'Functies',
    label: 'Functie met parameters',
    level: 'basis',
    detect: py(/^[ \t]*def\s+\w+\s*\(\s*\w/gm),
  },
  {
    id: 'py-return',
    group: 'Functies',
    label: 'return',
    level: 'gevorderd',
    detect: py(/^[ \t]*return\b/gm),
  },
  {
    id: 'py-lijst',
    group: 'Data',
    label: 'Lijsten',
    level: 'basis',
    detect: py(/=\s*\[/g),
  },
  {
    id: 'py-lijst-methoden',
    group: 'Data',
    label: 'Lijst-methoden',
    level: 'basis',
    detect: py(/\.(append|insert|remove|pop|sort|reverse|extend|index)\s*\(/g),
  },
  {
    id: 'py-dict',
    group: 'Data',
    label: 'Dictionaries',
    level: 'gevorderd',
    // Een dict herken je aan de dubbele punt binnen de accolades; zonder die
    // eis zou elke set ook meetellen.
    detect: py(/=\s*\{[^}]*:/g),
  },
  {
    id: 'py-dict-loop',
    group: 'Data',
    label: 'Door een dictionary loopen',
    level: 'gevorderd',
    detect: py(/\.(items|keys|values)\s*\(\s*\)/g),
  },
  {
    id: 'py-tuple-set',
    group: 'Data',
    label: 'Tuples / sets',
    level: 'gevorderd',
    // Zwak te detecteren, en dat is hier vastgelegd in plaats van weggepoetst:
    // een tuple zonder haakjes (`a, b = 1, 2`) valt hierbuiten, en een set
    // met één element is niet van een blok code te onderscheiden. Zie de
    // valkuilen-test.
    detect: py(/=\s*\([^)]*,|=\s*\{[^}:]+\}/g),
  },
  {
    id: 'py-import',
    group: 'Modules',
    label: 'Imports',
    level: { start: 'basis', verdieping: 'gevorderd' },
    detect: py(/^[ \t]*(from|import)\s+\w/gm),
  },
  {
    id: 'py-import-eigen',
    group: 'Modules',
    label: 'Import uit een eigen bestand',
    level: 'gevorderd',
    // Alles wat niet een module van het bord of uit de standaardbibliotheek
    // is, moet wel van de leerling zelf komen.
    detect: py(
      /^[ \t]*(?:from|import)\s+(?!machine\b|time\b|utime\b|leaphymicropython\b|random\b|math\b|sys\b|os\b|json\b|micropython\b|neopixel\b|network\b|gc\b)\w+/gm,
    ),
  },
].map((c) => ({ ...c, subject: 'python' }) as Concept);

const roboticaConcepts: Concept[] = [
  // --- Bouwen: alleen op foto's vast te stellen ---
  {
    id: 'rb-frame',
    group: 'Bouwen',
    label: 'Het frame gebouwd',
    level: 'basis',
    detect: HANDMATIG,
  },
  {
    id: 'rb-robot-compleet',
    group: 'Bouwen',
    label: 'Hele robot gebouwd (lego, motoren, IR-sensoren, scherm)',
    level: 'basis',
    detect: HANDMATIG,
  },
  {
    id: 'rb-batterijen',
    group: 'Bouwen',
    label: 'Robot werkt op batterijen',
    level: 'basis',
    detect: HANDMATIG,
  },

  // --- Sensoren: wat er in de code staat ---
  {
    id: 'rb-ir-een',
    group: 'Sensoren',
    label: 'Eén IR-sensor uitlezen en kalibreren',
    level: 'basis',
    detect: py(/\bAnalogIR\s*\(/g),
  },
  {
    id: 'rb-ir-twee',
    group: 'Sensoren',
    label: 'Twee IR-sensoren uitlezen en kalibreren',
    level: 'basis',
    detect: py(/\bAnalogIR\s*\(/g, 2),
  },
  {
    id: 'rb-ir-vier',
    group: 'Sensoren',
    label: 'Lijnvolgen met vier IR-sensoren',
    level: { start: 'gevorderd', verdieping: 'basis' },
    detect: py(/\bAnalogIR\s*\(/g, 4),
  },
  {
    id: 'rb-afstand',
    group: 'Sensoren',
    label: 'Afstandsensor uitlezen',
    level: { start: 'gevorderd', verdieping: 'basis' },
    detect: py(/\bTimeOfFlight\s*\(|\bget_distance\s*\(|\bread_distance\s*\(/g),
  },

  // --- Aansturen ---
  {
    id: 'rb-scherm',
    group: 'Aansturen',
    label: 'Waardes van de sensoren op het scherm',
    level: 'basis',
    detect: py(/\bOLEDSH1106\s*\(/g),
  },
  {
    id: 'rb-motoren',
    group: 'Aansturen',
    label: 'Motoren aansturen',
    level: 'basis',
    detect: py(/\bDCMotors\s*\(/g),
  },
  {
    id: 'rb-servo',
    group: 'Aansturen',
    label: 'Servo aansturen (grijper)',
    level: 'gevorderd',
    detect: py(/\bset_servo_angle\s*\(/g),
  },

  // --- Rijgedrag: alleen te zien aan een rijdende robot ---
  {
    id: 'rb-lijnvolgen-twee',
    group: 'Rijgedrag',
    label: 'Lijnvolgen met twee IR-sensoren',
    level: 'basis',
    detect: HANDMATIG,
  },
  {
    id: 'rb-obstakel-stoppen',
    group: 'Rijgedrag',
    label: 'Obstakel detecteren en stoppen',
    level: { start: 'gevorderd', verdieping: 'basis' },
    detect: HANDMATIG,
  },
  {
    id: 'rb-obstakel-omheen',
    group: 'Rijgedrag',
    label: 'Om een obstakel heen rijden',
    level: 'gevorderd',
    detect: HANDMATIG,
  },
  {
    id: 'rb-muren',
    group: 'Rijgedrag',
    label: 'Langs muren rijden',
    level: 'gevorderd',
    detect: HANDMATIG,
  },
  {
    id: 'rb-bal-detecteren',
    group: 'Rijgedrag',
    label: 'Bal detecteren',
    level: { start: 'gevorderd', verdieping: 'basis' },
    detect: HANDMATIG,
  },
  {
    id: 'rb-bal-grijpen',
    group: 'Rijgedrag',
    label: 'Bal grijpen',
    level: 'gevorderd',
    detect: HANDMATIG,
  },
  {
    id: 'rb-redden-basis',
    group: 'Rijgedrag',
    label: 'Redden Basis gelopen',
    level: 'gevorderd',
    detect: HANDMATIG,
  },

  // --- Op het bord ---
  {
    id: 'rb-main-py',
    group: 'Op het bord',
    label: 'Script heet main.py',
    level: 'basis',
    // Het bord voert bij het aanzetten alleen een bestand met exact deze naam
    // uit; heet het anders, dan doet de robot op batterijen niets.
    detect: { type: 'path', pattern: /(^|\/)main\.py$/ },
  },
].map((c) => ({ ...c, subject: 'robotica' }) as Concept);

export const roboticaConfig: CheckerConfig = {
  subjects: [
    { id: 'python', label: 'Python' },
    { id: 'robotica', label: 'Robotica' },
  ],

  tracks: [
    { id: 'start', label: 'Start' },
    { id: 'verdieping', label: 'Verdieping' },
  ],

  fileKinds: [
    { id: 'py', label: 'Python' },
    { id: 'image', label: "Foto's" },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['py'],
  imageKinds: ['image'],
  // Bewust geen .heic: telefoons maken dat formaat wel, maar Chrome kan het
  // niet tonen. De leerlingpagina vraagt daarom om JPG of PNG.
  accept: '.zip,.py,.png,.jpg,.jpeg,.webp',

  teacher: { password: 'coderius-docent', storageKey: 'roboticaChecker.docentUnlocked' },
  pdfFilename: (d) => `Beoordeling Robot - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',

  concepts: [...pythonConcepts, ...roboticaConcepts],
};
