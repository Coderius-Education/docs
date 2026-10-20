import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { maakBuitenLesstof } from './buitenLesstof';
import { webConfig } from './config';
import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';
import { berekenLesstof, stukkenUit } from './lesstof';
import niveaus from './niveaus.json';

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));
const SITE = fileURLToPath(new URL('../..', import.meta.url));

// Leest een voorbeeldproject van schijf en zet het om naar de vorm die de
// checker na een upload heeft. Bewust zonder readUploadedFiles: die is apart
// getest; hier gaat het om de conceptenlijst.
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
        kind: webConfig.classify(path),
        content,
        sizeBytes: content.length,
        tooLarge: false,
      };
    }
  };

  loop(wortel);
  return files;
}

/** Een project uit losse bestanden, voor de gevallen die geen voorbeeldproject nodig hebben. */
function project(bestanden: Record<string, string>): ProjectFiles {
  const files: ProjectFiles = {};
  for (const [path, content] of Object.entries(bestanden)) {
    files[path] = {
      path,
      kind: webConfig.classify(path),
      content,
      sizeBytes: content.length,
      tooLarge: false,
    };
  }
  return files;
}

function rij(files: ProjectFiles, id: string) {
  const m = analyze(files, webConfig).concepts.find((c) => c.id === id);
  if (!m) throw new Error(`geen rij '${id}' in webConfig`);
  return m;
}

// Asserteert op benoemde id's, uit de tabel of onder "Ook gebruikt", in
// plaats van op totalen. Elke genoemde id moet wel bestaan, anders wordt een
// assertie stilletjes betekenisloos.
function verwacht(naam: string, gebruikt: string[], ongebruikt: string[]): void {
  const report = analyze(leesFixture(naam), webConfig);
  const perId = new Map([...report.concepts, ...(report.extra ?? [])].map((c) => [c.id, c.used]));

  for (const id of [...gebruikt, ...ongebruikt]) {
    expect(perId.has(id), `concept '${id}' bestaat niet in webConfig`).toBe(true);
  }
  expect(gebruikt.filter((id) => !perId.get(id))).toEqual([]);
  expect(ongebruikt.filter((id) => perId.get(id))).toEqual([]);
}

describe('webConfig — de conceptenlijst zelf', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(webConfig)).toEqual([]);
  });

  it('telt precies de rijen uit de tabel van de docent, met hun niveau', () => {
    expect(webConfig.concepts.map((c) => [c.id, c.subject, c.label, c.level])).toEqual(
      niveaus.concepten.map((c) => [c.id, c.onderwerp, c.concept, c.niveau]),
    );
    // De tabel van de docent: 13 rijen basis, 11 gevorderd.
    expect(webConfig.concepts.filter((c) => c.level === 'basis')).toHaveLength(13);
    expect(webConfig.concepts.filter((c) => c.level === 'gevorderd')).toHaveLength(11);
  });

  it('zet elk ander concept uit de lessen onder "Ook gebruikt", zonder niveau', () => {
    const extra = webConfig.extra ?? [];
    expect(extra.length).toBeGreaterThan(0);
    for (const c of extra) expect(c).not.toHaveProperty('level');
    // Wat een rij al meet, staat er niet nog eens onder.
    const ids = new Set(extra.map((c) => c.id));
    for (const id of ['css-hover', 'html-ul', 'css-display-grid', 'js-onclick-attribute']) {
      expect(ids.has(id), id).toBe(false);
    }
    for (const id of ['html-p', 'css-color', 'js-let', 'html-button']) {
      expect(ids.has(id), id).toBe(true);
    }
    // Alles onder "Ook gebruikt" komt uit de lessen.
    const lessen = new Set([
      ...HTML_ELEMENTS.map((e) => `html-${e.tags.join('-')}`),
      ...CSS_TECHNIQUES.map((t) => t.id),
      ...JS_TECHNIQUES.map((t) => t.id),
    ]);
    expect(extra.filter((c) => !lessen.has(c.id))).toEqual([]);
  });

  it('classificeert bestanden op extensie', () => {
    expect(webConfig.classify('index.html')).toBe('html');
    expect(webConfig.classify('css/stijl.css')).toBe('css');
    expect(webConfig.classify('js/app.js')).toBe('js');
    expect(webConfig.classify('img/logo.png')).toBe('image');
    // Bewust: de cursus behandelt kale JS, dus .ts telt als overig.
    expect(webConfig.classify('app.ts')).toBe('other');
  });
});

describe('webConfig — voorbeeldprojecten scoren', () => {
  it('een minimale pagina levert alleen de koppen op', () => {
    verwacht(
      'minimaal',
      ['html-koppen', 'html-p'],
      ['css-tag-selector', 'js-script-tag', 'html-forms', 'css-flexbox-grid', 'css-color'],
    );
    // Een <p> staat niet in de tabel: herkend, maar onder "Ook gebruikt".
    const report = analyze(leesFixture('minimaal'), webConfig);
    expect(report.concepts.find((c) => c.id === 'html-p')).toBeUndefined();
  });

  it('een compleet leerlingproject herkent wat er echt in staat', () => {
    verwacht(
      'goed',
      [
        'css-tag-selector',
        'css-class',
        'html-koppen',
        'html-lijsten',
        'html-img',
        'html-a',
        'html-opbouw',
        'js-get-element-by-id',
        'js-script-tag',
        'js-script-js',
        'js-functies',
        'js-events',
        'js-if-else',
        // Ook gebruikt, telt niet mee:
        'html-p',
        'html-nav',
        'html-button',
        'css-color',
        'css-padding',
        'js-text-content',
        'js-class-list',
        'js-let',
      ],
      // Even belangrijk: de checker vinkt niet zomaar alles aan.
      [
        'css-pseudoclass',
        'css-id',
        'css-flexbox-grid',
        'css-media-query',
        'html-forms',
        'js-style',
        'js-prompt-alert',
        'js-add-event-listener',
        'js-arrays',
        'js-loops',
      ],
    );
  });

  it('noemt bij een rij met onderdelen welke er gevonden zijn', () => {
    const report = analyze(leesFixture('goed'), webConfig);
    const delen = new Map(report.concepts.map((c) => [c.id, c.delen]));
    expect(delen.get('html-koppen')).toEqual(['h1', 'h2']);
    expect(delen.get('html-lijsten')).toEqual(['li', 'ul']);
    expect(delen.get('html-opbouw')).toEqual(['footer', 'header', 'main']);
    expect(delen.get('css-tag-selector')).toEqual(['body']);
    expect(delen.get('js-events')).toEqual(['click']);
  });

  it('JavaScript in commentaar telt niet; HTML en CSS in commentaar wel — bekende beperking', () => {
    // BEVROREN GEDRAG voor HTML en CSS: de detectie is op reguliere
    // expressies, en weggecommentarieerde CSS of een tag in een
    // HTML-commentaar telt mee. Voor JavaScript niet meer: die patronen lopen
    // over de code zonder commentaar en zonder tekst tussen aanhalingstekens
    // (alleenJavaScript in buitenLesstof.ts).
    const report = analyze(leesFixture('valkuilen'), webConfig);
    const perId = new Map([...report.concepts, ...(report.extra ?? [])].map((c) => [c.id, c]));

    // Weggecommentarieerde CSS telt mee, een weggecommentarieerde alert niet.
    expect(perId.get('css-color')?.used).toBe(true);
    expect(perId.get('js-prompt-alert')?.used).toBe(false);
    // Een <select> die alleen in een HTML-commentaar staat, telt mee, net
    // als HTML-tags binnen een JavaScript-string.
    expect(perId.get('html-forms')?.delen).toEqual(['form', 'input', 'select']);

    // `.kaart:hover {` telt als class én als pseudoclass. Het patroon uit de
    // lessen eist `{` of `,` direct na de naam; de rij uit de tabel niet.
    expect(perId.get('css-class')?.used).toBe(true);
    expect(perId.get('css-pseudoclass')?.delen).toEqual([':hover']);
    // `(x) => [x]` is een functie die een array maakt.
    expect(perId.get('js-functies')?.delen).toEqual(['=>']);
    expect(perId.get('js-arrays')?.delen).toEqual(['array ([...])']);
  });
});

describe('webConfig — herkenning per rij', () => {
  it('vindt een tagselector aan het begin van een selector, ook na een commentaar', () => {
    const css = '/* kop */\nh1, h2 { color: red; }\nnav a { margin: 0 }\n.kaart p { padding: 0 }';
    expect(rij(project({ 'a.css': css }), 'css-tag-selector').delen).toEqual(['h1', 'h2', 'nav']);
  });

  it('ziet keyframe-stappen niet als tagselector', () => {
    const css = '@keyframes in { from { opacity: 0 } to { opacity: 1 } }';
    expect(rij(project({ 'a.css': css }), 'css-tag-selector').used).toBe(false);
  });

  it('vindt class en id ook met iets erachter, maar niet in een waarde', () => {
    const waardes = 'p { color: #fff; margin: 1.5em; background: url(a.png) }';
    expect(rij(project({ 'a.css': waardes }), 'css-class').used).toBe(false);
    expect(rij(project({ 'a.css': waardes }), 'css-id').used).toBe(false);
    const selectors = '.kaart h2 { margin: 0 }\n#menu:hover { color: red }';
    expect(rij(project({ 'a.css': selectors }), 'css-class').used).toBe(true);
    expect(rij(project({ 'a.css': selectors }), 'css-id').used).toBe(true);
  });

  it('telt tekst in een CSS-commentaar niet als selector', () => {
    // Een bestandsnaam bovenaan het CSS-bestand gaf eerst "class", een kleur
    // in een commentaar "id" en een opsomming van tags een tagselector.
    for (const commentaar of ['/* style.css */', '/* kleur #ccc */', '/* kop, nav :hover */']) {
      const files = project({ 'style.css': `${commentaar}\nbody { color: red }` });
      expect(rij(files, 'css-class').used, commentaar).toBe(false);
      expect(rij(files, 'css-id').used, commentaar).toBe(false);
      expect(rij(files, 'css-pseudoclass').used, commentaar).toBe(false);
      expect(rij(files, 'css-tag-selector').delen, commentaar).toEqual(['body']);
    }
  });

  it('telt CSS in een <style>-blok in de HTML niet — bekende beperking', () => {
    // BEVROREN GEDRAG. De CSS-patronen lopen alleen over .css-bestanden. Over
    // de hele HTML laten lopen kan niet: in `if (veld.value > 3) {` zou
    // `.value` een class zijn. Daarvoor moet de engine eerst de <style>-blokken
    // los kunnen lezen. Geen les zet CSS in de HTML.
    const files = project({ 'index.html': '<style>\n.kaart { color: red }\n</style>' });
    expect(rij(files, 'css-class').used).toBe(false);
  });

  it('telt elke pseudoclass, maar geen pseudo-element of declaratie', () => {
    const css = 'a:focus { color: red }\np::before { content: "x" }\nli:nth-child(2) { margin: 0 }';
    expect(rij(project({ 'a.css': css }), 'css-pseudoclass').delen).toEqual([
      ':focus',
      ':nth-child',
    ]);
  });

  it('noemt welke delen van flexbox of grid er zijn', () => {
    const css = '.rij { display: flex; gap: 8px }';
    expect(rij(project({ 'a.css': css }), 'css-flexbox-grid').delen).toEqual([
      'display: flex',
      'gap',
    ]);
  });

  it('onderscheidt een script-tag van een eigen script.js', () => {
    const inline = project({ 'index.html': '<script>alert("hoi")</script>' });
    expect(rij(inline, 'js-script-tag').used).toBe(true);
    expect(rij(inline, 'js-script-js').used).toBe(false);
    const extern = project({ 'index.html': '<script src="script.js"></script>' });
    expect(rij(extern, 'js-script-js').used).toBe(true);
    // Een bibliotheek van een andere site is geen eigen script.js.
    for (const src of ['https://cdn.example.com/lib.js', '//cdn.example.com/lib.js']) {
      const cdn = project({ 'index.html': `<script src="${src}"></script>` });
      expect(rij(cdn, 'js-script-js').used, src).toBe(false);
      expect(rij(cdn, 'js-script-tag').used, src).toBe(true);
    }
  });

  it('vindt JavaScript ook in een script-blok in de HTML', () => {
    // De les over de script-tag zet de code in de HTML; vroeger telde die niet.
    const files = project({ 'index.html': '<script>\nlet x = prompt("Naam?");\n</script>' });
    expect(rij(files, 'js-prompt-alert').delen).toEqual(['prompt()']);
  });

  it('noemt de events, als attribuut of met addEventListener', () => {
    const files = project({
      'index.html': '<button onclick="klik()">Klik</button>',
      'app.js': "kaart.addEventListener('mouseover', maakActief);",
    });
    expect(rij(files, 'js-events').delen).toEqual(['click', 'mouseover']);
    expect(rij(files, 'js-add-event-listener').used).toBe(true);
  });

  it('telt onClick met een hoofdletter ook als event', () => {
    // Het oude patroon was hoofdletterongevoelig; het eerste nieuwe niet.
    const files = project({ 'index.html': '<button onClick="klik()">Klik</button>' });
    expect(rij(files, 'js-events').delen).toEqual(['click']);
  });
});

describe('webConfig — buiten de lesstof', () => {
  // Zoals de docentpagina hem samenstelt, met de lesstof uit de lessen.
  const docentConfig = { ...webConfig, buitenLesstof: maakBuitenLesstof(berekenLesstof(SITE)) };

  it('de leerling krijgt de zoeker niet mee', () => {
    expect(webConfig.buitenLesstof).toBeUndefined();
  });

  it('meldt niets bij een project dat alleen lesstof gebruikt', () => {
    expect(analyze(leesFixture('goed'), docentConfig).buitenLesstof).toEqual([]);
  });

  it('een meegeleverde bibliotheek levert geen vondsten op, en het rapport noemt hem', () => {
    // jQuery staat vol met constructies die de lessen niet behandelen
    // (class, new, de ternary); die schreef de leerling niet zelf.
    const files = {
      ...leesFixture('goed'),
      ...project({
        'js/jquery.min.js': '/*! jQuery */\nclass A{} new A(); x ? a : b; y = () => 1;',
      }),
    };
    const report = analyze(files, docentConfig);
    expect(report.buitenLesstof).toEqual([]);
    expect(report.warnings).toContain(
      'Niet meegeteld: js/jquery.min.js. Dat is een bibliotheek, geen eigen code.',
    );
  });

  it('meldt de arrow-functie uit de valkuilen, die geen les gebruikt', () => {
    const vondsten = analyze(leesFixture('valkuilen'), docentConfig).buitenLesstof;
    expect(vondsten.map((v) => v.label)).toContain('=> (arrow-functie)');
  });
});

describe('webConfig — JavaScript wordt herkend waar het staat', () => {
  // Elk geval is een klein leerlingprogramma met wat de nakijker moet zien.
  // De eerste versie liep in 16 van deze gevallen fout: patronen liepen over
  // de hele HTML en over commentaar en strings, `let onderwerp = …` telde als
  // event, `Number(prompt())` als formulier, en een arrow-functie, `forEach`
  // of een array als argument werden gemist.
  const GEVALLEN: [string, Record<string, string>, Record<string, boolean>][] = [
    [
      'een Nederlandse variabele die met "on" begint',
      { 'a.js': 'let onderwerp = "wiskunde";\nlet online = "ja";' },
      { 'js-events': false },
    ],
    ['een event als eigenschap', { 'a.js': 'knop.onclick = toon;' }, { 'js-events': true }],
    [
      'een vergelijking met .onclick is geen koppeling',
      { 'a.js': 'if (knop.onclick == null) {}' },
      { 'js-events': false },
    ],
    [
      'een arrow-functie',
      { 'a.js': 'const groet = () => {\n  alert("hoi");\n};' },
      { 'js-functies': true },
    ],
    [
      'een naamloze functie',
      { 'a.js': 'const groet = function () {\n  alert("hoi");\n};' },
      { 'js-functies': true },
    ],
    [
      'een methode in een object',
      { 'a.js': 'const speler = {\n  spring() {\n    y++;\n  },\n};' },
      { 'js-functies': true },
    ],
    [
      'een if is geen methode',
      { 'a.js': 'if (x) {\n  y++;\n}\nwhile (x) {\n}' },
      { 'js-functies': false },
    ],
    ['een async function', { 'a.js': 'async function laad() {}' }, { 'js-functies': true }],
    [
      'een static methode',
      { 'a.js': 'class Speler {\n  static maak() {\n    return 1;\n  }\n}' },
      { 'js-functies': true },
    ],
    [
      'een async methode',
      { 'a.js': 'const api = {\n  async laad() {\n  },\n};' },
      { 'js-functies': true },
    ],
    [
      'een event na een attribuut met >',
      { 'index.html': '<input value="a>b" onclick="f()">' },
      { 'js-events': true },
    ],
    [
      'jQuery naast eigen HTML telt niet als eigen JavaScript',
      {
        'index.html': '<h1>Hoi</h1>\n<script src="js/jquery.min.js"></script>',
        'js/jquery.min.js':
          '/*! jQuery v3.7.1 */\n!function(e){for(var i=0;i<3;i++){if(e.style){}}var t=[];e.addEventListener("load",f)}(window);',
      },
      {
        'js-functies': false,
        'js-loops': false,
        'js-arrays': false,
        'js-if-else': false,
        'js-events': false,
        'js-script-js': true,
      },
    ],
    [
      'Bootstrap naast eigen CSS telt niet als eigen CSS',
      {
        'style.css': 'body { margin: 0; }',
        'css/bootstrap.min.css':
          '.btn:hover{color:red}@media (min-width:576px){.row{display:flex}}',
      },
      {
        'css-pseudoclass': false,
        'css-media-query': false,
        'css-flexbox-grid': false,
        'css-tag-selector': true,
      },
    ],
    [
      'Number(prompt()) is geen formulier',
      { 'a.js': 'let leeftijd = Number(prompt("Hoe oud?"));' },
      { 'js-formulier-data': false, 'js-prompt-alert': true },
    ],
    [
      'de waarde van een invoerveld',
      { 'a.js': 'let naam = document.getElementById("naam").value;' },
      { 'js-formulier-data': true, 'js-get-element-by-id': true },
    ],
    [
      'een for in commentaar',
      { 'a.js': '// for (let i = 0; i < 3; i++) {}\nalert("x");' },
      { 'js-loops': false },
    ],
    ['een if in een string', { 'a.js': 'alert("if (je wilt) kan het");' }, { 'js-if-else': false }],
    [
      '"let op" in een alinea',
      { 'index.html': '<p>Je moet hier wel even let op de kleur.</p>' },
      { 'js-let': false },
    ],
    [
      'getElementById in uitleg',
      { 'index.html': '<p>Gebruik getElementById() om iets te vinden.</p>' },
      { 'js-get-element-by-id': false },
    ],
    [
      '.value in uitleg',
      { 'index.html': '<p>De .value van een veld</p>' },
      { 'js-formulier-data': false },
    ],
    [
      'een stylesheet met style in de naam',
      { 'index.html': '<link rel="stylesheet" href="main.style.css">' },
      { 'js-style': false },
    ],
    [
      'een if in een HTML-commentaar',
      { 'index.html': '<!-- <script>if (oud) {}</script> -->' },
      { 'js-if-else': false },
    ],
    [
      'getElementById in commentaar',
      { 'a.js': '/* document.getElementById("x") */' },
      { 'js-get-element-by-id': false },
    ],
    ['forEach', { 'a.js': 'lijst.forEach(toon);' }, { 'js-loops': true }],
    ['for … of', { 'a.js': 'for (const x of lijst) { toon(x); }' }, { 'js-loops': true }],
    ['while zonder spatie', { 'a.js': 'while(x < 3){x++}' }, { 'js-loops': true }],
    ['een lege array', { 'a.js': 'const lijst = [];' }, { 'js-arrays': true }],
    ['een array als argument', { 'a.js': 'toon([1, 2, 3]);' }, { 'js-arrays': true }],
    ['een array na of', { 'a.js': 'for (const x of [1, 2]) {}' }, { 'js-arrays': true }],
    [
      'lijst[0] maakt geen array',
      { 'a.js': 'let eerste = lijst[0];\nconst [a, b] = paar;' },
      { 'js-arrays': false },
    ],
    [
      'JavaScript in een script-blok',
      { 'index.html': '<script>\nif (x > 3) { alert("ja"); }\n</script>' },
      { 'js-if-else': true, 'js-prompt-alert': true },
    ],
    [
      'een alert in een onclick-attribuut',
      { 'index.html': '<button onclick="alert(\'hoi\')">Klik</button>' },
      { 'js-events': true, 'js-prompt-alert': true },
    ],
    [
      'een submit-event',
      { 'a.js': "form.addEventListener('submit', verstuur);" },
      { 'js-events': true, 'js-add-event-listener': true },
    ],
    [
      'style.setProperty',
      { 'a.js': "el.style.setProperty('color', 'red');" },
      { 'js-style': true },
    ],
  ];

  it.each(GEVALLEN)('%s', (_naam, bestanden, verwacht) => {
    const report = analyze(project(bestanden), webConfig);
    const alle = new Map([...report.concepts, ...(report.extra ?? [])].map((m) => [m.id, m.used]));
    for (const [id, moet] of Object.entries(verwacht)) {
      expect(alle.has(id), `onbekend concept ${id}`).toBe(true);
      expect(alle.get(id), id).toBe(moet);
    }
  });

  it('een vondst in een script-blok wijst naar de goede regel van het HTML-bestand', () => {
    const html = '<!DOCTYPE html>\n<p>tekst</p>\n<script>\n  let a = 1;\n  if (a) {}\n</script>';
    const report = analyze(project({ 'index.html': html }), webConfig);
    expect(report.concepts.find((c) => c.id === 'js-if-else')?.plekken).toEqual([
      { bestand: 'index.html', regel: 5 },
    ]);
  });

  it('de afgeleide teksten zijn zo lang als het bestand', () => {
    const html =
      '<p>let op</p>\n<script>\n// x\nlet s = "a\\"b";\n</script>\n<b onclick="f(\'x\')">x</b>';
    for (const a of webConfig.afgeleid ?? []) {
      for (const soort of a.van) {
        const uit = a.maak(html, soort);
        expect(uit.length, `${a.kind} uit ${soort}`).toBe(html.length);
        expect(uit.split('\n').length, `${a.kind} uit ${soort}`).toBe(html.split('\n').length);
      }
    }
  });

  it('noemt welke soort functie, lus of array het is', () => {
    const report = analyze(
      project({
        'a.js':
          'function a() {}\nconst b = () => 1;\nfor (;;) {}\nlijst.forEach(a);\nlijst.push(1);',
      }),
      webConfig,
    );
    const delen = new Map(report.concepts.map((c) => [c.id, c.delen]));
    expect(delen.get('js-functies')).toEqual(['=>', 'function naam()']);
    expect(delen.get('js-loops')).toEqual(['for-loop', 'forEach()']);
    expect(delen.get('js-arrays')).toEqual(['.push()']);
  });
});

describe('webConfig — elke js-basics-les laat zien wat ze aanleert', () => {
  // De code van een les, als project geüpload, moet de rij uit de tabel
  // opleveren die die les aanleert. Zo merkt een strenger patroon het meteen
  // als het de code van de lessen zelf niet meer herkent.
  const LES_RIJ: Record<string, string[]> = {
    'tekst-veranderen': ['js-get-element-by-id'],
    'inline-onclick': ['js-events'],
    'inline-stijl': ['js-style'],
    'script-tag': ['js-script-tag'],
    scriptjs: ['js-script-js'],
    'prompt-alert': ['js-prompt-alert'],
    events: ['js-add-event-listener', 'js-events'],
    'if-else': ['js-if-else'],
    'formulier-data': ['js-formulier-data'],
    arrays: ['js-arrays'],
    loops: ['js-loops'],
  };

  it.each(Object.entries(LES_RIJ))('%s', (les, rijen) => {
    const bron = readFileSync(join(SITE, 'docs', 'js-basics', `${les}.mdx`), 'utf8');
    const bestanden: Record<string, string> = {};
    stukkenUit(bron).forEach((stuk, i) => {
      bestanden[`stuk${i}.${stuk.soort}`] = stuk.tekst;
    });
    const report = analyze(project(bestanden), webConfig);
    const gebruikt = new Set(report.concepts.filter((c) => c.used).map((c) => c.id));
    expect(rijen.filter((id) => !gebruikt.has(id))).toEqual([]);
  });
});
