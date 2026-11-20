import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { describe, expect, it } from 'vitest';
import { fullstackConfig } from './config';
import { samenhang } from './samenhang';

// De samenhang-controle wijst aan wat tussen twee bestanden niet aansluit.
// Een melding die niet klopt kost een leerling meer dan een gemiste, dus
// naast elke fout die hij moet vinden staat een geval dat hij met rust moet
// laten.

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

function leesFixture(naam: string): Record<string, string> {
  const wortel = join(FIXTURES, naam);
  const uit: Record<string, string> = {};
  const loop = (map: string): void => {
    for (const item of readdirSync(map)) {
      const volledig = join(map, item);
      if (statSync(volledig).isDirectory()) loop(volledig);
      else uit[relative(wortel, volledig).split('\\').join('/')] = readFileSync(volledig, 'utf8');
    }
  };
  loop(wortel);
  return uit;
}

function project(inhoud: Record<string, string>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(inhoud).map(([path, content]) => [
      path,
      {
        path,
        kind: fullstackConfig.classify(path),
        content,
        sizeBytes: content.length,
        tooLarge: false,
      },
    ]),
  );
}

/** Het complete gastenboek, met één bestand aangepast. */
function compleetMet(wijzig: (p: Record<string, string>) => void): ProjectFiles {
  const p = leesFixture('compleet');
  wijzig(p);
  return project(p);
}

const titels = (files: ProjectFiles) => samenhang(files).map((f) => f.titel);

describe('samenhang', () => {
  it('het complete gastenboek sluit overal aan', () => {
    expect(samenhang(project(leesFixture('compleet')))).toEqual([]);
    expect(samenhang(project(leesFixture('minimaal')))).toEqual([]);
  });

  it('komt in het rapport, ook voor de leerling', () => {
    const files = compleetMet((p) => {
      p['static/pages/gastenboek_form.html'] = p['static/pages/gastenboek_form.html'].replace(
        'name="naam"',
        'name="voornaam"',
      );
    });
    // De leerling krijgt geen concepten en geen buiten-de-lesstof, wel dit.
    const report = analyze(files, fullstackConfig, {
      buitenLesstof: false,
      plekken: false,
      concepten: false,
    });
    expect(report.samenhang?.length).toBeGreaterThan(0);
  });

  describe('formulier en functie', () => {
    const formulier = 'static/pages/gastenboek_form.html';

    it('een veld met een andere naam: 422 én een veld dat nergens aankomt', () => {
      const files = compleetMet((p) => {
        p[formulier] = p[formulier].replace('name="naam"', 'name="voornaam"');
      });
      const fouten = samenhang(files);
      expect(fouten.map((f) => f.titel)).toEqual([
        'De functie verwacht het veld "naam", het formulier stuurt het niet',
        'Het veld "voornaam" komt nergens aan',
      ]);
      // Beide kanten worden aangewezen, met de juiste regel.
      expect(fouten[0].plekken).toEqual([
        { bestand: formulier, regel: 5 },
        { bestand: 'main.py', regel: 20 },
      ]);
      expect(fouten[0].uitleg).toContain('422');
      expect(fouten[1].plekken[0]).toEqual({ bestand: formulier, regel: 6 });
    });

    it('een parameter met een standaardwaarde mag ontbreken', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace(
          'bericht: str = Form(...))',
          'bericht: str = Form(...), kleur: str = Form(""))',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('Annotated met Form telt ook', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace(
          'naam: str = Form(...)',
          'naam: Annotated[str, Form()]',
        );
        p[formulier] = p[formulier].replace('name="naam"', 'name="voornaam"');
      });
      expect(titels(files)).toContain(
        'De functie verwacht het veld "naam", het formulier stuurt het niet',
      );
    });

    it('een functie die zelf request.form() leest, laat hij met rust', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace(
          'async def gastenboek_opslaan(naam: str = Form(...), bericht: str = Form(...)):',
          'async def gastenboek_opslaan(request: Request):\n    velden = await request.form()\n    naam = velden["naam"]\n    bericht = velden["bericht"]',
        );
        p[formulier] = p[formulier].replace('name="naam"', 'name="voornaam"');
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een action zonder route: 404', () => {
      const files = compleetMet((p) => {
        p[formulier] = p[formulier].replace('action="/gastenboek"', 'action="/gastenboeken"');
      });
      expect(titels(files)).toEqual([
        'Het formulier stuurt naar /gastenboeken, en die route bestaat niet',
      ]);
    });

    it('een POST naar een route die alleen GET kent: 405', () => {
      const files = compleetMet((p) => {
        p[formulier] = p[formulier].replace('action="/gastenboek"', 'action="/berichten"');
      });
      const fouten = samenhang(files);
      expect(fouten.map((f) => f.titel)).toEqual([
        'Het formulier stuurt een POST, de route kent alleen GET',
      ]);
      expect(fouten[0].uitleg).toContain('405');
    });

    it('een action met een path-parameter uit Jinja past bij de route', () => {
      const files = compleetMet((p) => {
        p['main.py'] += `

@app.post("/bericht/{sleutel}/verwijder")
async def verwijder(sleutel: str):
    return RedirectResponse(url="/berichten", status_code=303)
`;
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          '<a href="/berichten">Terug</a>',
          '<form method="post" action="/bericht/{{ sleutel }}/verwijder"><button>Weg</button></form>',
        );
      });
      // Geen formulierfout; de template leest sleutel, maar die komt niet mee.
      expect(titels(files)).toEqual([
        'Het template gebruikt sleutel, het dictionary geeft het niet mee',
      ]);
    });
  });

  describe('template en dictionary', () => {
    it('een naam die het dictionary niet meegeeft', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace('{"bericht": bericht}', '{"item": bericht}');
      });
      const fouten = samenhang(files);
      expect(fouten.map((f) => f.titel)).toEqual([
        'Het template gebruikt bericht, het dictionary geeft het niet mee',
      ]);
      expect(fouten[0].plekken).toEqual([
        { bestand: 'templates/bericht.html', regel: 4 },
        { bestand: 'main.py', regel: 42 },
      ]);
      expect(fouten[0].uitleg).toContain('alleen item mee');
    });

    it('lusvariabelen, set en is defined horen niet in het dictionary', () => {
      const files = compleetMet((p) => {
        p['templates/berichten.html'] = p['templates/berichten.html'].replace(
          '<h1>Gastenboek</h1>',
          '<h1>{% set titel = "Gastenboek" %}{{ titel }}</h1>{% if fout is defined %}{{ fout }}{% endif %}{{ loop }}',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een dictionary uit een variabele laat hij met rust', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace('{"bericht": bericht}', '{**gegevens}');
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een template dat er niet is', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace('"bericht.html"', '"detail.html"');
      });
      const fouten = samenhang(files);
      expect(fouten.map((f) => f.titel)).toEqual(['Het template detail.html bestaat niet']);
      expect(fouten[0].uitleg).toContain('bericht_detail()');
    });

    it('de oude vorm met request in het dictionary', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace(
          'TemplateResponse(request, "bericht.html", {"bericht": bericht})',
          'TemplateResponse("bericht.html", {"request": request, "bericht": bericht})',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });
  });

  describe('wat de review vond: geen valse melding, geen crash', () => {
    it('een losse % in een static-link laat de controle niet crashen', () => {
      const files = compleetMet((p) => {
        p['templates/berichten.html'] = p['templates/berichten.html'].replace(
          '/static/logo.png',
          '/static/100%.png',
        );
      });
      expect(() => samenhang(files)).not.toThrow();
      // En de rest van het rapport komt er nog: een fout elders blijft staan.
      const metFout = compleetMet((p) => {
        p['templates/berichten.html'] = p['templates/berichten.html']
          .replace('/static/logo.png', '/static/100%.png')
          .replace('/static/css/style.css', '/static/css/stijl.css');
      });
      expect(titels(metFout)).toEqual([
        '/static/css/stijl.css wijst naar een bestand dat er niet is',
      ]);
    });

    it('een naam die alleen in {% if %} staat, mag in het dictionary ontbreken', () => {
      const files = compleetMet((p) => {
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          '<h1>',
          '{% if fout %}<p>{{ fout }}</p>{% endif %}<h1>',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een StaticFiles op / maakt van een link naar een route geen ontbrekend bestand', () => {
      const files = compleetMet((p) => {
        p['main.py'] +=
          '\napp.mount("/", StaticFiles(directory="static", html=True), name="site")\n';
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een slash aan het eind van action of link is geen andere route', () => {
      const files = compleetMet((p) => {
        p['static/pages/gastenboek_form.html'] = p['static/pages/gastenboek_form.html'].replace(
          'action="/gastenboek"',
          'action="/gastenboek/"',
        );
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          'href="/berichten"',
          'href="/berichten/"',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });
  });

  describe('tweede review: commentaar, onbekende routes en mounts, dubbele velden', () => {
    it('uitgecommentarieerde HTML en Jinja tellen niet mee', () => {
      const files = compleetMet((p) => {
        p['static/pages/gastenboek_form.html'] = p['static/pages/gastenboek_form.html']
          .replace(
            '<form method="post"',
            '<!-- <form method="post" action="/oud"><input name="x"></form> -->\n        <form method="post"',
          )
          .replace(
            '<button type="submit">',
            '<!-- <input name="oud"> -->\n            <button type="submit">',
          );
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          '<h1>',
          '{# <p>{{ oud }}</p> #}<h1>',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('commentaar verschuift de regelnummers niet', () => {
      const files = compleetMet((p) => {
        p['static/pages/gastenboek_form.html'] = p['static/pages/gastenboek_form.html']
          .replace('<form method="post"', '<!--\nweg\n-->\n        <form method="post"')
          .replace('name="naam"', 'name="voornaam"');
      });
      expect(samenhang(files)[0].plekken[0]).toEqual({
        bestand: 'static/pages/gastenboek_form.html',
        regel: 8,
      });
    });

    it('een route die hij niet kan lezen, maakt hem stil over routes', () => {
      for (const extra of [
        '\n@app.api_route("/zoek", methods=["GET", "POST"])\nasync def zoek():\n    return {}\n',
        '\n@app.get(path="/over")\nasync def over():\n    return {}\n',
        '\nPAD = "/over"\n\n\n@app.get(PAD)\nasync def over():\n    return {}\n',
        '\napp.add_api_route("/over", lambda: {})\n',
      ]) {
        const files = compleetMet((p) => {
          p['main.py'] += extra;
          p['templates/bericht.html'] = p['templates/bericht.html'].replace(
            'href="/berichten"',
            'href="/over"',
          );
        });
        expect(samenhang(files), extra).toEqual([]);
      }
    });

    it('een map die berekend wordt, is geen ontbrekende route', () => {
      const files = compleetMet((p) => {
        p['main.py'] = p['main.py'].replace(
          'StaticFiles(directory="static")',
          'StaticFiles(directory=Path(__file__).parent / "static")',
        );
        p['templates/berichten.html'] = p['templates/berichten.html'].replace(
          '<h1>Gastenboek</h1>',
          '<h1>Gastenboek</h1>\n        <a href="/static/pages/over.html">Over</a>',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een voorvoegsel dat hij niet kan lezen, maakt hem stil over links', () => {
      const files = compleetMet((p) => {
        p['main.py'] +=
          '\nWORTEL = "/"\napp.mount(WORTEL, StaticFiles(directory="site"), name="site")\n';
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          'href="/berichten"',
          'href="/over.html"',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('radioknoppen met één naam geven één melding', () => {
      const files = compleetMet((p) => {
        p['static/pages/gastenboek_form.html'] = p['static/pages/gastenboek_form.html'].replace(
          '<button type="submit">',
          '<input type="radio" name="kleur" value="a"><input type="radio" name="kleur" value="b">\n            <button type="submit">',
        );
      });
      expect(titels(files)).toEqual(['Het veld "kleur" komt nergens aan']);
    });
  });

  describe('links en bestanden', () => {
    it('een static-link zonder / vooraan', () => {
      const files = compleetMet((p) => {
        p['templates/berichten.html'] = p['templates/berichten.html'].replace(
          '"/static/css/style.css"',
          '"static/css/style.css"',
        );
      });
      expect(titels(files)).toEqual(['static/css/style.css mist een / vooraan']);
      const [fout] = samenhang(files);
      expect(fout.uitleg).toContain('Schrijf /static/css/style.css.');
    });

    it('een relatieve link naar iets anders dan static is geen melding', () => {
      const files = compleetMet((p) => {
        p['templates/berichten.html'] = p['templates/berichten.html'].replace(
          '</body>',
          '<a href="gastenboek">Gastenboek</a><a href="https://example.com/static/x.css">x</a><a href="#static">y</a>\n</body>',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een static-bestand dat er niet is', () => {
      const files = compleetMet((p) => {
        p['templates/berichten.html'] = p['templates/berichten.html'].replace(
          '/static/css/style.css',
          '/static/css/stijl.css',
        );
      });
      const fouten = samenhang(files);
      expect(fouten.map((f) => f.titel)).toEqual([
        '/static/css/stijl.css wijst naar een bestand dat er niet is',
      ]);
      // De link, en de regel die de map koppelt.
      expect(fouten[0].plekken).toEqual([
        { bestand: 'templates/berichten.html', regel: 5 },
        { bestand: 'main.py', regel: 10 },
      ]);
    });

    it('een project in een map: paden vanaf main.py', () => {
      const p = leesFixture('compleet');
      const files = project(
        Object.fromEntries(Object.entries(p).map(([k, v]) => [`mijn-project/${k}`, v])),
      );
      expect(samenhang(files)).toEqual([]);
    });

    it('een link naar een route die er niet is', () => {
      const files = compleetMet((p) => {
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          'href="/berichten"',
          'href="/bericht"',
        );
      });
      expect(titels(files)).toEqual(['De link naar /bericht heeft geen route']);
    });

    it('/docs en een link met Jinja in een padstuk zijn goed', () => {
      const files = compleetMet((p) => {
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          '<a href="/berichten">Terug</a>',
          '<a href="/docs">Handleiding</a><a href="/berichten?pagina=2">Verder</a>',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('een vaste link past bij een route met een path-parameter, ook {pad:path}', () => {
      const files = compleetMet((p) => {
        p['main.py'] += `

@app.get("/bestand/{pad:path}")
async def bestand(pad: str):
    return {"pad": pad}
`;
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          '<a href="/berichten">Terug</a>',
          '<a href="/bericht/bericht_1">Eerste</a><a href="/bestand/a/b/c.txt">Bestand</a>',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });

    it('{pad:path} pakt alleen links met hetzelfde begin', () => {
      // Eerst paste elke link met genoeg stukken bij /bestand/{pad:path},
      // ook /bestandje/a/b; dan bleef een typfout in de link onopgemerkt.
      const files = compleetMet((p) => {
        p['main.py'] += `

@app.get("/bestand/{pad:path}")
async def bestand(pad: str):
    return {"pad": pad}
`;
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          'href="/berichten"',
          'href="/bestandje/a/b"',
        );
      });
      expect(titels(files)).toEqual(['De link naar /bestandje/a/b heeft geen route']);
    });

    it('FileResponse naar een bestand dat er niet is', () => {
      const files = compleetMet((p) => {
        const { 'static/pages/gastenboek_form.html': _weg, ...rest } = p;
        for (const k of Object.keys(p)) if (!(k in rest)) Reflect.deleteProperty(p, k);
      });
      expect(titels(files)).toEqual([
        'FileResponse wijst naar static/pages/gastenboek_form.html, en dat bestand is er niet',
      ]);
    });

    it('een router met prefix: routes niet zeker, dus geen route-meldingen', () => {
      const files = compleetMet((p) => {
        p['main.py'] += '\nrouter = APIRouter(prefix="/api")\napp.include_router(router)\n';
        p['templates/bericht.html'] = p['templates/bericht.html'].replace(
          'href="/berichten"',
          'href="/api/lijst"',
        );
      });
      expect(samenhang(files)).toEqual([]);
    });
  });

  describe('een naam zonder import', () => {
    const main = (code: string) => project({ 'main.py': code });
    const KOP =
      'from fastapi import FastAPI, Request\nfrom fastapi.responses import HTMLResponse\n\napp = FastAPI()\n\n';

    it('vindt Form zonder import, en noemt de regel waar hij bij hoort', () => {
      const fouten = samenhang(
        main(
          `${KOP}@app.post("/naam")\nasync def naam(naam: str = Form(...)):\n    return {"naam": naam}\n`,
        ),
      );
      expect(fouten.map((f) => f.titel)).toEqual([
        'Form wordt gebruikt, maar staat niet bij de imports',
      ]);
      expect(fouten[0].uitleg).toContain('`from fastapi import FastAPI, Request`');
      expect(fouten[0].plekken).toEqual([{ bestand: 'main.py', regel: 7 }]);
    });

    it('geeft de hele regel als de module er nog niet staat', () => {
      const fouten = samenhang(
        main(
          `${KOP}@app.get("/weg")\nasync def weg():\n    return RedirectResponse(url="/", status_code=303)\n`,
        ),
      );
      const importFout = fouten.find((f) => f.titel.startsWith('RedirectResponse wordt gebruikt'));
      expect(importFout?.uitleg).toContain('`from fastapi.responses import HTMLResponse`');
      const zonderRegel = samenhang(
        main(`${KOP}app.mount("/static", StaticFiles(directory="static"), name="static")\n`),
      );
      expect(zonderRegel[0].uitleg).toContain('`from fastapi.staticfiles import StaticFiles`');
    });

    it('laat met rust: geimporteerd, met een alias, in een string of commentaar, met de module ervoor', () => {
      expect(
        titels(
          main(
            `${KOP}from fastapi import Form as Formulier\nimport fastapi\n\n@app.post("/a")\nasync def a(naam: str = fastapi.Form(...), b: str = Formulier(...)):\n    # HTTPException hoort hier niet\n    return HTMLResponse("<form>Form</form>")\n`,
          ),
        ),
      ).toEqual([]);
    });

    it('laat met rust: een import *, en een naam die het bestand zelf maakt', () => {
      expect(titels(main('from fastapi import *\n\napp = FastAPI()\nx = Form(...)\n'))).toEqual([]);
      expect(titels(main('def escape(t):\n    return t\n\nprint(escape("<b>"))\n'))).toEqual([]);
      expect(titels(main('Request = None\nprint(Request)\n'))).toEqual([]);
    });
  });
});

describe('samenhang — geen valse meldingen bij een gewone opzet', () => {
  it('zegt niets over templates en bestanden als alleen main.py geüpload is', () => {
    const main = [
      'from fastapi import FastAPI, Request',
      'from fastapi.responses import FileResponse',
      'from fastapi.templating import Jinja2Templates',
      'app = FastAPI()',
      'templates = Jinja2Templates(directory="templates")',
      '@app.get("/")',
      'def home(request: Request):',
      '    return templates.TemplateResponse(request, "home.html", {"naam": "Sam"})',
      '@app.get("/over")',
      'def over():',
      '    return FileResponse("static/over.html")',
    ].join('\n');
    expect(samenhang(project({ 'main.py': main }))).toEqual([]);
  });

  it('vindt templates naast een main.py in app/', () => {
    const main = [
      'from fastapi import FastAPI, Request',
      'from fastapi.templating import Jinja2Templates',
      'app = FastAPI()',
      'templates = Jinja2Templates(directory="templates")',
      '@app.get("/")',
      'def home(request: Request):',
      '    return templates.TemplateResponse(request, "home.html", {"naam": "Sam"})',
    ].join('\n');
    expect(
      samenhang(project({ 'app/main.py': main, 'templates/home.html': '<p>{{ naam }}</p>' })),
    ).toEqual([]);
  });

  it('meldt geen ontbrekende import bij commentaar achter de import-regel', () => {
    const main = [
      'from fastapi import FastAPI, Form  # Form erbij',
      'from fastapi.responses import (',
      '    HTMLResponse,  # voor de pagina',
      ')',
      'from fastapi.templating import \\',
      '    Jinja2Templates',
      'app = FastAPI()',
      'templates = Jinja2Templates(directory="templates")',
      '@app.post("/x", response_class=HTMLResponse)',
      'def x(naam: str = Form(...)):',
      '    return naam',
    ].join('\n');
    expect(samenhang(project({ 'main.py': main }))).toEqual([]);
  });
});

// De review van november 2026 van de hele nakijker vond deze valse en gemiste
// meldingen. Elk geval is nagedaan met het gastenboek uit de fixture.
describe('samenhang — review van de upload tool', () => {
  const FORM = 'static/pages/gastenboek_form.html';

  it('een meegeleverde htmx.min.js is geen ontbrekend bestand', () => {
    // isBibliotheek telt elk .min.js als bibliotheek, en de samenhang kreeg
    // alleen de bestanden van de leerling: elke leerling met de htmx-
    // uitbreiding kreeg "wijst naar een bestand dat er niet is".
    const p = leesFixture('compleet');
    p['static/js/htmx.min.js'] = '/* htmx */';
    p[FORM] = p[FORM].replace('</head>', '<script src="/static/js/htmx.min.js"></script></head>');
    expect(analyze(project(p), fullstackConfig).samenhang).toEqual([]);
    const zonder = Object.fromEntries(
      Object.entries(p).filter(([pad]) => pad !== 'static/js/htmx.min.js'),
    );
    expect(analyze(project(zonder), fullstackConfig).samenhang?.map((f) => f.titel)).toEqual([
      '/static/js/htmx.min.js wijst naar een bestand dat er niet is',
    ]);
  });

  it('losse bestanden zonder mappen geven geen meldingen over mappen', () => {
    // Kies bestanden met de zeven bestanden van het gastenboek: elk template
    // en elk static-bestand "bestond niet", terwijl ze net geüpload waren.
    const los = Object.fromEntries(
      Object.entries(leesFixture('compleet')).map(([pad, inhoud]) => [
        pad.split('/').at(-1),
        inhoud,
      ]),
    ) as Record<string, string>;
    expect(titels(project(los))).toEqual([]);
    expect(samenhang(project(los), project(los), { losseBestanden: true })).toEqual([]);
  });

  it('een map of zip met de templates naast main.py geeft wel de melding', () => {
    // Zelfde paden als bij losse bestanden, maar uit een map: de server zoekt
    // in templates/ en vindt het template niet.
    const plat = {
      'main.py': `from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(request, "home.html")
`,
      'home.html': '<h1>Hoi</h1>',
    };
    expect(
      samenhang(project(plat), project(plat), { losseBestanden: false }).map((f) => f.titel),
    ).toEqual(['Het template home.html bestaat niet']);
  });

  it('een vergeten Form(...) is een 422 uit de URL, geen veld dat weggegooid wordt', () => {
    const fouten = samenhang(
      compleetMet((p) => {
        p['main.py'] = p['main.py'].replace(
          'naam: str = Form(...), bericht: str = Form(...)',
          'naam: str, bericht: str',
        );
      }),
    );
    expect(fouten.map((f) => f.titel)).toEqual([
      'gastenboek_opslaan() zoekt "naam" in de URL, niet in het formulier',
      'gastenboek_opslaan() zoekt "bericht" in de URL, niet in het formulier',
    ]);
    expect(fouten[0].uitleg).toMatch(/= Form\(\.\.\.\).*422/s);
  });

  it('meldt geen ontbrekend veld als het formulier velden uit een include of block heeft', () => {
    for (const binnen of [
      '{% include "velden.html" %}',
      '{% block velden %}{% endblock %}',
      '<input name="{{ veld }}"><input name="bericht">',
    ]) {
      const p = compleetMet((q) => {
        q[FORM] = q[FORM].replace(/<form([^>]*)>[\s\S]*<\/form>/, `<form$1>${binnen}</form>`);
      });
      expect(titels(p), binnen).toEqual([]);
    }
  });

  it('een model uit Depends geeft geen "komt nergens aan"', () => {
    const p = compleetMet((q) => {
      q['main.py'] = q['main.py'].replace(
        'naam: str = Form(...), bericht: str = Form(...)',
        'data: Bericht = Depends(Bericht.as_form)',
      );
    });
    expect(titels(p)).toEqual([]);
    const leeg = compleetMet((q) => {
      q['main.py'] = q['main.py'].replace(
        'naam: str = Form(...), bericht: str = Form(...)',
        'data: Bericht = Depends()',
      );
    });
    expect(titels(leeg)).toEqual([]);
  });

  it('een database uit Depends naast Form slaat de controle niet over', () => {
    const p = compleetMet((q) => {
      q['main.py'] = q['main.py'].replace(
        'naam: str = Form(...), bericht: str = Form(...)',
        'naam: str = Form(...), bericht: str = Form(...), db = Depends(get_db)',
      );
      q[FORM] = q[FORM].replace('name="naam"', 'name="nam"');
    });
    expect(titels(p)).toContain('Het veld "nam" komt nergens aan');
  });

  it('een knop met een name komt niet als ontbrekend veld terug', () => {
    const p = compleetMet((q) => {
      q[FORM] = q[FORM].replace(
        '<button type="submit">',
        '<button type="submit" name="actie" value="opslaan">',
      );
    });
    expect(titels(p)).toEqual([]);
  });

  it('een formulier met method="delete" krijgt uitleg over get en post', () => {
    const p = compleetMet((q) => {
      q[FORM] = q[FORM].replace('method="post"', 'method="delete"');
    });
    expect(titels(p)).toEqual(['Een formulier kan geen DELETE sturen']);
    // Met hx-delete stuurt htmx de DELETE; method="dialog" stuurt niets.
    for (const tag of ['method="delete" hx-delete="/gastenboek"', 'method="dialog"']) {
      const goed = compleetMet((q) => {
        q[FORM] = q[FORM].replace('method="post"', tag);
      });
      expect(titels(goed), tag).toEqual([]);
    }
  });

  it('een link naar een route die alleen POST kent, is een 405 en geen 404', () => {
    const p = compleetMet((q) => {
      q[FORM] = q[FORM].replace('</form>', '</form><a href="/gastenboek_opslaan">x</a>');
      q['main.py'] = q['main.py'].replace(
        '@app.post("/gastenboek")',
        '@app.post("/gastenboek_opslaan")',
      );
      q[FORM] = q[FORM].replace('action="/gastenboek"', 'action="/gastenboek_opslaan"');
    });
    const fouten = samenhang(p);
    expect(fouten.map((f) => f.titel)).toEqual([
      'De link naar /gastenboek_opslaan gaat naar een route die alleen POST kent',
    ]);
    expect(fouten[0].uitleg).toContain('405');
  });

  it('een FileResponse met een stuk tekst ervoor wordt niet als pad gelezen', () => {
    const p = compleetMet((q) => {
      q['main.py'] = q['main.py'].replace(
        'FileResponse("static/pages/gastenboek_form.html")',
        'FileResponse("static/pages/" + "gastenboek_form.html")',
      );
    });
    expect(titels(p)).toEqual([]);
  });

  it('een RedirectResponse naar een route die niet bestaat', () => {
    const p = compleetMet((q) => {
      q['main.py'] = q['main.py'].replace('url="/berichten"', 'url="/berichtenn"');
    });
    expect(titels(p)).toEqual([
      'RedirectResponse stuurt door naar /berichtenn, en die route bestaat niet',
    ]);
    // Met een parameter of een query string past hij gewoon.
    const goed = compleetMet((q) => {
      q['main.py'] = q['main.py'].replace('url="/berichten"', 'url="/bericht/abc?nieuw=1"');
    });
    expect(titels(goed)).toEqual([]);
  });

  it('een RedirectResponse met een berekend pad, naar static of naar /docs is goed', () => {
    for (const doel of [
      '"/bericht/" + "abc"',
      'url="/static/pages/gastenboek_form.html"',
      'url="/docs"',
    ]) {
      const p = compleetMet((q) => {
        q['main.py'] = q['main.py'].replace('url="/berichten"', doel);
      });
      expect(titels(p), doel).toEqual([]);
    }
  });

  it('dezelfde kapotte link twee keer op een regel is één melding', () => {
    const p = compleetMet((q) => {
      q[FORM] = q[FORM].replace('</form>', '</form><a href="/weg">a</a> <a href="/weg">b</a>');
    });
    expect(titels(p)).toEqual(['De link naar /weg heeft geen route']);
  });
});
