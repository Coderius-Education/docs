import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projecten, routeBestand } from './ml-route';

// In de fases D, E en F (Nim, de kortste weg, het neuron) stonden bij elke
// opdracht de stappen "Begin klein …" en de verwachte uitvoer op het scherm
// De opdracht, en de editor op Aan de slag. De leerling klikte per stap heen
// en weer, en De opdracht zei "in de editor staat …" op een scherm zonder
// editor. De waarschuwing voor een while-loop stond bij Een zet twee
// tabbladen terug. Nu staat alles waar de leerling mee werkt op het scherm
// met de editor.

const FASES = ['ml-spellen', 'ml-zoeken', 'ml-neuronen'];

const paginas = projecten()
  .filter((p) => FASES.includes(p.fase))
  .flatMap((p) => p.stappen);

/** De opdrachten en Bouw zelf van een pagina: kop, De opdracht, Aan de slag. */
function opdrachten(tekst: string) {
  const delen = tekst.split(/^(## .*)$/m);
  const uit: { kop: string; opdracht: string; aanDeSlag: string }[] = [];
  for (let i = 1; i < delen.length; i += 2) {
    if (!/^## (Opdracht|Bouw zelf)\b/.test(delen[i])) continue;
    const m = delen[i + 1].match(/### De opdracht\n([\s\S]*?)### Aan de slag\n([\s\S]*)$/);
    uit.push({ kop: delen[i], opdracht: m?.[1] ?? '', aanDeSlag: m?.[2] ?? delen[i + 1] });
  }
  return uit;
}

/** Wat er vóór de tip staat: de stappen, de waarschuwing, het doel en de editor. */
const voorDeTip = (stuk: string) => {
  const tip = stuk.indexOf('<details>');
  return tip < 0 ? stuk : stuk.slice(0, tip);
};

describe('De opdracht beschrijft, Aan de slag heeft de stappen en de editor', () => {
  for (const id of paginas) {
    it(id, () => {
      const fouten: string[] = [];
      for (const { kop, opdracht, aanDeSlag } of opdrachten(
        readFileSync(routeBestand(id), 'utf8'),
      )) {
        if (/\beditor\b/.test(opdracht)) fouten.push(`${kop}: De opdracht noemt de editor`);
        if (/Begin klein/.test(opdracht)) fouten.push(`${kop}: de stappen staan op De opdracht`);
        if (/^```\n/m.test(opdracht)) fouten.push(`${kop}: een uitvoerblok op De opdracht`);
        const voor = voorDeTip(aanDeSlag);
        if (!/Begin klein/.test(voor)) fouten.push(`${kop}: geen stappen bij de editor`);
        if (!voor.includes('<PyRunner')) fouten.push(`${kop}: geen editor vóór de tip`);
      }
      expect(fouten).toEqual([]);
    });
  }
});

describe('de verwachte uitvoer staat vlak voor de editor', () => {
  for (const id of paginas) {
    it(id, () => {
      const fouten: string[] = [];
      for (const { kop, aanDeSlag } of opdrachten(readFileSync(routeBestand(id), 'utf8'))) {
        const voor = voorDeTip(aanDeSlag);
        const m = voor.match(/^Verwachte uitvoer[^\n]*:\n\n```\n[\s\S]*?\n```\n\n([\s\S]*)$/m);
        if (!m) continue;
        // De build zet het doel in de uitvoerkolom van de editor als er
        // hooguit twee alinea's tussen staan; hier staat de editor er direct
        // onder.
        if (!m[1].startsWith('<PyRunner'))
          fouten.push(`${kop}: de editor staat niet direct onder het doel`);
      }
      expect(fouten).toEqual([]);
    });
  }
});

describe('een while die de leerling schrijft, heeft de waarschuwing bij de editor', () => {
  for (const id of paginas) {
    it(id, () => {
      const fouten: string[] = [];
      for (const { kop, aanDeSlag } of opdrachten(readFileSync(routeBestand(id), 'utf8'))) {
        const antwoord =
          aanDeSlag.match(/<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/)?.[1] ?? '';
        if (!/^\s*while /m.test(antwoord)) continue;
        const waarschuwing = voorDeTip(aanDeSlag).match(/^:::caution\n([\s\S]*?)\n:::/m)?.[1] ?? '';
        if (!/tabblad/.test(waarschuwing) || !/vast/.test(waarschuwing))
          fouten.push(`${kop}: geen waarschuwing op het scherm met de editor`);
      }
      expect(fouten).toEqual([]);
    });
  }
});

// De regels van hooguit 66 tekens bewaakt ml-editors.test.ts voor de hele
// route.

describe('inhoudelijke fouten uit de review', () => {
  const les = (id: string) => readFileSync(routeBestand(id), 'utf8');

  it('pakken tot en met 4: de uitvoer na stap 2 is nog niet het doel', () => {
    // Bij 12 lucifers komt slim nooit op een stapel waar (stapel - 1) % 5
    // nul is, en won hij al zonder de if. De editor print daarom ook wat
    // slim bij 11 pakt.
    const tekst = les('ml-spellen/01-nim-strategie/05-pakken-tot-en-met-4');
    expect(tekst).toContain('print("bij 11 pakt slim", slim(11))');
    expect(tekst).toMatch(
      /Verwachte uitvoer:\n\n```\nslim wint 100 van de 100\nbij 11 pakt slim 1\n```/,
    );
    expect(tekst).not.toMatch(/druk bij twijfel op Stap voor stap/i);
  });

  it('gewichten: de GOED onder Er gaat iets mis geeft de band het gewicht van de opdracht', () => {
    const tekst = les('ml-neuronen/01-neuron/01-gewichten');
    const fout = tekst.slice(tekst.indexOf('## Er gaat iets mis'));
    expect(tekst).toContain('met gewicht 2');
    expect(fout).toContain('gewichten = [3, 2, -1, 2]');
  });

  it('een zet: de waarschuwing staat niet meer alleen in Zo werkt het', () => {
    const tekst = les('ml-spellen/01-nim-strategie/01-een-zet');
    const zo = tekst.slice(tekst.indexOf('## Zo werkt het'), tekst.indexOf('## Onderzoek'));
    expect(zo).not.toContain(':::caution');
  });
});
