import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Elke les met een oefenveld geeft elke opdracht zijn eigen veld, zodat de
// leerling niet omhoog hoeft te scrollen tussen opdrachttekst en editor.
// Er zijn twee vormen:
//
// - De opdracht-vorm (js-basics): genummerde koppen "## Opdracht 1: …" van
//   oplopende moeilijkheid, minstens drie per les, elk met een veld direct
//   onder de opdrachttekst en vóór de tip. De laatste opdracht is bouw-zelf
//   en seedt op een make*-export.
// - De Modify/Make-vorm (html-css): precies drie velden — het hoofdveld
//   onder "Probeer het zelf" en één onder Modify en Make.
//
// Daarnaast bewaakt dit bestand twee lessen uit de praktijk: de
// startcode-exports staan onder de H1 (anders valt de sidebar-titel terug op
// de bestandsnaam), en elk antwoord draait in het veld waar het onder staat
// (elke onclick in de geseede HTML heeft een functiedefinitie in de geseede
// JS of in het antwoord).

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Les = { naam: string; inhoud: string };

function alleLessen(): Les[] {
  const uit: Les[] = [];
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

/** Alle H2-secties waarvan de kop op het patroon past, elk t/m de volgende H2. */
function secties(inhoud: string, kop: RegExp): { kop: string; tekst: string }[] {
  const uit: { kop: string; tekst: string }[] = [];
  const koppen = [...inhoud.matchAll(/^## (.+)$/gm)];
  for (let i = 0; i < koppen.length; i++) {
    const m = koppen[i];
    if (!kop.test(m[1])) continue;
    const start = (m.index ?? 0) + m[0].length;
    const eind = i + 1 < koppen.length ? koppen[i + 1].index : inhoud.length;
    uit.push({ kop: m[1], tekst: inhoud.slice(start, eind) });
  }
  return uit;
}

/** De exports met startcode: naam -> inhoud van de template-literal. */
function exportsVan(inhoud: string): Map<string, string> {
  const uit = new Map<string, string>();
  for (const m of inhoud.matchAll(/^export const (\w+) = `([\s\S]*?)`;$/gm)) {
    uit.set(m[1], m[2]);
  }
  return uit;
}

/** De props van de eerste <CodeEditor …/> in een stuk tekst. */
function veldProps(tekst: string): Map<string, string> | null {
  const m = tekst.match(/<CodeEditor([\s\S]*?)\/>/);
  if (!m) return null;
  const props = new Map<string, string>();
  for (const p of m[1].matchAll(/(\w+)=\{(\w+)\}/g)) props.set(p[1], p[2]);
  return props;
}

const lessen = alleLessen().filter((l) => l.inhoud.includes('<CodeEditor'));
const opdrachtVorm = lessen.filter((l) => /^## Opdracht \d+:/m.test(l.inhoud));
const modifyVorm = lessen.filter((l) => !/^## Opdracht \d+:/m.test(l.inhoud));

describe('oefenvelden per opdracht (web)', () => {
  it('er zijn lessen met een oefenveld', () => {
    expect(lessen.length).toBeGreaterThanOrEqual(30);
  });

  it('opdracht-vorm: één veld per opdracht plus het hoofdveld', () => {
    const fouten = opdrachtVorm
      .filter((l) => {
        const velden = (l.inhoud.match(/<CodeEditor/g) ?? []).length;
        const opdrachten = secties(l.inhoud, /^Opdracht \d+:/).length;
        return velden !== opdrachten + 1;
      })
      .map(
        (l) =>
          `${l.naam}: ${(l.inhoud.match(/<CodeEditor/g) ?? []).length} velden bij ${
            secties(l.inhoud, /^Opdracht \d+:/).length
          } opdrachten`,
      );
    expect(fouten).toEqual([]);
  });

  it('opdracht-vorm: minstens drie opdrachten van oplopend nummer', () => {
    const fouten: string[] = [];
    for (const les of opdrachtVorm) {
      const nummers = secties(les.inhoud, /^Opdracht \d+:/).map((s) =>
        Number(s.kop.match(/^Opdracht (\d+):/)?.[1]),
      );
      if (nummers.length < 3) fouten.push(`${les.naam}: maar ${nummers.length} opdrachten`);
      if (nummers.some((n, i) => n !== i + 1))
        fouten.push(`${les.naam}: nummering ${nummers.join(', ')} telt niet door vanaf 1`);
    }
    expect(fouten).toEqual([]);
  });

  it('opdracht-vorm: elk veld staat vóór de eerste tip van zijn opdracht', () => {
    const fouten: string[] = [];
    for (const les of opdrachtVorm) {
      for (const s of secties(les.inhoud, /^Opdracht \d+:/)) {
        const veld = s.tekst.indexOf('<CodeEditor');
        const details = s.tekst.indexOf('<details>');
        if (veld === -1) fouten.push(`${les.naam}: geen veld in ## ${s.kop}`);
        else if (details !== -1 && details < veld)
          fouten.push(`${les.naam}: het veld in ## ${s.kop} staat ná de tip`);
      }
    }
    expect(fouten).toEqual([]);
  });

  it('opdracht-vorm: de laatste opdracht start op een eigen skelet', () => {
    const fouten = opdrachtVorm
      .filter((l) => {
        const alle = secties(l.inhoud, /^Opdracht \d+:/);
        const laatste = alle[alle.length - 1];
        return !laatste || !/initial(?:Html|Js)=\{make\w*\}/.test(laatste.tekst);
      })
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

  it('modify/make-vorm: precies drie velden per les', () => {
    const fouten = modifyVorm
      .filter((l) => (l.inhoud.match(/<CodeEditor/g) ?? []).length !== 3)
      .map((l) => `${l.naam}: ${(l.inhoud.match(/<CodeEditor/g) ?? []).length} velden`);
    expect(fouten).toEqual([]);
  });

  for (const kop of ['Modify', 'Make']) {
    it(`modify/make-vorm: veld vóór de eerste tip in ${kop}`, () => {
      const fouten: string[] = [];
      for (const les of modifyVorm) {
        for (const s of secties(les.inhoud, new RegExp(`^${kop}$`))) {
          const veld = s.tekst.indexOf('<CodeEditor');
          const details = s.tekst.indexOf('<details>');
          if (veld === -1) fouten.push(`${les.naam}: geen veld in ## ${kop}`);
          else if (details !== -1 && details < veld)
            fouten.push(`${les.naam}: het veld in ## ${kop} staat ná de tip`);
        }
      }
      expect(fouten).toEqual([]);
    });
  }

  it('modify/make-vorm: het Make-veld start met een eigen skelet', () => {
    const fouten = modifyVorm
      .filter((l) => {
        const make = secties(l.inhoud, /^Make$/)[0];
        return !make || !/initial(?:Html|Js)=\{make(?:Html|Js)\}/.test(make.tekst);
      })
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

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

  it('elk antwoord draait in het veld waar het onder staat', () => {
    // De klassieke fout: het skelet bedraadt onclick="puntErbij()" en het
    // antwoord definieert plus(). Elke onclick-functie in de geseede HTML
    // moet gedefinieerd zijn in de geseede JS of in de js-blokken van de
    // details van diezelfde opdracht.
    const fouten: string[] = [];
    for (const les of opdrachtVorm) {
      const exportsMap = exportsVan(les.inhoud);
      for (const s of secties(les.inhoud, /^Opdracht \d+:/)) {
        const props = veldProps(s.tekst);
        if (!props) continue;
        const html = exportsMap.get(props.get('initialHtml') ?? '') ?? '';
        const js = exportsMap.get(props.get('initialJs') ?? '') ?? '';
        const namen = [...html.matchAll(/onclick="(\w+)\(/g)].map((m) => m[1]);
        if (namen.length === 0) continue;
        const antwoordJs = [...s.tekst.matchAll(/```js\n([\s\S]*?)```/g)]
          .map((m) => m[1])
          .join('\n');
        for (const naam of new Set(namen)) {
          // De definitie mag in de geseede JS staan, in een <script> binnen
          // de geseede HTML (de script-tag-les), of in het antwoord.
          const definitie = new RegExp(`function ${naam}\\s*\\(`);
          if (!definitie.test(js) && !definitie.test(html) && !definitie.test(antwoordJs)) {
            fouten.push(`${les.naam}: ## ${s.kop} bedraadt ${naam}() maar definieert hem nergens`);
          }
        }
      }
    }
    expect(fouten).toEqual([]);
  });
});
