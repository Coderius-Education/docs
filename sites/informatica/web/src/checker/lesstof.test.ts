import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProjectFiles } from '@coderius/checker/types';
import { describe, expect, it } from 'vitest';
import { GROEPEN, type Stuk, buitenLesstof, constructiesIn, sleutel } from './buitenLesstof';
import LESSTOF from './lesstof.json';

// lesstof.json is wat de nakijker "behandeld in de lessen" noemt. Het hoort
// precies te zijn wat de code van de lessen en de cheatsheet gebruikt: staat
// er iets te weinig in, dan krijgt een docent een gespreksvraag over iets dat
// gewoon in les 3 stond; staat er te veel in, dan verdwijnt een echte vondst.
// Deze test rekent de lijst na. Na een wijziging in de lessen schrijf je hem
// opnieuw met
//
//   LESSTOF_SCHRIJVEN=1 pnpm vitest run sites/informatica/web/src/checker/lesstof.test.ts

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const BRONNEN = [join(SITE, 'docs'), join(SITE, 'src/pages/cheatsheet.mdx')];

function bestanden(pad: string): string[] {
  if (!statSync(pad).isDirectory()) return [pad];
  return readdirSync(pad).flatMap((naam) => bestanden(join(pad, naam)));
}

/** De code op een lespagina: codeblokken en startcode in MDX-exports. */
function stukkenUit(bron: string): Stuk[] {
  const stukken: Stuk[] = [];
  for (const m of bron.matchAll(/```(html|css|js|javascript)\b[^\n]*\n([\s\S]*?)```/g)) {
    // Een fout-voorbeeld ("getElementByID met een hoofdletter D") is geen
    // lesstof: het blok erna is dan de foutmelding van de browser.
    const erna = bron.slice((m.index ?? 0) + m[0].length);
    if (/^\s*```\n[^`]*?(?:fout|Error)/.test(erna)) continue;
    stukken.push({ soort: m[1] === 'javascript' ? 'js' : (m[1] as Stuk['soort']), tekst: m[2] });
  }
  for (const m of bron.matchAll(/export const \w*?(Html|Css|Js) = `([\s\S]*?)(?<!\\)`;/g)) {
    const soort = m[1].toLowerCase() as Stuk['soort'];
    stukken.push({ soort, tekst: m[2].replace(/\\([`$\\])/g, '$1') });
  }
  return stukken;
}

function lesstofUitDeLessen(): Record<string, string[]> {
  const stukken = BRONNEN.flatMap(bestanden)
    .filter((pad) => /\.mdx?$/.test(pad))
    .flatMap((pad) => stukkenUit(readFileSync(pad, 'utf8')));
  const perGroep: Record<string, string[]> = Object.fromEntries(GROEPEN.map((g) => [g, []]));
  for (const k of constructiesIn(stukken).keys()) {
    const [groep, ...rest] = k.split('|');
    perGroep[groep].push(rest.join('|'));
  }
  for (const labels of Object.values(perGroep)) labels.sort();
  return perGroep;
}

function project(bestanden: Record<string, string>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(bestanden).map(([path, content]) => [
      path,
      {
        path,
        kind: path.split('.').pop() ?? 'other',
        content,
        sizeBytes: content.length,
        tooLarge: false,
      },
    ]),
  );
}

const labels = (files: ProjectFiles) => buitenLesstof(files).map((v) => `${v.groep}|${v.label}`);

describe('lesstof.json', () => {
  const berekend = lesstofUitDeLessen();

  if (process.env.LESSTOF_SCHRIJVEN) {
    writeFileSync(
      fileURLToPath(new URL('./lesstof.json', import.meta.url)),
      `${JSON.stringify(berekend, null, 2)}\n`,
    );
  }

  it('is precies wat de code van de lessen en de cheatsheet gebruikt', () => {
    const lijst = LESSTOF as Record<string, string[]>;
    const inJson = new Set(
      Object.entries(lijst).flatMap(([g, ls]) => ls.map((l) => sleutel(g, l))),
    );
    const inLessen = new Set(
      Object.entries(berekend).flatMap(([g, ls]) => ls.map((l) => sleutel(g, l))),
    );
    const erbij = [...inLessen].filter((k) => !inJson.has(k));
    const eraf = [...inJson].filter((k) => !inLessen.has(k));
    expect(
      { erbij, eraf },
      'lesstof.json loopt niet gelijk met de lessen; schrijf hem opnieuw (zie de kop van deze test)',
    ).toEqual({ erbij: [], eraf: [] });
  });

  it('vindt de basis die elke les gebruikt', () => {
    // Een kapotte extractie zou de lijst leeg laten en elk project vol
    // vondsten zetten.
    expect(berekend['HTML-elementen']).toEqual(expect.arrayContaining(['<p>', '<h1>', '<body>']));
    expect(berekend['CSS-eigenschappen']).toEqual(expect.arrayContaining(['color', 'margin']));
    expect(berekend.JavaScript).toEqual(expect.arrayContaining(['.addEventListener()']));
  });

  it('kent geen naamloze of arrow-functies, want die staan niet in de lessen', () => {
    // Afspraak uit web/CLAUDE.md: alle functies in het lesmateriaal hebben een
    // naam. Een arrow-functie in een project is dus altijd een vondst.
    expect(berekend.JavaScript).not.toContain('=> (arrow-functie)');
  });
});

describe('buitenLesstof — wat een project meer gebruikt', () => {
  it('meldt niets voor een project dat alleen lesstof gebruikt', () => {
    const files = project({
      'index.html':
        '<!DOCTYPE html><html><head><title>Hoi</title></head><body><p>Hoi</p></body></html>',
      'style.css': 'p { color: red; margin: 10px; }',
    });
    expect(buitenLesstof(files)).toEqual([]);
  });

  it('vindt een element, een at-regel en een arrow-functie, met het bestand erbij', () => {
    const files = project({
      'index.html': '<body><canvas id="c"></canvas><canvas></canvas></body>',
      'style.css': '@keyframes draai { to { color: red; } }',
      'app.js':
        'const knop = document.getElementById("knop");\nknop.addEventListener("click", () => {});',
    });
    const vondsten = buitenLesstof(files);
    expect(vondsten).toContainEqual({
      groep: 'HTML-elementen',
      label: '<canvas>',
      count: 2,
      files: ['index.html'],
    });
    expect(labels(files)).toEqual(
      expect.arrayContaining(['CSS-at-regels|@keyframes', 'JavaScript|=> (arrow-functie)']),
    );
  });

  it('leest CSS in een <style>-blok en JavaScript in een <script>-blok mee', () => {
    const files = project({
      'index.html':
        '<style>p { transform: rotate(10deg); }</style><script>fetch("data.json");</script>',
    });
    expect(labels(files)).toEqual(
      expect.arrayContaining([
        'CSS-eigenschappen|transform',
        'CSS-waarden|rotate()',
        'CSS-waarden|deg',
        'JavaScript|fetch()',
      ]),
    );
  });

  it('telt niets in commentaar of in tekst tussen aanhalingstekens', () => {
    const files = project({
      'index.html': '<!-- <canvas> --><p>Hoi</p>',
      'app.js': '// fetch("x") => y\nconst tekst = "klik => hier";',
    });
    expect(labels(files)).not.toEqual(expect.arrayContaining(['HTML-elementen|<canvas>']));
    expect(labels(files).filter((l) => l.startsWith('JavaScript|=>'))).toEqual([]);
    expect(labels(files)).not.toContain('JavaScript|fetch()');
  });

  it('houdt classList.remove() en element.remove() uit elkaar', () => {
    const files = project({
      'app.js':
        'knop.classList.remove("aan");\ndocument.querySelector(".kaart").classList.remove("aan");',
    });
    expect(labels(files)).not.toContain('JavaScript|.remove()');
    expect(labels(project({ 'app.js': 'knop.remove();' }))).toContain('JavaScript|.remove()');
  });

  it('noemt eigen namen niet: een eigen eigenschap of functie is geen techniek', () => {
    const files = project({
      'app.js': 'const speler = { score: 0 };\nfunction teken() {}\nspeler.score = 1;\nteken();',
    });
    expect(labels(files).filter((l) => /score|teken/.test(l))).toEqual([]);
  });

  it('vat data-* en eigen CSS-variabelen samen tot één vondst', () => {
    const files = project({
      'index.html': '<div data-kleur="rood" data-maat="2"></div>',
      'style.css': ':root { --hoofd: red; --rand: blue; }',
    });
    expect(labels(files)).toEqual(
      expect.arrayContaining(['HTML-attributen|data-*', 'CSS-eigenschappen|--*']),
    );
  });

  it('zet de vondsten op groep, in de volgorde van het rapport', () => {
    const files = project({
      'app.js': 'fetch("x");',
      'index.html': '<canvas></canvas>',
      'style.css': 'p { transform: none; }',
    });
    const groepen = buitenLesstof(files).map((v) => v.groep);
    expect(groepen).toEqual(
      [...groepen].sort((a, b) => GROEPEN.indexOf(a as never) - GROEPEN.indexOf(b as never)),
    );
  });
});

describe('stukkenUit — de code van een lespagina', () => {
  it('neemt codeblokken en startcode-exports, met de soort uit de naam, maar geen fout-voorbeeld', () => {
    const bron = [
      'export const startHtml = `<p>Hoi</p>`;',
      'export const makeJs = `const x = \\`a\\`;`;',
      '```css',
      'p { color: red; }',
      '```',
      '```bash',
      'npm start',
      '```',
      '```html',
      '<button onclick="document.getElementByID(1)">Klik</button>',
      '```',
      '',
      '```',
      'JavaScript fout: document.getElementByID is not a function',
      '```',
    ].join('\n');
    expect(stukkenUit(bron)).toEqual([
      { soort: 'css', tekst: 'p { color: red; }\n' },
      { soort: 'html', tekst: '<p>Hoi</p>' },
      { soort: 'js', tekst: 'const x = `a`;' },
    ]);
  });
});
