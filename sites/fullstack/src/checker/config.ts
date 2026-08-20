import type { CheckerConfig } from '@coderius/checker/types';

// Conceptenlijst voor de fullstack-nakijker, 1-op-1 afgeleid van
// sites/fullstack/docs/cheatsheet.md (koppen: FastAPI, HTML, Database, plus een
// mappenstructuur-check). Wijzig je de cheatsheet, werk dan ook hier de
// bijbehorende regel bij.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function classify(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  if (ext === '.py') return 'py';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.css') return 'css';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const fullstackConfig: CheckerConfig = {
  subjects: [
    { id: 'fastapi', label: 'FastAPI' },
    { id: 'html', label: 'HTML' },
    { id: 'database', label: 'Database' },
    { id: 'structuur', label: 'Structuur' },
  ],

  fileKinds: [
    { id: 'py', label: 'Python' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['py', 'html', 'css'],
  accept: '.zip,.py,.html,.htm,.css,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico',

  teacher: { password: 'coderius-docent', storageKey: 'fullstackChecker.docentUnlocked' },
  pdfFilename: (d) => `Beoordeling Fullstack Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',

  concepts: [
    // --- FastAPI ---
    {
      id: 'fastapi-app',
      subject: 'fastapi',
      group: 'App & endpoints',
      label: 'FastAPI-app aanmaken',
      level: 'basis',
      detect: { type: 'regex', pattern: /FastAPI\s*\(/g, in: ['py'] },
    },
    {
      id: 'fastapi-get',
      subject: 'fastapi',
      group: 'App & endpoints',
      label: 'GET endpoint (@app.get)',
      level: 'basis',
      detect: { type: 'regex', pattern: /@app\.get\s*\(/g, in: ['py'] },
    },
    {
      id: 'fastapi-post',
      subject: 'fastapi',
      group: 'App & endpoints',
      label: 'POST endpoint (@app.post)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /@app\.post\s*\(/g, in: ['py'] },
    },
    {
      id: 'fastapi-path-param',
      subject: 'fastapi',
      group: 'App & endpoints',
      label: 'Path-parameter in de URL',
      level: 'gevorderd',
      detect: {
        type: 'regex',
        pattern: /@app\.(get|post)\s*\(\s*["'][^"']*\{[^}]*\}/g,
        in: ['py'],
      },
    },
    {
      id: 'fastapi-html-response',
      subject: 'fastapi',
      group: 'HTML tonen',
      label: 'HTML-response (HTMLResponse)',
      level: 'basis',
      detect: { type: 'regex', pattern: /HTMLResponse/g, in: ['py'] },
    },
    {
      id: 'fastapi-static',
      subject: 'fastapi',
      group: 'HTML tonen',
      label: 'Static files (StaticFiles/mount)',
      level: 'basis',
      detect: { type: 'regex', pattern: /StaticFiles\s*\(|\.mount\s*\(/g, in: ['py'] },
    },
    {
      id: 'fastapi-fileresponse',
      subject: 'fastapi',
      group: 'HTML tonen',
      label: 'HTML-bestand serveren (FileResponse)',
      level: 'basis',
      detect: { type: 'regex', pattern: /FileResponse\s*\(/g, in: ['py'] },
    },
    {
      id: 'fastapi-form',
      subject: 'fastapi',
      group: 'Formulieren & templates',
      label: 'Formulier verwerken (Form)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /Form\s*\(/g, in: ['py'] },
    },
    {
      id: 'fastapi-templates',
      subject: 'fastapi',
      group: 'Formulieren & templates',
      label: 'Jinja2 templates',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /Jinja2Templates|TemplateResponse/g, in: ['py'] },
    },
    {
      id: 'fastapi-request',
      subject: 'fastapi',
      group: 'Formulieren & templates',
      label: 'Request-object',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bRequest\b/g, in: ['py'] },
    },

    {
      id: 'fastapi-redirect',
      subject: 'fastapi',
      group: 'Doorsturen & fouten',
      label: 'Doorsturen na POST (RedirectResponse)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /RedirectResponse/g, in: ['py'] },
    },
    {
      id: 'fastapi-httpexception',
      subject: 'fastapi',
      group: 'Doorsturen & fouten',
      label: '404 sturen (HTTPException)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /HTTPException/g, in: ['py'] },
    },

    // --- HTML ---
    {
      id: 'html-basis',
      subject: 'html',
      group: 'HTML-pagina',
      label: 'Basis HTML-pagina (<html>)',
      level: 'basis',
      detect: { type: 'regex', pattern: /<html/gi, in: ['html'] },
    },
    {
      id: 'html-css-link',
      subject: 'html',
      group: 'HTML-pagina',
      label: 'CSS koppelen (<link>)',
      level: 'basis',
      detect: { type: 'regex', pattern: /<link\b[^>]*stylesheet/gi, in: ['html'] },
    },
    {
      id: 'html-img',
      subject: 'html',
      group: 'HTML-pagina',
      label: 'Afbeelding (<img>)',
      level: 'basis',
      detect: { type: 'regex', pattern: /<img\b/gi, in: ['html'] },
    },
    {
      id: 'html-link',
      subject: 'html',
      group: 'HTML-pagina',
      label: 'Link (<a href>)',
      level: 'basis',
      detect: { type: 'regex', pattern: /<a\b[^>]*href/gi, in: ['html'] },
    },
    {
      id: 'html-form',
      subject: 'html',
      group: 'Formulieren',
      label: 'Formulier (method="post")',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /<form\b[^>]*method\s*=\s*["']?\s*post/gi, in: ['html'] },
    },
    {
      id: 'html-jinja-var',
      subject: 'html',
      group: 'Formulieren',
      label: 'Template-variabele ({{ … }})',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\{\{[^}]+\}\}/g, in: ['html'] },
    },
    {
      id: 'html-jinja-loop',
      subject: 'html',
      group: 'Lijsten',
      label: 'Lijst herhalen (for-lus in template)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\{%\s*for\b/g, in: ['html'] },
    },
    {
      id: 'html-jinja-if',
      subject: 'html',
      group: 'Lijsten',
      label: 'Leeg geval opvangen (if in template)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\{%\s*if\b/g, in: ['html'] },
    },

    // --- Database (sqlitedict) ---
    {
      id: 'db-sqlitedict',
      subject: 'database',
      group: 'sqlitedict',
      label: 'SqliteDict gebruiken',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /SqliteDict\s*\(/g, in: ['py'] },
    },
    {
      id: 'db-write',
      subject: 'database',
      group: 'sqlitedict',
      label: 'Data opslaan (db[…] = …)',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bdb\s*\[[^\]]+\]\s*=/g, in: ['py'] },
    },
    {
      id: 'db-commit',
      subject: 'database',
      group: 'sqlitedict',
      label: 'Opslaan bevestigen (.commit())',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\.commit\s*\(\s*\)/g, in: ['py'] },
    },
    {
      id: 'db-get',
      subject: 'database',
      group: 'sqlitedict',
      label: 'Veilig uitlezen (db.get())',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bdb\.get\s*\(/g, in: ['py'] },
    },
    {
      id: 'db-del',
      subject: 'database',
      group: 'sqlitedict',
      label: 'Data verwijderen (del db[…])',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\bdel\s+db\s*\[/g, in: ['py'] },
    },
    {
      id: 'db-items',
      subject: 'database',
      group: 'sqlitedict',
      label: 'Alles bekijken (.items())',
      level: 'gevorderd',
      detect: { type: 'regex', pattern: /\.items\s*\(\s*\)/g, in: ['py'] },
    },

    // --- Structuur (mappenstructuur) ---
    {
      id: 'struct-main',
      subject: 'structuur',
      group: 'Mappen',
      label: 'main.py aanwezig',
      level: 'basis',
      detect: { type: 'path', pattern: /(^|\/)main\.py$/ },
    },
    {
      id: 'struct-static',
      subject: 'structuur',
      group: 'Mappen',
      label: 'static/-map',
      level: 'basis',
      detect: { type: 'path', pattern: /(^|\/)static\// },
    },
    {
      id: 'struct-templates',
      subject: 'structuur',
      group: 'Mappen',
      label: 'templates/-map',
      level: 'gevorderd',
      detect: { type: 'path', pattern: /(^|\/)templates\// },
    },
  ],
};
