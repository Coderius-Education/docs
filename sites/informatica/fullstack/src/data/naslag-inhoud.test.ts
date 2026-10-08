import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De naslag (cheatsheet, Er gaat iets mis, Projectstructuur) wordt los van de
// lessen samengevat, en liep daardoor uit de pas met wat de lessen doen en wat
// de packages echt geven. Bij een leerling-doorloop, met alles nagedraaid in een
// venv (fastapi 0.142, starlette 1.7, fastapi-cli 0.0.32, sqlitedict 2.1,
// htmx 2.0.10), bleek:
//
// - de naslag zei dat data zonder commit() pas weg is "als de server stopt",
//   terwijl hij weg is zodra het with-blok sluit, dus al bij het volgende verzoek;
// - het htmx-formulier in de cheatsheet richtte op #berichten-lijst, een element
//   dat niet op de formulierpagina staat: htmx stuurt dan geen verzoek;
// - `ip addr` heette het commando voor macOS, waar het niet bestaat;
// - de cheatsheet zei dat samesite de cookie nooit meestuurt vanaf een andere
//   site, terwijl lax hem bij een link wél meestuurt;
// - de mappenboom in de cheatsheet was geen stand die ooit bestaat;
// - de "Zie …"-links in Veiligheid landden op de zwakheid en niet op de les die
//   de syntax leert;
// - op Er gaat iets mis had een symptoom één oorzaak, terwijl deze cursus er
//   twee oplevert, en drie fouten die je bij het starten maakt ontbraken.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = `${SITE}/docs`;
const lees = (pad: string) => readFileSync(pad, 'utf8');
const CHEATSHEET = lees(`${DOCS}/cheatsheet.md`);
const FOUTEN = lees(`${DOCS}/troubleshooting.md`);
const STRUCTUUR = lees(`${DOCS}/FastAPI/projectstructuur.mdx`);

type Item = { summary: string; tekst: string; kop: string };

/** De <details>-items van een pagina, met de H2 waar ze onder staan. */
function items(tekst: string): Item[] {
  const uit: Item[] = [];
  let kop = '';
  for (const deel of tekst.split(/^(?=## )/m)) {
    const h2 = deel.match(/^## (.+)$/m);
    if (h2) kop = h2[1].trim();
    for (const m of deel.matchAll(/<details>\s*<summary>(.+?)<\/summary>([\s\S]*?)<\/details>/g)) {
      uit.push({ summary: m[1], tekst: m[2], kop });
    }
  }
  return uit;
}

const codeblokken = (tekst: string, taal = '[^\\n]*') =>
  [...tekst.matchAll(new RegExp(`\`\`\`${taal}\\n([\\s\\S]*?)\`\`\``, 'g'))].map((m) => m[1]);

const cheatItems = items(CHEATSHEET);
const foutItems = items(FOUTEN);
const foutItem = (begin: string) => {
  const item = foutItems.find((i) => i.summary.startsWith(begin));
  if (!item) throw new Error(`geen item dat begint met "${begin}"`);
  return item;
};

describe('db.commit() in de naslag', () => {
  it('zegt nergens dat de wijziging pas bij het stoppen weg is', () => {
    // Nagedraaid: zonder commit() geeft een tweede `with SqliteDict` in
    // hetzelfde programma al een lege database.
    const verboden = ['als de server stopt', 'als het programma stopt', 'in het geheugen hangen'];
    const fout = verboden.filter((zin) => CHEATSHEET.includes(zin) || FOUTEN.includes(zin));
    expect(fout).toEqual([]);
  });

  it('"Lijst blijft leeg" noemt commit() als oorzaak', () => {
    expect(foutItem('Lijst blijft leeg').tekst).toContain('db.commit()');
  });
});

describe('cheatsheet volgt de lessen', () => {
  // Elk element met hx-get, hx-post of hx-delete én een hx-target staat met
  // hetzelfde pad en hetzelfde doel in een les. Een doel dat geen les gebruikt,
  // staat waarschijnlijk niet op de pagina waar de leerling het neerzet.
  it('elk htmx-doel in de cheatsheet komt met hetzelfde pad in een les voor', () => {
    const lessen = [
      'zonder-herladen/htmx',
      'zonder-herladen/htmx-overzicht',
      'in-de-browser/javascript',
      'in-de-browser/server-of-browser',
      'onthouden/sessies',
      'onthouden/cookie-of-sessie',
    ]
      .map((f) => lees(`${DOCS}/FastAPI/${f}.mdx`))
      .join('\n');
    const paren = (tekst: string) =>
      [
        ...tekst.matchAll(
          /<\w+[^>]*?\bhx-(?:get|post|delete)="([^"]+)"[^>]*?\bhx-target="([^"]+)"/g,
        ),
      ].map((m) => `${m[1]} → ${m[2]}`);
    const inLessen = new Set(paren(lessen));
    expect(paren(CHEATSHEET).filter((p) => !inLessen.has(p))).toEqual([]);
  });

  it('het adres zoeken gaat met dezelfde commando’s als in Laat het aan anderen zien', () => {
    const les = lees(`${DOCS}/FastAPI/afronden/laat-het-zien.mdx`);
    const blok = codeblokken(les, 'bash').find((c) => c.includes('ipconfig'));
    expect(blok, 'codeblok met ipconfig in laat-het-zien').toBeDefined();
    const commandos = (blok as string)
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r && !r.startsWith('#'));
    const host = cheatItems.find((i) => i.summary.includes('--host'));
    const klasgenoot = foutItem('Mijn klasgenoot');
    const ontbreekt = commandos.flatMap((c) => [
      ...(host?.tekst.includes(c) ? [] : [`cheatsheet: ${c}`]),
      ...(klasgenoot.tekst.includes(c) ? [] : [`Er gaat iets mis: ${c}`]),
    ]);
    expect(ontbreekt).toEqual([]);
  });

  it('wie samesite uitlegt, linkt naar de les over samesite', () => {
    const fout = cheatItems
      .filter(
        (i) =>
          i.tekst.includes('samesite') && !i.tekst.includes('/docs/veiligheid/cookies/samesite'),
      )
      .map((i) => i.summary);
    expect(fout).toEqual([]);
  });

  // Het kenmerk uit de summary (tussen haakjes) en wat er in de code van de
  // doelles moet staan. Een link naar de eerste les van de reeks landt op de
  // zwakheid, waar de syntax nog niet staat.
  const KENMERK: Record<string, string> = {
    'docs_url=None': 'docs_url=None',
    'Form met max_length': 'max_length=',
    'lijst met wat mag': 'if naam not in PAGINAS:',
    escape: 'escape(',
    '403': 'status_code=403',
    httponly: 'httponly=True',
    Argon2: 'ph.hash(',
    slowapi: '@limiter.limit',
    textContent: 'textContent = veld.value',
  };

  it('elk Veiligheid-item linkt naar een les waarvan de code de syntax bevat', () => {
    const veiligheid = cheatItems.filter((i) => i.kop === 'Veiligheid');
    expect(veiligheid.length).toBe(Object.keys(KENMERK).length);
    const fout = veiligheid.flatMap((item) => {
      const kenmerk = item.summary.match(/\(([^)]+)\)$/)?.[1] ?? '';
      const nodig = KENMERK[kenmerk];
      if (!nodig) return [`${item.summary}: geen kenmerk in de test`];
      const doelen = [...item.tekst.matchAll(/\]\((\/docs\/veiligheid\/[\w/-]+)\)/g)].map(
        (m) => m[1],
      );
      const raak = doelen.some((d) =>
        ['python', 'js'].some((taal) =>
          codeblokken(lees(`${SITE}${d}.mdx`), taal).some((c) => c.includes(nodig)),
        ),
      );
      return raak ? [] : [`${item.summary}: geen link naar een les met ${nodig}`];
    });
    expect(fout).toEqual([]);
  });

  it('een compleet bestand met app = FastAPI() zegt in welke map het hoort', () => {
    // Geplakt in het gastenboek maakt een tweede app = FastAPI() de endpoints
    // erboven onbereikbaar (zie Er gaat iets mis).
    const fout = cheatItems
      .filter((i) => !i.summary.startsWith('Hoe maak ik een FastAPI-app?'))
      .filter((i) => codeblokken(i.tekst).some((c) => c.includes('app = FastAPI()')))
      .filter((i) => !/map `veiligheid-\w+`/.test(i.tekst))
      .map((i) => i.summary);
    expect(fout).toEqual([]);
  });

  // Uit de hoofdtekst van de htmx- en devtools-lessen.
  it.each([
    'hx-on::after-request',
    'keyup changed delay:300ms',
    'hx-swap="beforeend"',
    'console.log',
    'datetime.now()',
  ])('bevat %s', (bouwsteen) => {
    expect(CHEATSHEET).toContain(bouwsteen);
  });
});

/** Volledige paden uit een mappenboom met ├── en └──. */
function paden(boom: string): string[] {
  const stapel: string[] = [];
  const uit: string[] = [];
  for (const regel of boom.split('\n')) {
    const m = regel.match(/^([│ ]*)[├└]── ([^\s←]+)/);
    if (!m) continue;
    const diepte = m[1].length / 4;
    stapel.length = diepte;
    stapel.push(m[2].replace(/\/$/, ''));
    uit.push(stapel.join('/'));
  }
  return uit;
}

describe('mappenstructuur', () => {
  const bomen = codeblokken(STRUCTUUR).filter((c) => c.startsWith('je-project/'));
  const laatste = new Set(paden(bomen.at(-1) ?? ''));

  it('leest de bomen uit', () => {
    expect(bomen.length).toBeGreaterThan(5);
    expect(laatste.has('templates/gastenboek.html')).toBe(true);
  });

  it('de boom in de cheatsheet is een deel van de laatste stand in Projectstructuur', () => {
    const item = cheatItems.find((i) => i.summary.includes('(projectstructuur)'));
    const boom = codeblokken(item?.tekst ?? '').find((c) => c.startsWith('je-project/')) ?? '';
    expect(paden(boom).filter((p) => !laatste.has(p))).toEqual([]);
  });

  it('opdrachtbestanden staan niet in de standen, zoals de pagina belooft', () => {
    const fout = bomen.flatMap(paden).filter((p) => /contact\.html|about\.css/.test(p));
    expect(fout).toEqual([]);
  });
});

describe('Er gaat iets mis', () => {
  it('een ERR_-code in de summary staat letterlijk in een codeblok', () => {
    const fout = foutItems.flatMap(({ summary, tekst }) => {
      const code = codeblokken(tekst).join('\n');
      return (summary.match(/\bERR_[A-Z_]+\b/g) ?? []).filter((k) => !code.includes(k));
    });
    expect(fout).toEqual([]);
  });

  it('een item kent alleen de velden Oorzaak en Oplossing (schrijfgids §8)', () => {
    const labels = [...FOUTEN.matchAll(/^\*\*([^*]+):\*\*/gm)].map((m) => m[1]);
    expect(labels.filter((l) => l !== 'Oorzaak' && l !== 'Oplossing')).toEqual([]);
  });

  // Een symptoom met twee oorzaken in deze cursus. Elke oorzaak is nagedraaid
  // en geeft precies het symptoom uit de summary.
  it.each([
    [
      'Elk bericht is een lege regel',
      'list(db.values())',
      'values() met een lus over sleutel, bericht',
    ],
    [
      'Er gebeurt niets na een klik',
      'htmx:targetError',
      'een hx-target dat niet op de pagina staat',
    ],
    [
      "NameError: name '...'",
      "NameError: name 'request' is not defined",
      'een parameter in plaats van een import',
    ],
    ['422 Unprocessable', '`"query"` met `"request"`', 'request zonder : Request'],
  ])('"%s" noemt ook %s (%s)', (summary, nodig) => {
    expect(foutItem(summary).tekst).toContain(nodig);
  });

  it('het sessie-item beschrijft wat je ziet, niet wat de server doet', () => {
    // Sinds de accounts (issue #126) maakt alleen /inloggen een sessie, dus de
    // oude fout (een nieuw sessie-id bij elk bericht, en daardoor alleen bij je
    // laatste bericht een verwijderknop) bestaat niet meer. De fout die je nu
    // ziet: na het inloggen weer het inlogformulier. Nagedraaid in Chromium,
    // allebei met precies dat symptoom: zonder sessies.commit() staat er wel
    // een cookie, met set_cookie op een ander antwoord geen.
    expect(foutItems.map((i) => i.summary)).not.toContain('Mijn sessie wordt elke keer vergeten');
    const item = foutItem('Na het inloggen zie je weer het inlogformulier').tekst;
    expect(item).toContain('sessies.commit()');
    expect(item).toContain('set_cookie');
  });

  // Fouten bij het starten die in de cursus vaak voorkomen, letterlijk zoals
  // fastapi dev ze geeft.
  it.each([
    ['Path does not exist main.py', 'Path does not exist main.py'],
    ['De server start niet: Directory', "RuntimeError: Directory 'static' does not exist"],
    ['Je drukt op de afspeelknop', 'fastapi dev main.py'],
  ])('heeft een item "%s" met %s', (summary, nodig) => {
    expect(foutItem(summary).tekst).toContain(nodig);
  });
});
