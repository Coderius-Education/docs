import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arduino } from '@leaphy-robotics/leaphy-blocks';
import * as B from 'blockly/core';
import 'blockly/blocks';
import * as nl from 'blockly/msg/nl';
import { describe, expect, it } from 'vitest';
import { registreer } from '../components/Blokken/leaphy';
import { cameraAfstand } from '../components/ObjViewer/passend';

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

// Wat de tweede doorloop van intro tot en met bal-slaan vond, vastgepind.
// De teksten van Easybloqs komen uit leaphy-webbased-svelte op 7511bd3: het
// eerste bezoek in packages/client/src/lib/state/popup.svelte.ts (setup:
// eerst LanguageSelector, dan Credits), de menu's in
// components/core/header/Header.svelte (Mijn projecten met Nieuw, Open,
// Opslaan, Opslaan als ...; Meer... met Taal) en het blok Duurt met de
// keuzelijst ms, μs en s in packages/blocks/src/blocks/situation.ts.

const MIJN = ['intro', 'microcontroller', 'easybloqs', 'ir-sensor', 'servo', 'bal-slaan'];

function sectie(inhoud: string, kop: string): string {
  const begin = inhoud.indexOf(kop);
  if (begin === -1) throw new Error(`geen ${kop}`);
  const einde = inhoud.indexOf('\n## ', begin + kop.length);
  return inhoud.slice(begin, einde === -1 ? undefined : einde);
}

describe('Easybloqs voor het eerst', () => {
  it('de taalkeuze bij het eerste bezoek staat in de stappen, vóór de robot', () => {
    // Easybloqs opent eerst een venster met drie talen en zonder keuze is het
    // Engels. Stap 4 ging ervan uit dat de app al Nederlands was.
    const stappen = sectie(tekst('easybloqs'), '## Easybloqs openen');
    const taal = stappen.search(/venster met drie talen[^.]*\. Kies \*\*Nederlands\*\*/);
    expect(taal).toBeGreaterThan(-1);
    expect(taal).toBeLessThan(stappen.indexOf('Kies de robot **Arduino Nano**'));
    // Het tweede venster, met de knop Aan de slag!, komt ook voor de robot.
    expect(stappen.indexOf('**Aan de slag!**')).toBeLessThan(
      stappen.indexOf('Kies de robot **Arduino Nano**'),
    );
  });

  it('de terugweg naar Nederlands noemt ook de Engelse namen', () => {
    expect(tekst('easybloqs')).toMatch(
      /\*\*Meer…\*\* en daarna \*\*Taal\*\* \([^)]*More\.\.\. > Language\)/,
    );
  });

  it('de knop Toon output op scherm is te vinden zonder over de knoppen te zweven', () => {
    // De naam verschijnt alleen als je er met de muis boven hangt; op een
    // touchscherm nooit.
    const inhoud = tekst('easybloqs');
    expect(inhoud).not.toMatch(/Ga met je muis over/);
    expect(inhoud).toMatch(
      /Klik op de knop met het plaatje van een vierkantje met liggende streepjes: dat is de knop \*\*Toon output op scherm\*\*/,
    );
  });
});

describe('een nieuw programma, en het oude', () => {
  it('de servo-les zegt hoe je het sensorprogramma bewaart en weghaalt', () => {
    const inhoud = sectie(tekst('servo'), '## Heen en weer');
    expect(inhoud).toMatch(/\*\*Mijn projecten\*\*[^.]*\*\*Opslaan als \.\.\.\*\*/);
    expect(inhoud).toMatch(
      /sleep \*\*herhaal voor altijd\*\* uit het Leaphy-blok naar de groepen links/,
    );
    // Eerst bewaren, dan weghalen.
    expect(inhoud.indexOf('Opslaan als')).toBeLessThan(inhoud.indexOf('naar de groepen links'));
  });

  it('bal-slaan bouwt op het sensorprogramma, en zegt wat je doet als dat weg is', () => {
    // "Begin met het programma uit stap 2" terwijl de servo-les dat net had
    // laten weghalen.
    const inhoud = tekst('bal-slaan');
    expect(inhoud).toMatch(/open het dan met \*\*Mijn projecten\*\* en \*\*Open\*\*/);
    expect(inhoud).toMatch(/bouw stap 2 opnieuw/);
  });
});

describe('de IR-sensor', () => {
  it('Toon op scherm gaat in het gat onder als … dan, niet achter dan', () => {
    // Het gat van als … dan zit onder de rij, ingesprongen.
    const inhoud = tekst('ir-sensor');
    expect(inhoud).not.toMatch(/achter het woord dan/);
    expect(inhoud).toMatch(/Sleep Toon op scherm in het gat onder als … dan/);
  });

  it('zegt welk van de twee als-blokken je neemt', () => {
    expect(tekst('ir-sensor')).toMatch(
      /twee blokken \*\*als\*\*: neem het eerste, zonder \*\*anders\*\*/,
    );
  });

  it('stap 1 zegt waar herhaal voor altijd komt, vóór het voorbeeld', () => {
    const stap1 = sectie(tekst('ir-sensor'), '## Stap 1');
    const plek = stap1.search(/\*\*herhaal voor altijd\*\*[^.]*in het Leaphy-blok/);
    expect(plek).toBeGreaterThan(-1);
    expect(plek).toBeLessThan(stap1.indexOf('<Blokken'));
  });

  it('de eerste les met duurt noemt het blok Duurt en de keuzelijst, en kiest ms', () => {
    // In de app heet het blok Duurt, met een keuzelijst ms, μs en s. Wie s
    // kiest, wacht 500 seconden.
    const eerste = ROUTE.find((naam) =>
      voorbeelden(tekst(naam)).some((b) =>
        alleBlokken(programma(b)).some((blok) => blok.type === 'time_delay'),
      ),
    );
    expect(eerste).toBe('ir-sensor');
    const inhoud = tekst(eerste as string);
    expect(inhoud).toMatch(/\*\*Duurt\*\*/);
    expect(inhoud).toMatch(/keuzelijstje met ms, μs en s\. Laat dat op \*\*ms\*\* staan/);
  });
});

describe('de servo', () => {
  it('de voorspelvraag komt voordat een zin zegt wat het programma doet', () => {
    const inhoud = tekst('servo');
    const kop = inhoud.indexOf('## Heen en weer');
    const vraag = inhoud.indexOf('<Voorspel vraag="Wat doet het asje?">');
    const ervoor = inhoud.slice(inhoud.indexOf('\n', kop), vraag);
    expect(ervoor).not.toMatch(/laat het asje|heen en weer draai/);
  });

  it('de tip bij Probeer het zelf zegt niet hoeveel blokken er nodig zijn', () => {
    const zelf = sectie(tekst('servo'), '## Probeer het zelf');
    const tip = zelf.slice(zelf.indexOf('<summary>Tip</summary>'), zelf.indexOf('</details>'));
    expect(tip).not.toMatch(/drie keer|\*\*Servo 9 op/);
  });
});

describe('zie de bal, sla de bal', () => {
  it('zegt dat een bal die blijft liggen opnieuw geslagen wordt', () => {
    // Het programma slaat zolang het getal onder de grens is: om de 2,5 s.
    expect(tekst('bal-slaan')).toMatch(/Haal de bal na de slag weg/);
  });

  it('heeft een kaart voor servo-blokken onder als … dan in plaats van erin', () => {
    const kaart = problemen(tekst('bal-slaan')).find((p) =>
      /onder \*\*als … dan\*\*, en niet erin/.test(p.inhoud),
    );
    expect(kaart).toBeDefined();
  });
});

describe('op elk scherm', () => {
  it('wie de muis noemt, noemt ook de vinger', () => {
    // Groep 7/8 werkt ook op een tablet. Toetsen en de rechtermuisknop vallen
    // hier niet onder: die horen bij Easybloqs op de laptop.
    const zonder: string[] = [];
    for (const naam of MIJN) {
      for (const zin of tekst(naam).split(/(?<=[.?!])\s+/)) {
        if (/\bmuis\b/.test(zin) && !/vinger/.test(zin))
          zonder.push(`${naam}: ${zin.slice(0, 60)}`);
      }
    }
    expect(zonder).toEqual([]);
  });

  it('het 3D-model past in de breedte van een telefoon, niet alleen in de hoogte', () => {
    // Een bol met straal 1, kijkhoek 45° in de hoogte. Op 375 bij 500 is het
    // vak smaller dan hoog; de camera moet dan verder weg dan bij een breed vak.
    const breed = cameraAfstand(1, 45, 800 / 500);
    const smal = cameraAfstand(1, 45, 375 / 500);
    expect(smal).toBeGreaterThan(breed);
    // In de breedte past de bol: de halve kijkhoek ziet minstens de straal.
    const horizontaal = 2 * Math.atan(Math.tan((45 * Math.PI) / 360) * (375 / 500));
    expect(smal * Math.sin(horizontaal / 2)).toBeGreaterThanOrEqual(1);
  });
});

describe('de controlevragen', () => {
  it('staan als <Voorspel>, niet meer als twee uitklapblokken', () => {
    const oud = MIJN.filter((naam) => /<summary>Controlevraag<\/summary>/.test(tekst(naam)));
    expect(oud).toEqual([]);
    expect(tekst('intro')).toMatch(/<Voorspel soort="Controlevraag"/);
  });
});

describe('de kaarten', () => {
  it('een titel is een zin met een punt, behalve een letterlijke melding van Easybloqs', () => {
    const LETTERLIJK = new Set([
      'Geen robot geselecteerd',
      'Geen seriële verbinding mogelijk vanwege de browser',
      'Upload mislukt!',
    ]);
    const zonder = MIJN.flatMap((naam) =>
      problemen(tekst(naam))
        .filter((p) => !LETTERLIJK.has(p.titel) && !p.titel.endsWith('.'))
        .map((p) => `${naam}: ${p.titel}`),
    );
    expect(zonder).toEqual([]);
  });
});

describe('de microcontroller', () => {
  it('legt uit waarom er A0/D14 op het shield staat', () => {
    expect(tekst('microcontroller')).toMatch(/Bij A0 staat ook D14: die pin heeft twee namen/);
  });
});
