import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bevindingen uit een leerling-doorloop van de reeksen HTML van een bezoeker
// (xss) en Wie mag wat (toegang), elk vastgepind:
//
// - De scripts in Wie mag wat maakten de namenlijst met een list
//   comprehension. De Python-cursus behandelt die niet, dus een leerling las
//   een regel die hij niet kon volgen. Een for-lus met append doet hetzelfde.
// - De Content-Security-Policy in XSS: in de praktijk zette `script-src 'self'`
//   de tip `hx-on::after-request="this.reset()"` uit het htmx-overzicht stil
//   uit (velden bleven gevuld, alleen een EvalError in de Console). De uitleg
//   moet hx-on noemen.
// - In je eigen project noemde GET /sessies uit Sessies opdracht 3 niet,
//   terwijl dat endpoint elk sessie-id weggeeft en daarmee elke 403 omzeilt.
// - De praktijk zei "In Detailpagina vraag je berichten op met een nummer";
//   dat deed alleen wie opdracht 5 maakte.

const VEILIGHEID = fileURLToPath(new URL('../../docs/veiligheid', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

// Met de witruimte samengevouwen, zodat een zin over twee regels ook telt.
const lees = (pad: string) => readFileSync(join(VEILIGHEID, pad), 'utf8').replace(/\s+/g, ' ');

// Een list comprehension die wel mag, met de reden erbij. Sleutel: het pad
// onder docs/veiligheid plus de regel zelf, zonder inspringing.
const TOEGESTAAN: Record<string, string> = {};

// Een `[` en daarna op dezelfde regel `for … in`. Niet `[^\]]`, want
// `[bericht["naam"] for …` heeft zelf een `]` vóór de `for`.
const COMPREHENSION = /\[[^\n]*\sfor\s+[\w, ]+\s+in\s/;

describe('Python-blokken in de veiligheidsroute', () => {
  const regels = bestanden(VEILIGHEID).flatMap((pad) =>
    [...readFileSync(pad, 'utf8').matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].flatMap((m) =>
      m[1].split('\n').map((regel) => ({ bestand: relative(VEILIGHEID, pad), regel })),
    ),
  );

  it('vindt de blokken', () => {
    expect(regels.length).toBeGreaterThan(500);
  });

  it('gebruiken geen list comprehension (de Python-cursus behandelt die niet)', () => {
    const fout = regels
      .filter(({ regel }) => COMPREHENSION.test(regel))
      .map(({ bestand, regel }) => `${bestand}: ${regel.trim()}`)
      .filter((sleutel) => !(sleutel in TOEGESTAAN));
    expect(fout).toEqual([]);
  });

  it('elke uitzondering bestaat nog', () => {
    const gevonden = new Set(regels.map(({ bestand, regel }) => `${bestand}: ${regel.trim()}`));
    for (const sleutel of Object.keys(TOEGESTAAN))
      expect(gevonden.has(sleutel), sleutel).toBe(true);
  });
});

describe('XSS in de praktijk: Content-Security-Policy', () => {
  it('zegt dat hx-on-attributen dan niet meer werken, en wat je dan doet', () => {
    const tekst = lees('xss/praktijk.mdx');
    const blok = tekst.slice(tekst.indexOf('Content-Security-Policy</summary>'));
    const csp = blok.slice(0, blok.indexOf('</details>'));
    expect(csp).toContain('hx-on');
    expect(csp).toMatch(/\.js/);
  });
});

describe('Wie mag wat', () => {
  it('in je eigen project noemt GET /sessies uit Sessies', () => {
    expect(lees('toegang/eigen-project.mdx')).toContain('`GET /sessies`');
  });

  it('de praktijk doet niet alsof elke leerling berichten per nummer opvraagt', () => {
    expect(lees('toegang/praktijk.mdx')).not.toContain('met een nummer');
  });
});

// Issue #126: het gastenboek kreeg accounts in de basis, en Sessies logt je
// één keer in. Wie mag wat ging nog uit van een sessie die begon bij je eerste
// bericht, met een lijst sleutels erin, en een naam die de bezoeker in het
// formulier typte. Cookies afschermen bouwt op die server voort, en
// Wachtwoorden introduceerde /registreer en /inloggen alsof ze nieuw waren.
// Nu sluiten de drie reeksen aan op de accounts: de naam bij een bericht komt
// uit de sessie, en de eigenaar is wie onder die naam inlogde.
describe('Veiligheid sluit aan op de accounts uit de basis', () => {
  const python = (pad: string) =>
    [
      ...readFileSync(join(VEILIGHEID, pad), 'utf8').matchAll(/```python[^\n]*\n([\s\S]*?)```/g),
    ].map((m) => m[1]);
  const reeks = (map: string) =>
    bestanden(join(VEILIGHEID, map)).map((pad) => relative(VEILIGHEID, pad));

  it('de server van Wie mag wat heeft registreren en inloggen, en de naam komt uit de sessie', () => {
    const start = python('toegang/zwakheid.mdx').find((b) => b.includes('app = FastAPI()')) ?? '';
    expect(start).toContain('@app.post("/registreer")');
    expect(start).toContain('@app.post("/inloggen")');
    const plaatsen = start.slice(start.indexOf('@app.post("/bericht")'));
    expect(plaatsen).not.toContain('naam: str = Form(');
    expect(plaatsen).toContain('{"naam": mijn["naam"]');
  });

  it('een sessie heeft geen lijst met berichten meer, in de cursus en de cheatsheet', () => {
    // Wat je server laat zien houdt bewust zijn eigen kleine gastenboek, zonder
    // accounts, met een sessie die begint bij het eerste bericht; de les zegt
    // dat erbij. Alle andere plekken gaan uit van de sessie uit Sessies.
    const DOCS = join(VEILIGHEID, '..');
    const fout = bestanden(DOCS)
      .filter((pad) => !relative(DOCS, pad).startsWith('veiligheid/zichtbaar/'))
      .filter((pad) => /mijn\["berichten"\]|mijn\.get\("berichten"/.test(readFileSync(pad, 'utf8')))
      .map((pad) => relative(DOCS, pad));
    expect(fout).toEqual([]);
  });

  it('elk script in Wie mag wat en Cookies dat een bericht plaatst, logt eerst in', () => {
    const fout = [...reeks('toegang'), ...reeks('cookies')].flatMap((pad) =>
      python(pad)
        .filter((b) => b.startsWith('import httpx') && b.includes('.post("/bericht"'))
        .filter(
          (b) =>
            b.indexOf('/inloggen') === -1 || b.indexOf('/inloggen') > b.indexOf('.post("/bericht"'),
        )
        .map(() => pad),
    );
    expect(fout).toEqual([]);
  });

  it('de controle met 403 vergelijkt de naam bij het bericht met de naam in de sessie', () => {
    const code = python('toegang/controle.mdx')[0];
    expect(code).toContain('bericht["naam"] != mijn.get("naam")');
    expect(code).toContain('status_code=403');
  });

  it('Controleer op wat de server weet: fout met een naam van de bezoeker, goed met de sessie', () => {
    const code = python('toegang/server-weet.mdx').join('\n');
    expect(code).toContain('async def bericht_verwijderen(sleutel: str, naam: str = ""):');
    expect(code).toMatch(/# FOUT\n[^\n]*!= naam:[\s\S]*# GOED\n[^\n]*!= mijn\.get\("naam"\):/);
  });

  it('in Cookies afschermen zet alleen /inloggen de sessie-cookie', () => {
    const fout = reeks('cookies').flatMap((pad) =>
      python(pad)
        .flatMap((b) => b.split(/\n(?=@app\.)/))
        .filter((stuk) => stuk.includes('key="sessie_id"') && stuk.includes('set_cookie'))
        .filter((stuk) => stuk.startsWith('@app.') && !stuk.startsWith('@app.post("/inloggen")'))
        .map((stuk) => `${pad}: ${stuk.split('\n')[0]}`),
    );
    expect(fout).toEqual([]);
  });

  it('Wachtwoorden begint bij de accounts uit de basis', () => {
    const tekst = lees('wachtwoorden/gewone-tekst.mdx');
    const intro = tekst.slice(0, tekst.indexOf('<CodeUitleg>'));
    expect(intro).toContain('](/docs/FastAPI/registreren)');
    expect(intro).toContain('](/docs/FastAPI/inloggen)');
  });

  it('In je eigen project zet Argon2 op het inloggen van het gastenboek, en zegt wat een oud wachtwoord doet', () => {
    const tekst = lees('wachtwoorden/pogingen.mdx');
    const opdracht = tekst.slice(tekst.indexOf('### Opdracht 3: Make - In je eigen project'));
    expect(opdracht).toContain('](/docs/FastAPI/registreren)');
    expect(opdracht).toContain('gebruikers.get(naam, NEP)');
    expect(opdracht).toContain('InvalidHashError');
  });

  it('de statuscodes op de startpagina noemen 401', () => {
    expect(lees('index.mdx')).toMatch(/\| `401` \|/);
  });
});
