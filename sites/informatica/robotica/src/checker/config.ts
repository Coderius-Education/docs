import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type {
  CheckerConfig,
  ConceptDetect,
  ExtraConcept,
  ProjectFiles,
} from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import leerdoelenJson from '../leerdoelen.json';
import { irPinnen, schermMetSensor, zonderTekst } from './sensoren';

// De nakijker voor robotica. Wélke concepten tellen en op welk niveau staat
// in `src/leerdoelen.json`: het tabblad robotica van het beoordelingsblad, in
// dezelfde volgorde en met dezelfde woorden, met start als niveau 1,
// verdieping als niveau 4 en daartussen niveau 3. Een concept met `null` op
// een niveau telt in die leerroute niet mee. Hier staat alleen hóé je elk
// concept terugvindt (DETECTIE), en wat de nakijker daarnaast onder "Ook
// gebruikt" laat zien (OOK_GEBRUIKT).
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

/** Korter dan het hele object uitschrijven; een python-concept leest `py`. */
function py(pattern: RegExp, minCount?: number): ConceptDetect {
  return minCount === undefined
    ? { type: 'regex', pattern, in: ['py'] }
    : { type: 'regex', pattern, in: ['py'], minCount };
}

/**
 * Zoekt in de code zonder de tekst in strings (`zonderTekst`):
 * `print("links and rechts")` is geen and/or, en `print("DCMotors()")`
 * stuurt geen motoren aan.
 */
function code(pattern: RegExp): ConceptDetect {
  return { type: 'regex', pattern, in: ['py-code'] };
}

// Een blok dat iets doet: na de dubbele punt een opdracht die geen `pass` of
// `...` is, op dezelfde regel of dieper ingesprongen eronder. Het skelet van
// Deel 8 (`elif …:` met alleen `pass`) is nog geen elif, en een lege
// `def rijden(): pass` nog geen functie.
const DOET = String.raw`:(?:[ \t]*(?!pass\b|\.\.\.)\S|(?:[ \t]*\n)+\1[ \t]+(?!pass\b|\.\.\.)\S)`;
const metBlok = (kop: string) => new RegExp(String.raw`^([ \t]*)${kop}${DOET}`, 'gm');

const HANDMATIG = { type: 'handmatig' } as const;

// Windows-regeleinden: de `\r` wordt een spatie (dezelfde lengte). Een blok
// na `elif …:` of een regel als `kleur = links.black_or_white()` werd met een
// `\r` aan het eind niet meer herkend.
const lf = (t: string) => t.replaceAll('\r', ' ');

// Een IR-sensor, met zijn pin als onderdeel: een analoge (`AnalogIR("A0",
// 2500)`, ook met `pin_name=` of als `IR` geïmporteerd), een digitale
// (`Pin("D14", Pin.IN)`, zoals RoboCup ze aanbiedt; een knop heeft er PULL_UP
// bij), of een pin uit een lijst of hulpfunctie die `AnalogIR(pin, …)` maakt.
// Alleen een sensor die gelezen wordt (`ir-gelezen`), en voor lijnvolgen met
// vier een sensor waarvan wat hij leest in een `if` komt (`ir-beslist`); zie
// sensoren.ts. Per bestand, want drie scripts met 1, 2 en 2 sensoren zijn geen
// robot met vier.
function irSensoren(aantal: number, soort: 'ir-gelezen' | 'ir-beslist'): ConceptDetect {
  return {
    type: 'regex',
    pattern: /["'](A[0-7]|D\d{1,2})["']/g,
    in: [soort],
    delen: true,
    minDelen: aantal,
    perBestand: true,
  };
}

// Een meegeleverde bibliotheek: de leaphymicropython (ook de map
// leaphy-micropython-main uit de download van GitHub, met zijn examples/ en
// .github/), en een pakket in lib/ (een map met modules, waar MicroPython
// zoekt). Die gaf eerst lijsten, break, continue, tuples en de
// afstandssensor, en tilde een knipperscript van "niet aan basis" naar
// gevorderd. Alleen hele mappen: een eigen module die de leerling in lib/
// zette (`lib/motoren.py`) is van hem, en een projectmap die
// `leaphymicropython_robot` heet ook.
//
// Wie alleen de map lib/ kiest, krijgt de paden zonder lib/leaphymicropython
// ervoor: de nakijker haalt de mappen weg die elk bestand gemeen heeft. Een
// bestand op de plek van een module van de bibliotheek (`sensors/tof.py`) is
// daarom ook een bibliotheek. De namen komen uit leaphy-api.json; de test
// houdt ze gelijk.
export const LEAPHY_MODULES: Record<string, string> = {
  actuators: 'buzzer dcmotor oled_screen rgbled servo sh1106 ssd1306',
  sensors: 'adps9960 barometer bmp280 compass dht22 linesensor lsm6dsox sonar tof vl53l0x',
  utils: 'ble_uart i2c_address_finder i2c_helper pins timeschedule wifi',
};
const LEAPHY_PAD = new RegExp(
  `(?:^|\\/)(?:${Object.entries(LEAPHY_MODULES)
    .map(([map, namen]) => `${map}\\/(?:${namen.replaceAll(' ', '|')}|__init__)\\.py$`)
    .join('|')})`,
);
const isBibliotheek = (path: string) =>
  /(?:^|\/)(?:leaphy[-_]?micropython(?:-main|-master)?|\.github)\/|(?:^|\/)lib\/[^/]+\//i.test(
    path,
  ) || LEAPHY_PAD.test(path);

/**
 * De eigen modules: elk .py-bestand behalve main.py en boot.py, en een map
 * met een `__init__.py` (een pakket).
 */
export function eigenModules(files: ProjectFiles): string[] {
  const paden = Object.keys(files).filter((p) => p.endsWith('.py') && !isBibliotheek(p));
  const namen = paden
    .map((p) => p.slice(p.lastIndexOf('/') + 1, -3))
    .filter((naam) => !['main', 'boot', '__init__'].includes(naam));
  const pakketten = paden
    .filter((p) => p.endsWith('/__init__.py'))
    .map((p) => p.split('/').at(-2) ?? '');
  return [...new Set([...namen, ...pakketten])].filter((naam) => /^\w+$/.test(naam));
}

/**
 * De namen waaronder een eigen module te importeren is: `robot/rijden.py`
 * als `rijden` en als `robot.rijden`, een pakket met `__init__.py` als zijn
 * map. Een import moet een van die namen helemaal noemen: een eigen
 * `servo.py` maakt `from leaphymicropython.actuators.servo import …` nog
 * geen eigen module.
 */
export function eigenImportNamen(files: ProjectFiles): string[] {
  const namen = new Set<string>();
  for (const p of Object.keys(files)) {
    if (!p.endsWith('.py') || isBibliotheek(p)) continue;
    const delen = p.slice(0, -3).split('/');
    if (delen.at(-1) === '__init__') delen.pop();
    if (delen.length === 0 || ['main', 'boot'].includes(delen.at(-1) ?? '')) continue;
    if (!delen.every((d) => /^\w+$/.test(d))) continue;
    for (let i = 0; i < delen.length; i++) namen.add(delen.slice(i).join('.'));
  }
  return [...namen].sort((a, b) => b.length - a.length);
}

// Wat het bord en MicroPython zelf meebrengen. Een import van iets anders
// dat niet in de upload zit, is een eigen module die de leerling vergat mee
// te sturen (zie waarschuwingen).
const INGEBOUWD = new Set(
  (
    'array asyncio binascii bluetooth builtins cmath collections deflate errno framebuf gc ' +
    'hashlib heapq io json machine math micropython neopixel network os platform random re ' +
    'rp2 select socket ssl struct sys time uasyncio ubinascii ucollections uctypes uio ujson ' +
    'uos urandom ure uselect usocket ustruct usys utime dht onewire ds18x20 ssd1306 requests ' +
    'urequests mip'
  ).split(' '),
);

/** De modules die een bestand importeert, alleen het eerste deel van de naam. */
function importsVan(code: string): string[] {
  const namen: string[] = [];
  for (const m of code.matchAll(/^[ \t]*from\s+(\w+)[\w.]*\s+import\b/gm)) namen.push(m[1]);
  for (const m of code.matchAll(/^[ \t]*import\s+([^\n#;]+)/gm)) {
    for (const deel of m[1].split(',')) {
      const naam = /^\s*(\w+)/.exec(deel)?.[1];
      if (naam) namen.push(naam);
    }
  }
  return namen;
}

const opsomming = (namen: string[]) =>
  namen.length === 1 ? namen[0] : `${namen.slice(0, -1).join(', ')} en ${namen.at(-1)}`;

/**
 * Wat de leerling over zijn upload moet weten voordat de docent kijkt: alleen
 * de bibliotheek, geen main.py, een import die ontbreekt, geen foto.
 */
export function waarschuwingen(files: ProjectFiles): string[] {
  const alle = Object.values(files);
  const python = alle.filter((f) => f.kind === 'py');
  const eigen = python.filter((f) => !isBibliotheek(f.path));
  if (python.length === 0) return [];
  if (eigen.length === 0) {
    return [
      'Er staat alleen de bibliotheek van het bord in de upload, geen eigen code. Upload ook je main.py.',
    ];
  }
  const uit: string[] = [];
  const naam = (p: string) => p.slice(p.lastIndexOf('/') + 1);
  if (!eigen.some((f) => naam(f.path) === 'main.py')) {
    const bijna = eigen.find((f) => /^main\b.*\.py$/i.test(naam(f.path)));
    uit.push(
      bijna
        ? `Je script heet ${naam(bijna.path)}, niet main.py. Het bord voert bij het aanzetten alleen main.py uit: geef het die naam, op het bord en hier.`
        : 'Er staat geen main.py in de upload. Het bord voert bij het aanzetten alleen main.py uit: upload het script dat op je bord zo heet.',
    );
  }
  // Wat in de upload staat, ook een pakket in lib/ dat als bibliotheek
  // telt: dat is er wel.
  const eigenNamen = new Set(
    Object.keys(files)
      .filter((p) => p.endsWith('.py'))
      .flatMap((p) => p.slice(0, -3).split('/')),
  );
  const ontbreekt = [
    ...new Set(
      eigen.flatMap((f) =>
        importsVan(f.content ?? '').filter(
          (m) => !INGEBOUWD.has(m) && !eigenNamen.has(m) && !/^leaphy/i.test(m),
        ),
      ),
    ),
  ].sort();
  if (ontbreekt.length > 0) {
    const bestanden = opsomming(ontbreekt.map((m) => `${m}.py`));
    uit.push(
      `Je code importeert ${opsomming(ontbreekt)}, maar ${ontbreekt.length === 1 ? 'dat bestand zit' : 'die bestanden zitten'} niet in de upload. Upload ${bestanden} mee: alleen dan telt wat erin staat.`,
    );
  }
  if (!alle.some((f) => f.kind === 'image')) {
    uit.push(
      "Er staat geen foto in de upload. Aan je code is niet te zien of je robot gebouwd is en rijdt: voeg een paar foto's toe.",
    );
  }
  return uit;
}

const DETECTIE: Record<string, ConceptDetect> = {
  // Ook een constante in hoofdletters (`DREMPEL = 2500`).
  'py-variabele': code(/^[ \t]*[A-Za-z_]\w*\s*=\s*[^=\s]/gm),
  // Een operator tussen twee getallen, namen of haakjes, met of zonder
  // spaties (`teller+1`, `snelheid - 55`), en `teller += 1`. Tekst in strings
  // telt niet: `print("Links - Rechts")` rekent niet. `->` ook niet.
  'py-rekenen': code(
    // Een min na `return`, `else` of `in` is een negatief getal (`return -1`).
    /(?:\b(?!(?:return|else|yield|in|not|and|or|if|elif|while|lambda|is|assert|await)\b)\w+|[)\]])\s*(?:\*\*|\/\/|[-+*/%])(?!>)\s*[\w(]|\w\s*(?:\/\/|[-+*/%])=\s*[\w(-]/g,
  ),
  'py-fstring': py(/\bf["']/g),
  // `while True:` telt hier niet mee. Die regel staat in élk script van de
  // cursus, al in het knipperscript van Deel 2, en zou dit concept dus
  // aanvinken voordat de leerling één boolean heeft gebruikt.
  // Ook `<` en `>`, maar niet `->` of `<<`.
  // Ook `while(True):` niet.
  'py-boolean': code(
    /[=!<>]=|(?<![-<>])[<>](?![<>=])|(?<!\bwhile\s{0,8}\(?\s{0,8})\b(?:True|False)\b/g,
  ),
  'py-if-else': code(/^[ \t]*if\b/gm),
  // Een tak die iets doet: het skelet van Deel 8 met alleen `pass` niet.
  'py-elif': code(metBlok('elif\\b[^\\n]*')),
  'py-while': code(/^[ \t]*while\b/gm),
  // Elke functie: wie een functie met parameters schrijft, kan er ook een
  // zonder. Op niveau 3 en 4 telt "met parameters" niet mee, en eerst gaf
  // `def stuur(a, b)` daar dus niets, terwijl `def rechtdoor()` gevorderd was.
  // Een functie die iets doet; `def rijden(): pass` nog niet.
  'py-functie': code(metBlok('def\\s+\\w+\\s*\\([^)]*\\)[^:\\n]*')),
  // `self` alleen is geen parameter.
  'py-functie-parameters': code(
    metBlok('def\\s+\\w+\\s*\\(\\s*(?:self\\s*,\\s*)?(?!self\\b)\\w[^)]*\\)[^:\\n]*'),
  ),
  // Niet op tekst (`"abc".index(…)`) of het bestandssysteem (`os.remove`).
  'py-lijst-methoden': code(
    /(?<!["']|\bos|\bsys|\bpath)\.(append|insert|remove|pop|sort|reverse|extend|index|clear|count)\s*\(/g,
  ),
  'py-import': code(/^[ \t]*(from|import)\s+\w/gm),
  'rb-frame': HANDMATIG,
  'rb-ir-een': irSensoren(1, 'ir-gelezen'),
  'rb-ir-twee': irSensoren(2, 'ir-gelezen'),
  // Een regel die een waarde van een IR-sensor op het scherm zet (zie
  // schermMetSensor); "Hallo robot", een teller of de afstand niet.
  'rb-scherm': { type: 'regex', pattern: /^[ \t]*\S/gm, in: ['scherm'] },
  // Ook één motor (`DCMotor`).
  'rb-motoren': code(/\bDCMotors?\s*\(/g),
  'rb-robot-compleet': HANDMATIG,
  'rb-batterijen': HANDMATIG,
  'rb-lijnvolgen-twee': HANDMATIG,
  // Lijnvolgen: vier sensoren waarvan wat ze lezen in een `if` komt. Bij
  // Uitlezen en tonen van Deel 9 staan de twee buitenste alleen op het
  // scherm; de les zegt zelf "een nieuwe sensor doet niets zolang geen regel
  // in je if-blok hem gebruikt".
  'rb-ir-vier': irSensoren(4, 'ir-beslist'),
  'rb-afstand': code(/\bTimeOfFlight\s*\(|\bget_distance\s*\(|\bread_distance\s*\(/g),
  'rb-obstakel-stoppen': HANDMATIG,
  'rb-bal-detecteren': HANDMATIG,
  'py-and-or': code(/\s(and|or)\s/g),
  // Ook op één regel: `if x: break`.
  'py-continue': code(/(?:^[ \t]*|:[ \t]*)continue\b/gm),
  'py-break': code(/(?:^[ \t]*|:[ \t]*)break\b/gm),
  // Een lijst die je maakt en gebruikt (`naam[…]`, `naam.iets(`, `in naam`,
  // of als argument), of een lus over een lijst (`for pin in ["A0", "A1"]`).
  // `metingen = []` die nergens meer voorkomt, en `pins=["A0"]` als argument,
  // zijn geen lijst die de leerling gebruikt.
  'py-lijst': code(
    /^[ \t]*(\w+)\s*=\s*\[(?=[\s\S]*?(?:(?<![\w.])\1\s*\[|(?<![\w.])\1\.\w+\s*\(|\bin\s+\1\b|[(,]\s*\1\s*[,)]))|\bin\s+\[/gm,
  ),
  // Een module die als .py in het project staat (zie detectieVoor hieronder);
  // `import struct` of `import ssd1306` telde eerst ook als eigen module.
  'py-import-eigen': py(/(?!)/g),
  // Een tuple tussen haakjes (`meting = (a(), b())`, `return (1, 2)`), een
  // lijst tuples (`[(255, 0, 0), …]`), uitpakken (`wit, zwart = 800, 5000`,
  // `for r, g, b in kleuren`), `return a, b`, een set (`{…}` zonder dubbele
  // punt, `in {…}`), of set() en tuple(). Een set met één element is niet van
  // een blok code te onderscheiden. Tekst in strings telt niet, zodat
  // `f"afstand={afstand}"` geen set is.
  'py-tuple-set': code(
    /^[ \t]*(?:[\w.]+\s*=|return)\s*\((?:[^()\n]|\([^()\n]*\))*,(?:[^()\n]|\([^()\n]*\))*\)|\[\s*\(|(?<![(,[{][ \t]*\n)^[ \t]*[\w.]+(?:\s*,\s*[\w.]+)+\s*=(?!=)|^[ \t]*for\s+\w+(?:\s*,\s*\w+)+\s+in\b|^[ \t]*return\s+[\w.]+\s*,|^[ \t]*[\w.]+\s*=\s*\{[^}:\n]+\}|\bin\s+\{|\b(?:set|tuple|frozenset)\s*\(/gm,
  ),
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
    // Een main.py in een map oud/ of backup/ telt niet.
    // Precies zo: het bord start geen `Main.py` (de batterijenles zegt het).
    detect: { type: 'path', pattern: /^(?!(?:.*\/)?(?:oud|old|backup|test)\/)(?:.*\/)?main\.py$/ },
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
  // blad en is niveau 1; verdieping is sinds de nieuwe indeling niveau 4.
  oudeLeerroutes: { start: '1', verdieping: '4' },

  fileKinds: [
    { id: 'py', label: 'Python' },
    { id: 'image', label: "Foto's" },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['py'],
  commentaar: { py: 'python' },
  bibliotheek: isBibliotheek,
  // Zie sensoren.ts. `alle` is de code van elk eigen bestand: een sensor uit
  // sensoren.py telt als main.py hem leest.
  afgeleid: [
    { kind: 'py-code', van: ['py'], maak: (t) => zonderTekst(lf(t)) },
    {
      kind: 'ir-gelezen',
      van: ['py'],
      maak: (t, _s, alle) => irPinnen(lf(t), alle.map(lf), false),
    },
    { kind: 'ir-beslist', van: ['py'], maak: (t, _s, alle) => irPinnen(lf(t), alle.map(lf), true) },
    { kind: 'scherm', van: ['py'], maak: (t, _s, alle) => schermMetSensor(lf(t), alle.map(lf)) },
  ],
  waarschuwingen,
  // Een import van een eigen module, ook als tweede naam (`import time,
  // rijden`), uit een pakket (`from robot.rijden import vooruit`) of uit lib/.
  detectieVoor: (files): Record<string, ConceptDetect> => {
    const namen = eigenImportNamen(files);
    if (namen.length === 0) return {};
    const n = `(?:${namen.map((m) => m.replaceAll('.', '\\.')).join('|')})(?![\\w.])`;
    const patroon = new RegExp(
      `^[ \\t]*(?:from\\s+\\.*${n}|import\\s+(?:[\\w.]+(?:\\s+as\\s+\\w+)?\\s*,\\s*)*${n})`,
      'gm',
    );
    return { 'py-import-eigen': code(patroon) };
  },
  imageKinds: ['image'],
  // Bewust geen .heic: telefoons maken dat formaat wel, maar Chrome kan het
  // niet tonen. De leerlingpagina vraagt daarom om JPG of PNG.
  accept: '.zip,.py,.png,.jpg,.jpeg,.webp',

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('robotica', 'roboticaChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Robot - ${todayStamp(d)}.pdf`,
};
