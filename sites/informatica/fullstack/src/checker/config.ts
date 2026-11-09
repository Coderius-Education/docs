import { lijktBibliotheek } from '@coderius/checker/bibliotheek';
import { leerdoelenNaarConfig } from '@coderius/checker/leerdoelen';
import type { CheckerConfig, ConceptDetect, ExtraConcept } from '@coderius/checker/types';
import { storageKey } from '@coderius/shared/opslag';
import leerdoelenJson from '../leerdoelen.json';
import { samenhang } from './samenhang';

// De nakijker voor fullstack-projecten. Wélke concepten tellen en op welk
// niveau staat in `src/leerdoelen.json`: het tabblad fullstack van het
// beoordelingsblad, in dezelfde volgorde en met dezelfde woorden, met de twee
// startkolommen als niveau 1 en 2. Niveau 3 (Linux, Veiligheid en Online
// zetten) staat niet op het blad; daar telt FastAPI niet mee. Hier staat alleen hóé je elk concept in de
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
// De haakjes mogen zelf haakjes hebben (`SqliteDict(os.path.join(…))`), en
// achter de naam mag een tweede database staan (`as a, SqliteDict(…) as b:`).
const DB_HAAKJES = String.raw`\((?:[^()]|\([^()]*\))*\)`;
const MET_DB = String.raw`SqliteDict\s*${DB_HAAKJES}\s+as\s+(\w+)\s*[:,]`;
// Of één database voor het hele bestand: `db = SqliteDict("…",
// autocommit=True)` bovenaan. Die geldt tot het eind van het bestand.
const GLOBALE_DB = String.raw`^(\w+)\s*=\s*SqliteDict\s*${DB_HAAKJES}`;
// Alles tot de volgende regel die helemaal links begint: het einde van de
// functie of het script. Zo telt een `Form` in het ene endpoint niet mee voor
// een database in het volgende. Een `):` helemaal links hoort nog bij de
// functie: zo sluit een handtekening over meer regels, zoals die van
// `POST /gastenboek` in de lessen.
const ZELFDE_FUNCTIE = String.raw`(?:(?!\n[^\s#)])[\s\S])*?`;
const SCHRIJFT = String.raw`\s*\[[^\]]+\]\s*=(?!=)`;
/** Een terugverwijzing naar groep n, `\\n`, om in een String.raw te zetten. */
const terug = (n: number) => `\\${n}`;

/**
 * Een database en wat erna komt. `na` krijgt het nummer van de groep met de
 * naam van de database, en dat van de eerste groep die hij zelf maakt: de
 * twee vormen (in een functie, of voor het hele bestand) hebben elk hun eigen
 * groepen.
 */
const inDb = (na: (db: number, eigen: number) => string, eigenGroepen = 0): ConceptDetect =>
  py(
    new RegExp(
      `(?:${MET_DB}${ZELFDE_FUNCTIE}${na(1, 2)})|(?:${GLOBALE_DB}[\\s\\S]*?${na(2 + eigenGroepen, 3 + eigenGroepen)})`,
      'gm',
    ),
  );

// De naam van een wachtwoordveld, en van het veld waarin je hem herhaalt.
const WACHTWOORD = String.raw`(?:wachtwoord|password|passwd|ww|pw)\b`;
const HERHAAL = String.raw`(?:herhaal\w*|bevestig\w*|\w*2\b|\w*_again\b)`;

// Het controlescript van de cursus (static/controleer.py): de leerling zet
// het naast main.py, en zijn routes, cookies en if's telden eerst als die van
// de leerling (niveau 1 werd expert). Plus jQuery, htmx.min.js en andere
// meegeleverde bibliotheken.
const isBibliotheek = (path: string, content: string) =>
  (/(?:^|\/)controleer\.py$/.test(path) && content.includes('fullstack-cursus')) ||
  lijktBibliotheek(path, content);

const DETECTIE: Record<string, ConceptDetect> = {
  'fastapi-installeren': { type: 'handmatig' },
  // Starten zie je niet in een bestand, de app die gestart wordt wel.
  'fastapi-app': py(/FastAPI\s*\(/g),
  'browser-devtools': { type: 'handmatig' },
  'fastapi-fileresponse': py(/FileResponse\s*\(/g),
  // Gebruikt, niet alleen geïmporteerd: de import-regel telde eerst al mee.
  'fastapi-html-response': py(/\bresponse_class\s*=\s*HTMLResponse\b|\bHTMLResponse\s*\(/g),
  // @app, of een APIRouter in een eigen bestand (@router.get).
  'fastapi-routes': py(/@\w+\.get\s*\(/g, 2),
  // Een eigen bestand: een stylesheet van een CDN (Pico) telt niet.
  'html-css-link': html(
    /<link\b(?=[^>]*stylesheet)(?=[^>]*\bhref\s*=\s*["'](?!https?:|\/\/))[^>]*>/gi,
  ),
  'html-img': html(/<img\b/gi),
  // Een link naar een route van de eigen server; een link naar een bestand in
  // /static/ of naar een andere site is geen pagina via een endpoint.
  'html-link': html(/<a\b[^>]*\bhref\s*=\s*["']\/(?!static\/)[^"']*["']/gi),
  // Met variabelen: een dictionary met een sleutel. Alleen `request` telt
  // niet; dat gaf de oude vorm mee zonder iets in het template te zetten.
  // Of een dictionary in een variabele die je meegeeft (`context = {…}`).
  'fastapi-templates': py(
    new RegExp(
      String.raw`TemplateResponse\s*\([^)]*\{[^}]*?["'](?!request["'])\w+["']\s*:|\b(\w+)\s*=\s*\{\s*["'](?!request["'])\w+["']\s*:${ZELFDE_FUNCTIE}TemplateResponse\s*\([^)]*\b\1\b`,
      'g',
    ),
  ),
  'db-write': inDb((d) => String.raw`\b${terug(d)}${SCHRIJFT}`),
  'db-lezen': inDb(
    (d) =>
      String.raw`(?:\b${terug(d)}\s*\.(?:get|items|keys|values)\s*\(|\b${terug(d)}\s*\[[^\]]+\](?!\s*=(?!=))|\bin\s+${terug(d)}\b)`,
  ),
  // Een Form-parameter en een database die in dezelfde functie wordt
  // beschreven: wat het formulier stuurt, komt in de database.
  'db-formulier': py(
    new RegExp(
      String.raw`(?:Form\s*\(${ZELFDE_FUNCTIE}${MET_DB}${ZELFDE_FUNCTIE}\b\1${SCHRIJFT})|(?:${GLOBALE_DB}[\s\S]*?Form\s*\(${ZELFDE_FUNCTIE}\b\2${SCHRIJFT})`,
      'gm',
    ),
  ),
  'db-dictionary': inDb((d) => String.raw`\b${terug(d)}${SCHRIJFT}\s*(?:\{|dict\s*\()`),
  // Ophalen in een variabele (\2), die aanpassen, en hem terugzetten. Wie
  // `db["sara"]["klas"] = …` schrijft past een kopie aan; dat telt niet.
  'db-aanpassen': inDb(
    (d, v) =>
      String.raw`\b(\w+)\s*=\s*${terug(d)}\s*(?:\[[^\]]+\]|\.get\s*\([^)]*\))${ZELFDE_FUNCTIE}\b${terug(v)}\s*(?:\[[^\]]+\]\s*=(?!=)|\.(?:append|extend|update|remove|pop)\s*\()${ZELFDE_FUNCTIE}\b${terug(d)}\s*\[[^\]]+\]\s*=\s*${terug(v)}\b`,
    1,
  ),
  // Gebruikt, niet alleen geïmporteerd.
  'fastapi-redirect': py(/\bRedirectResponse\s*\(|\bresponse_class\s*=\s*RedirectResponse\b/g),
  // In een template of in Python; in de cursus komt hij voor het eerst als
  // het lege geval in een template. `{%- … %}` is dezelfde tag, met de
  // witruimte ervoor weggehaald; dat geldt ook voor for en include.
  'if-else': {
    type: 'regex',
    // `if __name__ == "__main__":` telt niet: dat is geen keuze van de leerling.
    pattern: /\{%-?\s*if\b|^[ \t]*if\b(?!\s+__name__\b)[^\n]*:/gm,
    in: ['py', 'html'],
  },
  // Niet "aanmelden": dat is in het Nederlands meestal inloggen.
  'account-registreren': py(/@\w+\.post\s*\(\s*["']\/(?:registr|account|signup)/gi),
  // Een formulier met precies één wachtwoordveld: een registreerformulier
  // heeft er twee (wachtwoord en herhalen), ook als het naar /aanmelden gaat.
  'account-inloggen': html(
    /<form\b(?![^>]*registr)[^>]*>(?:(?!<\/form>|type\s*=\s*["']?password)[\s\S])*type\s*=\s*["']?password(?:(?!<\/form>|type\s*=\s*["']?password)[\s\S])*<\/form>/gi,
  ),
  // Het wachtwoord vergelijken met wat opgeslagen is (`opgeslagen !=
  // wachtwoord`), of een hash controleren. Niet met een lege tekst, en niet
  // met het herhaalveld bij registreren.
  'account-wachtwoord': py(
    new RegExp(
      String.raw`[\w)\]](?<!herhaal\w*|bevestig\w*|2|_again)\s*[!=]=\s*${WACHTWOORD}|\b${WACHTWOORD}\s*[!=]=\s*(?!["'\d]|${HERHAAL}|None\b)\w|\.verify\s*\(`,
      'g',
    ),
  ),
  'fastapi-path-param': py(/@\w+\.(get|post|delete|put|patch)\s*\(\s*["'][^"']*\{[^}]*\}/g),
  'htmx-verzoek': html(/\bhx-(get|post|delete|put|patch)\s*=/gi),
  'fastapi-cookie': py(/set_cookie\s*\(|\bCookie\s*\(/g),
  'fastapi-sessie': py(/token_hex\s*\(|token_urlsafe\s*\(/g),

  // Niveau 3: Linux, Veiligheid en Online zetten. Wat in de terminal of op
  // een server gebeurt, staat in geen ingeleverd bestand: dat vinkt de docent
  // aan. Een bestand dat erbij hoort (Dockerfile, compose.yaml) herkent de
  // nakijker aan zijn naam; de inhoud leest hij niet, want alleen .py, .html,
  // .css en .js zijn tekst voor hem.
  'lx-mappen': { type: 'handmatig' },
  'lx-bestanden': { type: 'handmatig' },
  'lx-rechten': { type: 'handmatig' },
  'lx-apt': { type: 'handmatig' },
  'lx-nano': { type: 'handmatig' },
  'lx-ssh': { type: 'handmatig' },
  'lx-zoeken': { type: 'handmatig' },
  'lx-diensten': { type: 'handmatig' },
  'lx-groepen': { type: 'handmatig' },
  'lx-scp': { type: 'handmatig' },
  // Alle drie de adressen uit, zoals in de les; alleen docs_url is genoeg.
  'vh-docs': py(/\bdocs_url\s*=\s*None\b/g),
  'vh-gitignore': { type: 'path', pattern: /(^|\/)\.gitignore$/ },
  // Een grens in Form: lengte of waarde. Form(...) alleen is geen controle.
  'vh-invoer': py(/\bForm\s*\([^)]*\b(?:max_length|min_length|ge|le|gt|lt)\s*=/g),
  // Templates escapen vanzelf: wie niets doet, doet het goed. Of er nergens
  // |safe op tekst van een bezoeker staat, beoordeelt de docent.
  'vh-xss': { type: 'handmatig' },
  'vh-toegang': py(/HTTPException\s*\(\s*(?:status_code\s*=\s*)?(?:403\b|status\.HTTP_403)/g),
  'vh-limiet': py(/@limiter\.limit\s*\(/g),
  // httponly=True op een cookie. samesite hoeft niet: FastAPI zet "lax" al
  // vanzelf (Cookies afschermen: samesite).
  'vh-cookies': py(/\bhttponly\s*=\s*True\b/g),
  'vh-hash': py(/\bPasswordHasher\s*\(/g),
  // De limiet op het inlog-endpoint, zoals in de les: direct onder @app.post.
  'vh-pogingen': py(/@\w+\.post\s*\(\s*["']\/(?:inlog|login)[^\n]*\n\s*@limiter\.limit\s*\(/gi),
  'on-requirements': { type: 'path', pattern: /(^|\/)requirements\.txt$/ },
  'on-readme': { type: 'path', pattern: /(^|\/)README\.md$/i },
  'on-linux': { type: 'handmatig' },
  'on-dockerfile': { type: 'path', pattern: /(^|\/)Dockerfile$/ },
  'on-compose': { type: 'path', pattern: /(^|\/)(?:docker-)?compose\.ya?ml$/ },
  'on-server': { type: 'handmatig' },
  'on-dichtzetten': { type: 'handmatig' },
  'on-https': { type: 'handmatig' },
  'on-backup': { type: 'handmatig' },
  'on-nieuwe-versie': { type: 'handmatig' },
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
    detect: html(/\{%-?\s*for\b/g),
  },
  {
    id: 'html-jinja-include',
    subject: 'html',
    group: 'Lijsten',
    label: 'Stuk template hergebruiken ({% include %})',
    detect: html(/\{%-?\s*include\b/g),
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
    detect: inDb((d) => String.raw`\b${terug(d)}\.get\s*\(`),
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
    detect: inDb((d) => String.raw`\bdel\s+${terug(d)}\s*\[`),
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
  // FastAPI, en voor niveau 3 Linux, Veiligheid en Online zetten. De andere
  // zijn er voor Ook gebruikt.
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
  // Ook de bestanden van niveau 3 (requirements.txt, README.md, compose.yaml).
  // Een Dockerfile of .gitignore heeft geen extensie en is hier niet te
  // kiezen; die komen mee met Kies een map of een zip.
  accept:
    '.zip,.py,.html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico,.txt,.md,.yml,.yaml,.toml,.json',
  commentaar: { py: 'python', html: 'html', js: 'js', css: 'css' },
  bibliotheek: isBibliotheek,
  // Een beoordeling van vóór de niveaus (november 2026) was de eerste
  // startkolom van het blad.
  zonderLeerroute: '1',

  teacher: {
    password: 'coderius-docent',
    storageKey: storageKey('fullstack', 'fullstackChecker.docentUnlocked'),
  },
  pdfFilename: (d) => `Beoordeling Fullstack Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',
};
