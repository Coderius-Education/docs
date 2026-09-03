import { describe, expect, it } from 'vitest';
import { buildDoc } from './buildDoc';

// buildDoc van web-docs is de oudere, vaste-bestandsnamen-variant (style.css
// en script.js) van packages/editor/src/runners/web/buildDoc.ts. Die twee
// waren uit elkaar gegroeid: de editor-versie brugt niet-afgevangen
// JavaScript-fouten (window 'error'-event, bijv. een typefout in een inline
// <script> of een fout in een event-handler) naar de console van de leerling,
// de web-versie niet — daar verdween zo'n fout stilletjes in de devtools van
// de browser. Deze tests pinnen die brug én de rest van het inline-werk.

const CSS = 'body{color:red}';
const JS = 'document.getElementById("x")';

function pagina(head: string, body: string): string {
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;
}

describe('buildDoc — console-interceptor', () => {
  it('staat direct na <head>, vóór elk ander script, met de bron code-editor', () => {
    const html = pagina('<script>console.log(1)</script>', '');
    const result = buildDoc(html, '', '');
    expect(result.indexOf('<head>\n<script>')).toBe(html.indexOf('<head>'));
    expect(result.indexOf('<script>')).toBeLessThan(result.indexOf('console.log(1)'));
    expect(result).toContain("source: 'code-editor'");
    expect(result).toContain("type: 'console'");
  });

  it('komt vooraan als er geen <head> is', () => {
    const result = buildDoc('<p>hoi</p>', '', '');
    expect(result.startsWith('<script>')).toBe(true);
    expect(result.endsWith('<p>hoi</p>')).toBe(true);
  });

  it('brugt niet-afgevangen JavaScript-fouten naar de console van de leerling', () => {
    const result = buildDoc(pagina('', ''), '', '');
    const interceptor = result.slice(0, result.indexOf('</script>'));
    expect(interceptor).toContain("window.addEventListener('error', function(e) {");
    expect(interceptor).toContain("send('error', ['JavaScript fout: ' + e.message]);");
    // Een fout in een .then() of een async functie is geen ErrorEvent maar een
    // afgewezen promise; zonder deze listener blijft de console daar leeg.
    expect(interceptor).toContain("window.addEventListener('unhandledrejection', function(e) {");
  });

  it('meldt de hoogte van de inhoud aan de pagina eromheen', () => {
    const result = buildDoc(pagina('', ''), '', '');
    expect(result).toContain("type: 'height'");
    expect(result.indexOf("type: 'height'")).toBeLessThan(result.indexOf('</head>'));
  });
});

describe('buildDoc — stylesheet', () => {
  it.each([
    '<link rel="stylesheet" href="style.css">',
    "<link href='style.css' rel='stylesheet'>",
    '<link rel="stylesheet" href="style.css" />',
  ])('zet %s om in een <style>-blok met de CSS-tab', (link) => {
    const result = buildDoc(pagina(link, ''), CSS, '');
    expect(result).toContain(`<style>\n${CSS}\n</style>`);
    expect(result).not.toContain('<link');
  });

  it('vervangt alleen de eerste stylesheet-link', () => {
    const result = buildDoc(
      pagina('<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="b.css">', ''),
      CSS,
      '',
    );
    expect(result).toContain(`<style>\n${CSS}\n</style><link rel="stylesheet" href="b.css">`);
  });

  it('laat de CSS weg als er geen stylesheet-link is', () => {
    const result = buildDoc(pagina('', '<p></p>'), CSS, '');
    expect(result).not.toContain(CSS);
  });
});

describe('buildDoc — script', () => {
  it.each([
    '<script src="script.js"></script>',
    '<script src="script.js" defer></script>',
    "<script src='script.js'></script>",
    '<script src="script.js" />',
  ])('vervangt %s door de JS-tab in een try/catch vlak vóór </body>', (tag) => {
    const html = pagina(tag, '<p id="x"></p>');
    const result = buildDoc(html, '', JS);
    expect(result).not.toContain('src=');
    expect(result).toContain(`<script>\ntry {\n${JS}\n} catch (e) {`);
    expect(result.indexOf(JS)).toBeGreaterThan(result.indexOf('<p id="x"></p>'));
    expect(result).toContain('</script>\n</body>');
  });

  it('meldt een fout uit de try/catch aan de console én in de pagina', () => {
    const result = buildDoc(pagina('', ''), '', JS);
    expect(result).toContain("pre.textContent = 'JavaScript fout: ' + e.message;");
    expect(result).toContain(
      "window.parent.postMessage({ source: 'code-editor', type: 'console', level: 'error', text: 'JavaScript fout: ' + e.message }, '*');",
    );
  });

  it('plakt het script achteraan als er geen </body> is', () => {
    const result = buildDoc('<p></p>', '', JS);
    expect(result.indexOf(JS)).toBeGreaterThan(result.indexOf('<p></p>'));
    expect(result.trimEnd().endsWith('</script>')).toBe(true);
  });

  it('laat de placeholder staan en voegt niets in zonder JS', () => {
    const html = pagina('', '<script src="script.js"></script>');
    const result = buildDoc(html, '', '   \n');
    expect(result).toContain('<script src="script.js"></script>');
    expect(result).not.toContain('<script>\ntry {');
  });

  it('laat een script met een andere bestandsnaam met rust', () => {
    const html = pagina('', '<script src="ander.js"></script>');
    const result = buildDoc(html, '', JS);
    expect(result).toContain('<script src="ander.js"></script>');
    expect(result).toContain(JS);
  });
});
