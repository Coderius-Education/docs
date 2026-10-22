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
});
