import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arduino } from '@leaphy-robotics/leaphy-blocks';
import * as B from 'blockly/core';
import 'blockly/blocks';
import * as nl from 'blockly/msg/nl';
import { describe, expect, it } from 'vitest';
import { registreer } from '../components/Blokken/leaphy';

// Wat een leerling-doorloop van de Click Golfer (intro tot en met bal-slaan)
// vond, vastgepind. Wat Easybloqs laat zien, komt uit de live app:
// leaphy-robotics/leaphy-webbased-svelte, met de toolbox in
// packages/client/src/lib/domain/blockly/toolbox.ts, het pinveld in
// packages/blocks/src/fields/pinSelector.ts en de Nederlandse teksten in
// packages/client/src/assets/translations/nl.json. De oudere repo
// leaphy-webbased staat stil en is niet meer wat leerlingen zien.

const CLICK = fileURLToPath(new URL('../../click_golfer', import.meta.url));

const ROUTE = [
  'intro',
  'microcontroller',
  'easybloqs',
  'ir-sensor',
  'servo',
  'bal-slaan',
  'oefenen',
  'bouwen',
  'hout',
  'mikken',
  'subprogrammas',
  'extras',
];

function tekst(naam: string): string {
  return readFileSync(join(CLICK, `${naam}.md`), 'utf8');
}

function voorbeelden(inhoud: string): string[] {
  return [...inhoud.matchAll(/from '\.\/blokken\/([^']+\.json)'/g)].map((m) => m[1]);
}

type Blok = {
  type: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, { block?: Blok; shadow?: Blok }>;
  next?: { block?: Blok };
};

function alleBlokken(waarde: unknown, uit: Blok[] = []): Blok[] {
  if (!waarde || typeof waarde !== 'object') return uit;
  const blok = waarde as Blok;
  if (typeof blok.type === 'string') uit.push(blok);
  for (const kind of Object.values(waarde)) alleBlokken(kind, uit);
  return uit;
}

function getal(blok: Blok | undefined): unknown {
  return blok?.type === 'math_number' ? blok.fields?.NUM : undefined;
}

function programma(bestand: string): { blocks: { blocks: Blok[] } } {
  return JSON.parse(readFileSync(join(CLICK, 'blokken', bestand), 'utf8'));
}

function problemen(inhoud: string): { titel: string; inhoud: string }[] {
  return [...inhoud.matchAll(/<Probleem titel="([^"]+)">([\s\S]*?)<\/Probleem>/g)].map((m) => ({
    titel: m[1],
    inhoud: m[2],
  }));
}

describe('een blok dat in Easybloqs anders begint dan in de les', () => {
  // Een blok uit de toolbox staat niet zoals in het voorbeeld: het servo-blok
  // begint op pin 2 (het pinveld telt vanaf 2), het vergelijkblok op 1 = 1, en
  // duurt op 1000. Een leerling die het voorbeeld natekent, ziet dat verschil
  // niet als de les het niet zegt; zijn servo op D9 doet dan niets.
  // Per bloktype: wat Easybloqs neerzet, hoe je dat in het voorbeeld leest,
  // en wat de les moet noemen (wat er eerst staat, en wat je kiest).
  const BEGIN: {
    type: string;
    anders: (blok: Blok) => string | undefined;
    eerst: RegExp;
    kies: (waarde: string) => RegExp;
  }[] = [
    {
      type: 'leaphy_servo_write',
      anders: (b) => (b.fields?.SERVO_PIN !== '2' ? String(b.fields?.SERVO_PIN) : undefined),
      eerst: /\*\*Servo 2 op 90\*\*/,
      kies: (pin) => new RegExp(`kies \\*\\*${pin}\\*\\*`),
    },
    {
      type: 'logic_compare',
      anders: (b) => (b.fields?.OP !== 'EQ' ? String(b.fields?.OP) : undefined),
      eerst: /`1 = 1`/,
      kies: (op) => new RegExp(`kies[^.]*\\*\\*\`${{ LT: '<', GT: '>' }[op] ?? op}\`\\*\\*`),
    },
    {
      type: 'time_delay',
      anders: (b) => {
        const ms = getal(b.inputs?.DELAY_TIME_MILI?.block);
        return ms !== 1000 ? String(ms) : undefined;
      },
      eerst: /eerst 1000/,
      kies: (ms) => new RegExp(`typ ${ms}\\b`),
    },
  ];

  it.each(BEGIN.map((b) => [b.type, b] as const))(
    '%s: de eerste les waarin het voorbeeld afwijkt, zegt wat er eerst staat en wat je kiest',
    (_type, { type, anders, eerst, kies }) => {
      for (const naam of ROUTE) {
        const inhoud = tekst(naam);
        for (const bestand of voorbeelden(inhoud)) {
          const blok = alleBlokken(programma(bestand)).find(
            (b) => b.type === type && anders(b) !== undefined,
          );
          if (!blok) continue;
          expect(inhoud, `${naam}: ${bestand}`).toMatch(eerst);
          expect(inhoud, `${naam}: ${bestand}`).toMatch(kies(anders(blok) as string));
          return;
        }
      }
      throw new Error(`geen voorbeeld met ${type} dat afwijkt`);
    },
  );
});

describe('de kaarten bij Er gaat iets mis', () => {
  it('twee kaarten op één pagina delen geen symptoom', () => {
    // "Het asje trilt" en "De servo zoemt of trilt" stonden naast elkaar,
    // met een andere oorzaak. Een leerling met een trillende servo kiest dan
    // de eerste en zoekt naar een ontbrekend duurt-blok.
    const SYMPTOMEN = ['trilt', 'zoemt', 'schokt', 'warm', 'leeg', 'nooit', 'niets', 'twee keer'];
    const dubbel: string[] = [];
    for (const naam of ROUTE) {
      const titels = problemen(tekst(naam)).map((p) => p.titel.toLowerCase());
      for (const woord of SYMPTOMEN) {
        const met = titels.filter((t) => new RegExp(`\\b${woord}\\b`).test(t));
        if (met.length > 1) dubbel.push(`${naam}: "${woord}" in ${met.join(' / ')}`);
      }
    }
    expect(dubbel).toEqual([]);
  });

  it('elke fout die de doorloop tegenkwam, heeft een kaart op de pagina waar hij gebeurt', () => {
    const NODIG: [string, RegExp, string][] = [
      // Het scherm bewaart wat de robot na de upload stuurde; na RST staat
      // de zin er dan nog een keer.
      ['easybloqs', /twee keer/, 'titel'],
      // Actuatoren heeft twee blokken Toon op scherm; het tweede zet "= 0"
      // achter de tekst.
      ['easybloqs', /= 0/, 'titel'],
      // Melding uit nl.json (UPDATE_FAILED, NOT_IN_SYNC).
      ['easybloqs', /^Upload mislukt!$/, 'titel'],
      ['easybloqs', /De robot is niet in sync, probeer het opnieuw/, 'inhoud'],
      // Het vergelijkblok begint op =; dan verschijnt de zin nooit.
      ['ir-sensor', /klaar om te golfen/, 'titel'],
      // Het servo-blok begint op pin 2.
      ['servo', /\*\*Servo 2\*\*/, 'inhoud'],
    ];
    const ontbreekt = NODIG.filter(
      ([naam, patroon, waar]) =>
        !problemen(tekst(naam)).some((p) => patroon.test(waar === 'titel' ? p.titel : p.inhoud)),
    ).map(([naam, patroon]) => `${naam}: ${patroon}`);
    expect(ontbreekt).toEqual([]);
  });
});

describe('wat de lessen over Easybloqs zeggen, klopt met de app', () => {
  it('noemt de knoppen zoals ze in de live app heten', () => {
    // "Windows drivers" heet in de app "Download Windows drivers", en staat
    // alleen op een Windows-laptop in het menu. Het scherm heeft een
    // prullenbak (faTrash in SerialMonitor.svelte), en het uploadvenster
    // begint met "Verbinden met robot..." en opent de poort vóór het uploaden.
    const inhoud = tekst('easybloqs');
    expect(inhoud).toContain('**Download Windows drivers**');
    expect(inhoud).not.toMatch(/en daarna \*\*Windows drivers\*\*/);
    expect(inhoud).toMatch(/Windows-laptop/);
    expect(inhoud).toMatch(/prullenbak/);
    expect(inhoud).toContain('**Verbinden met robot...**');
    expect(inhoud).toContain('**Poort openen**');
  });

  it('de controlevraag over het scherm heeft één antwoord', () => {
    // Na de upload kan de zin al op het scherm staan, en na RST nog een keer.
    // "Hoe vaak zie je elke zin?" had dan twee goede antwoorden, tenzij de
    // vraag zegt dat het scherm eerst leeg is.
    const inhoud = tekst('easybloqs');
    const vraag = inhoud.slice(inhoud.lastIndexOf('<Voorspel soort="Controlevraag"'));
    expect(vraag.slice(0, 400)).toMatch(/prullenbak/);
  });

  it('de les zegt welk van de twee blokken Toon op scherm je neemt', () => {
    expect(tekst('easybloqs')).toMatch(/twee blokken \*\*Toon op scherm\*\*/);
  });
});

describe('aansluiten', () => {
  it('wie de robot uitzet om iets aan te sluiten, zet hem daarna weer aan', () => {
    // De lessen zeiden "zet je robot uit met ON/OFF" en daarna alleen
    // "Upload". Of de servo via usb alleen ook draait, is niet gemeten; dat
    // je hem weer aanzet voordat je test, klopt in elk geval.
    const zonder = ['ir-sensor', 'servo'].filter((naam) => {
      const inhoud = tekst(naam);
      const uit = inhoud.indexOf('uit met de knop **ON/OFF**');
      return uit === -1 || !/weer aan met \*\*ON\/OFF\*\*/.test(inhoud.slice(uit));
    });
    expect(zonder).toEqual([]);
  });

  it('het signaalpinnetje is het pinnetje bij de naam van de pin', () => {
    // Boven de kolommen staat alleen <GND en <5V. Welke van de drie het
    // signaal is, moest de leerling raden.
    expect(tekst('microcontroller')).toMatch(/dichtst bij de naam/);
    expect(tekst('ir-sensor')).toMatch(/dichtst bij de naam/);
    expect(tekst('servo')).toMatch(/dichtst bij de naam/);
  });

  it('bij het sensorplaatje staat dat de oranje draad alleen op A0 hoort', () => {
    // Op het plaatje loopt de draad langs de rij van A4 en dan omhoog; de
    // hoeken lijken aansluitpunten. Het plaatje zelf passen we niet aan.
    const inhoud = tekst('ir-sensor');
    const na = inhoud.slice(inhoud.indexOf('click_golfer_sensor.png'));
    expect(na.slice(0, 400)).toMatch(/rij van A4/);
  });

  it('D0 van de sensor is niet D0 van het shield', () => {
    // Het shield heeft ook D0 (D0/TX1), de pin waarover het programma naar de
    // Arduino gaat. De controlevraag "waarom niet op D0?" liet in het midden
    // welke D0 bedoeld was.
    const inhoud = tekst('ir-sensor');
    expect(inhoud).toMatch(/\*\*D0\/TX1\*\*/);
    expect(inhoud).not.toMatch(/waarom niet op D0\?/);
  });
});

registreer(B, nl as unknown as Record<string, string>);

function code(bestand: string): string {
  const ws = new B.Workspace();
  try {
    B.serialization.workspaces.load(programma(bestand), ws);
    return arduino.workspaceToCode(ws);
  } finally {
    ws.dispose();
  }
}

describe('wat Easybloqs van de voorbeelden maakt', () => {
  // Dezelfde generator als Easybloqs (arduino uit @leaphy-robotics/leaphy-blocks).

  it('de sensorvoorbeelden lezen A0 en wachten zo lang als de les zegt', () => {
    expect(code('sensor-uitlezen.json')).toMatch(
      /Serial\.println\(analogRead\(A0\)\);\s*delay\(500\);/,
    );
    expect(code('bal-klaar.json')).toMatch(/if \(analogRead\(A0\) < 300\)/);
  });

  it('de servo gaat bij het opstarten al naar 90°, dus daar wacht hij ook tussen twee slagen', () => {
    // De generator zet myServo9.attach(9) in setup, vóór het programma van de
    // leerling; de Servo-bibliotheek van de Arduino stuurt dan 90°. Wacht
    // het slaanprogramma op een andere stand, dan doet de eerste bal iets
    // anders dan de rest, en klopt "geen bal, dan niets" niet.
    const c = code('bal-slaan.json');
    expect(c.indexOf('myServo9.attach(9);')).toBeGreaterThan(c.indexOf('void setup()'));
    expect(c.indexOf('myServo9.attach(9);')).toBeLessThan(c.indexOf('leaphyProgram();'));
    const standen = [...c.matchAll(/myServo9\.write\((\d+)\);/g)].map((m) => Number(m[1]));
    expect(standen.at(-1)).toBe(90);
    expect(standen[0]).toBeLessThan(90);
  });

  it('de slaanles zegt dat het asje direct na de upload kan bewegen', () => {
    const inhoud = tekst('bal-slaan');
    expect(inhoud).toMatch(/direct na de upload[^.]*90°/);
    expect(inhoud).toMatch(/naar 0° en slaat terug naar 90°/);
  });
});
