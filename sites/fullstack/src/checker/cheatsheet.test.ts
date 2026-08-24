import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fullstackConfig } from './config';

// De nakijker hoort te toetsen wat de cheatsheet belooft. Dat verband stond tot
// nu toe alleen in een comment bovenaan config.ts, en een comment houdt niemand
// tegen: een nieuw cheatsheet-item zonder concept blijft ongemerkt, en een
// hernoemd concept ook.
//
// De labels lopen niet één op één ("POST endpoint (Form data)" dekt twee
// concepten, "Server starten" geen enkel), dus een automatische vergelijking
// kan niet. Wat wel kan is deze koppeltabel expliciet maken en aan beide kanten
// dichttimmeren. Verandert er iets aan de cheatsheet of aan config.ts, dan moet
// je hier langs — en dat is precies de bedoeling.

const CHEATSHEET = fileURLToPath(new URL('../../docs/cheatsheet.md', import.meta.url));

/** De H2-koppen van de cheatsheet, vertaald naar het subject in de nakijker. */
const SUBJECT_PER_KOP: Record<string, string> = {
  FastAPI: 'fastapi',
  HTML: 'html',
  JavaScript: 'js',
  'Database (sqlitedict)': 'database',
  Mappenstructuur: 'structuur',
};

type Item = {
  /** De tekst in <summary>, letterlijk zoals in de cheatsheet. */
  summary: string;
  /** Concepten die dit item introduceert. Leeg mag, mits met reden. */
  concepten: string[];
  /** Waarom er geen concept bij hoort. Alleen invullen als concepten leeg is. */
  geenConcept?: string;
};

// In dezelfde volgorde als de cheatsheet. Die volgorde meetesten klinkt streng,
// maar hij is didactisch: de items lopen mee met de lesvolgorde.
const KOPPELING: Item[] = [
  // --- FastAPI ---
  { summary: 'FastAPI app aanmaken', concepten: ['fastapi-app'] },
  {
    summary: 'Server starten',
    concepten: [],
    geenConcept: 'een terminalcommando, dat staat niet in de ingeleverde code',
  },
  {
    summary: 'Je server openzetten voor het netwerk',
    concepten: [],
    geenConcept: 'een terminalcommando met een vlag, niet terug te zien in een bestand',
  },
  { summary: 'GET endpoint (JSON)', concepten: ['fastapi-get'] },
  { summary: 'GET endpoint (HTML)', concepten: ['fastapi-html-response'] },
  { summary: 'Static files instellen', concepten: ['fastapi-static'] },
  { summary: 'HTML bestand serveren (FileResponse)', concepten: ['fastapi-fileresponse'] },
  { summary: 'POST endpoint (Form data)', concepten: ['fastapi-post', 'fastapi-form'] },
  { summary: 'Jinja2 template response', concepten: ['fastapi-templates', 'fastapi-request'] },
  { summary: 'Redirect na een POST', concepten: ['fastapi-redirect'] },
  { summary: 'Path-parameter in de URL', concepten: ['fastapi-path-param'] },
  { summary: '404 sturen als iets niet bestaat', concepten: ['fastapi-httpexception'] },
  { summary: 'Een cookie meegeven', concepten: ['fastapi-cookie'] },
  // Zetten en uitlezen zijn twee cheatsheet-items maar één concept: de regex
  // vangt set_cookie én Cookie(, en een project dat maar de helft doet werkt
  // sowieso niet.
  { summary: 'Een cookie uitlezen', concepten: ['fastapi-cookie'] },
  { summary: 'Een sessie: gegevens op de server', concepten: ['fastapi-sessie'] },

  // --- HTML ---
  { summary: 'Basis HTML pagina', concepten: ['html-basis'] },
  { summary: 'CSS koppelen', concepten: ['html-css-link'] },
  { summary: 'Afbeelding tonen', concepten: ['html-img'] },
  { summary: 'Link naar andere pagina', concepten: ['html-link'] },
  { summary: 'Formulier (POST)', concepten: ['html-form'] },
  { summary: 'Template variabele (Jinja2)', concepten: ['html-jinja-var'] },
  { summary: 'Lijst herhalen in een template (for-lus)', concepten: ['html-jinja-loop'] },
  { summary: 'Lege lijst opvangen (if en else)', concepten: ['html-jinja-if'] },

  // --- JavaScript ---
  { summary: 'JavaScript koppelen aan je pagina', concepten: ['js-bestand-koppelen'] },
  {
    summary: 'Reageren op typen of klikken',
    concepten: [],
    geenConcept:
      'querySelector en addEventListener horen bij de web-cursus en worden daar nagekeken',
  },

  // --- Database (sqlitedict) ---
  {
    summary: 'Installatie',
    concepten: [],
    geenConcept: 'een pip-commando, geen code in het project',
  },
  { summary: 'Data opslaan', concepten: ['db-sqlitedict', 'db-write', 'db-commit'] },
  {
    summary: 'Data uitlezen',
    concepten: [],
    geenConcept: 'db["naam"] is gewoon indexeren; alleen db.get() wordt apart nagekeken',
  },
  { summary: 'Data veilig uitlezen (met default)', concepten: ['db-get'] },
  { summary: 'Data verwijderen', concepten: ['db-del'] },
  { summary: 'Alles bekijken', concepten: ['db-items'] },

  // --- Mappenstructuur ---
  { summary: 'Compleet project', concepten: ['struct-main', 'struct-static', 'struct-templates'] },
];

/** Leest de cheatsheet als een lijst van (H2-kop, summary-tekst). */
function leesCheatsheet(): { kop: string; summary: string }[] {
  const regels = readFileSync(CHEATSHEET, 'utf8').split('\n');
  const items: { kop: string; summary: string }[] = [];
  let kop = '';

  for (const regel of regels) {
    const h2 = regel.match(/^## (.+)$/);
    if (h2) {
      kop = h2[1].trim();
      continue;
    }
    const summary = regel.match(/^<summary>(.+)<\/summary>$/);
    if (summary) items.push({ kop, summary: summary[1].trim() });
  }

  return items;
}

describe('cheatsheet en nakijker lopen gelijk op', () => {
  const cheatsheet = leesCheatsheet();

  it('leest de cheatsheet überhaupt uit', () => {
    // Zonder deze test zou een kapotte parser alle andere tests groen laten:
    // een lege lijst matcht nergens mee.
    expect(cheatsheet.length).toBeGreaterThan(20);
    expect(new Set(cheatsheet.map((i) => i.kop))).toEqual(new Set(Object.keys(SUBJECT_PER_KOP)));
  });

  it('de koppeltabel dekt precies de items uit de cheatsheet, in dezelfde volgorde', () => {
    // Een nieuw item in de cheatsheet, een hernoemde summary of een verwijderd
    // item komt hier binnen. Vul de koppeltabel aan met het bijbehorende
    // concept, of met een reden waarom er geen concept bij hoort.
    expect(KOPPELING.map((i) => i.summary)).toEqual(cheatsheet.map((i) => i.summary));
  });

  it('elk gekoppeld concept bestaat in de nakijker', () => {
    const bestaande = new Set(fullstackConfig.concepts.map((c) => c.id));
    const onbekend = KOPPELING.flatMap((i) => i.concepten).filter((id) => !bestaande.has(id));

    expect(onbekend).toEqual([]);
  });

  it('elk concept in de nakijker staat ook in de cheatsheet', () => {
    // De andere richting: een concept toevoegen zonder de leerling ergens te
    // vertellen hoe het werkt, is een concept waar hij nooit op kan scoren.
    const gekoppeld = new Set(KOPPELING.flatMap((i) => i.concepten));
    const ongedekt = fullstackConfig.concepts.map((c) => c.id).filter((id) => !gekoppeld.has(id));

    expect(ongedekt).toEqual([]);
  });

  it('een item zonder concept heeft een reden', () => {
    const zonderReden = KOPPELING.filter((i) => i.concepten.length === 0 && !i.geenConcept).map(
      (i) => i.summary,
    );

    expect(zonderReden).toEqual([]);
  });

  it('een item met een concept heeft juist géén reden', () => {
    // Anders blijft er een verouderde uitleg staan nadat het concept er alsnog
    // is bijgekomen.
    const dubbelop = KOPPELING.filter((i) => i.concepten.length > 0 && i.geenConcept).map(
      (i) => i.summary,
    );

    expect(dubbelop).toEqual([]);
  });

  it('een concept staat onder dezelfde kop als in de cheatsheet', () => {
    // Vangt een concept dat onder het verkeerde subject is gezet: dan komt het
    // in de verkeerde kolom van het rapport te staan.
    const subjectPerId = new Map(fullstackConfig.concepts.map((c) => [c.id, c.subject]));
    const scheef: string[] = [];

    for (const [i, item] of KOPPELING.entries()) {
      const verwacht = SUBJECT_PER_KOP[cheatsheet[i].kop];
      for (const id of item.concepten) {
        const gevonden = subjectPerId.get(id);
        if (gevonden !== verwacht) {
          scheef.push(`${id}: subject '${gevonden}' maar cheatsheet-kop '${cheatsheet[i].kop}'`);
        }
      }
    }

    expect(scheef).toEqual([]);
  });
});
