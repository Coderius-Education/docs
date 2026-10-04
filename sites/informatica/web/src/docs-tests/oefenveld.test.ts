import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VIEWPORTS } from '../components/CodeEditor/PreviewPane';

// Wat een les over het oefenveld belooft, kan de leerling niet nakijken — en
// juist die beloftes verouderen stil. Drie ervan waren niet waar:
//
// - "Sleep de preview-rand om het effect te zien". Er is geen sleepgreep; de
//   panelen staan op `flex: 1 1 60%` en `flex: 1 1 40%`.
// - "In de preview werken links". De iframe stond op
//   `sandbox="allow-scripts allow-modals"`, en Chromium blokkeerde
//   `target="_blank"` met zoveel woorden. Met alleen `allow-popups` erbij
//   opende er wel een tabblad, maar dat erfde de sandbox: opaque origin,
//   SecurityError op localStorage — en een site die daarop leunt doet het
//   dan niet.
// - De media-queries-les gebruikte breekpunten van 500 tot 700px terwijl het
//   voorbeeldpaneel op een laptop 327px breed is, dus er schakelde nooit iets
//   om. Daarvoor zijn de breedteknoppen er.

const DOCS = fileURLToPath(new URL('../../docs/html-css', import.meta.url));
const PREVIEW = fileURLToPath(new URL('../components/CodeEditor/PreviewPane.tsx', import.meta.url));

function lessen(): string[] {
  return readdirSync(DOCS)
    .filter((f) => f.endsWith('.mdx'))
    .sort();
}

function tekst(bestand: string): string {
  return readFileSync(join(DOCS, bestand), 'utf8');
}

describe('de preview doet wat de lessen beloven', () => {
  const preview = readFileSync(PREVIEW, 'utf8');

  it('links met target="_blank" openen echt een tabblad', () => {
    // Zonder allow-popups blokkeert de browser het openen, en dan klopt de
    // hele les Pagina\'s koppelen niet meer: zijn Predict, Modify én Make
    // hangen aan dat effect. En zonder allow-popups-to-escape-sandbox is het
    // tabblad zelf gesandboxt, dus een kreupele versie van de site.
    const belooft = lessen().filter((f) => /target="_blank"/.test(tekst(f)));
    expect(belooft.length).toBeGreaterThan(0);
    // Per token, niet met een regex: `\ballow-popups\b` matcht ook bínnen
    // allow-popups-to-escape-sandbox, en die vlag doet niets zonder de losse.
    const vlaggen = preview.match(/sandbox="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    expect(vlaggen).toContain('allow-popups');
    expect(vlaggen).toContain('allow-popups-to-escape-sandbox');
  });

  it('geen les vraagt de leerling aan de preview te slepen', () => {
    // Het paneel heeft geen greep. Wie dit schrijft, stuurt de leerling naar
    // een handeling die niet bestaat; de breedteknoppen doen het werk.
    const fout = lessen().filter((f) =>
      /sleep (de |het )?(preview|voorbeeld|paneel)/i.test(tekst(f)),
    );

    expect(fout).toEqual([]);
  });

  it('elk breekpunt in een les is met de knoppen te bereiken', () => {
    // Een `min-width: 1200px` die geen enkele knop haalt laat de leerling naar
    // een regel kijken die nooit aangaat. De uitzondering staat in de tekst
    // van media-queries zelf: daar is zo\'n breekpunt juist het voorbeeld van
    // wat er misgaat.
    const breedtes = VIEWPORTS.map((v) => v.breedte);
    const onbereikbaar: string[] = [];

    for (const bestand of lessen()) {
      const inhoud = tekst(bestand);
      // Een bewust onhaalbaar breekpunt hoort thuis onder "Er gaat iets mis";
      // overal anders kijkt de leerling naar een regel die nooit aangaat.
      const les = inhoud.split('\n## Er gaat iets mis')[0];
      for (const m of les.matchAll(/@media[^{]*\(\s*(min|max)-width:\s*(\d+)px/g)) {
        const [, soort, waarde] = m;
        const grens = Number(waarde);
        const haalbaar = breedtes.some((b) => (soort === 'min' ? b >= grens : b <= grens));
        if (!haalbaar) onbereikbaar.push(`${bestand}: ${soort}-width ${grens}px`);
      }
    }

    expect(onbereikbaar).toEqual([]);
  });
});

describe('een experiment wijst naar code die er staat', () => {
  it('elke "verander/verwijder/vervang" noemt iets uit de startcode', () => {
    // Wie de startcode aanpast en de tekst eromheen laat staan, stuurt de
    // leerling op zoek naar iets dat er niet meer is. Dat gebeurde toen het
    // <input>-veld uit pseudo-klassen verdween en de Predict er nog naar vroeg.
    //
    // Deze test dekt de helft die in backticks staat: een regel die zegt
    // "Verwijder `button:focus`" moet die selector in de startcode kunnen
    // vinden. Een Predict die in lopend Nederlands over "het invoerveld"
    // praat, valt erbuiten — dat blijft lezen.
    const mist: string[] = [];

    for (const bestand of lessen()) {
      const inhoud = tekst(bestand);
      const exports: Record<string, string> = {};
      for (const m of inhoud.matchAll(/export const (\w+) = `([\s\S]*?)`;/g)) {
        exports[m[1]] = m[2];
      }
      const startcode = `${exports.startHtml ?? ''}\n${exports.startCss ?? ''}`;

      for (const sectie of inhoud.split(/\n## /).slice(1)) {
        const kop = sectie.split('\n')[0];
        if (!/^(Predict|Investigate|Modify)/.test(kop)) continue;
        // Alleen de opdrachttekst, niet het antwoord eronder.
        for (const regel of sectie.split(/\n<details/)[0].split('\n')) {
          const m = regel.match(/\b(Verander|Verwijder|Vervang|Haal)\b(.*)/i);
          if (!m) continue;
          // Na "naar", "in" of "door" staat de nieuwe waarde, niet het doel.
          const doel = m[2].split(/\b(?:naar|in|door)\b/)[0];
          for (const stuk of doel.matchAll(/`([^`]+)`/g)) {
            const naam = stuk[1].match(/^([.#]?[\w-]+)/)?.[1];
            // Losse waarden (`20px`, `2em`) verwijzen nergens naar.
            if (!naam || /^(px|rem|em|%|\d)/.test(naam)) continue;
            if (!startcode.includes(naam.replace(/^[.#]/, ''))) {
              mist.push(`${bestand} — ${kop}: ${stuk[1]}`);
            }
          }
        }
      }
    }

    expect(mist.sort()).toEqual([]);
  });
});
