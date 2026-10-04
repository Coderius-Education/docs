import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as B from 'blockly/core';
import 'blockly/blocks';
import * as nl from 'blockly/msg/nl';
import { describe, expect, it } from 'vitest';
import { registreer } from '../components/Blokken/leaphy';
import { MINSTE_SCHAAL, schaalVoor } from '../components/Blokken/schaal';

// De blokvoorbeelden van de Click Golfer staan als JSON naast de lessen, in
// de vorm waarin Blockly een programma bewaart. De browser tekent ze pas bij
// het openen van de pagina, dus een tikfout in een bloknaam of een pin die
// niet op het bord zit, ziet de build niet. Deze test laadt elk voorbeeld in
// dezelfde Blockly als de pagina, en eist dat er na het laden precies staat
// wat er in het bestand stond: een onbekende waarde in een keuzelijst gooit
// Blockly niet weg met een fout, maar vervangt hij stil door de eerste optie.

const CLICK = fileURLToPath(new URL('../../click_golfer', import.meta.url));
const MAP = join(CLICK, 'blokken');

registreer(B, nl as unknown as Record<string, string>);

type Blok = {
  type: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, { block?: Blok; shadow?: Blok }>;
  next?: { block?: Blok };
};

// Alleen wat de leerling ziet: type, velden, en wat erin en eronder zit.
function kern(blok: Blok | undefined): unknown {
  if (!blok) return null;
  const inputs: Record<string, unknown> = {};
  for (const [naam, invoer] of Object.entries(blok.inputs ?? {})) {
    inputs[naam] = kern(invoer.block ?? invoer.shadow);
  }
  return {
    type: blok.type,
    fields: blok.fields ?? {},
    inputs,
    next: kern(blok.next?.block),
  };
}

function laad(programma: { blocks: { blocks: Blok[] } }): unknown[] {
  const ws = new B.Workspace();
  try {
    B.serialization.workspaces.load(programma, ws);
    const bewaard = B.serialization.workspaces.save(ws) as { blocks: { blocks: Blok[] } };
    return bewaard.blocks.blocks.map(kern);
  } finally {
    ws.dispose();
  }
}

function voorbeelden(): string[] {
  if (!existsSync(MAP)) return [];
  return readdirSync(MAP)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

function paginas(): string[] {
  return readdirSync(CLICK)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => readFileSync(join(CLICK, f), 'utf8'));
}

const BAL = {
  blocks: {
    blocks: [
      {
        type: 'leaphy_start',
        inputs: {
          STACK: {
            block: {
              type: 'controls_if',
              inputs: {
                IF0: {
                  block: {
                    type: 'logic_compare',
                    fields: { OP: 'LT' },
                    inputs: {
                      A: { block: { type: 'analog_read', fields: { PIN: 'A0' } } },
                      B: { block: { type: 'math_number', fields: { NUM: 300 } } },
                    },
                  },
                },
                DO0: {
                  block: {
                    type: 'leaphy_serial_print_line',
                    inputs: {
                      VALUE: { block: { type: 'text', fields: { TEXT: 'klaar om te golfen!' } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

describe('de controle zelf', () => {
  it('laat een goed programma heel', () => {
    expect(laad(BAL)).toEqual(BAL.blocks.blocks.map(kern));
  });

  it('merkt een pin die niet op het bord zit', () => {
    const fout = structuredClone(BAL);
    const als = fout.blocks.blocks[0].inputs.STACK.block;
    als.inputs.IF0.block.inputs.A.block.fields.PIN = 'A9';
    expect(laad(fout)).not.toEqual(fout.blocks.blocks.map(kern));
  });

  it('merkt een blok dat niet bestaat', () => {
    expect(() => laad({ blocks: { blocks: [{ type: 'lees_anapin' }] } })).toThrow();
  });

  it('toont de blokken in het Nederlands', () => {
    const ws = new B.Workspace();
    B.serialization.workspaces.load(BAL, ws);
    const teksten = ws
      .getAllBlocks(false)
      .flatMap((blok) => blok.inputList.flatMap((i) => i.fieldRow.map((v) => v.getText())));
    ws.dispose();
    expect(teksten).toEqual(expect.arrayContaining(['als', 'Lees anapin', 'Toon op scherm']));
  });
});

describe('de voorbeelden in de lessen', () => {
  it.each(voorbeelden())('%s laadt precies zoals het er staat', (bestand) => {
    const programma = JSON.parse(readFileSync(join(MAP, bestand), 'utf8'));
    expect(laad(programma)).toEqual(programma.blocks.blocks.map(kern));
  });

  it('elk voorbeeld staat op een pagina', () => {
    const alles = paginas().join('\n');
    const ongebruikt = voorbeelden().filter((f) => !alles.includes(`./blokken/${f}'`));
    expect(ongebruikt).toEqual([]);
  });

  it('elk blokvoorbeeld heeft een beschrijving', () => {
    // De beschrijving is de alt-tekst: wie de blokken niet ziet, of bij wie
    // ze niet laden, leest wat erin staat.
    const zonder = paginas().flatMap((inhoud) =>
      [...inhoud.matchAll(/<Blokken\b[^>]*>/g)]
        .map((m) => m[0])
        .filter((tag) => !/beschrijving="[^"]{10,}"/.test(tag)),
    );
    expect(zonder).toEqual([]);
  });
});

describe('een getal dat afwijkt van Easybloqs staat in de tekst', () => {
  // Easybloqs zet een nieuw blok neer met een beginwaarde (leaphy-webbased-
  // svelte, packages/client/src/lib/domain/blockly/toolbox.ts; het pinveld
  // in de app zelf). Staat er in een voorbeeld iets anders, dan moet de
  // leerling het veranderen, en dat kan hij alleen als de tekst het zegt.
  // Mikken had "wijzig hoek met -1" alleen in de blokken: Easybloqs geeft
  // 1, en wie dat laat staan, draait de arm door tot 100°. Bij het lampje
  // stond nergens dat Zet PWM op pin 3 begint.
  //
  // Per bloktype en veld: waar de waarde zit, en waar Easybloqs mee begint.
  const BEGIN: { type: string; veld: string; invoer?: boolean; begin: string }[] = [
    { type: 'leaphy_servo_write', veld: 'PIN', begin: '2' },
    { type: 'leaphy_servo_write', veld: 'SERVO_ANGLE', invoer: true, begin: '90' },
    { type: 'leaphy_io_analogwrite', veld: 'PIN', begin: '3' },
    { type: 'leaphy_io_analogwrite', veld: 'NUM', invoer: true, begin: '0' },
    { type: 'time_delay', veld: 'DELAY_TIME_MILI', invoer: true, begin: '1000' },
    { type: 'controls_repeat_ext', veld: 'TIMES', invoer: true, begin: '10' },
    { type: 'math_change', veld: 'DELTA', invoer: true, begin: '1' },
  ];

  type Waarde = { regel: (typeof BEGIN)[number]; waarde: string };

  function waarden(blok: Blok | undefined, uit: Waarde[] = []): Waarde[] {
    if (!blok) return uit;
    for (const regel of BEGIN) {
      if (regel.type !== blok.type) continue;
      const getal = regel.invoer
        ? blok.inputs?.[regel.veld]?.block
        : { type: 'math_number', fields: { NUM: blok.fields?.[regel.veld] } };
      // Een variabele of een willekeurig getal is geen getal om te typen.
      if (getal?.type !== 'math_number' || getal.fields?.NUM === undefined) continue;
      uit.push({ regel, waarde: String(getal.fields.NUM) });
    }
    for (const invoer of Object.values(blok.inputs ?? {})) waarden(invoer.block, uit);
    waarden(blok.next?.block, uit);
    return uit;
  }

  // De tekst zoals de leerling hem leest: zonder frontmatter, imports en de
  // beschrijving van de blokken (die is de alt-tekst, niet de uitleg).
  function proza(inhoud: string): string {
    return (
      inhoud
        .replace(/^---[\s\S]*?---/, '')
        .replace(/^import .*$/gm, '')
        .replace(/<Blokken\b[^>]*\/>/g, '')
        // Het nummer van een genummerde lijst is geen getal in een blok.
        .replace(/^\s*\d+\. /gm, '')
    );
  }

  function noemt(tekst: string, getal: string): boolean {
    const g = getal.replace('-', '\\-');
    return new RegExp(`(?<![\\w-])${g}(?![\\w])`).test(tekst);
  }

  // De lessen op volgorde van de cursus.
  const LESSEN = readdirSync(CLICK)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const inhoud = readFileSync(join(CLICK, f), 'utf8');
      return {
        bestand: f,
        inhoud,
        plek: Number(inhoud.match(/^sidebar_position: ([\d.]+)$/m)?.[1]),
      };
    })
    .sort((a, b) => a.plek - b.plek);

  function waardenOp(inhoud: string): Waarde[] {
    return [...inhoud.matchAll(/from '\.\/blokken\/([^']+\.json)'/g)].flatMap((m) =>
      (JSON.parse(readFileSync(join(MAP, m[1]), 'utf8')).blocks.blocks as Blok[]).flatMap((b) =>
        waarden(b),
      ),
    );
  }

  it('de les waar een getal voor het eerst anders is, noemt de beginwaarde en het nieuwe getal', () => {
    const gezien = new Set<string>();
    const veranderd = new Set<string>();
    const fout: string[] = [];
    for (const { bestand, inhoud } of LESSEN) {
      const tekst = proza(inhoud);
      for (const { regel, waarde } of waardenOp(inhoud)) {
        if (waarde === regel.begin) continue;
        const sleutel = `${regel.type}.${regel.veld}`;
        if (!veranderd.has(sleutel) && !noemt(tekst, regel.begin))
          fout.push(`${bestand}: ${sleutel} begint in Easybloqs op ${regel.begin}`);
        veranderd.add(sleutel);
        if (!gezien.has(`${sleutel}=${waarde}`) && !noemt(tekst, waarde))
          fout.push(`${bestand}: ${sleutel} = ${waarde} staat niet in de tekst`);
        gezien.add(`${sleutel}=${waarde}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de controle merkt een getal dat alleen in de blokken staat', () => {
    const inhoud = '<Blokken programma={x} beschrijving="wijzig hoek met -1" />\nwijzig met 1';
    expect(noemt(proza(inhoud), '-1')).toBe(false);
    expect(noemt('typ -1', '-1')).toBe(true);
    expect(noemt('pin D10', '10')).toBe(false);
    expect(noemt('Servo 10 op 0', '10')).toBe(true);
    expect(noemt(proza('3. Zet PWM 11 op 255'), '3')).toBe(false);
  });
});

describe('op een smal scherm blijven de blokken leesbaar', () => {
  // Het en-programma van Oefenen schaalde op 375 px breed naar 6 px tekst.
  // De tekst is bij schaal 1 16 px (gemeten in Chromium); onder de
  // MINSTE_SCHAAL schuift het kader opzij in plaats van dat het krimpt.
  it('de schaal zakt niet onder 9 px tekst', () => {
    expect(MINSTE_SCHAAL * 16).toBeGreaterThanOrEqual(9);
    expect(schaalVoor(320, 900)).toBe(MINSTE_SCHAAL);
    expect(schaalVoor(600, 400)).toBe(1);
    expect(schaalVoor(400, 500)).toBeCloseTo(0.8);
  });

  it('het kader schuift opzij, niet de pagina', () => {
    const css = readFileSync(
      fileURLToPath(new URL('../components/Blokken/styles.module.css', import.meta.url)),
      'utf8',
    );
    const kader = css.match(/\.kader \{([^}]*)\}/)?.[1] ?? '';
    expect(kader).toMatch(/max-width: 100%/);
    expect(kader).toMatch(/overflow-x: auto/);
  });
});
