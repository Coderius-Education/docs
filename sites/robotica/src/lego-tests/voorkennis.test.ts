import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden, parseItems } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Bewaakt wélke pagina's een <Voorkennis>-blok horen te hebben. Dát de paden
// bestaan wordt monorepo-breed getest in packages/shared/voorkennis.test.ts.
//
// Robotica heeft drie sporen met elk een eigen beleid, en dat is de reden dat
// deze test er anders uitziet dan die van fullstack en godot:
//
//   lego_auto/    het opbouwende traject. Vaste leesvolgorde, dus "de eerste
//                 keer dat een concept nodig is" bestaat hier echt. Elk
//                 bestand staat hieronder expliciet in een van de lijsten.
//   docs/         de Bibliotheek: naslag waar je middenin binnenvalt. Zonder
//                 leesvolgorde bestaat er geen eerste keer, dus geen blokken —
//                 met als enige uitzondering de instap-hoofdstukken, waar de
//                 code wél regel voor regel wordt opgebouwd (zie CLAUDE.md).
//   click_golfer/ Leaphy-blokken voor groep 7/8, geen Python.

// Let op de replace: `new URL('../..')` levert een map-URL op en dus een pad
// mét afsluitende slash, wat het afknippen hieronder een teken zou verschuiven.
const SITE = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');

function lessenIn(map: string): string[] {
  return alleLesbestanden(`${SITE}/${map}`)
    .map((pad) =>
      pad
        .slice(SITE.length + 1)
        .split('\\')
        .join('/'),
    )
    .sort();
}

function heeftBlok(relatiefPad: string): boolean {
  return parseItems(readFileSync(`${SITE}/${relatiefPad}`, 'utf8')).length > 0;
}

// --- lego_auto: het traject waar de python-stof binnenkomt -------------------

// Per deel het concept dat er voor het eerst nodig is. De volgorde volgt de
// sidebar: hoofdstukpositie, dan sidebar_position.
const LEGO_MET_BLOK = [
  'lego_auto/analoog_ir/deel3_een_sensor.md', //  5.4  print
  'lego_auto/analoog_ir/while_loop.md', //         5.7  while, vergelijken, tellen
  'lego_auto/eerste_programma/deel1_lampje.md', // 4.2  variabelen, methode-aanroep
  'lego_auto/eerste_programma/deel2_knipperen.md', // 4.3 while-loop
  'lego_auto/lijnvolgen/deel7_rechtdoor.md', //    10.3 if en else
  'lego_auto/lijnvolgen/nu_jij.md', //             10.4 and, or en elif
];

const LEGO_ZONDER_BLOK: { reden: string; lessen: string[] }[] = [
  {
    reden: 'hardware: materiaal, monteren of aansluiten, geen code op de pagina',
    lessen: [
      'lego_auto/afstand/monteren.md',
      'lego_auto/analoog_ir/material.md',
      'lego_auto/analoog_ir/monteren.md',
      'lego_auto/batterijen/material.md',
      'lego_auto/batterijen/wiring.md',
      'lego_auto/debuggen_met_scherm/material.md',
      'lego_auto/doos.md',
      'lego_auto/intro.md',
      'lego_auto/motoren/let_op.md',
      'lego_auto/motoren/material.md',
      'lego_auto/motoren/wiring.md',
      'lego_auto/motoren_aan_legoframe/monteren.md',
    ],
  },
  {
    reden: 'uitleg over hoe een onderdeel werkt, natuurkunde in plaats van Python',
    lessen: [
      'lego_auto/afstand/concept.md',
      'lego_auto/batterijen/concept.md',
      'lego_auto/debuggen_met_scherm/concept.md',
      'lego_auto/lijnvolgen/hoe_werkt.md',
      'lego_auto/motoren/concept.md',
    ],
  },
  {
    reden: 'hoofdstuk-opener: wat gaan we maken, nog geen code',
    lessen: [
      'lego_auto/afstand/doel.md',
      'lego_auto/analoog_ir/doel.md',
      'lego_auto/batterijen/doel.md',
      'lego_auto/debuggen_met_scherm/doel.md',
      'lego_auto/eerste_programma/doel.md',
      'lego_auto/lijnvolgen/doel.md',
      'lego_auto/motoren/doel.md',
    ],
  },
  {
    reden: 'installeren en verbinden: editor, bord en bibliotheek, geen Python-stof',
    lessen: [
      'lego_auto/software_editor/bibliotheek.md',
      'lego_auto/software_editor/bord.md',
      'lego_auto/software_editor/editor.md',
      'lego_auto/software_editor/repl.md',
      'lego_auto/software_editor/verbinden.md',
    ],
  },
  {
    reden: 'nieuw onderdeel in bekende code: een tweede object of een andere methode',
    lessen: [
      'lego_auto/afstand/tof_scherm.md',
      'lego_auto/afstand/uitlezen.md',
      'lego_auto/analoog_ir/deel4_twee_sensoren.md',
      'lego_auto/batterijen/code.md',
      'lego_auto/debuggen_met_scherm/deel5_scherm.md',
      'lego_auto/motoren/deel6_draaien.md',
    ],
  },
];

const LEGO_ZONDER_BLOK_LESSEN = LEGO_ZONDER_BLOK.flatMap((groep) => groep.lessen);

// --- Bibliotheek: alleen de instap bouwt code regel voor regel op -----------

const BIBLIOTHEEK_INSTAP = [
  'docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-ingebouwd-lampje/1_ingebouwd_lampje.md',
  'docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-ingebouwd-lampje/2_knipperen.md',
  'docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-lampje/4_code.md',
];

describe('robotica Voorkennis-blokken', () => {
  it('lego_auto: precies de afgesproken delen hebben een blok', () => {
    const metBlok = lessenIn('lego_auto').filter(heeftBlok);

    expect(metBlok).toEqual([...LEGO_MET_BLOK].sort());
  });

  it('lego_auto: elke pagina staat in een van de twee lijsten', () => {
    // Dit is de kern: een nieuw deel in het traject dwingt een expliciete
    // keuze af. Zonder deze test dekt de lijst hierboven alleen wat er ís.
    const bekend = new Set([...LEGO_MET_BLOK, ...LEGO_ZONDER_BLOK_LESSEN]);
    const onbesproken = lessenIn('lego_auto').filter((les) => !bekend.has(les));

    expect(onbesproken).toEqual([]);
  });

  it('lego_auto: de twee lijsten spreken elkaar niet tegen', () => {
    expect(LEGO_MET_BLOK.filter((les) => LEGO_ZONDER_BLOK_LESSEN.includes(les))).toEqual([]);

    const dubbel = LEGO_ZONDER_BLOK_LESSEN.filter(
      (les, i) => LEGO_ZONDER_BLOK_LESSEN.indexOf(les) !== i,
    );
    expect(dubbel).toEqual([]);

    const bestaat = new Set(lessenIn('lego_auto'));
    const verdwenen = [...LEGO_MET_BLOK, ...LEGO_ZONDER_BLOK_LESSEN].filter(
      (les) => !bestaat.has(les),
    );
    expect(verdwenen).toEqual([]);

    expect(LEGO_ZONDER_BLOK.filter((groep) => groep.reden.trim() === '')).toEqual([]);
  });

  it('Bibliotheek: alleen de instap heeft blokken', () => {
    // De andere kant op dan bij lego_auto: hier is een blok de uitzondering.
    // Komt er een blok bij op een naslagpagina, dan is dat een koerswijziging
    // en hoort die pagina hier genoemd te worden.
    expect(lessenIn('docs').filter(heeftBlok)).toEqual([...BIBLIOTHEEK_INSTAP].sort());
  });

  it('click_golfer heeft geen blokken', () => {
    // Leaphy-blokken voor groep 7/8: geen Python, dus geen python-voorkennis.
    expect(lessenIn('click_golfer').filter(heeftBlok)).toEqual([]);
  });

  it('elk blok noemt het concept waar de pagina het eerst om vraagt', () => {
    // Geen lege of dubbele items binnen één blok.
    const kapot: string[] = [];
    for (const les of LEGO_MET_BLOK) {
      const items = parseItems(readFileSync(`${SITE}/${les}`, 'utf8'));
      if (items.length === 0) kapot.push(`${les}: leeg blok`);
      const paden = items.map((i) => i.to);
      if (new Set(paden).size !== paden.length) kapot.push(`${les}: dubbel item`);
      if (items.some((i) => i.label.trim() === '')) kapot.push(`${les}: item zonder label`);
    }

    expect(kapot).toEqual([]);
  });
});
