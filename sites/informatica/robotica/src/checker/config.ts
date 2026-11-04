import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type { CheckerConfig, ConceptDetect, ExtraConcept } from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import leerdoelenJson from '../leerdoelen.json';

// De nakijker voor robotica. Wélke concepten tellen en op welk niveau staat
// in `src/leerdoelen.json`: het tabblad robotica van het beoordelingsblad, in
// dezelfde volgorde en met dezelfde woorden, met start als niveau 1 en
// verdieping als niveau 3. Hier staat alleen hóé je elk concept terugvindt
// (DETECTIE), en wat de nakijker daarnaast onder "Ook gebruikt" laat zien
// (OOK_GEBRUIKT).
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

// Exact de extensies uit `accept` hieronder. Wijkt die lijst af, dan valt een
// foto uit een zip wél in de fotostrip terwijl dezelfde foto via de
// bestandskiezer niet eens te selecteren is.
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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
function py(pattern: RegExp, minCount?: number): ConceptDetect {
  return minCount === undefined
    ? { type: 'regex', pattern, in: ['py'] }
    : { type: 'regex', pattern, in: ['py'], minCount };
}

const HANDMATIG = { type: 'handmatig' } as const;

const DETECTIE: Record<string, ConceptDetect> = {
  'py-variabele': py(/^[ \t]*[a-z_]\w*\s*=\s*[^=\s]/gm),
  // Bewust smal: een operator tússen twee getallen of variabelen, met
  // spaties eromheen zoals de cursus het schrijft. Een kale `+` zou net zo
  // vaak tekst plakken als rekenen.
  'py-rekenen': py(/[\w)]\s[-*/]\s[\w(]|[\w)]\s\+\s[\w(]/g),
  'py-fstring': py(/\bf["']/g),
  // `while True:` telt hier niet mee. Die regel staat in élk script van de
  // cursus, al in het knipperscript van Deel 2, en zou dit concept dus
  // aanvinken voordat de leerling één boolean heeft gebruikt.
  'py-boolean': py(/[=!<>]=|(?<!\bwhile\s{1,8})\b(?:True|False)\b/g),
  'py-if-else': py(/^[ \t]*if\b/gm),
  'py-elif': py(/^[ \t]*elif\b/gm),
  'py-while': py(/^[ \t]*while\b/gm),
  'py-functie': py(/^[ \t]*def\s+\w+\s*\(\s*\)/gm),
  'py-functie-parameters': py(/^[ \t]*def\s+\w+\s*\(\s*\w/gm),
  'py-lijst-methoden': py(/\.(append|insert|remove|pop|sort|reverse|extend|index)\s*\(/g),
  'py-import': py(/^[ \t]*(from|import)\s+\w/gm),
  'rb-frame': HANDMATIG,
  'rb-ir-een': py(/\bAnalogIR\s*\(/g),
  'rb-ir-twee': py(/\bAnalogIR\s*\(/g, 2),
  'rb-scherm': py(/\bOLEDSH1106\s*\(/g),
  'rb-motoren': py(/\bDCMotors\s*\(/g),
  'rb-robot-compleet': HANDMATIG,
  'rb-batterijen': HANDMATIG,
  'rb-lijnvolgen-twee': HANDMATIG,
  'rb-ir-vier': py(/\bAnalogIR\s*\(/g, 4),
  'rb-afstand': py(/\bTimeOfFlight\s*\(|\bget_distance\s*\(|\bread_distance\s*\(/g),
  'rb-obstakel-stoppen': HANDMATIG,
  'rb-bal-detecteren': HANDMATIG,
  'py-and-or': py(/\s(and|or)\s/g),
  'py-continue': py(/^[ \t]*continue\b/gm),
  'py-break': py(/^[ \t]*break\b/gm),
  'py-lijst': py(/=\s*\[/g),
  // Alles wat niet een module van het bord of uit de standaardbibliotheek
  // is, moet wel van de leerling zelf komen.
  'py-import-eigen': py(
    /^[ \t]*(?:from|import)\s+(?!machine\b|time\b|utime\b|leaphymicropython\b|random\b|math\b|sys\b|os\b|json\b|micropython\b|neopixel\b|network\b|gc\b)\w+/gm,
  ),
  // Zwak te detecteren, en dat is hier vastgelegd in plaats van weggepoetst:
  // een tuple zonder haakjes (`a, b = 1, 2`) valt hierbuiten, en een set
  // met één element is niet van een blok code te onderscheiden. Zie de
  // valkuilen-test.
  'py-tuple-set': py(/=\s*\([^)]*,|=\s*\{[^}:]+\}/g),
  'rb-obstakel-omheen': HANDMATIG,
  'rb-muren': HANDMATIG,
  'rb-bal-grijpen': HANDMATIG,
  'rb-redden-basis': HANDMATIG,
};

// Wat het blad niet noemt. De nakijker laat het zien onder Ook gebruikt, maar
// het telt niet mee voor de moeilijkheid.
const OOK_GEBRUIKT: ExtraConcept[] = [
  {
    id: 'py-print',
    subject: 'python',
    group: 'Basis',
    label: 'print',
    detect: py(/\bprint\s*\(/g),
  },
  {
    id: 'py-string-methoden',
    subject: 'python',
    group: 'Tekst',
    label: 'String-methoden',
    detect: py(/\.(upper|lower|strip|replace|split|join|startswith|endswith|title|format)\s*\(/g),
  },
  {
    id: 'py-for',
    subject: 'python',
    group: 'Herhalen',
    label: 'for-loop',
    detect: py(/^[ \t]*for\b/gm),
  },
  {
    id: 'py-range',
    subject: 'python',
    group: 'Herhalen',
    label: 'range',
    detect: py(/\brange\s*\(/g),
  },
  {
    id: 'py-return',
    subject: 'python',
    group: 'Functies',
    label: 'return',
    detect: py(/^[ \t]*return\b/gm),
  },
  {
    id: 'py-dict',
    subject: 'python',
    group: 'Data',
    label: 'Dictionaries',
    // Een dict herken je aan de dubbele punt binnen de accolades; zonder die
    // eis zou elke set ook meetellen.
    detect: py(/=\s*\{[^}]*:/g),
  },
  {
    id: 'py-dict-loop',
    subject: 'python',
    group: 'Data',
    label: 'Door een dictionary lopen',
    detect: py(/\.(items|keys|values)\s*\(\s*\)/g),
  },
  {
    id: 'rb-servo',
    subject: 'robotica',
    group: 'Aansturen',
    label: 'Servo aansturen (grijper)',
    detect: py(/\bset_servo_angle\s*\(/g),
  },
  {
    id: 'rb-main-py',
    subject: 'robotica',
    group: 'Op het bord',
    label: 'Script heet main.py',
    // Het bord voert bij het aanzetten alleen een bestand met exact deze naam
    // uit; heet het anders, dan doet de robot op batterijen niets.
    detect: { type: 'path', pattern: /(^|\/)main\.py$/ },
  },
];

const uitLeerdoelen = leerdoelenNaarConfig(leerdoelenJson, DETECTIE);

export const roboticaConfig: CheckerConfig = {
  subjects: uitLeerdoelen.subjects,
  tracks: uitLeerdoelen.tracks,
  concepts: uitLeerdoelen.concepts,
  leerdoelen: uitLeerdoelen.leerdoelen,
  extra: OOK_GEBRUIKT,
  // De leerroutes van vóór de leerdoelen. Start was de eerste kolom van het
  // blad en is niveau 1; verdieping is niveau 3, zoals bij Godot.
  oudeLeerroutes: { start: '1', verdieping: '3' },

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

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('robotica', 'roboticaChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Robot - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
