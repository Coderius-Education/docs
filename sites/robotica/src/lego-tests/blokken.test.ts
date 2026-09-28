import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as B from 'blockly/core';
import 'blockly/blocks';
import * as nl from 'blockly/msg/nl';
import { describe, expect, it } from 'vitest';
import { registreer } from '../components/Blokken/leaphy';

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
