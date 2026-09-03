import { describe, expect, it } from 'vitest';
import { MESSAGE_SOURCE, buildDoc, resolvePath } from './buildDoc';

// buildDoc maakt van de projectbestanden van een leerling één document voor
// de preview-iframe. Hier zat een echte regressie (f71f6b9): een `<script
// src="script.js" defer>` in <head> draaide inline vóór de DOM bestond, dus
// elk project dat de cheatsheet-conventie volgde brak. Deze tests leggen dat
// gedrag en de rest van het inline-werk vast op exacte strings.

const TOKEN = 'tok';
const PNG = 'data:image/png;base64,AAA';

function pagina(head: string, body: string): string {
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;
}

describe('resolvePath', () => {
  it.each([
    ['', './stijl.css', 'stijl.css'],
    ['pages', 'app.js', 'pages/app.js'],
    ['pages', '../style.css', 'style.css'],
    ['a/b', '../../x.css', 'x.css'],
    ['', '../x.css', 'x.css'],
    ['pages', '/img/logo.png', 'img/logo.png'],
    ['pages', './sub/./x.js', 'pages/sub/x.js'],
  ])('vanuit %j lost %j op naar %j', (baseDir, href, verwacht) => {
    expect(resolvePath(baseDir, href)).toBe(verwacht);
  });
});

describe('buildDoc — console-interceptor', () => {
  it('staat direct na <head>, vóór elk ander script, met bron en token', () => {
    const html = pagina('<script>console.log(1)</script>', '');
    const result = buildDoc({ 'index.html': html }, 'index.html', TOKEN);
    expect(result.indexOf('<head>\n<script>')).toBe(html.indexOf('<head>'));
    expect(result.indexOf('<script>')).toBeLessThan(result.indexOf('console.log(1)'));
    expect(result).toContain(`source: '${MESSAGE_SOURCE}'`);
    expect(result).toContain(`token: '${TOKEN}'`);
  });

  it('meldt ook afgewezen promises als JavaScript-fout', () => {
    // Een fout in een .then() of een async functie is geen ErrorEvent maar een
    // afgewezen promise; zonder deze listener blijft de console daar leeg.
    const result = buildDoc({ 'index.html': pagina('', '') }, 'index.html', TOKEN);
    expect(result).toContain("window.addEventListener('error', function(e) {");
    expect(result).toContain("window.addEventListener('unhandledrejection', function(e) {");
  });

  it('komt vooraan als er geen <head> is', () => {
    const result = buildDoc({ 'index.html': '<p>hoi</p>' }, 'index.html', TOKEN);
    expect(result.startsWith('<script>')).toBe(true);
    expect(result.endsWith('<p>hoi</p>')).toBe(true);
  });

  it('geeft een lege string voor een onbekend startbestand plus de interceptor', () => {
    const result = buildDoc({}, 'index.html', TOKEN);
    expect(result.startsWith('<script>')).toBe(true);
  });
});

describe('buildDoc — stylesheets', () => {
  const css = 'body{color:red}';

  it.each([
    '<link rel="stylesheet" href="style.css">',
    "<link href='style.css' rel='stylesheet'>",
    '<link rel="stylesheet" href="style.css" />',
  ])('zet %s om in een <style>-blok', (link) => {
    const result = buildDoc(
      { 'index.html': pagina(link, ''), 'style.css': css },
      'index.html',
      TOKEN,
    );
    expect(result).toContain(`<style>\n${css}\n</style>`);
    expect(result).not.toContain('<link');
  });

  it.each([
    '<link rel="stylesheet" href="https://cdn.example/x.css">',
    '<link rel="stylesheet" href="//cdn.example/x.css">',
    '<link rel="stylesheet" href="bestaat-niet.css">',
  ])('laat %s staan', (link) => {
    const result = buildDoc(
      { 'index.html': pagina(link, ''), 'style.css': css },
      'index.html',
      TOKEN,
    );
    expect(result).toContain(link);
  });

  it('escapet een letterlijke </style> in de CSS', () => {
    const result = buildDoc(
      {
        'index.html': pagina('<link rel="stylesheet" href="style.css">', ''),
        'style.css': 'a{}</style><b>',
      },
      'index.html',
      TOKEN,
    );
    expect(result).toContain('a{}<\\/style><b>');
  });

  it('herschrijft url(...) relatief aan de map van het CSS-bestand', () => {
    const files = {
      'index.html': pagina('<link rel="stylesheet" href="css/stijl.css">', ''),
      'css/stijl.css': 'h1{background:url("../img/a.png")} h2{background:url(../img/a.png)}',
      'img/a.png': PNG,
    };
    const result = buildDoc(files, 'index.html', TOKEN);
    expect(result).toContain(`h1{background:url(${PNG})} h2{background:url(${PNG})}`);
  });

  it('laat url(...) naar tekst of externe bronnen ongemoeid', () => {
    const files = {
      'index.html': pagina('<link rel="stylesheet" href="stijl.css">', ''),
      'stijl.css': 'a{background:url(tekst.txt)} b{background:url(https://x/y.png)}',
      'tekst.txt': 'geen afbeelding',
    };
    const result = buildDoc(files, 'index.html', TOKEN);
    expect(result).toContain('a{background:url(tekst.txt)} b{background:url(https://x/y.png)}');
  });
});

describe('buildDoc — scripts', () => {
  const js = 'document.getElementById("x")';

  it('zet een script inline met foutafhandeling', () => {
    const result = buildDoc(
      { 'index.html': pagina('', '<script src="script.js"></script>'), 'script.js': js },
      'index.html',
      TOKEN,
    );
    expect(result).toContain(`<script>\ntry {\n${js}\n} catch (e) {`);
    expect(result).not.toContain('src=');
  });

  it('escapet een letterlijke </script> in de code', () => {
    const result = buildDoc(
      {
        'index.html': pagina('', '<script src="script.js"></script>'),
        'script.js': 'x = "</script>"',
      },
      'index.html',
      TOKEN,
    );
    expect(result).toContain('x = "<\\/script>"');
  });

  it.each([
    '<script src="https://cdn.example/x.js"></script>',
    '<script src="bestaat-niet.js"></script>',
  ])('laat %s staan', (tag) => {
    const result = buildDoc({ 'index.html': pagina('', tag) }, 'index.html', TOKEN);
    expect(result).toContain(tag);
  });

  it.each([
    '<script src="script.js" defer></script>',
    '<script src="script.js" async></script>',
    '<script defer src="script.js"></script>',
    '<script src="script.js" DEFER></script>',
  ])('verplaatst %s uit <head> naar vlak vóór </body>, ná de DOM (f71f6b9)', (tag) => {
    const html = pagina(tag, '<p id="x"></p>');
    const result = buildDoc({ 'index.html': html, 'script.js': js }, 'index.html', TOKEN);
    const head = result.slice(0, result.indexOf('</head>'));
    expect(head).not.toContain(js);
    expect(result.indexOf(js)).toBeGreaterThan(result.indexOf('<p id="x"></p>'));
    expect(result).toContain('}\n</script>\n</body>');
  });

  it('houdt de volgorde van meerdere uitgestelde scripts aan', () => {
    const html = pagina(
      '<script src="een.js" defer></script><script src="twee.js" defer></script>',
      '<p></p>',
    );
    const result = buildDoc(
      { 'index.html': html, 'een.js': 'EEN()', 'twee.js': 'TWEE()' },
      'index.html',
      TOKEN,
    );
    expect(result.indexOf('EEN()')).toBeLessThan(result.indexOf('TWEE()'));
    expect(result.indexOf('EEN()')).toBeGreaterThan(result.indexOf('<p></p>'));
  });

  it('laat een script zonder defer/async op zijn plek in <head>', () => {
    const html = pagina('<script src="script.js"></script>', '<p></p>');
    const result = buildDoc({ 'index.html': html, 'script.js': js }, 'index.html', TOKEN);
    expect(result.indexOf(js)).toBeLessThan(result.indexOf('<body>'));
  });

  it('ziet een bestandsnaam als async.js niet aan voor het attribuut', () => {
    const html = pagina('<script src="async.js"></script>', '<p></p>');
    const result = buildDoc({ 'index.html': html, 'async.js': js }, 'index.html', TOKEN);
    expect(result.indexOf(js)).toBeLessThan(result.indexOf('<body>'));
  });

  it('plakt uitgestelde scripts achteraan als er geen </body> is', () => {
    const result = buildDoc(
      { 'index.html': '<p></p><script src="script.js" defer></script>', 'script.js': js },
      'index.html',
      TOKEN,
    );
    expect(result.indexOf(js)).toBeGreaterThan(result.indexOf('<p></p>'));
    expect(result.trimEnd().endsWith('</script>')).toBe(true);
  });
});

describe('buildDoc — afbeeldingen', () => {
  it('vult de data-URL in en laat de andere attributen staan', () => {
    const result = buildDoc(
      {
        'index.html': pagina(
          '',
          '<img class="a" src="img/logo.png" alt="x"><img src=\'img/logo.png\'>',
        ),
        'img/logo.png': PNG,
      },
      'index.html',
      TOKEN,
    );
    expect(result).toContain(`<img class="a" src="${PNG}" alt="x">`);
    expect(result).toContain(`<img src="${PNG}">`);
  });

  it.each([
    '<img src="https://cdn.example/x.png">',
    '<img src="bestaat-niet.png">',
    '<img src="tekst.txt">',
  ])('laat %s staan', (tag) => {
    const result = buildDoc(
      { 'index.html': pagina('', tag), 'tekst.txt': 'geen afbeelding' },
      'index.html',
      TOKEN,
    );
    expect(result).toContain(tag);
  });
});
