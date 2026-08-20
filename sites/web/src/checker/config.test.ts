import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { webConfig } from './config';

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

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

// Asserteert op benoemde concept-id's in plaats van op totalen, zodat een
// nieuwe les in de cheatsheet deze tests niet breekt. Elke genoemde id moet
// wel bestaan — anders wordt een assertie stilletjes betekenisloos.
function verwacht(naam: string, gebruikt: string[], ongebruikt: string[]): void {
  const report = analyze(leesFixture(naam), webConfig);
  const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

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

  it('dekt alle drie de onderwerpen met een flink aantal concepten', () => {
    // Ondergrens, geen exact getal: concepten toevoegen mag, een halvering valt op.
    expect(webConfig.concepts.length).toBeGreaterThanOrEqual(70);
    for (const subject of ['html', 'css', 'js']) {
      expect(webConfig.concepts.filter((c) => c.subject === subject).length).toBeGreaterThan(10);
    }
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
  it('een minimale pagina levert alleen de basis-HTML op', () => {
    verwacht(
      'minimaal',
      ['html-h1-h2-h3-h4-h5-h6', 'html-p'],
      ['css-color', 'js-let', 'html-form', 'css-display-flex'],
    );
  });

  it('een compleet leerlingproject herkent wat er echt in staat', () => {
    verwacht(
      'goed',
      [
        'html-h1-h2-h3-h4-h5-h6',
        'html-p',
        'html-ul',
        'html-li',
        'html-a',
        'html-img',
        'html-header',
        'html-nav',
        'html-main',
        'html-section',
        'html-footer',
        'html-button',
        'css-color',
        'css-font-family',
        'css-background-color',
        'css-padding',
        'css-margin',
        'css-border',
        'css-width',
        'css-class-selector',
        'js-get-element-by-id',
        'js-text-content',
        'js-class-list',
        'js-function',
        'js-let',
        'js-const',
        'js-if-else',
        'js-onclick-attribute',
      ],
      // Even belangrijk: de checker vinkt niet zomaar alles aan.
      [
        'css-display-flex',
        'css-display-grid',
        'css-media-query',
        'html-form',
        'html-textarea',
        'js-while',
        'js-array-push',
      ],
    );
  });

  it('telt code in commentaar en in strings mee — bekende beperking', () => {
    // BEVROREN GEDRAG, geen gewenst gedrag. De detectie is puur op reguliere
    // expressies zonder parser, dus weggecommentarieerde code telt gewoon mee.
    // Netjes oplossen vraagt een echte HTML/CSS/JS-parser; dat staat niet in
    // verhouding tot een checklist-tool. Deze test legt vast wat er nú gebeurt,
    // zodat een toekomstige wijziging een bewuste keuze is.
    const report = analyze(leesFixture('valkuilen'), webConfig);
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    // Weggecommentarieerde CSS en JS tellen mee.
    expect(perId.get('css-color')).toBe(true);
    expect(perId.get('js-alert')).toBe(true);
    // Een <select> die alleen in een HTML-commentaar staat, telt ook mee.
    expect(perId.get('html-select')).toBe(true);
    // En HTML-tags binnen een JavaScript-string net zo goed.
    expect(perId.get('html-form')).toBe(true);
    expect(perId.get('html-input')).toBe(true);

    // En twee patronen die juist té streng zijn:
    // `.kaart:hover {` telt niet als klasse-selector (het patroon eist { of ,
    // direct na de naam), en `(x) => [x]` telt niet als array.
    expect(perId.get('css-hover')).toBe(true);
    expect(perId.get('css-class-selector')).toBe(false);
    expect(perId.get('js-array-literal')).toBe(false);
  });
});
