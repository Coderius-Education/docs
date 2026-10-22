import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { bestandInfo } from '../components/Bestand/logica';

// In de FastAPI-route komen Python, HTML, CSS, JavaScript en Jinja vaak op één
// pagina samen, en daar lopen beginners vast. Drie dingen helpen, en deze test
// bewaakt ze:
//
// 1. Elk codeblok in een les met meer dan één taal heeft een <Bestand pad="…" />
//    erboven: welk bestand het is en waar het draait (server of browser).
// 2. Elke Predict-opdracht is een <Voorspel>: de leerling kiest en ziet meteen
//    of het klopt, met uitleg bij elke foute keuze. Eerst stond het antwoord in
//    een uitklapblok, en dan klikte je het open zonder te kiezen.
// 3. Elke les met code heeft een controlevraag (<Voorspel soort="Controlevraag">).
//
// De vorm van een <Voorspel> zelf (één goede keuze, uitleg bij elke keuze)
// bewaakt packages/shared/voorspel.test.ts.

type Categorie = { type: 'category'; label: string; items: string[] };
const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const items = sidebars.apiSidebar as unknown as (string | Categorie)[];
const ids = items.flatMap((i) => (typeof i === 'string' ? [i] : i.items));
const lessen = ids.map((id) => ({ id, tekst: readFileSync(`${DOCS}/${id}.mdx`, 'utf8') }));

const TALEN = ['python', 'html', 'css', 'js', 'javascript'];

/** De codeblokken op volgorde: taal, en de tekst sinds het vorige blok. */
function blokken(tekst: string): { taal: string; ervoor: string; regel: number }[] {
  const uit: { taal: string; ervoor: string; regel: number }[] = [];
  const regels = tekst.split('\n');
  let open = false;
  let sinds: string[] = [];
  regels.forEach((r, i) => {
    const hek = r.match(/^\s*```(\w*)/);
    if (!open && hek) {
      uit.push({ taal: hek[1], ervoor: sinds.join('\n'), regel: i + 1 });
      open = true;
    } else if (open && /^\s*```\s*$/.test(r)) {
      open = false;
      sinds = [];
    } else if (!open) sinds.push(r);
  });
  return uit;
}

describe('losse vragen en labels in de FastAPI-route', () => {
  it('elk <Bestand>-pad bestaat als soort: static/, templates/ of .py', () => {
    for (const { id, tekst } of lessen) {
      for (const m of tekst.matchAll(/<Bestand pad="([^"]+)"/g)) {
        expect(() => bestandInfo(m[1]), `${id}: ${m[1]}`).not.toThrow();
      }
    }
  });

  it('in een les met meer dan één taal heeft elk codeblok een <Bestand> erboven', () => {
    const zonder: string[] = [];
    for (const { id, tekst } of lessen) {
      const code = blokken(tekst).filter((b) => TALEN.includes(b.taal));
      const talen = new Set(code.map((b) => (b.taal === 'javascript' ? 'js' : b.taal)));
      if (talen.size < 2) continue;
      for (const b of code) {
        if (!/<Bestand\b/.test(b.ervoor)) zonder.push(`${id}:${b.regel} (${b.taal})`);
      }
    }
    expect(zonder).toEqual([]);
  });

  it('elke Predict-opdracht is een <Voorspel>', () => {
    const fout: string[] = [];
    for (const { id, tekst } of lessen) {
      for (const deel of tekst.split(/\n(?=### Opdracht )/)) {
        if (!/^### Opdracht \d+: Predict/.test(deel)) continue;
        const blok = deel.split(/\n(?=##+ )/)[0];
        if (!blok.includes('<Voorspel')) fout.push(`${id}: ${blok.split('\n')[0]}`);
        if (blok.includes('<summary>Antwoord</summary>')) fout.push(`${id}: nog een Antwoord-blok`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('elke les met code heeft een controlevraag', () => {
    const zonder = lessen
      .filter(({ tekst }) => blokken(tekst).some((b) => TALEN.includes(b.taal)))
      .filter(({ tekst }) => !/<Voorspel\s+soort="Controlevraag"/.test(tekst))
      .map(({ id }) => id);
    expect(zonder).toEqual([]);
  });
});
