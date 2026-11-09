// Haalt commentaar uit code, met behoud van elke positie: wat wegvalt wordt
// spaties, elk regeleinde blijft staan. Zo wijst een plek in het rapport nog
// steeds naar de goede regel van het echte bestand.
//
// Een uitgecommentarieerde regel liet eerst een concept meetellen: `# tof =
// TimeOfFlight(...)` gaf de afstandssensor, `# TODO: Tween` gaf tweens, en
// `<!-- <button hx-get> -->` gaf htmx. Een leerling die de les volgt en een
// regel uitzet om te testen, kreeg zo een concept dat er niet meer is.
//
// Strings blijven staan, want daar staat in deze cursussen vaak het concept
// zelf: een route als `@app.get("/dier/{naam}")`, een node als
// `type="Timer"`. Alleen een string die als losse regel staat (een docstring,
// of in GDScript een blok commentaar tussen drie aanhalingstekens) is
// commentaar.

export type CommentaarTaal = 'python' | 'gdscript' | 'html' | 'js' | 'css';

const blanco = (s: string) => s.replace(/[^\n]/g, ' ');

/** Python en GDScript: `#` buiten een string, en een losse string op een eigen regel. */
function hekje(tekst: string): string {
  let uit = '';
  let i = 0;
  while (i < tekst.length) {
    const c = tekst[i];
    if (c === '#') {
      const eind = tekst.indexOf('\n', i);
      const stop = eind === -1 ? tekst.length : eind;
      uit += blanco(tekst.slice(i, stop));
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      const drie = tekst.startsWith(c.repeat(3), i);
      const sluit = drie ? c.repeat(3) : c;
      let j = i + sluit.length;
      while (j < tekst.length) {
        if (tekst[j] === '\\') j += 2;
        else if (tekst.startsWith(sluit, j)) break;
        else if (!drie && tekst[j] === '\n') break;
        else j++;
      }
      const stop = Math.min(tekst.length, j + (tekst.startsWith(sluit, j) ? sluit.length : 0));
      const stuk = tekst.slice(i, stop);
      // Een docstring: alleen witruimte (en een voorvoegsel als r of f)
      // ervoor op de regel, en alleen witruimte erna.
      const regelStart = tekst.lastIndexOf('\n', i - 1) + 1;
      const ervoor = tekst.slice(regelStart, i);
      const regelEind = tekst.indexOf('\n', stop);
      const erna = tekst.slice(stop, regelEind === -1 ? tekst.length : regelEind);
      const los = drie && /^\s*[rRuUbBfF]{0,2}$/.test(ervoor) && /^\s*(?:#.*)?$/.test(erna);
      uit += los ? blanco(stuk) : stuk;
      i = stop;
      continue;
    }
    uit += c;
    i++;
  }
  return uit;
}

/** JavaScript: `//` en `/* *\/` buiten een string. */
function js(tekst: string): string {
  let uit = '';
  let i = 0;
  while (i < tekst.length) {
    const c = tekst[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < tekst.length && tekst[j] !== c && (c === '`' || tekst[j] !== '\n')) {
        j += tekst[j] === '\\' ? 2 : 1;
      }
      const stop = Math.min(tekst.length, j + 1);
      uit += tekst.slice(i, stop);
      i = stop;
    } else if (tekst.startsWith('//', i)) {
      const eind = tekst.indexOf('\n', i);
      const stop = eind === -1 ? tekst.length : eind;
      uit += blanco(tekst.slice(i, stop));
      i = stop;
    } else if (tekst.startsWith('/*', i)) {
      const eind = tekst.indexOf('*/', i + 2);
      const stop = eind === -1 ? tekst.length : eind + 2;
      uit += blanco(tekst.slice(i, stop));
      i = stop;
    } else {
      uit += c;
      i++;
    }
  }
  return uit;
}

const css = (tekst: string) => tekst.replace(/\/\*[\s\S]*?\*\//g, blanco);

/** HTML en Jinja-commentaar, en commentaar in `<script>` en `<style>`. */
function html(tekst: string): string {
  return tekst
    .replace(/<!--[\s\S]*?-->|\{#[\s\S]*?#\}/g, blanco)
    .replace(
      /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
      (_, open: string, binnen: string, dicht: string) => open + js(binnen) + dicht,
    )
    .replace(
      /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
      (_, open: string, binnen: string, dicht: string) => open + css(binnen) + dicht,
    );
}

export function zonderCommentaar(tekst: string, taal: CommentaarTaal): string {
  switch (taal) {
    case 'python':
    case 'gdscript':
      return hekje(tekst);
    case 'js':
      return js(tekst);
    case 'css':
      return css(tekst);
    case 'html':
      return html(tekst);
  }
}
