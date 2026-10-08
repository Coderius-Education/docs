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
// Nu oefent de leerling eerst in losse scripts, vóór de les die SqliteDict in
// een endpoint zet, en elke les heeft een Er gaat iets mis met die fouten.
// Dat waren eerst drie lessen (opslaan; sleutels bekijken, zoeken en
// verwijderen; een dictionary als waarde), maar de opdrachtgever vond de
// stappen te groot. Nu zijn het zes kleine lessen met elk één concept:
// opslaan en uitlezen, len en items, in en get, del, een dictionary als
// waarde, en ophalen-aanpassen-terugzetten. Daarnaast is er een
// naslagpagina, net als Projectstructuur niet in de sidebar.

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

const SCRIPTLESSEN = [
  'FastAPI/sqlitedict/database',
  'FastAPI/sqlitedict/bekijken',
  'FastAPI/sqlitedict/zoeken',
  'FastAPI/sqlitedict/verwijderen',
  'FastAPI/sqlitedict/dictionary',
  'FastAPI/sqlitedict/aanpassen',
];
const PRIMM = ['Predict', 'Run', 'Investigate', 'Modify', 'Make'];
const opdrachtenVan = (id: string) => sectie(tekst(id), 'Opdrachten') ?? '';

describe('SqliteDict eerst in een script', () => {
  const eersteInServer = lessen.find((id) =>
    pythonBlokken(tekst(id)).some((b) => b.includes('@app.') && b.includes('SqliteDict')),
  );

  it('de scriptlessen staan direct vóór de eerste les met SqliteDict in een endpoint', () => {
    expect(eersteInServer).toBe('FastAPI/formulier-opslaan/naam-opslaan');
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
    [
      'FastAPI/sqlitedict/database',
      'db.commit()',
      'een vergeten commit: geen fout, de oude waarde blijft',
    ],
    [
      'FastAPI/sqlitedict/database',
      'andere map',
      'een script in een andere map maakt een lege database',
    ],
    ['FastAPI/sqlitedict/database', "KeyError: 'Naam'", 'een hoofdletter in de sleutel'],
    [
      'FastAPI/sqlitedict/bekijken',
      "AttributeError: 'NoneType' object has no attribute 'select'",
      'de lus buiten het with-blok',
    ],
    ['FastAPI/sqlitedict/verwijderen', "KeyError: 'leeftijd'", 'del zonder in, de tweede keer'],
    ['FastAPI/sqlitedict/aanpassen', 'terug', 'een dictionary aanpassen zonder terugzetten'],
  ])('%s: Er gaat iets mis noemt %s (%s)', (id, nodig) => {
    expect(sectie(tekst(id), 'Er gaat iets mis') ?? '').toContain(nodig);
  });

  // Elke les is klein, maar doorloopt toch de cyclus: voorspellen, draaien,
  // onderzoeken en zelf iets aanpassen of maken.
  it.each(SCRIPTLESSEN)(
    '%s heeft Predict, Run, Investigate en Modify of Make, elk met een antwoord',
    (id) => {
      const opdrachten = opdrachtenVan(id);
      for (const stap of ['Predict', 'Run', 'Investigate']) {
        expect(opdrachten, stap).toMatch(new RegExp(`### Opdracht \\d+: ${stap}`));
      }
      expect(opdrachten).toMatch(/### Opdracht \d+: (Modify|Make)/);
      const aantal = opdrachten.match(/^### Opdracht /gm)?.length ?? 0;
      const antwoorden = opdrachten.match(/<summary>Antwoord<\/summary>/g)?.length ?? 0;
      expect(antwoorden).toBe(aantal);
    },
  );

  it('over de scriptlessen samen komen alle vijf PRIMM-stappen voor', () => {
    const alle = SCRIPTLESSEN.map(opdrachtenVan).join('\n');
    for (const stap of PRIMM) {
      expect(alle, stap).toMatch(new RegExp(`### Opdracht \\d+: ${stap}`));
    }
  });

  it('Een formulier opslaan legt db.get en de dictionary niet opnieuw uit, maar linkt naar de les', () => {
    expect(tekst('FastAPI/formulier-opslaan/naam-opslaan')).toContain(
      '](/docs/FastAPI/sqlitedict/zoeken)',
    );
    expect(tekst('FastAPI/formulier-opslaan/berichten-opslaan')).toContain(
      '](/docs/FastAPI/sqlitedict/dictionary)',
    );
  });
});

describe('SqliteDict op een rij', () => {
  // Pas in de test gelezen: bestaat de pagina niet, dan faalt elke test apart.
  const naslag = () => tekst('FastAPI/sqlitedict/op-een-rij');

  it('is naslag: niet in de sidebar, wel in de Database-sectie van de cheatsheet', () => {
    expect(lessen).not.toContain('FastAPI/sqlitedict/op-een-rij');
    const cheatsheet = readFileSync(`${DOCS}/cheatsheet.md`, 'utf8');
    expect(sectie(cheatsheet, 'Database (sqlitedict)')).toContain(
      '(/docs/FastAPI/sqlitedict/op-een-rij)',
    );
  });

  it.each(SCRIPTLESSEN)('de naslag linkt naar %s', (id) => {
    expect(naslag()).toContain(`](/docs/${id})`);
  });

  it('de eerste scriptles noemt de naslag', () => {
    expect(tekst('FastAPI/sqlitedict/database')).toContain(
      '](/docs/FastAPI/sqlitedict/op-een-rij)',
    );
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
