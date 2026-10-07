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
  htmx: 'htmx',
  'Database (sqlitedict)': 'database',
  Browser: 'browser',
  Mappenstructuur: 'structuur',
  Veiligheid: 'veiligheid',
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
// maar hij is didactisch: de items lopen mee met de lesvolgorde van de sidebar,
// en de koppen staan in de volgorde waarin hun onderwerp voor het eerst
// terugkomt (FastAPI, Browser bij Kijken wat de browser doet, HTML, ...).
// Een summary is een vraag met de functienaam erachter (schrijfgids §7).
const KOPPELING: Item[] = [
  // --- FastAPI ---
  { summary: 'Hoe maak ik een FastAPI-app? (FastAPI)', concepten: ['fastapi-app'] },
  {
    summary: 'Hoe start ik mijn server? (fastapi dev)',
    concepten: [],
    geenConcept: 'een terminalcommando, dat staat niet in de ingeleverde code',
  },
  { summary: 'Hoe geef ik JSON terug? (@app.get)', concepten: ['fastapi-get'] },
  {
    summary: 'Hoe geef ik een HTML-pagina terug? (HTMLResponse)',
    concepten: ['fastapi-html-response'],
  },
  { summary: 'Hoe stuur ik een HTML-bestand? (FileResponse)', concepten: ['fastapi-fileresponse'] },
  {
    summary: 'Hoe maak ik CSS en afbeeldingen bereikbaar? (app.mount)',
    concepten: ['fastapi-static'],
  },
  {
    summary: 'Hoe vul ik een template in? (TemplateResponse)',
    concepten: ['fastapi-templates', 'fastapi-request'],
  },
  {
    summary: 'Hoe lees ik iets na het vraagteken in de URL? (query-parameter)',
    concepten: [],
    geenConcept:
      'een gewone parameter zonder Form of accolades; aan de code is niet te zien dat hij uit de URL komt',
  },
  {
    summary: 'Hoe ontvang ik een formulier? (@app.post en Form)',
    concepten: ['fastapi-post', 'fastapi-form'],
  },
  {
    summary: 'Hoe stuur ik door na een POST? (RedirectResponse)',
    concepten: ['fastapi-redirect'],
  },
  {
    summary: 'Hoe haal ik een waarde uit het pad? (path-parameter)',
    concepten: ['fastapi-path-param'],
  },
  {
    summary: 'Hoe stuur ik een 404 als iets niet bestaat? (HTTPException)',
    concepten: ['fastapi-httpexception'],
  },
  // Dezelfde regex als de 404: een project met een eigen controle gebruikt
  // HTTPException ook, en scoort daarmee op hetzelfde concept.
  {
    summary: 'Hoe weiger ik invoer die niet klopt? (HTTPException met 400)',
    concepten: ['fastapi-httpexception'],
  },
  {
    summary: 'Wat betekent deze statuscode?',
    concepten: [],
    geenConcept: 'naslag bij het lezen van Netwerk en de terminal, geen code in het project',
  },
  {
    summary: 'Hoe zet ik de tijd in een antwoord? (datetime.now)',
    concepten: [],
    geenConcept:
      'een functie uit Python zelf; het endpoint eromheen wordt nagekeken via fastapi-get',
  },
  {
    summary: 'Hoe verwijder ik zonder herladen? (@app.delete)',
    concepten: ['fastapi-delete'],
  },
  { summary: 'Hoe geef ik een cookie mee? (set_cookie)', concepten: ['fastapi-cookie'] },
  // Zetten en uitlezen zijn twee cheatsheet-items maar één concept: de regex
  // vangt set_cookie én Cookie(, en een project dat maar de helft doet werkt
  // sowieso niet.
  { summary: 'Hoe lees ik een cookie uit? (Cookie)', concepten: ['fastapi-cookie'] },
  {
    summary: 'Hoe onthoud ik iets op de server? (sessie met secrets)',
    concepten: ['fastapi-sessie'],
  },
  {
    summary: 'Hoe zet ik mijn server open voor het netwerk? (--host 0.0.0.0)',
    concepten: [],
    geenConcept: 'een terminalcommando met een vlag, niet terug te zien in een bestand',
  },

  // --- Browser ---
  // Handelingen in de browser van de leerling; daar staat niets van in het
  // ingeleverde project.
  {
    summary: 'Hoe open ik de ontwikkelaarstools? (F12)',
    concepten: [],
    geenConcept: 'een handeling in de browser, niet terug te zien in een bestand',
  },
  {
    summary: 'Hoe zie ik welke verzoeken de pagina doet? (tabblad Netwerk)',
    concepten: [],
    geenConcept: 'een handeling in de browser, niet terug te zien in een bestand',
  },
  {
    summary: 'Hoe herlaad ik zonder cache? (Ctrl+Shift+R)',
    concepten: [],
    geenConcept: 'een handeling in de browser, niet terug te zien in een bestand',
  },

  // --- HTML ---
  { summary: 'Hoe ziet een HTML-pagina eruit? (DOCTYPE)', concepten: ['html-basis'] },
  { summary: 'Hoe link ik naar een andere pagina? (a href)', concepten: ['html-link'] },
  { summary: 'Hoe koppel ik CSS aan mijn pagina? (link)', concepten: ['html-css-link'] },
  { summary: 'Hoe toon ik een afbeelding? (img)', concepten: ['html-img'] },
  {
    summary: 'Hoe zet ik een waarde uit Python in een template? (dubbele accolades)',
    concepten: ['html-jinja-var'],
  },
  { summary: 'Hoe maak ik een formulier? (form method="post")', concepten: ['html-form'] },
  {
    summary: 'Hoe herhaal ik iets voor elk bericht? (for-lus in een template)',
    concepten: ['html-jinja-loop'],
  },
  {
    summary: 'Hoe vang ik een lege lijst op? (if en else in een template)',
    concepten: ['html-jinja-if'],
  },
  {
    summary: 'Hoe maak ik een verwijderknop per bericht? (verborgen veld)',
    concepten: [],
    geenConcept:
      'een gewoon input-veld; het verwijderen zelf wordt nagekeken via db-del en het formulier via html-form',
  },
  {
    summary: 'Hoe link ik naar de pagina van één bericht? (sleutel in de link)',
    concepten: [],
    geenConcept:
      'een gewone link met {{ }}; de lus en de path-parameter aan de andere kant worden al nagekeken',
  },
  {
    summary: 'Hoe gebruik ik een stuk template opnieuw? (include)',
    concepten: ['html-jinja-include'],
  },

  // --- Mappenstructuur ---
  {
    summary: 'Welk bestand hoort in welke map? (projectstructuur)',
    concepten: ['struct-main', 'struct-static', 'struct-templates'],
  },

  // --- Database (sqlitedict) ---
  {
    summary: 'Hoe installeer ik sqlitedict? (python -m pip install)',
    concepten: [],
    geenConcept: 'een pip-commando, geen code in het project',
  },
  {
    summary: 'Hoe sla ik iets op? (db[...] = en commit)',
    concepten: ['db-sqlitedict', 'db-write', 'db-commit'],
  },
  {
    summary: 'Hoe lees ik iets uit? (db[...])',
    concepten: [],
    geenConcept: 'db["naam"] is gewoon indexeren; alleen db.get() wordt apart nagekeken',
  },
  { summary: 'Hoe bekijk ik alles wat erin staat? (db.items)', concepten: ['db-items'] },
  {
    summary: 'Hoe kijk ik of een sleutel bestaat? (in)',
    concepten: [],
    geenConcept:
      'in is gewoon Python; verwijderen met die controle ervoor wordt nagekeken via db-del',
  },
  {
    summary: 'Hoe lees ik iets uit dat misschien niet bestaat? (db.get)',
    concepten: ['db-get'],
  },
  { summary: 'Hoe verwijder ik iets? (del db[...])', concepten: ['db-del'] },
  {
    summary: 'Hoe sla ik meer dan één ding onder een sleutel op? (dictionary als waarde)',
    concepten: [],
    geenConcept: 'een dictionary is Python; het opslaan zelf wordt nagekeken via db-write',
  },
  {
    summary: 'Hoe pas ik een opgeslagen dictionary aan? (ophalen, aanpassen, terugzetten)',
    concepten: [],
    geenConcept:
      'terugzetten is een gewone toewijzing, aan de code niet te onderscheiden van db-write',
  },
  {
    summary: 'Hoe geef ik elk bericht een eigen sleutel? (time.time_ns)',
    concepten: [],
    geenConcept:
      'een functie uit Python zelf; het opslaan onder die sleutel wordt nagekeken via db-write',
  },
  {
    summary: 'Hoe stuur ik alle berichten naar een template? (list met db.values)',
    concepten: [],
    geenConcept:
      'list() en values() zijn Python; de lus in de template wordt nagekeken via html-jinja-loop',
  },

  // --- htmx ---
  { summary: 'Hoe koppel ik htmx aan mijn pagina? (htmx.min.js)', concepten: ['htmx-koppelen'] },
  {
    summary: 'Hoe stuur ik een verzoek zonder herladen? (hx-post, hx-get, hx-delete)',
    concepten: ['htmx-verzoek'],
  },
  {
    summary: 'Waar komt het antwoord terecht? (hx-target en hx-swap)',
    concepten: ['htmx-target'],
  },
  { summary: 'Wanneer gaat het verzoek? (hx-trigger)', concepten: ['htmx-trigger'] },
  {
    summary: 'Hoe vraag ik eerst om bevestiging? (hx-confirm)',
    concepten: [],
    geenConcept: 'een tekst in een attribuut; het verzoek zelf wordt al nagekeken via hx-delete',
  },
  {
    summary: 'Hoe maak ik een formulier leeg na versturen? (hx-on::after-request)',
    concepten: [],
    geenConcept: 'een gemak in de browser; het verzoek zelf wordt al nagekeken via hx-post',
  },

  // --- JavaScript ---
  {
    summary: 'Hoe koppel ik JavaScript aan mijn pagina? (script met defer)',
    concepten: ['js-bestand-koppelen'],
  },
  {
    summary: 'Hoe reageer ik op typen of klikken? (addEventListener)',
    concepten: [],
    geenConcept:
      'querySelector en addEventListener horen bij de web-cursus en worden daar nagekeken',
  },
  {
    summary: 'Hoe zie ik wat mijn JavaScript doet? (console.log)',
    concepten: [],
    geenConcept: 'een hulpmiddel bij het zoeken naar fouten, dat haal je weg voor je inlevert',
  },

  // --- Veiligheid ---
  // Een eigen reeks in de navbar, los van het nagekeken eindproject. De
  // nakijker toetst deze syntax daarom niet.
  {
    summary: 'Hoe zet ik de lijst met endpoints uit? (docs_url=None)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe begrens ik invoer op de server? (Form met max_length)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe laat ik een bezoeker een pagina kiezen? (lijst met wat mag)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe maak ik HTML van een bezoeker onschadelijk? (escape)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe beperk ik het aantal verzoeken? (slowapi)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe controleer ik wie iets mag? (403)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe houd ik scripts bij mijn cookie weg? (httponly)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
  {
    summary: 'Hoe bewaar ik een wachtwoord veilig? (Argon2)',
    concepten: [],
    geenConcept: 'hoort bij de optionele reeks Veiligheid, niet bij het nagekeken eindproject',
  },
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
