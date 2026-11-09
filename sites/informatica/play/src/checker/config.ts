import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type { CheckerConfig, ConceptDetect } from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import leerdoelenJson from '../leerdoelen.json';

// De nakijker voor play-projecten. Wélke concepten tellen en op welk niveau
// staat in `src/leerdoelen.json`, met Niveau 1 en Niveau 2 als leerroute; hier
// staat alleen hóé je elk concept in de bestanden terugvindt (DETECTIE). Elk
// concept is een aanroep of een stukje Python uit de lesstof, dus regex op de
// broncode is betrouwbaar: anders dan bij robotica hoeft niets handmatig,
// want alles wat de leerling maakt staat in de code.
//
// De groepen heten naar de hoofdstukken (1 Vormen tot en met 10 Pygame-ce),
// de Python-concepten naar hun onderwerp. Niveau 1 vraagt de basis van de
// hoofdstukken 1 tot en met 4; 5 en 6 zijn daar gevorderd, en 7 tot en met 9
// expert. Op niveau 2 is alles uit 1 tot en met 6 basis, 7 tot en met 9
// gevorderd en pygame-ce expert.

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

const DETECTIE: Record<string, ConceptDetect> = {
  // Aan het begin van een regel, anders telt `color="red"` in een aanroep
  // ook mee en heeft élk programma dit concept.
  'py-variabele': py(/^[ \t]*\w+\s*=\s*[^=\n]/gm),
  // Een f-string met een waarde erin: f"Score: {score}".
  'py-fstring': py(/\bf["'][^"'\n]*\{/g),
  'py-vergelijken': py(/[=!<>]=|(?<!<)>(?!=)|(?<!>)<(?!=)/g),
  'py-if': py(/(?<!\w)if\s+.+:/g),
  // elif aan het begin van een regel, of and/or in een if of while.
  'py-elif-and-or': py(/^\s*elif\b|^\s*(if|elif|while)\b[^\n]*\b(and|or)\b/gm),
  'py-functie': py(/^\s*(async\s+)?def\s+\w+/gm),
  'py-global': py(/^\s*global\s+\w+/gm),
  'py-lijst': py(/=\s*\[|\.append\s*\(/g),
  'py-for': py(/^\s*for\s+\w+\s+in\b/gm),
  // Ook een dictionary in een lijst, zoals 9.1 hem leert:
  // levels = [{'snelheid': 100}, …]; daar staat geen = { voor.
  'py-dict': py(/=\s*\{|\{\s*['"][^'"\n]*['"]\s*:|\.get\s*\(\s*['"]/g),
  'py-import-extra': py(/^\s*(import|from)\s+(?!play\b)\w+/gm),
  'play-circle': py(/\bplay\.new_circle\s*\(/g),
  'play-box': py(/\bplay\.new_box\s*\(/g),
  'play-text': py(/\bplay\.new_text\s*\(/g),
  'play-image': py(/\bplay\.new_image\s*\(/g),
  'play-backdrop': py(/\bplay\.set_backdrop\w*\s*\(/g),
  'play-vorm-aanpassen': py(/\b\w+\.(color|radius|words|size|angle|transparency|x|y)\s*=/g),
  'play-physics': py(/\.start_physics\s*\(/g),
  'play-physics-type': py(/\b(can_move|obeys_gravity|stable)\s*=/g),
  'play-physics-eigenschap': py(/\b(bounciness|mass|sensor)\s*=/g),
  'play-clone': py(/\.clone\s*\(/g),
  'play-hide-show': py(/\.(hide|show)\s*\(/g),
  'play-random': py(/\bplay\.random_\w+\s*\(/g),
  'play-distance': py(/\.distance_to\s*\(/g),
  'play-key': py(/@play\.(when|while)_(any_)?key_\w+/g),
  'play-mouse': py(/@play\.(when|while)_mouse\w*|\bplay\.mouse\b/g),
  'play-clicked': py(/@\w+\.when_clicked\b/g),
  'play-touching': py(/@\w+\.when(_stopped)?_touching\w*/g),
  'play-wall': py(/when_touching_wall|WallSide/g),
  'play-timer': py(/await\s+play\.timer\s*\(/g),
  'play-repeat': py(/@play\.repeat_forever\b/g),
  'play-database': py(/\bplay\.new_database\s*\(/g),
  'play-data': py(/\.(set|get)_data\s*\(/g),
  'play-database-bestand': { type: 'path', pattern: /(^|\/)database\.json$/i },
  'play-button': py(/\bplay\.new_button\s*\(/g),
  'play-slider': py(/\bplay\.new_(slider|checkbox)\s*\(/g),
  'play-keuze': py(/\bplay\.new_(dropdown|radio_group|radio_button)\s*\(/g),
  'play-input': py(/\bplay\.new_text_input\s*\(/g),
  'play-progress': py(/\bplay\.new_(progress_bar|tooltip)\s*\(/g),
  'play-sound': py(/\bplay\.new_sound\s*\(/g),
  'play-sound-bestand': { type: 'path', pattern: /\.(mp3|wav|ogg)$/i },
  'play-video': py(/\bplay\.new_video\s*\(/g),
  'play-level-instellingen': py(/\b(levels?|niveaus?)\s*=\s*[[{]/gi),
  'play-level-opruimen': py(/\.remove\s*\(\s*\)/g),
  'play-level-bouwen': py(/^\s*def\s+\w*(level|scherm|niveau)\w*\s*\(/gim),
  'pygame-import': py(/^\s*import\s+pygame\b/gm),
  'pygame-loop': py(/pygame\.display\.(flip|update)\s*\(/g),
  pymunk: py(/^\s*import\s+pymunk\b/gm),
};

const uitLeerdoelen = leerdoelenNaarConfig(leerdoelenJson, DETECTIE);

export const playConfig: CheckerConfig = {
  subjects: uitLeerdoelen.subjects,
  tracks: uitLeerdoelen.tracks,
  concepts: uitLeerdoelen.concepts,
  leerdoelen: uitLeerdoelen.leerdoelen,
  // Een beoordeling van vóór de niveaus heeft geen leerroute. Hoofdstuk 1
  // tot en met 6 had toen dezelfde moeilijkheden als niveau 1 nu.
  zonderLeerroute: '1',

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

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('play', 'playChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling play-project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
