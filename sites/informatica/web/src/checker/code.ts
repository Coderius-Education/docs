import { blanco } from '@coderius/checker/plekken';

// Wat de nakijker nodig heeft om code uit een bestand te halen: HTML splitsen
// in opmaak, CSS en JavaScript, en commentaar en tekst wegpoetsen. Zowel de
// conceptherkenning (config.ts, ook op de leerlingpagina) als Buiten de
// lesstof (buitenLesstof.ts, alleen voor de docent) gebruikt het. Het staat
// los, zodat de leerlingpagina de woordenlijsten van Buiten de lesstof niet
// hoeft te laden.

export type Soort = 'html' | 'css' | 'js';

export interface Stuk {
  soort: Soort;
  tekst: string;
  /** Waar het stuk in het bestand begint, voor de regelnummers (standaard 0). */
  begin?: number;
}

// Een attribuutwaarde tussen aanhalingstekens mag < en > bevatten
// (onclick="lijst.forEach(x => tel(x))"); die sluit de tag niet af.
export const TAG =
  /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+(?:"[^"]*"|'[^']*'|[^\s"'<>/]|\/(?!>))+)*)\s*\/?>/g;
export const ATTRIBUUT = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|[^\s"'>]+))?/g;

/**
 * Splitst een HTML-bestand in stukken: de opmaak zelf, de inhoud van elk
 * `<style>` en `style="…"` als CSS, en die van elk `<script>` en elk
 * `on…="…"` als JavaScript. Zo telt CSS in een `<style>`-blok net zo goed mee
 * als CSS in een los bestand.
 */
export function splitsHtml(html: string, begin = 0): Stuk[] {
  const stukken: Stuk[] = [];
  let rest = html.replace(/<!--[\s\S]*?-->/g, blanco);
  rest = rest.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi,
    (_m, open: string, css: string, dicht: string, plek: number) => {
      stukken.push({ soort: 'css', tekst: css, begin: begin + plek + open.length });
      return open + blanco(css) + dicht;
    },
  );
  rest = rest.replace(
    /(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,
    (_m, open: string, js: string, dicht: string, plek: number) => {
      stukken.push({ soort: 'js', tekst: js, begin: begin + plek + open.length });
      return open + blanco(js) + dicht;
    },
  );
  for (const tag of rest.matchAll(TAG)) {
    const attrBegin = (tag.index ?? 0) + 1 + tag[1].length;
    for (const a of (tag[2] ?? '').matchAll(ATTRIBUUT)) {
      const naam = a[1].toLowerCase();
      const waarde = a[2] ?? a[3];
      if (waarde === undefined) continue;
      const waardeBegin = begin + attrBegin + (a.index ?? 0) + a[0].search(/["']/) + 1;
      if (naam === 'style') {
        // Een declaratieblok zonder selector; de 'x{' ervoor valt precies
        // vóór de waarde, zodat de posities kloppen.
        stukken.push({ soort: 'css', tekst: `x{${waarde}}`, begin: waardeBegin - 2 });
      } else if (naam.startsWith('on')) {
        stukken.push({ soort: 'js', tekst: waarde, begin: waardeBegin });
      }
    }
  }
  stukken.push({ soort: 'html', tekst: rest, begin });
  return stukken;
}

/**
 * Alleen de JavaScript uit een bestand, op zijn eigen plek: een .js-bestand
 * helemaal, uit HTML de inhoud van elk `<script>` en elk `on…="…"`. Al het
 * andere, en het commentaar, wordt spaties; met `tekstLaten` blijft tekst
 * tussen aanhalingstekens staan, anders gaat die ook weg. De uitkomst is even
 * lang als het bestand, met de regeleinden op hun plek, zodat een vondst het
 * goede regelnummer houdt. Zo zoekt de nakijker een JavaScript-patroon niet
 * in een alinea ("let op"), een commentaar of een string.
 */
export function alleenJavaScript(
  inhoud: string,
  soort: string,
  { tekstLaten = false } = {},
): string {
  const poets = (js: string) => zonderCommentaarEnTekst(js, { tekstLaten });
  if (soort !== 'html') return poets(inhoud);
  const uit = blanco(inhoud).split('');
  for (const stuk of splitsHtml(inhoud)) {
    if (stuk.soort !== 'js') continue;
    const js = poets(stuk.tekst);
    for (let i = 0; i < js.length; i++) uit[(stuk.begin ?? 0) + i] = js[i];
  }
  return uit.join('');
}

/** Een HTML-bestand zonder commentaar en zonder de inhoud van `<style>` en `<script>`. */
export function alleenOpmaak(html: string): string {
  return splitsHtml(html).find((s) => s.soort === 'html')?.tekst ?? blanco(html);
}

/**
 * Poetst commentaar en tekst tussen aanhalingstekens weg: tekst kan alles
 * bevatten ("Klik => hier") en telt niet mee. Eén doorloop, van links naar
 * rechts, zodat wat het eerst begint wint: een // in een string is geen
 * commentaar, en een " in commentaar opent geen string. De code tussen ${ }
 * in een template literal blijft staan, want dat is gewone code; de backticks
 * ook, zodat de template literal zelf herkend blijft. Alles wordt spaties van
 * dezelfde lengte, met de regeleinden erin, zodat posities kloppen.
 *
 * Met `tekstLaten` blijft de tekst tussen aanhalingstekens staan en gaat
 * alleen het commentaar weg: de naam van een event staat tussen
 * aanhalingstekens (`addEventListener('click', …)`).
 */
export function zonderCommentaarEnTekst(js: string, { tekstLaten = false } = {}): string {
  let uit = '';
  let i = 0;
  // Per open ${ … } in een template: hoeveel { er binnen nog open staan.
  const templates: number[] = [];
  const blancoTot = (eind: number) => {
    uit += blanco(js.slice(i, eind));
    i = eind;
  };
  const tekstTot = (eind: number) => {
    if (tekstLaten) uit += js.slice(i, eind);
    else uit += blanco(js.slice(i, eind));
    i = eind;
  };
  const inTemplate = () => {
    // In de tekst van een template literal, tot de sluitende ` of een ${.
    while (i < js.length) {
      const c = js[i];
      if (c === '\\') {
        tekstTot(Math.min(i + 2, js.length));
      } else if (c === '`') {
        uit += '`';
        i++;
        return;
      } else if (c === '$' && js[i + 1] === '{') {
        uit += '${';
        i += 2;
        templates.push(0);
        return;
      } else {
        tekstTot(i + 1);
      }
    }
  };
  while (i < js.length) {
    const c = js[i];
    const volgende = js[i + 1];
    if (c === '/' && volgende === '/') {
      const eind = js.indexOf('\n', i);
      blancoTot(eind === -1 ? js.length : eind);
    } else if (c === '/' && volgende === '*') {
      const eind = js.indexOf('*/', i + 2);
      blancoTot(eind === -1 ? js.length : eind + 2);
    } else if (c === '"' || c === "'") {
      // Tot de sluitende quote (of het regeleinde, als hij ontbreekt).
      let j = i + 1;
      while (j < js.length && js[j] !== c && js[j] !== '\n') j += js[j] === '\\' ? 2 : 1;
      const dicht = js[j] === c;
      const binnen = js.slice(i + 1, j);
      uit += c + (tekstLaten ? binnen : blanco(binnen)) + (dicht ? c : '');
      i = dicht ? j + 1 : j;
    } else if (c === '`') {
      uit += '`';
      i++;
      inTemplate();
    } else if (templates.length > 0 && c === '{') {
      templates[templates.length - 1]++;
      uit += c;
      i++;
    } else if (templates.length > 0 && c === '}') {
      uit += c;
      i++;
      const open = templates.length - 1;
      if (templates[open] === 0) {
        templates.pop();
        inTemplate();
      } else {
        templates[open]--;
      }
    } else {
      uit += c;
      i++;
    }
  }
  return uit;
}

/**
 * Poetst commentaar en tekst tussen aanhalingstekens uit CSS: een regel die
 * is weggecommentarieerd telt niet, en `content: ".kaart {"` is geen
 * selector. Alles wordt spaties van dezelfde lengte, met de regeleinden erin.
 */
export function zonderCssCommentaarEnTekst(css: string): string {
  return css.replace(/\/\*[\s\S]*?(?:\*\/|$)|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) =>
    m.startsWith('/*') ? blanco(m) : m[0] + blanco(m.slice(1, -1)) + m[m.length - 1],
  );
}

/**
 * Alleen de CSS uit een bestand, op zijn eigen plek: een .css-bestand
 * helemaal, uit HTML de inhoud van elk `<style>` en elk `style="…"`. Zo telt
 * CSS in een HTML-bestand net zo goed mee als in een los bestand. Een
 * `style`-attribuut wordt een declaratieblok `*{…}` op de plek van `="` en
 * de sluitende quote; `*` is geen tag, dus het telt niet als tagselector.
 * Commentaar en tekst tussen aanhalingstekens gaan eruit.
 */
export function alleenCss(inhoud: string, soort: string): string {
  if (soort !== 'html') return zonderCssCommentaarEnTekst(inhoud);
  const uit = blanco(inhoud).split('');
  for (const stuk of splitsHtml(inhoud)) {
    if (stuk.soort !== 'css') continue;
    // splitsHtml zet een style-attribuut als `x{…}`; hier wordt dat `*{…}`.
    const tekst = /^x\{[\s\S]*\}$/.test(stuk.tekst) ? `*${stuk.tekst.slice(1)}` : stuk.tekst;
    const css = zonderCssCommentaarEnTekst(tekst);
    for (let i = 0; i < css.length; i++) uit[(stuk.begin ?? 0) + i] = css[i];
  }
  return uit.join('');
}

/**
 * De tags van een bestand: uit HTML de opmaak zonder commentaar, plus de
 * HTML in tekst tussen aanhalingstekens in JavaScript (`innerHTML =
 * "<ul>…"`); uit een .js-bestand alleen die tekst. Een tag in een
 * HTML-commentaar telt niet, en een vergelijking als `i<li.length` in een
 * script ook niet: dat is code, geen tekst. Bouwt een leerling een
 * formulier met innerHTML, dan heeft hij wel een formulier gemaakt.
 */
export function alleenTags(inhoud: string, soort: string): string {
  const uit = (soort === 'html' ? alleenOpmaak(inhoud) : blanco(inhoud)).split('');
  if (soort === 'html') {
    // De JavaScript in een on…-attribuut is code, geen opmaak.
    for (const stuk of splitsHtml(inhoud)) {
      if (stuk.soort !== 'js') continue;
      for (let i = 0; i < stuk.tekst.length; i++) {
        const plek = (stuk.begin ?? 0) + i;
        if (uit[plek] !== '\n') uit[plek] = ' ';
      }
    }
  }
  // Wat er met tekst wél staat en zonder tekst niet, is tekst tussen
  // aanhalingstekens.
  const code = alleenJavaScript(inhoud, soort);
  const metTekst = alleenJavaScript(inhoud, soort, { tekstLaten: true });
  for (let i = 0; i < metTekst.length; i++) if (metTekst[i] !== code[i]) uit[i] = metTekst[i];
  return uit.join('');
}
