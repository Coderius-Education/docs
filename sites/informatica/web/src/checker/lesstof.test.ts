import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProjectFiles } from '@coderius/checker/types';
import { describe, expect, it } from 'vitest';
import { GROEPEN, maakBuitenLesstof, zonderCommentaarEnTekst } from './buitenLesstof';
import { berekenLesstof, lesstofWatchPaden, stukkenUit } from './lesstof';
import { LESSTOF_PLUGIN } from './lesstof-plugin';

// De lesstof is wat de nakijker "behandeld in de lessen" noemt: elke
// herkende constructie in de code van de lessen en de cheatsheet. De
// lesstof-plugin berekent hem bij het bouwen; deze tests doen hetzelfde
// vanuit de bron, en kijken of een project daarbuiten goed wordt gemeld.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const LESSTOF = berekenLesstof(SITE);
const buitenLesstof = maakBuitenLesstof(LESSTOF);

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

describe('de lesstof uit de lessen', () => {
  it('vindt de basis die elke les gebruikt', () => {
    // Een kapotte extractie zou de lijst leeg laten en elk project vol
    // vondsten zetten.
    expect(LESSTOF['HTML-elementen']).toEqual(expect.arrayContaining(['<p>', '<h1>', '<body>']));
    expect(LESSTOF['CSS-eigenschappen']).toEqual(expect.arrayContaining(['color', 'margin']));
    expect(LESSTOF.JavaScript).toEqual(expect.arrayContaining(['.addEventListener()']));
  });

  it('kent geen arrow-functies, want die staan niet in de lessen', () => {
    // Afspraak uit web/CLAUDE.md: alle functies in het lesmateriaal hebben een
    // naam. Een arrow-functie in een project is dus altijd een vondst.
    expect(LESSTOF.JavaScript).not.toContain('=> (arrow-functie)');
  });

  it('telt een fout-voorbeeld uit de lessen niet mee', () => {
    // inline-onclick.mdx toont getElementByID als fout, met de foutmelding eronder.
    expect(LESSTOF.JavaScript).not.toContain('document.getElementByID');
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
      plekken: [{ bestand: 'index.html', regel: 1 }],
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

describe('buitenLesstof — de regels waar het staat', () => {
  const plekVan = (files: ProjectFiles, label: string) =>
    buitenLesstof(files).find((v) => v.label === label)?.plekken;

  it('wijst in HTML, een <style>, een <script>, style="" en onclick="" de goede regel aan', () => {
    const html = [
      '<!DOCTYPE html>', // 1
      '<!-- <canvas> in commentaar -->', // 2
      '<style>', // 3
      '  p { color: red; }', // 4
      '  .x { transform: rotate(5deg); }', // 5
      '</style>', // 6
      '<body>', // 7
      '  <canvas></canvas>', // 8
      '  <p style="animation: none">Hoi</p>', // 9
      '  <button onclick="fetch(\'x\')">Klik</button>', // 10
      '<script>', // 11
      '  // const f = () => 1;', // 12
      '  const g = () => 2;', // 13
      '</script>', // 14
      '</body>', // 15
    ].join('\n');
    const files = project({ 'index.html': html });
    expect(plekVan(files, '<canvas>')).toEqual([{ bestand: 'index.html', regel: 8 }]);
    expect(plekVan(files, 'transform')).toEqual([{ bestand: 'index.html', regel: 5 }]);
    expect(plekVan(files, 'deg')).toEqual([{ bestand: 'index.html', regel: 5 }]);
    expect(plekVan(files, 'animation')).toEqual([{ bestand: 'index.html', regel: 9 }]);
    expect(plekVan(files, 'fetch()')).toEqual([{ bestand: 'index.html', regel: 10 }]);
    expect(plekVan(files, '=> (arrow-functie)')).toEqual([{ bestand: 'index.html', regel: 13 }]);
  });

  it('telt in CSS en JS de regels van het bestand, ook na meerregelig commentaar en tekst', () => {
    const files = project({
      'style.css':
        '/* een\nlang\ncommentaar */\np {\n  color: red;\n  animation: x 1s;\n}\n@keyframes x {}',
      'app.js': '/*\n x => y\n*/\nconst s = "a => b";\nconst t = `\n`;\nfetch("data.json");',
    });
    expect(plekVan(files, 'animation')).toEqual([{ bestand: 'style.css', regel: 6 }]);
    expect(plekVan(files, '@keyframes')).toEqual([{ bestand: 'style.css', regel: 8 }]);
    expect(plekVan(files, 'fetch()')).toEqual([{ bestand: 'app.js', regel: 7 }]);
    expect(plekVan(files, '=> (arrow-functie)')).toBeUndefined();
  });

  it('zet plekken uit meerdere bestanden op volgorde van bestand', () => {
    const files = project({
      'b.html': '<p>\n<canvas></canvas>',
      'a.html': '<canvas></canvas>',
    });
    expect(plekVan(files, '<canvas>')).toEqual([
      { bestand: 'a.html', regel: 1 },
      { bestand: 'b.html', regel: 2 },
    ]);
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

describe('rekenen met toewijzing', () => {
  it('houdt += en *= uit elkaar, zodat *= niet onder += verdwijnt', () => {
    const files = project({ 'app.js': 'let prijs = 10;\nprijs *= 1.21;\nprijs /= 2;' });
    expect(labels(files)).toContain('JavaScript|*= / /= / %=');
    expect(labels(files)).not.toContain('JavaScript|+= / -=');
  });
});

describe('zonderCommentaarEnTekst — één doorloop door de JavaScript', () => {
  it('ziet // in een string niet als commentaar', () => {
    const files = project({ 'app.js': 'el.innerHTML = "a//b"; el.remove(); setTimeout(f, 10);' });
    expect(labels(files)).toEqual(
      expect.arrayContaining(['JavaScript|.remove()', 'JavaScript|setTimeout()']),
    );
  });

  it('ziet een aanhalingsteken in commentaar niet als begin van een string', () => {
    const files = project({ 'app.js': "// het is Sam's code\nfetch('data.json');" });
    expect(labels(files)).toContain('JavaScript|fetch()');
  });

  it('houdt de code in ${ } van een template literal, ook met accolades erin', () => {
    const js = 'const t = `Hoi ${ { a: fetch(x) }.a } en // geen commentaar`; setInterval(f, 1);';
    const uit = zonderCommentaarEnTekst(js);
    expect(uit).toHaveLength(js.length);
    expect(uit).toContain('fetch(x)');
    expect(uit).not.toContain('Hoi');
    expect(uit).not.toContain('geen commentaar');
    expect(uit).toContain('setInterval(f, 1)');
  });

  it('houdt posities en regeleinden gelijk', () => {
    const js = '/* a\nb */ "x\\"y" `p\nq` // z\nok';
    const uit = zonderCommentaarEnTekst(js);
    expect(uit).toHaveLength(js.length);
    expect(uit.split('\n')).toHaveLength(js.split('\n').length);
    expect(uit.endsWith('ok')).toBe(true);
  });
});

describe('de lesstof-plugin', () => {
  it('de docentpagina importeert de data van precies deze plugin', () => {
    // Docusaurus zet createData-bestanden onder <pluginnaam>/<pluginId>; een
    // andere naam of indeling laat de build pas op het import falen.
    const pagina = readFileSync(join(SITE, 'src/pages/website-checken-docent.tsx'), 'utf8');
    expect(pagina).toContain(`'@generated/${LESSTOF_PLUGIN}/default/lesstof.json'`);
    const types = readFileSync(join(SITE, 'src/checker/lesstof-generated.d.ts'), 'utf8');
    expect(types).toContain(`'@generated/${LESSTOF_PLUGIN}/default/lesstof.json'`);
  });

  it('houdt in de dev-server elke bron in de gaten, ook de losse cheatsheet', () => {
    for (const pad of lesstofWatchPaden(SITE)) {
      const vast = pad.includes('*') ? dirname(pad.slice(0, pad.indexOf('*'))) : pad;
      expect(existsSync(vast), pad).toBe(true);
    }
    expect(lesstofWatchPaden(SITE)).toContain(join(SITE, 'src/pages/cheatsheet.mdx'));
  });
});
