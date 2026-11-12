import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// De docs-tests van een cursus met tabbladen lezen hun lessen met
// plugins/les-schermen.js en controleren per scherm of een zin naar iets
// wijst dat er staat. Bij robotica gaf dat valse meldingen en miste het
// echte: een plaatje telde als een lege zin ("de tegels hieronder" met de
// tegels eronder was fout), een vast id stond in de naam van het tabblad, en
// de rij tabbladen werd geteld met het label in plaats van met wat erop staat.

const require = createRequire(import.meta.url);
const { schermenVan } = require('./plugins/les-schermen.js');
const { mdxParser } = require('./plugins/werkvormen.js');

const parse = await mdxParser();
const schermen = (bron: string, velden: string[] = []) => schermenVan(bron, parse, { velden });

describe('de schermen van een les', () => {
  it('een plaatje is te zien, en is geen zin', () => {
    const [eerste] = schermen(
      '# Les\n\n## Tegels\n\nJe komt de tegels hieronder tegen.\n\n![Een bocht](./bocht.png)\n\n## Code\n\nx\n',
    );
    expect(eerste.blokken.map((b: { soort: string }) => b.soort)).toEqual(['tekst', 'plaatje']);
    // Ook een los <img> of een ingesloten pdf.
    const [los] = schermen(
      '# Les\n\n## Stuklijst\n\n<iframe src="lijst.pdf"></iframe>\n\n<img src="a.png" alt="a" />\n\n## Code\n\nx\n',
    );
    expect(los.blokken.map((b: { soort: string }) => b.soort)).toEqual(['plaatje', 'plaatje']);
  });

  it('een vast id achter de kop hoort niet bij de naam', () => {
    const namen = schermen(
      '# Les\n\n## Lampje aanzetten \\{#aanzetten}\n\na\n\n## Opdracht 1: Knipper \\{#knipper}\n\nb\n',
    ).map((s: { naam: string }) => s.naam);
    expect(namen).toEqual(['Lampje aanzetten', 'Opdracht 1']);
  });

  it('opTab is wat er op het tabblad staat: in een lange rij opdrachten het nummer', () => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const bron = `# Les\n\n## Zo werkt het\n\nx\n\n${letters
      .map((l) => `## Opdracht 5.7.${l}: iets\n\nDoe iets.\n`)
      .join('\n')}\n## Klaar\n\ny\n`;
    const uit = schermen(bron);
    expect(uit.map((s: { opTab: string }) => s.opTab).slice(0, 4)).toEqual([
      'Zo werkt het',
      'Opdracht 5.7.a',
      '5.7.b',
      '5.7.c',
    ]);
    expect(uit[2].tab).toBe('Opdracht 5.7.b');
  });
});
