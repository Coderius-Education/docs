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
import { berekenLesstof } from './lesstof';
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

  it('telt code in commentaar en in strings mee — bekende beperking', () => {
    // BEVROREN GEDRAG, geen gewenst gedrag. De detectie is puur op reguliere
    // expressies zonder parser, dus weggecommentarieerde code telt gewoon mee.
    // Netjes oplossen vraagt een echte HTML/CSS/JS-parser; dat staat niet in
    // verhouding tot een checklist-tool. Deze test legt vast wat er nú gebeurt,
    // zodat een toekomstige wijziging een bewuste keuze is.
    const report = analyze(leesFixture('valkuilen'), webConfig);
    const perId = new Map([...report.concepts, ...(report.extra ?? [])].map((c) => [c.id, c]));

    // Weggecommentarieerde CSS en JS tellen mee.
    expect(perId.get('css-color')?.used).toBe(true);
    expect(perId.get('js-prompt-alert')?.delen).toEqual(['alert()']);
    // Een <select> die alleen in een HTML-commentaar staat, telt ook mee, net
    // als HTML-tags binnen een JavaScript-string.
    expect(perId.get('html-forms')?.delen).toEqual(['form', 'input', 'select']);

    // `.kaart:hover {` telt als class én als pseudoclass. Het patroon uit de
    // lessen eist `{` of `,` direct na de naam; de rij uit de tabel niet.
    expect(perId.get('css-class')?.used).toBe(true);
    expect(perId.get('css-pseudoclass')?.delen).toEqual([':hover']);
    // `(x) => [x]` telt niet als array: het patroon eist `= [`.
    expect(perId.get('js-arrays')?.used).toBe(false);
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

  it('meldt de arrow-functie uit de valkuilen, die geen les gebruikt', () => {
    const vondsten = analyze(leesFixture('valkuilen'), docentConfig).buitenLesstof;
    expect(vondsten.map((v) => v.label)).toContain('=> (arrow-functie)');
  });
});
