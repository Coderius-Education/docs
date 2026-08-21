import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
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

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

// Leest een voorbeeldproject van schijf, net als de helper in web. Zelfde
// afspraak: assereer op benoemde concept-id's en nooit op totalen, zodat een
// nieuwe les deze tests alleen breekt als hij precies deze concepten raakt.
function leesFixture(naam: string): ProjectFiles {
  const wortel = join(FIXTURES, naam);
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
  const report = analyze(leesFixture(naam), fullstackConfig);
  const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

  for (const id of [...gebruikt, ...ongebruikt]) {
    expect(perId.has(id), `concept '${id}' bestaat niet in fullstackConfig`).toBe(true);
  }
  expect(gebruikt.filter((id) => !perId.get(id))).toEqual([]);
  expect(ongebruikt.filter((id) => perId.get(id))).toEqual([]);
}

describe('fullstackConfig — voorbeeldprojecten scoren', () => {
  it('een project met alleen een endpoint levert alleen de basis op', () => {
    verwacht(
      'minimaal',
      ['fastapi-app', 'fastapi-get', 'struct-main'],
      [
        'fastapi-post',
        'fastapi-templates',
        'fastapi-redirect',
        'fastapi-httpexception',
        'db-sqlitedict',
        'struct-static',
        'struct-templates',
        'html-basis',
        'js-query-selector',
      ],
    );
  });

  it('een compleet gastenboek herkent wat er echt in staat', () => {
    verwacht(
      'compleet',
      [
        'fastapi-app',
        'fastapi-get',
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
        'html-jinja-if',
        'js-bestand-koppelen',
        'js-query-selector',
        'js-event-listener',
        'db-sqlitedict',
        'db-write',
        'db-commit',
        'db-get',
        'db-items',
        'struct-main',
        'struct-static',
        'struct-templates',
      ],
      // Even belangrijk: de nakijker vinkt niet zomaar alles aan. Deze fixture
      // doet de fetch-les niet, dus js-fetch hoort uit te blijven.
      ['fastapi-html-response', 'db-del', 'js-fetch'],
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
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('struct-main')).toBe(true);
    expect(perId.get('struct-static')).toBe(true);
    expect(perId.get('struct-templates')).toBe(true);
  });

  it('vindt de mappen niet als ze er niet zijn', () => {
    const report = analyze(files({ 'app.py': 'print("hoi")' }), fullstackConfig);
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('struct-main')).toBe(false);
    expect(perId.get('struct-static')).toBe(false);
    expect(perId.get('struct-templates')).toBe(false);
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
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('fastapi-redirect')).toBe(true);
    expect(perId.get('fastapi-httpexception')).toBe(true);
    expect(perId.get('fastapi-path-param')).toBe(true);
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
          '    del db[sleutel]',
        ].join('\n'),
      }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('fastapi-html-response')).toBe(true);
    expect(perId.get('db-del')).toBe(true);
  });

  it('ziet een route zonder accolades niet aan voor een path-parameter', () => {
    const report = analyze(
      files({ 'main.py': '@app.get("/berichten")\nasync def berichten():\n    return []' }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('fastapi-path-param')).toBe(false);
    expect(perId.get('fastapi-redirect')).toBe(false);
    expect(perId.get('fastapi-httpexception')).toBe(false);
  });

  // Voor de JS-lessen werd .js als 'other' geclassificeerd en stond het niet in
  // textKinds, dus werd een JavaScript-bestand niet eens ingelezen.
  it('leest JavaScript-bestanden en herkent wat erin staat', () => {
    expect(fullstackConfig.classify('static/js/app.js')).toBe('js');
    expect(fullstackConfig.textKinds).toContain('js');

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
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('js-bestand-koppelen')).toBe(true);
    expect(perId.get('js-query-selector')).toBe(true);
    expect(perId.get('js-event-listener')).toBe(true);
  });

  it('herkent fetch, en niet in een bestand dat het alleen noemt', () => {
    const met = analyze(
      files({ 'static/js/app.js': 'const a = await fetch("/api/berichten");' }),
      fullstackConfig,
    );
    expect(new Map(met.concepts.map((c) => [c.id, c.used])).get('js-fetch')).toBe(true);

    // 'prefetch' of 'fetchData' mag niet meetellen: het patroon eist een
    // woordgrens plus een haakje.
    const zonder = analyze(
      files({ 'static/js/app.js': 'const fetchData = 1; prefetch(x); element.fetchAll;' }),
      fullstackConfig,
    );
    expect(new Map(zonder.concepts.map((c) => [c.id, c.used])).get('js-fetch')).toBe(false);
  });

  it('telt JavaScript in een HTML-bestand niet mee als JavaScript-concept', () => {
    // De cursus leert een apart bestand in static/js/. Een inline <script>-blok
    // met dezelfde code hoort dus niet als "querySelector gebruikt" te tellen.
    const report = analyze(
      files({
        'templates/form.html':
          '<script>document.querySelector("#x").addEventListener("click", f);</script>',
      }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('js-query-selector')).toBe(false);
    expect(perId.get('js-event-listener')).toBe(false);
    expect(perId.get('js-bestand-koppelen')).toBe(false);
  });

  it('onderscheidt een template met een lus van een template met alleen variabelen', () => {
    const metLus = analyze(
      files({
        'templates/berichten.html':
          '{% if berichten %}<ul>{% for b in berichten %}<li>{{ b.naam }}</li>{% endfor %}</ul>{% endif %}',
      }),
      fullstackConfig,
    );
    const lus = new Map(metLus.concepts.map((c) => [c.id, c.used]));
    expect(lus.get('html-jinja-loop')).toBe(true);
    expect(lus.get('html-jinja-if')).toBe(true);
    expect(lus.get('html-jinja-var')).toBe(true);

    const zonderLus = analyze(
      files({ 'templates/groet.html': '<h1>Hallo {{ naam }}</h1>' }),
      fullstackConfig,
    );
    const plat = new Map(zonderLus.concepts.map((c) => [c.id, c.used]));
    expect(plat.get('html-jinja-var')).toBe(true);
    expect(plat.get('html-jinja-loop')).toBe(false);
    expect(plat.get('html-jinja-if')).toBe(false);
  });
});
