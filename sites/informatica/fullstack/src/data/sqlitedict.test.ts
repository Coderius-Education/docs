import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Issue #126: SqliteDict kwam in één les binnen. Opslaan, commit en uitlezen
// stonden er, maar del, items en in alleen in een rijtje "Overzicht
// commando's", en "Er gaat iets mis" was één zin over commit(). De fouten die
// leerlingen echt maken, kwamen ze pas in de server tegen, of pas in Sessies of
// Wachtwoorden: een script in een andere map maakt stil een lege database
// (KeyError), een dictionary aanpassen zonder hem terug te zetten geeft geen
// fout maar ook geen wijziging, en del zonder in crasht de tweede keer. Alles
// nagedraaid met sqlitedict 2.1.
//
// Nu oefent de leerling eerst in drie lessen met losse scripts, vóór de les
// die SqliteDict in een endpoint zet, en elke les heeft een Er gaat iets mis
// met die fouten. Daarnaast is er een naslagpagina, net als Projectstructuur
// niet in de sidebar.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const pythonBlokken = (bron: string) =>
  [...bron.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
const hoofdtekst = (id: string) =>
  tekst(id)
    .split(/\n## Opdrachten\n/)[0]
    .replace(/<details>[\s\S]*?<\/details>/g, '');
const sectie = (bron: string, kop: string) => bron.split(`\n## ${kop}\n`)[1]?.split(/\n## /)[0];

const SCRIPTLESSEN = ['FastAPI/database', 'FastAPI/database-sleutels', 'FastAPI/database-waarden'];

describe('SqliteDict eerst in een script', () => {
  const eersteInServer = lessen.find((id) =>
    pythonBlokken(tekst(id)).some((b) => b.includes('@app.') && b.includes('SqliteDict')),
  );

  it('de drie scriptlessen staan direct vóór de eerste les met SqliteDict in een endpoint', () => {
    expect(eersteInServer).toBe('FastAPI/post_naar_database');
    const plek = lessen.indexOf(eersteInServer as string);
    expect(lessen.slice(plek - SCRIPTLESSEN.length, plek)).toEqual(SCRIPTLESSEN);
  });

  it.each(SCRIPTLESSEN)('%s heeft geen endpoint: de leerling oefent in een los script', (id) => {
    expect(pythonBlokken(tekst(id)).filter((b) => b.includes('@app.'))).toEqual([]);
  });

  // Elke bouwsteen staat in de hoofdtekst van een scriptles, niet alleen in
  // een opdracht of in de server.
  it.each([
    'db.commit()',
    ' in db',
    'db.get(',
    'del db[',
    'db.items()',
    'len(db)',
    'db["sara"] = sara',
  ])('%s wordt in de hoofdtekst van een scriptles uitgelegd', (bouwsteen) => {
    expect(SCRIPTLESSEN.some((id) => hoofdtekst(id).includes(bouwsteen))).toBe(true);
  });

  it.each(SCRIPTLESSEN)('%s heeft een Er gaat iets mis met oorzaak en oplossing', (id) => {
    const deel = sectie(tekst(id), 'Er gaat iets mis') ?? '';
    expect(deel).toContain('**Oorzaak:**');
    expect(deel).toContain('**Oplossing:**');
  });

  // De fouten die leerlingen echt maken, elk nagedraaid.
  it.each([
    ['FastAPI/database', 'db.commit()', 'een vergeten commit: geen fout, de oude waarde blijft'],
    ['FastAPI/database', 'andere map', 'een script in een andere map maakt een lege database'],
    ['FastAPI/database', "KeyError: 'Naam'", 'een hoofdletter in de sleutel'],
    ['FastAPI/database-sleutels', "KeyError: 'leeftijd'", 'del zonder in, de tweede keer'],
    ['FastAPI/database-waarden', 'terug', 'een dictionary aanpassen zonder terugzetten'],
  ])('%s: Er gaat iets mis noemt %s (%s)', (id, nodig) => {
    expect(sectie(tekst(id), 'Er gaat iets mis') ?? '').toContain(nodig);
  });

  it.each(SCRIPTLESSEN)('%s doorloopt PRIMM: van Predict tot Make, elk met een antwoord', (id) => {
    const opdrachten = sectie(tekst(id), 'Opdrachten') ?? '';
    for (const stap of ['Predict', 'Run', 'Investigate', 'Modify', 'Make']) {
      expect(opdrachten, stap).toMatch(new RegExp(`### Opdracht \\d+: ${stap}`));
    }
    const aantal = opdrachten.match(/^### Opdracht /gm)?.length ?? 0;
    const antwoorden = opdrachten.match(/<summary>Antwoord<\/summary>/g)?.length ?? 0;
    expect(antwoorden).toBe(aantal);
  });

  it('Een formulier opslaan legt db.get niet opnieuw uit, maar linkt naar de les', () => {
    const les = tekst('FastAPI/post_naar_database');
    expect(les).toContain('](/docs/FastAPI/database-sleutels)');
    expect(les).toContain('](/docs/FastAPI/database-waarden)');
  });
});

describe('SqliteDict op een rij', () => {
  // Pas in de test gelezen: bestaat de pagina niet, dan faalt elke test apart.
  const naslag = () => tekst('FastAPI/sqlitedict');

  it('is naslag: niet in de sidebar, wel in de Database-sectie van de cheatsheet', () => {
    expect(lessen).not.toContain('FastAPI/sqlitedict');
    const cheatsheet = readFileSync(`${DOCS}/cheatsheet.md`, 'utf8');
    expect(sectie(cheatsheet, 'Database (sqlitedict)')).toContain('(/docs/FastAPI/sqlitedict)');
  });

  it.each(SCRIPTLESSEN)('de naslag linkt naar %s', (id) => {
    expect(naslag()).toContain(`](/docs/${id})`);
  });

  it('de eerste scriptles noemt de naslag', () => {
    expect(tekst('FastAPI/database')).toContain('](/docs/FastAPI/sqlitedict)');
  });

  // Elk verschil met een gewone dictionary is een fout uit de lessen.
  it.each([
    'commit()',
    'kopie',
    "AttributeError: 'NoneType' object has no attribute 'select'",
    'map van je terminal',
    'lege database',
  ])('noemt %s', (nodig) => {
    expect(sectie(naslag(), 'Anders dan een gewone dictionary')).toContain(nodig);
  });
});
