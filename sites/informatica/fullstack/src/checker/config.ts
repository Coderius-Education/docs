import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type { CheckerConfig, ConceptDetect, ExtraConcept } from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import leerdoelenJson from '../leerdoelen.json';
import { samenhang } from './samenhang';

// De nakijker voor fullstack-projecten. Wélke concepten tellen en op welk
// niveau staat in `src/leerdoelen.json`: het tabblad fullstack van het
// beoordelingsblad, in dezelfde volgorde en met dezelfde woorden, met de twee
// startkolommen als niveau 1 en 2. Hier staat alleen hóé je elk concept in de
// bestanden terugvindt (DETECTIE), en wat de nakijker daarnaast onder "Ook
// gebruikt" laat zien (OOK_GEBRUIKT).
//
// Twee rijen zijn handmatig: een virtual environment staat niet in een
// ingeleverd project (de nakijker leest .venv niet), en wat iemand in de
// ontwikkelaarstools doet, staat in geen bestand. De docent vinkt ze aan.
//
// Eén grens blijft: concepten die een andere cursus aanleert en ook zelf
// nakijkt, staan hier niet. `querySelector` en `addEventListener` horen bij de
// web-cursus (web/src/checker/curriculum.ts); van JavaScript telt alleen het
// koppelen vanuit static/js/, want die plek is fullstack-stof.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function classify(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  if (ext === '.py') return 'py';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.css') return 'css';
  if (ext === '.js') return 'js';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const py = (pattern: RegExp, minCount?: number): ConceptDetect => ({
  type: 'regex',
  pattern,
  in: ['py'],
  ...(minCount ? { minCount } : {}),
});
const html = (pattern: RegExp): ConceptDetect => ({ type: 'regex', pattern, in: ['html'] });

// De database zoals de cursus hem opent: `with SqliteDict("…") as db:`. De
// naam na `as` is de groep \1, zodat `gebruikers[naam] = …` net zo goed telt
// als `db[…] = …`, en een gewone dictionary (`DIEREN[naam]`) niet.
const MET_DB = String.raw`SqliteDict\s*\([^)]*\)\s+as\s+(\w+)\s*:`;
// Alles tot de volgende regel die helemaal links begint: het einde van de
// functie of het script. Zo telt een `Form` in het ene endpoint niet mee voor
// een database in het volgende.
const ZELFDE_FUNCTIE = String.raw`(?:(?!\n[^\s#])[\s\S])*?`;
const SCHRIJFT = String.raw`\s*\[[^\]]+\]\s*=(?!=)`;
const inDb = (na: string): ConceptDetect => py(new RegExp(MET_DB + ZELFDE_FUNCTIE + na, 'g'));

const DETECTIE: Record<string, ConceptDetect> = {
  'fastapi-installeren': { type: 'handmatig' },
  // Starten zie je niet in een bestand, de app die gestart wordt wel.
  'fastapi-app': py(/FastAPI\s*\(/g),
  'browser-devtools': { type: 'handmatig' },
  'fastapi-fileresponse': py(/FileResponse\s*\(/g),
  'fastapi-html-response': py(/HTMLResponse/g),
  'fastapi-routes': py(/@app\.get\s*\(/g, 2),
  'html-css-link': html(/<link\b[^>]*stylesheet/gi),
  'html-img': html(/<img\b/gi),
  // Een link naar een route van de eigen server; een link naar een bestand in
  // /static/ of naar een andere site is geen pagina via een endpoint.
  'html-link': html(/<a\b[^>]*\bhref\s*=\s*["']\/(?!static\/)[^"']*["']/gi),
  // Met variabelen: een dictionary met een sleutel als derde argument.
  'fastapi-templates': py(/TemplateResponse\s*\([^)]*\{\s*["']\w+["']\s*:/g),
  'db-write': inDb(String.raw`\b\1${SCHRIJFT}`),
  'db-lezen': inDb(
    String.raw`(?:\b\1\s*\.(?:get|items|keys|values)\s*\(|\b\1\s*\[[^\]]+\](?!\s*=(?!=))|\bin\s+\1\b)`,
  ),
  // Een Form-parameter en een database die in dezelfde functie wordt
  // beschreven: wat het formulier stuurt, komt in de database.
  'db-formulier': py(
    new RegExp(
      String.raw`Form\s*\(${ZELFDE_FUNCTIE}${MET_DB}${ZELFDE_FUNCTIE}\b\1${SCHRIJFT}`,
      'g',
    ),
  ),
  'db-dictionary': inDb(String.raw`\b\1${SCHRIJFT}\s*(?:\{|dict\s*\()`),
  // Ophalen in een variabele (\2), die aanpassen, en hem terugzetten. Wie
  // `db["sara"]["klas"] = …` schrijft past een kopie aan; dat telt niet.
  'db-aanpassen': inDb(
    String.raw`\b(\w+)\s*=\s*\1\s*(?:\[[^\]]+\]|\.get\s*\([^)]*\))${ZELFDE_FUNCTIE}\b\2\s*(?:\[[^\]]+\]\s*=(?!=)|\.(?:append|extend|update|remove|pop)\s*\()${ZELFDE_FUNCTIE}\b\1\s*\[[^\]]+\]\s*=\s*\2\b`,
  ),
  'fastapi-redirect': py(/RedirectResponse/g),
  // In een template of in Python; in de cursus komt hij voor het eerst als
  // het lege geval in een template.
  'if-else': {
    type: 'regex',
    pattern: /\{%\s*if\b|^[ \t]*if\b[^\n]*:/gm,
    in: ['py', 'html'],
  },
  'account-registreren': py(/@app\.post\s*\(\s*["']\/(?:registr|aanmeld|account|signup)/gi),
  // Een formulier met een wachtwoordveld dat niet het registreerformulier is.
  'account-inloggen': html(
    /<form\b(?![^>]*registr)[^>]*>(?:(?!<\/form>)[\s\S])*?type\s*=\s*["']?password/gi,
  ),
  // `gebruikers.get(naam) != wachtwoord`, of een hash die je controleert.
  'account-wachtwoord': py(/[!=]=\s*wachtwoord\b|\bwachtwoord\s*[!=]=|\.verify\s*\(/g),
  'fastapi-path-param': py(/@app\.(get|post|delete)\s*\(\s*["'][^"']*\{[^}]*\}/g),
  'htmx-verzoek': html(/\bhx-(get|post|delete|put|patch)\s*=/gi),
  'fastapi-cookie': py(/set_cookie\s*\(|\bCookie\s*\(/g),
  'fastapi-sessie': py(/token_hex\s*\(|token_urlsafe\s*\(/g),
};

// Wat de nakijker daarnaast laat zien. Het telt niet voor de moeilijkheid,
// maar zegt wel wat er in het project zit: elk item van de cheatsheet heeft
// een concept, en dit zijn die het blad niet apart noemt.
const OOK_GEBRUIKT: ExtraConcept[] = [
  {
    id: 'fastapi-get',
    subject: 'fastapi',
    group: 'App & endpoints',
    label: 'GET endpoint (@app.get)',
    detect: py(/@app\.get\s*\(/g),
  },
  {
    id: 'fastapi-post',
    subject: 'fastapi',
    group: 'App & endpoints',
    label: 'POST endpoint (@app.post)',
    detect: py(/@app\.post\s*\(/g),
  },
  {
    id: 'fastapi-static',
    subject: 'fastapi',
    group: 'HTML tonen',
    label: 'Static files (StaticFiles/mount)',
    detect: py(/StaticFiles\s*\(|\.mount\s*\(/g),
  },
  {
    id: 'fastapi-form',
    subject: 'fastapi',
    group: 'Formulieren & templates',
    label: 'Formulier verwerken (Form)',
    detect: py(/Form\s*\(/g),
  },
  {
    id: 'fastapi-request',
    subject: 'fastapi',
    group: 'Formulieren & templates',
    label: 'Request-object',
    detect: py(/\bRequest\b/g),
  },
  {
    id: 'fastapi-httpexception',
    subject: 'fastapi',
    group: 'Doorsturen & fouten',
    label: '404 sturen (HTTPException)',
    detect: py(/HTTPException/g),
  },
  {
    id: 'fastapi-delete',
    subject: 'fastapi',
    group: 'Doorsturen & fouten',
    label: 'DELETE endpoint (@app.delete)',
    detect: py(/@app\.delete\s*\(/g),
  },
  {
    id: 'html-basis',
    subject: 'html',
    group: 'HTML-pagina',
    label: 'Basis HTML-pagina (<html>)',
    detect: html(/<html/gi),
  },
  {
    id: 'html-form',
    subject: 'html',
    group: 'Formulieren',
    label: 'Formulier (method="post")',
    detect: html(/<form\b[^>]*method\s*=\s*["']?\s*post/gi),
  },
  {
    id: 'html-jinja-var',
    subject: 'html',
    group: 'Formulieren',
    label: 'Template-variabele ({{ … }})',
    detect: html(/\{\{[^}]+\}\}/g),
  },
  {
    id: 'html-jinja-loop',
    subject: 'html',
    group: 'Lijsten',
    label: 'Lijst herhalen (for-lus in template)',
    detect: html(/\{%\s*for\b/g),
  },
  {
    id: 'html-jinja-include',
    subject: 'html',
    group: 'Lijsten',
    label: 'Stuk template hergebruiken ({% include %})',
    detect: html(/\{%\s*include\b/g),
  },
  // De detectie kijkt in de HTML en niet in de JS: wat fullstack toevoegt is
  // de plek, een apart bestand in static/js/, gemount door FastAPI.
  {
    id: 'js-bestand-koppelen',
    subject: 'js',
    group: 'In de browser',
    label: 'JavaScript koppelen (<script src>)',
    detect: html(/<script\b[^>]*\bsrc\s*=/gi),
  },
  // Het koppelen herkennen we aan de bestandsnaam in de script-tag, anders
  // telt app.js twee keer.
  {
    id: 'htmx-koppelen',
    subject: 'htmx',
    group: 'Zonder herladen',
    label: 'htmx koppelen (htmx.min.js)',
    detect: html(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*htmx[^"']*\.js/gi),
  },
  {
    id: 'htmx-target',
    subject: 'htmx',
    group: 'Zonder herladen',
    label: 'Doel van het antwoord (hx-target, hx-swap)',
    detect: html(/\bhx-(target|swap)\s*=/gi),
  },
  {
    id: 'htmx-trigger',
    subject: 'htmx',
    group: 'Zonder herladen',
    label: 'Moment van het verzoek (hx-trigger)',
    detect: html(/\bhx-trigger\s*=/gi),
  },
  {
    id: 'db-sqlitedict',
    subject: 'database',
    group: 'sqlitedict',
    label: 'SqliteDict gebruiken',
    detect: py(/SqliteDict\s*\(/g),
  },
  {
    id: 'db-commit',
    subject: 'database',
    group: 'sqlitedict',
    label: 'Opslaan bevestigen (.commit())',
    detect: py(/\.commit\s*\(\s*\)/g),
  },
  {
    id: 'db-get',
    subject: 'database',
    group: 'sqlitedict',
    label: 'Veilig uitlezen (.get())',
    detect: inDb(String.raw`\b\1\.get\s*\(`),
  },
  {
    id: 'db-items',
    subject: 'database',
    group: 'sqlitedict',
    label: 'Alles bekijken (.items())',
    detect: py(/\.items\s*\(\s*\)/g),
  },
  {
    id: 'db-del',
    subject: 'database',
    group: 'sqlitedict',
    label: 'Data verwijderen (del db[…])',
    detect: inDb(String.raw`\bdel\s+\1\s*\[`),
  },
  {
    id: 'struct-main',
    subject: 'structuur',
    group: 'Mappen',
    label: 'main.py aanwezig',
    detect: { type: 'path', pattern: /(^|\/)main\.py$/ },
  },
  {
    id: 'struct-static',
    subject: 'structuur',
    group: 'Mappen',
    label: 'static/-map',
    detect: { type: 'path', pattern: /(^|\/)static\// },
  },
  {
    id: 'struct-templates',
    subject: 'structuur',
    group: 'Mappen',
    label: 'templates/-map',
    detect: { type: 'path', pattern: /(^|\/)templates\// },
  },
];

const uitLeerdoelen = leerdoelenNaarConfig(leerdoelenJson, DETECTIE);

export const fullstackConfig: CheckerConfig = {
  samenhang,
  // Het blad heeft één onderwerp, FastAPI. De andere zijn er voor Ook gebruikt.
  subjects: [
    ...uitLeerdoelen.subjects,
    { id: 'html', label: 'HTML' },
    { id: 'js', label: 'JavaScript' },
    { id: 'htmx', label: 'htmx' },
    { id: 'database', label: 'Database' },
    { id: 'structuur', label: 'Structuur' },
  ],
  tracks: uitLeerdoelen.tracks,
  concepts: uitLeerdoelen.concepts,
  leerdoelen: uitLeerdoelen.leerdoelen,
  extra: OOK_GEBRUIKT,

  fileKinds: [
    { id: 'py', label: 'Python' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'js', label: 'JavaScript' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['py', 'html', 'css', 'js'],
  accept: '.zip,.py,.html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico',

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('fullstack', 'fullstackChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Fullstack Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
