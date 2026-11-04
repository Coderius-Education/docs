import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelVoor } from '@coderius/checker/conceptLevel';
import { analyze } from '@coderius/checker/matchConcepts';
import type { CheckReport, ConceptMatch, ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { leesLeerdoelen } from '@coderius/shared/leerdoelen';
import { describe, expect, it } from 'vitest';
import leerdoelenJson from '../leerdoelen.json';
import { fullstackConfig } from './config';

function files(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: fullstackConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

// Concepten uit de leerdoelen en die onder Ook gebruikt, samen.
const alle = (report: CheckReport): ConceptMatch[] => [...report.concepts, ...(report.extra ?? [])];
const perId = (report: CheckReport) => new Map(alle(report).map((c) => [c.id, c.used]));

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

// Leest een voorbeeldproject van schijf, net als de helper in web. Zelfde
// afspraak: assereer op benoemde concept-id's en nooit op totalen, zodat een
// nieuwe les deze tests alleen breekt als hij precies deze concepten raakt.
function leesFixture(naam: string, map = FIXTURES): ProjectFiles {
  const wortel = join(map, naam);
  const files: ProjectFiles = {};

  const loop = (map: string): void => {
    for (const item of readdirSync(map)) {
      const volledig = join(map, item);
      if (statSync(volledig).isDirectory()) {
        loop(volledig);
        continue;
      }
      const path = relative(wortel, volledig).split('\\').join('/');
      const content = readFileSync(volledig, 'utf8');
      files[path] = {
        path,
        kind: fullstackConfig.classify(path),
        content,
        sizeBytes: content.length,
        tooLarge: false,
      };
    }
  };

  loop(wortel);
  return files;
}

function verwacht(naam: string, gebruikt: string[], ongebruikt: string[]): void {
  const gevonden = perId(analyze(leesFixture(naam), fullstackConfig));

  for (const id of [...gebruikt, ...ongebruikt]) {
    expect(gevonden.has(id), `concept '${id}' bestaat niet in fullstackConfig`).toBe(true);
  }
  expect(gebruikt.filter((id) => !gevonden.get(id))).toEqual([]);
  expect(ongebruikt.filter((id) => gevonden.get(id))).toEqual([]);
}

describe('fullstackConfig — voorbeeldprojecten scoren', () => {
  it('een project met alleen een endpoint levert alleen de basis op', () => {
    verwacht(
      'minimaal',
      ['fastapi-app', 'fastapi-get', 'struct-main'],
      [
        'fastapi-routes',
        'db-write',
        'db-lezen',
        'fastapi-post',
        'fastapi-templates',
        'fastapi-redirect',
        'fastapi-httpexception',
        'db-sqlitedict',
        'struct-static',
        'struct-templates',
        'html-basis',
        'js-bestand-koppelen',
      ],
    );
  });

  it('een compleet gastenboek herkent wat er echt in staat', () => {
    verwacht(
      'compleet',
      [
        'fastapi-app',
        'fastapi-get',
        'fastapi-routes',
        'fastapi-post',
        'fastapi-path-param',
        'fastapi-static',
        'fastapi-fileresponse',
        'fastapi-form',
        'fastapi-templates',
        'fastapi-request',
        'fastapi-redirect',
        'fastapi-httpexception',
        'html-basis',
        'html-css-link',
        'html-img',
        'html-link',
        'html-form',
        'html-jinja-var',
        'html-jinja-loop',
        'if-else',
        'js-bestand-koppelen',
        'db-sqlitedict',
        'db-write',
        'db-lezen',
        'db-formulier',
        'db-dictionary',
        'db-commit',
        'db-get',
        'db-items',
        'struct-main',
        'struct-static',
        'struct-templates',
      ],
      // Even belangrijk: de nakijker vinkt niet zomaar alles aan. Deze fixture
      // gebruikt geen HTMLResponse, verwijdert niets en onthoudt de bezoeker
      // niet, dus die blijven uit.
      // De fixture is van vóór het htmx-blok en doet niets zonder herladen,
      // en van vóór de accounts.
      [
        'db-aanpassen',
        'account-registreren',
        'account-inloggen',
        'account-wachtwoord',
        'fastapi-html-response',
        'db-del',
        'fastapi-cookie',
        'fastapi-sessie',
        'fastapi-delete',
        'html-jinja-include',
        'htmx-koppelen',
        'htmx-verzoek',
      ],
    );
  });

  it('leest de fixture zoals de checker een upload ziet', () => {
    const files = leesFixture('compleet');
    // Als classify of textKinds wijzigt, valt het hier meteen op.
    expect(files['main.py'].kind).toBe('py');
    expect(files['static/js/app.js'].kind).toBe('js');
    expect(files['static/css/style.css'].kind).toBe('css');
    expect(files['templates/berichten.html'].kind).toBe('html');
  });
});

describe('fullstackConfig', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(fullstackConfig)).toEqual([]);
  });

  it('herkent de mappenstructuur aan de paden', () => {
    // Fullstack en godot zijn de enige sites met pad-detectie; zonder deze test
    // is dat hele codepad in analyze() ongedekt.
    const report = analyze(
      files({
        'main.py': 'from fastapi import FastAPI',
        'static/style.css': 'body { color: red; }',
        'templates/index.html': '<h1>Hoi</h1>',
      }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('struct-main')).toBe(true);
    expect(gevonden.get('struct-static')).toBe(true);
    expect(gevonden.get('struct-templates')).toBe(true);
  });

  it('vindt de mappen niet als ze er niet zijn', () => {
    const report = analyze(files({ 'app.py': 'print("hoi")' }), fullstackConfig);
    const gevonden = perId(report);

    expect(gevonden.get('struct-main')).toBe(false);
    expect(gevonden.get('struct-static')).toBe(false);
    expect(gevonden.get('struct-templates')).toBe(false);
  });

  // De lessen 13-15 (lijst tonen, redirect, detailpagina + 404) leveren code op
  // die hiervoor nergens in de cursus voorkwam. Zonder deze test zou de
  // nakijker een project dat die lessen wél heeft gedaan niet van een project
  // zonder onderscheiden.
  it('herkent doorsturen, path-parameters en 404', () => {
    const report = analyze(
      files({
        'main.py': [
          'from fastapi import FastAPI, HTTPException',
          'from fastapi.responses import RedirectResponse',
          '@app.post("/gastenboek")',
          'async def opslaan():',
          '    return RedirectResponse(url="/berichten", status_code=303)',
          '@app.get("/bericht/{sleutel}")',
          'async def detail(sleutel: str):',
          '    raise HTTPException(status_code=404, detail="Bestaat niet")',
        ].join('\n'),
      }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('fastapi-redirect')).toBe(true);
    expect(gevonden.get('fastapi-httpexception')).toBe(true);
    expect(gevonden.get('fastapi-path-param')).toBe(true);
  });

  // De twee concepten die niet in de fixtures voorkomen; zonder deze test zou
  // een kapotte regex voor precies deze twee stil de hele suite groen laten.
  it('herkent HTMLResponse en verwijderen uit de database', () => {
    const report = analyze(
      files({
        'main.py': [
          'from fastapi.responses import HTMLResponse',
          '@app.get("/pagina", response_class=HTMLResponse)',
          'async def pagina():',
          '    return "<h1>Hallo</h1>"',
          'async def verwijderen(sleutel: str = Form(...)):',
          '    with SqliteDict("gastenboek.db") as db:',
          '        del db[sleutel]',
        ].join('\n'),
      }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('fastapi-html-response')).toBe(true);
    expect(gevonden.get('db-del')).toBe(true);
  });

  it('herkent een cookie en een sessie in de code van de les', () => {
    const report = analyze(
      files({
        'main.py': [
          'import secrets',
          'from fastapi import Cookie',
          'async def form(sessie_id: str = Cookie(default="")):',
          '    if not sessie_id:',
          '        sessie_id = secrets.token_hex(16)',
          '    antwoord.set_cookie(key="sessie_id", value=sessie_id)',
        ].join('\n'),
      }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('fastapi-cookie')).toBe(true);
    expect(gevonden.get('fastapi-sessie')).toBe(true);
  });

  it('ziet een gewone variabelenaam niet aan voor een cookie of sessie', () => {
    const report = analyze(
      files({ 'main.py': 'cookies = 3\nsessie = "x"\nprint(cookies, sessie)' }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('fastapi-cookie')).toBe(false);
    expect(gevonden.get('fastapi-sessie')).toBe(false);
  });

  it('ziet een route zonder accolades niet aan voor een path-parameter', () => {
    const report = analyze(
      files({ 'main.py': '@app.get("/berichten")\nasync def berichten():\n    return []' }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('fastapi-path-param')).toBe(false);
    expect(gevonden.get('fastapi-redirect')).toBe(false);
    expect(gevonden.get('fastapi-httpexception')).toBe(false);
  });

  // Voor de JS-lessen werd .js als 'other' geclassificeerd en stond het niet in
  // textKinds. Een JavaScript-bestand telt dus mee in het bestandsoverzicht,
  // ook nu er geen concept meer in de JS-broncode zoekt.
  it('herkent een JavaScript-bestand als JavaScript', () => {
    expect(fullstackConfig.classify('static/js/app.js')).toBe('js');
    expect(fullstackConfig.textKinds).toContain('js');
  });

  it('kijkt naar de koppeling, niet naar wat er in het JavaScript staat', () => {
    // querySelector en addEventListener horen bij de web-cursus en worden daar
    // nagekeken. Fullstack toetst alleen dat het bestand netjes in static/js/
    // staat en vanuit de HTML gekoppeld is.
    const report = analyze(
      files({
        'templates/form.html': '<script src="/static/js/app.js" defer></script>',
        'static/js/app.js': [
          'const veld = document.querySelector("#bericht-veld");',
          'veld.addEventListener("input", function () {});',
        ].join('\n'),
      }),
      fullstackConfig,
    );

    const jsConcepten = [...fullstackConfig.concepts, ...(fullstackConfig.extra ?? [])]
      .filter((c) => c.subject === 'js')
      .map((c) => c.id);
    expect(jsConcepten).toEqual(['js-bestand-koppelen']);
    expect(perId(report).get('js-bestand-koppelen')).toBe(true);
  });

  it('een inline script-blok telt niet als koppelen', () => {
    // De cursus leert een apart bestand in static/js/, gemount door FastAPI.
    const report = analyze(
      files({
        'templates/form.html':
          '<script>document.querySelector("#x").addEventListener("click", f);</script>',
      }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('js-bestand-koppelen')).toBe(false);
  });

  it('onderscheidt een template met een lus van een template met alleen variabelen', () => {
    const metLus = analyze(
      files({
        'templates/berichten.html':
          '{% if berichten %}<ul>{% for b in berichten %}<li>{{ b.naam }}</li>{% endfor %}</ul>{% endif %}',
      }),
      fullstackConfig,
    );
    const lus = perId(metLus);
    expect(lus.get('html-jinja-loop')).toBe(true);
    expect(lus.get('if-else')).toBe(true);
    expect(lus.get('html-jinja-var')).toBe(true);

    const zonderLus = analyze(
      files({ 'templates/groet.html': '<h1>Hallo {{ naam }}</h1>' }),
      fullstackConfig,
    );
    const plat = perId(zonderLus);
    expect(plat.get('html-jinja-var')).toBe(true);
    expect(plat.get('html-jinja-loop')).toBe(false);
    expect(plat.get('if-else')).toBe(false);
  });

  // De htmx-concepten en include staan in geen enkele fixture; zonder deze
  // test zou een kapotte regex ze stil op nul houden.
  it('herkent htmx, DELETE en include', () => {
    const report = analyze(
      files({
        'main.py': [
          '@app.delete("/bericht/{sleutel}")',
          'async def weg(sleutel: str):',
          '    pass',
        ].join('\n'),
        'templates/berichten.html': [
          '<script src="/static/js/htmx.min.js" defer></script>',
          '<script src="/static/js/app.js" defer></script>',
          '<form hx-post="/gastenboek" hx-target="#berichten-lijst">',
          '<div id="berichten-lijst" hx-get="/berichten/lijst" hx-trigger="every 10s">',
          '{% include "berichten_lijst.html" %}',
        ].join('\n'),
      }),
      fullstackConfig,
    );
    const gevonden = perId(report);

    expect(gevonden.get('fastapi-delete')).toBe(true);
    expect(gevonden.get('htmx-koppelen')).toBe(true);
    expect(gevonden.get('htmx-verzoek')).toBe(true);
    expect(gevonden.get('htmx-target')).toBe(true);
    expect(gevonden.get('htmx-trigger')).toBe(true);
    expect(gevonden.get('html-jinja-include')).toBe(true);
    // app.js alleen is geen htmx.
    const zonder = analyze(
      files({ 'templates/a.html': '<script src="/static/js/app.js" defer></script>' }),
      fullstackConfig,
    );
    expect(perId(zonder).get('htmx-koppelen')).toBe(false);
  });
});

describe('fullstackConfig — de leerdoelen', () => {
  const leerdoelen = leesLeerdoelen(leerdoelenJson);

  it('volgt het tabblad fullstack van het beoordelingsblad', () => {
    // Het blad zoals de docent het invulde, met de twee startkolommen als
    // niveau 1 en 2. Een verschuiving hoort een bewuste keuze te zijn, geen
    // bijvangst van een nieuwe les; vandaar de hele tabel. Twee tikfouten van
    // het blad zijn hersteld: "reponsetype" en "een genested dictionary".
    const B = 'basis';
    const G = 'gevorderd';
    const E = 'expert';
    const blad = [
      ['virtual environment en FastAPI package installeren', B, B],
      ['FastAPI applicatie starten', B, B],
      ['je kunt de developtools gebruiken om te kijken wat de browser doet', B, B],
      ['FileResponse als responstype', B, B],
      ['HTMLResponse als responstype', B, B],
      ['meerdere GET-routes', B, B],
      ['CSS importeren van los bestand', B, B],
      ['afbeelding importeren van los bestand', B, B],
      ["links tussen pagina's via endpoint", B, B],
      ['Jinja2 template met variabelen', G, B],
      ['data opslaan met sqlitedict', B, B],
      ['data uitlezen met sqlitedict', B, B],
      ['formulier data opslaan via sqlitedict', G, B],
      ['een geneste dictionary in sqlitedict', E, G],
      ['Een dictionary aanpassen: ophalen, aanpassen, terugzetten', E, B],
      ['Doorsturen na opslaan (redirect)', G, B],
      ['if else in python of jinja2 template', G, G],
      ['Registreren: een account opslaan', G, B],
      ['gebruiker laten inloggen', G, G],
      ['Inloggen: een wachtwoord controleren', E, G],
      ['path parameters', E, G],
      ['htmx', E, G],
      ['Cookies', E, G],
      ['Sessions', E, G],
    ];
    expect(leerdoelen.niveaus.map((n) => n.id)).toEqual(['1', '2']);
    expect(leerdoelen.onderwerpen).toEqual([{ id: 'fastapi', label: 'FastAPI' }]);
    expect(leerdoelenJson.concepten.map((c) => [c.concept, c['1'], c['2']])).toEqual(blad);
  });

  it('geeft elk concept uit de leerdoelen een detectie, in dezelfde volgorde', () => {
    expect(fullstackConfig.concepts.map((c) => c.id)).toEqual(
      leerdoelen.concepten.map((c) => c.id),
    );
    // Ook gebruikt is wat het blad niet noemt; een id staat nooit in allebei.
    const rijen = new Set(leerdoelen.concepten.map((c) => c.id));
    expect((fullstackConfig.extra ?? []).filter((c) => rijen.has(c.id))).toEqual([]);
  });

  it('kijkt alleen de installatie en de ontwikkelaarstools met de hand na', () => {
    // Een venv leest de nakijker niet in, en wat je in de browser doet staat
    // in geen bestand. De rest moet uit het project te halen zijn.
    expect(
      fullstackConfig.concepts.filter((c) => c.detect.type === 'handmatig').map((c) => c.id),
    ).toEqual(['fastapi-installeren', 'browser-devtools']);
  });

  it('maakt van de twee niveaus leerroutes met elk een eigen verdeling', () => {
    expect(fullstackConfig.tracks).toEqual([
      { id: '1', label: 'Niveau 1' },
      { id: '2', label: 'Niveau 2' },
    ]);
    const telling = (route: string, m: string) =>
      fullstackConfig.concepts.filter((c) => levelVoor(c, route) === m).length;
    expect([telling('1', 'basis'), telling('1', 'gevorderd'), telling('1', 'expert')]).toEqual([
      11, 6, 7,
    ]);
    expect([telling('2', 'basis'), telling('2', 'gevorderd'), telling('2', 'expert')]).toEqual([
      16, 8, 0,
    ]);
  });

  it('vindt in het eindproject van de basis elke rij van de basis', () => {
    // src/controle/referentie is letterlijk de laatste stand van main.py uit
    // de lessen (controleer.test.ts houdt dat bij). Wat de basis leert, moet
    // de nakijker daar terugvinden; anders scoort een leerling die de cursus
    // afmaakt minder dan hij gedaan heeft.
    const referentie = fileURLToPath(new URL('../controle', import.meta.url));
    const gevonden = perId(analyze(leesFixture('referentie', referentie), fullstackConfig));
    const nietInDeBasis = [
      // handmatig
      'fastapi-installeren',
      'browser-devtools',
      // een los script in Gegevens opslaan, geen endpoint
      'db-aanpassen',
      // uitbreidingen
      'htmx-verzoek',
      'fastapi-cookie',
      'fastapi-sessie',
    ];
    const gemist = leerdoelen.concepten
      .map((c) => c.id)
      .filter((id) => !nietInDeBasis.includes(id) && !gevonden.get(id));
    expect(gemist).toEqual([]);
    for (const id of nietInDeBasis) expect(gevonden.get(id), id).toBe(false);
  });
});

describe('fullstackConfig — de nieuwe rijen van het blad', () => {
  const gebruikt = (code: Record<string, string>) => perId(analyze(files(code), fullstackConfig));

  it('telt een tweede GET-route pas als meerdere routes', () => {
    const een = gebruikt({ 'main.py': '@app.get("/")\nasync def a():\n    return {}\n' });
    expect(een.get('fastapi-get')).toBe(true);
    expect(een.get('fastapi-routes')).toBe(false);
    const twee = gebruikt({
      'main.py':
        '@app.get("/")\nasync def a():\n    return {}\n@app.get("/b")\nasync def b():\n    return {}\n',
    });
    expect(twee.get('fastapi-routes')).toBe(true);
  });

  it('telt een link naar een route, niet naar een bestand of een andere site', () => {
    expect(gebruikt({ 'a.html': '<a href="/about">Over</a>' }).get('html-link')).toBe(true);
    expect(gebruikt({ 'a.html': '<a href="/static/a.pdf">pdf</a>' }).get('html-link')).toBe(false);
    expect(gebruikt({ 'a.html': '<a href="https://x.nl">x</a>' }).get('html-link')).toBe(false);
  });

  it('telt een template pas met variabelen', () => {
    const met = 'return templates.TemplateResponse(request, "a.html", {"naam": naam})';
    const zonder = 'return templates.TemplateResponse(request, "a.html")';
    expect(gebruikt({ 'main.py': met }).get('fastapi-templates')).toBe(true);
    expect(gebruikt({ 'main.py': zonder }).get('fastapi-templates')).toBe(false);
  });

  it('herkent de database aan de naam na as, ook als die niet db heet', () => {
    const code = [
      'with SqliteDict("gebruikers.db") as gebruikers:',
      '    gebruikers[naam] = wachtwoord',
      '    gebruikers.commit()',
    ].join('\n');
    const g = gebruikt({ 'main.py': code });
    expect(g.get('db-write')).toBe(true);
    expect(g.get('db-lezen')).toBe(false);
    // Een gewone dictionary is geen database.
    const dier = gebruikt({ 'main.py': 'DIEREN = {}\nDIEREN["kat"] = {"geluid": "miauw"}\n' });
    expect(dier.get('db-write')).toBe(false);
    expect(dier.get('db-dictionary')).toBe(false);
  });

  it('telt uitlezen met indexeren, get, items en in, maar opslaan niet als uitlezen', () => {
    const lees = (regel: string) =>
      gebruikt({ 'main.py': `with SqliteDict("a.db") as db:\n    ${regel}\n` }).get('db-lezen');
    expect(lees('print(db["naam"])')).toBe(true);
    expect(lees('x = db.get(sleutel)')).toBe(true);
    expect(lees('alles = list(db.items())')).toBe(true);
    expect(lees('if naam in db:')).toBe(true);
    expect(lees('db["naam"] = "Sam"')).toBe(false);
  });

  it('telt formulierdata opslaan alleen als Form en database in hetzelfde endpoint staan', () => {
    const samen = [
      '@app.post("/opslaan")',
      'async def opslaan(naam: str = Form(...)):',
      '    with SqliteDict("namen.db") as db:',
      '        db["naam"] = naam',
      '        db.commit()',
    ].join('\n');
    expect(gebruikt({ 'main.py': samen }).get('db-formulier')).toBe(true);
    const los = [
      '@app.post("/groet")',
      'async def groet(naam: str = Form(...)):',
      '    return {"naam": naam}',
      '',
      'with SqliteDict("namen.db") as db:',
      '    db["teller"] = 1',
    ].join('\n');
    expect(gebruikt({ 'main.py': los }).get('db-formulier')).toBe(false);
  });

  it('telt een dictionary als waarde, en aanpassen alleen met terugzetten', () => {
    const goed = [
      'with SqliteDict("mijn_data.db") as db:',
      '    db["sara"] = {"klas": "5A", "vakken": []}',
      '    sara = db["sara"]',
      '    sara["klas"] = "5B"',
      '    db["sara"] = sara',
      '    db.commit()',
    ].join('\n');
    const g = gebruikt({ 'main.py': goed });
    expect(g.get('db-dictionary')).toBe(true);
    expect(g.get('db-aanpassen')).toBe(true);
    // De fout uit de les: een kopie aanpassen verandert het bestand niet.
    const kopie = [
      'with SqliteDict("mijn_data.db") as db:',
      '    db["sara"]["klas"] = "5B"',
      '    sara = db["sara"]',
      '    sara["vakken"].append("Duits")',
      '    db.commit()',
    ].join('\n');
    expect(gebruikt({ 'main.py': kopie }).get('db-aanpassen')).toBe(false);
  });

  it('telt een if in Python of in een template', () => {
    expect(gebruikt({ 'main.py': 'if naam in db:\n    pass' }).get('if-else')).toBe(true);
    expect(gebruikt({ 'a.html': '{% if berichten %}x{% endif %}' }).get('if-else')).toBe(true);
    expect(gebruikt({ 'main.py': 'verschil = 3\nprint("if")' }).get('if-else')).toBe(false);
  });

  it('onderscheidt registreren, inloggen en het wachtwoord controleren', () => {
    const g = gebruikt({
      'main.py': [
        '@app.post("/registreer")',
        'async def registreer(naam: str = Form(...), wachtwoord: str = Form(...)):',
        '    pass',
        '@app.post("/gastenboek")',
        'async def opslaan(naam: str = Form(...), wachtwoord: str = Form(...)):',
        '    if gebruikers.get(naam) != wachtwoord:',
        '        raise HTTPException(status_code=401)',
      ].join('\n'),
      'static/pages/gastenboek_form.html':
        '<form action="/gastenboek" method="post"><input type="password" name="wachtwoord"></form>',
    });
    expect(g.get('account-registreren')).toBe(true);
    expect(g.get('account-inloggen')).toBe(true);
    expect(g.get('account-wachtwoord')).toBe(true);
    // Alleen een registreerformulier is nog geen inloggen.
    const alleen = gebruikt({
      'static/pages/registreer.html':
        '<form action="/registreer" method="post"><input type="password" name="wachtwoord"></form>',
    });
    expect(alleen.get('account-inloggen')).toBe(false);
    expect(alleen.get('account-wachtwoord')).toBe(false);
  });
});
