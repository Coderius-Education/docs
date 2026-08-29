import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Elke les met een oefenveld heeft er drie: het hoofdveld onder "Probeer het
// zelf" en één onder elke opdracht (Modify en Make). Dat is de afspraak sinds
// de leerling niet meer omhoog hoeft te scrollen tussen opdrachttekst en veld.
// Deze test houdt hem overeind: een nieuwe les die het patroon mist — of een
// opdracht-veld dat bij het herschrijven sneuvelt — valt hier om, met de
// pagina en de sectie erbij.
//
// De vorm die bewaakt wordt: het veld staat direct in de opdracht-sectie,
// vóór het eerste <details>-blok (de Tip), zodat opdracht, veld en hulp in
// leesvolgorde bij elkaar staan.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function alleLessen(): { naam: string; inhoud: string }[] {
  const uit: { naam: string; inhoud: string }[] = [];
  for (const map of readdirSync(DOCS, { withFileTypes: true })) {
    if (!map.isDirectory()) continue;
    for (const bestand of readdirSync(join(DOCS, map.name))) {
      if (!bestand.endsWith('.mdx')) continue;
      uit.push({
        naam: `${map.name}/${bestand}`,
        inhoud: readFileSync(join(DOCS, map.name, bestand), 'utf8'),
      });
    }
  }
  return uit;
}

function sectie(inhoud: string, kop: string): string {
  const start = inhoud.indexOf(`\n## ${kop}`);
  if (start === -1) return '';
  const rest = inhoud.slice(start + 1);
  const eind = rest.indexOf('\n## ', 1);
  return eind === -1 ? rest : rest.slice(0, eind);
}

const lessen = alleLessen().filter((l) => l.inhoud.includes('<CodeEditor'));

describe('oefenvelden per opdracht (web)', () => {
  it('er zijn lessen met een oefenveld', () => {
    expect(lessen.length).toBeGreaterThanOrEqual(30);
  });

  it('elke les met een veld heeft er precies drie', () => {
    const fouten = lessen
      .filter((l) => (l.inhoud.match(/<CodeEditor/g) ?? []).length !== 3)
      .map((l) => `${l.naam}: ${(l.inhoud.match(/<CodeEditor/g) ?? []).length} velden`);
    expect(fouten).toEqual([]);
  });

  for (const kop of ['Modify', 'Make']) {
    it(`elke ${kop}-opdracht heeft een veld vóór de eerste tip`, () => {
      const fouten: string[] = [];
      for (const les of lessen) {
        const tekst = sectie(les.inhoud, kop);
        const veld = tekst.indexOf('<CodeEditor');
        const details = tekst.indexOf('<details>');
        if (veld === -1) {
          fouten.push(`${les.naam}: geen veld in ## ${kop}`);
        } else if (details !== -1 && details < veld) {
          fouten.push(`${les.naam}: het veld in ## ${kop} staat ná de tip`);
        }
      }
      expect(fouten).toEqual([]);
    });
  }

  it('de startcode-exports staan onder de H1', () => {
    // Docusaurus leidt de paginatitel (en dus het sidebar-label) af uit de
    // eerste H1, en slaat daarbij alleen import-regels over. Een export vóór
    // de H1 laat titel én sidebar terugvallen op de bestandsnaam.
    const fouten = lessen
      .filter((l) => {
        const h1 = l.inhoud.indexOf('\n# ');
        const eersteExport = l.inhoud.indexOf('export const ');
        return eersteExport !== -1 && (h1 === -1 || eersteExport < h1);
      })
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

  it('het Make-veld start met een eigen skelet, niet met de voorbeeldcode', () => {
    // De Make-fase is bouw-zelf; het veld hoort naar makeHtml of makeJs te
    // wijzen. Alleen initialCss mag de gedeelde start-stijl hergebruiken.
    const fouten = lessen
      .filter((l) => {
        const make = sectie(l.inhoud, 'Make');
        return !/initial(?:Html|Js)=\{make(?:Html|Js)\}/.test(make);
      })
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });
});
