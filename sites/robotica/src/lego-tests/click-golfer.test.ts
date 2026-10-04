import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Click Golfer is voor groep 7/8 en draait om hardware die de leerling voor
// zich heeft. Wat de tekst over die hardware zegt, kan hij niet nakijken —
// dus moet het kloppen.
//
// Twee dingen gingen mis. "De houten baan" zei dat je met het blauwe
// stelschroefje de gevoeligheid instelt, terwijl dit project de sensor
// analoog uitleest op A0: dat schroefje hoort bij de digitale uitgang D0, en
// die is in het bedradingsschema niet eens aangesloten. En "Aansluiten"
// noemde geen enkele pin, terwijl `sites/robotica/CLAUDE.md` voorschrijft dat
// hardware-instructies de exacte pin-aansluitingen noemen — drie pagina's
// later dook A0 op zonder dat ergens stond waarom.

const CLICK = fileURLToPath(new URL('../../click_golfer', import.meta.url));
const STATIC = fileURLToPath(new URL('../../static', import.meta.url));

function paginas(): string[] {
  return readdirSync(CLICK)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function tekst(bestand: string): string {
  return readFileSync(join(CLICK, bestand), 'utf8');
}

function problemen(inhoud: string): { titel: string; inhoud: string }[] {
  return [...inhoud.matchAll(/<Probleem titel="([^"]+)">([\s\S]*?)<\/Probleem>/g)].map((m) => ({
    titel: m[1],
    inhoud: m[2],
  }));
}

describe('de hardware-uitleg klopt', () => {
  it('noemt het stelschroefje alleen met de mededeling dat je het laat zitten', () => {
    // Het schroefje zet de drempel van de digitale uitgang D0, en die is niet
    // eens aangesloten. Wie het noemt zonder erbij te zeggen dat het hier
    // niets doet, stuurt een leerling naar een knop die het getal op zijn
    // scherm niet verandert. Een verbod op de woorden zou te grof zijn: de
    // foto toont het schroefje, dus benoemen mag, mits met die uitleg erbij.
    const zonderUitleg: string[] = [];

    for (const bestand of paginas()) {
      const inhoud = tekst(bestand);
      for (const m of inhoud.matchAll(/schroefje/gi)) {
        const rondom = inhoud.slice(m.index, m.index + 260);
        if (
          !/laat je met rust|laat je zitten|niets? (mee )?te maken|verandert er niet van/i.test(
            rondom,
          )
        ) {
          zonderUitleg.push(`${bestand}: "${rondom.slice(0, 60)}…"`);
        }
      }
    }

    expect(zonderUitleg).toEqual([]);
  });

  it('elke pagina met een blokprogramma noemt de pinnen daaruit ook in de tekst', () => {
    // De pin staat in de blokken, en die tekent de browser pas. Een leerling
    // die op de pagina leest welke draad waar moet, moet de pin in de tekst
    // vinden: vet, zoals in de aansluittabellen, of via een link naar de les
    // die hem aansluit.
    const zonder: string[] = [];

    for (const bestand of paginas()) {
      const inhoud = tekst(bestand);
      for (const m of inhoud.matchAll(/from '\.\/blokken\/([^']+\.json)'/g)) {
        const programma = readFileSync(join(CLICK, 'blokken', m[1]), 'utf8');
        const pinnen = new Set<string>();
        for (const p of programma.matchAll(/"PIN": "(A\d)"/g)) pinnen.add(p[1]);
        for (const p of programma.matchAll(/"SERVO_PIN": "(\d+)"/g)) pinnen.add(`D${p[1]}`);
        for (const pin of pinnen) {
          const uitleg = pin.startsWith('A') ? 'ir-sensor' : 'servo';
          const noemt =
            inhoud.includes(`**${pin}**`) || new RegExp(`\\(${uitleg}(\\.md)?\\)`).test(inhoud);
          if (!noemt) zonder.push(`${bestand}: ${m[1]} gebruikt ${pin}`);
        }
      }
    }

    expect(zonder).toEqual([]);
  });

  it('in Easybloqs kies je de Arduino Nano', () => {
    // Het werkboek toonde een tegel "Leaphy Click", maar het bord van de
    // Click Golfer is een Arduino Nano. Wie de verkeerde robot kiest, krijgt
    // andere pinnen in de blokken dan de lessen noemen.
    expect(tekst('easybloqs.md')).toMatch(/Kies de robot \*\*Arduino Nano\*\*/);
    const verkeerd = paginas().filter((f) => /Leaphy Click/.test(tekst(f)));
    expect(verkeerd).toEqual([]);

    // De blokken op de site zijn Nederlands; de leerling moet zien waar hij
    // Easybloqs ook op Nederlands zet, anders staat er 'Read anapin' waar de
    // les 'Lees anapin' zegt.
    expect(tekst('easybloqs.md')).toMatch(/\*\*Meer…\*\* en daarna \*\*Taal\*\*/);
  });

  it('de Easybloqs-les noemt de knoppen en meldingen van Easybloqs letterlijk', () => {
    // Een leerling van groep 7/8 zoekt op zijn scherm naar precies de woorden
    // uit de les. Deze teksten komen uit de Nederlandse vertaling van
    // Easybloqs (leaphy-webbased, src/assets/i18n/nl.json). Het scherm opent
    // met een knop rechts naast de blokken, niet via het blok Toon op scherm;
    // en omdat het Leaphy-blok maar één keer loopt, direct na de upload, is
    // de zin weg voordat het scherm opengaat. Daarom de RST-knop.
    const inhoud = tekst('easybloqs.md');
    for (const label of [
      'Upload naar robot',
      'Code compileren',
      'Code uploaden',
      'Upload voltooid',
      'Ga terug naar code scherm',
      'Toon output op scherm',
      'Geen robot geselecteerd',
      'Geen seriële verbinding mogelijk vanwege de browser',
      'RST',
    ]) {
      // Vet in de tekst, of als titel van een kaart bij Er gaat iets mis.
      const genoemd = inhoud.includes(`**${label}**`) || inhoud.includes(`titel="${label}"`);
      expect(genoemd, label).toBe(true);
    }
  });

  it('een bal voor de sensor geeft een lager getal, dus "bal" is kleiner dan de grens', () => {
    // Nagemeten op het bord: een obstakel voor de IR-sensor maakt het getal
    // op A0 lager, niet hoger. De lessen en het Leaphy-werkboek gebruikten
    // eerst "groter dan 300", en dan ziet de robot nooit een bal.
    const verkeerd: string[] = [];
    type Blok = { type?: string; fields?: { OP?: string }; inputs?: { A?: { block?: Blok } } };
    const loop = (waarde: unknown, bestand: string) => {
      if (!waarde || typeof waarde !== 'object') return;
      const blok = waarde as Blok;
      if (blok.type === 'logic_compare' && blok.inputs?.A?.block?.type === 'analog_read') {
        if (blok.fields?.OP !== 'LT') verkeerd.push(`${bestand}: ${blok.fields?.OP}`);
      }
      for (const kind of Object.values(waarde)) loop(kind, bestand);
    };
    for (const bestand of readdirSync(join(CLICK, 'blokken')).filter((f) => f.endsWith('.json'))) {
      loop(JSON.parse(readFileSync(join(CLICK, 'blokken', bestand), 'utf8')), bestand);
    }
    // In de tekst gaat het om de voorwaarde zelf. "Zonder bal is het getal
    // groter dan 300" is juist waar, en mag blijven.
    for (const bestand of paginas()) {
      if (/(anapin A0\**|kijk je of het getal) groter (is )?dan/i.test(tekst(bestand))) {
        verkeerd.push(`${bestand}: "groter dan" bij de sensor`);
      }
    }
    expect(verkeerd).toEqual([]);
  });

  it('wie iets aansluit, ziet het schema van dat onderdeel', () => {
    // Een tabel met draadkleuren is voor groep 7/8 niet genoeg: bij het
    // aansluiten hoort de uitsnede van het Fritzing-schema.
    expect(tekst('ir-sensor.md')).toContain('fritzing/click_golfer_sensor.png');
    expect(tekst('servo.md')).toContain('fritzing/click_golfer_servo.png');
    expect(tekst('easybloqs.md')).toContain('fritzing/click_golfer_rst.png');
  });

  it('wat alleen in een bouwplaatje staat, staat ook in de tekst', () => {
    // Stap 4 van het werkboek zegt in een kadertje dat het snoertje van de
    // motor omhoog moet. In een plaatje leest een leerling daar overheen.
    const zonderPlaatjes = tekst('bouwen.md').replace(/<figure>[\s\S]*?<\/figure>/g, '');
    expect(zonderPlaatjes).toMatch(/snoertje[^.]*\*\*omhoog\*\*/);
  });

  it('elke fout bij de servo heeft één oorzaak, niet een tweede onder de verkeerde kop', () => {
    // "Doet helemaal niets" had "beweegt één keer en daarna niet meer" als
    // punt erbij: dat is een ander symptoom, met een eigen kaart.
    const niets = problemen(tekst('servo.md')).find(
      (p) => p.titel === 'De servo doet helemaal niets.',
    );
    expect(niets).toBeDefined();
    expect(niets?.inhoud).not.toMatch(/één keer/);
  });

  it('"Er gaat iets mis" is een kaart per probleem, met oorzaak en oplossing', () => {
    // Losse vette regels onder elkaar lazen als één lap tekst. Elke sectie
    // bestaat nu uit <Probleem>-kaarten, en elke kaart zegt waarom het
    // misgaat en wat je eraan doet.
    const fout: string[] = [];
    for (const bestand of paginas()) {
      const inhoud = tekst(bestand);
      const begin = inhoud.indexOf('## Er gaat iets mis');
      if (begin === -1) continue;
      const sectie = inhoud.slice(begin).split(/\n<details>|\n<Voorspel|\n## (?!Er gaat)/)[0];
      const zonderKaarten = sectie.replace(/<Probleem[\s\S]*?<\/Probleem>/g, '');
      if (/\*\*(Oorzaak|Oplossing):\*\*/.test(zonderKaarten))
        fout.push(`${bestand}: tekst buiten een kaart`);
      const kaarten = problemen(sectie);
      if (kaarten.length === 0) fout.push(`${bestand}: geen kaarten`);
      for (const { titel, inhoud: k } of kaarten) {
        if (!/\*\*Oorzaak:\*\*/.test(k) || !/\*\*Oplossing:\*\*/.test(k))
          fout.push(`${bestand}: ${titel}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('wie de servo losmaakt, sluit hem vóór stap 11 weer aan', () => {
    // Vóór stap 11 zet de leerling de servo met een programma op 90°. De
    // bouwpagina zei eerst "sluit ze na het bouwen weer aan": wie dat deed,
    // zette het tandwiel op een willekeurige stand.
    const inhoud = tekst('bouwen.md');
    const voorStap11 = inhoud.slice(0, inhoud.indexOf('stap-11.jpg'));
    expect(voorStap11).toMatch(/vóór stap 11\*\* weer aan/);
    expect(voorStap11).not.toMatch(/na het bouwen weer aan/);
    expect(voorStap11).toMatch(/Kijk daarom eerst of de servo op het signaal van \*\*D9\*\* zit/);
  });

  it('na stap 11 test je de servo met alleen het tandwiel, en pas dan bouw je de arm', () => {
    // De bouwpagina ging van het tandwiel in stap 11 meteen door naar de arm.
    // Werkte de Golfer daarna niet, dan wist de leerling niet of het aan de
    // servo, het tandwiel of de arm lag. Met alleen een tandwiel zie je het
    // meteen; daarna zet je de servo terug op 90° en bouw je verder.
    const inhoud = tekst('bouwen.md');
    const tussen = inhoud.slice(inhoud.indexOf('stap-11.jpg'), inhoud.indexOf('stap-12.jpg'));
    expect(tussen).toMatch(/^## Eerst testen: alleen het tandwiel$/m);
    expect(tussen).toMatch(/<Blokken programma=\{heenEnWeer\}/);
    expect(tussen).toMatch(/\*\*Servo 9 op 90\*\*/);
    expect(tussen).toMatch(/^## De arm$/m);
  });

  it('de sensor- en de servoles noemen hun pin', () => {
    expect(tekst('ir-sensor.md')).toMatch(/\*\*A0\*\*/);
    expect(tekst('servo.md')).toMatch(/\*\*D9\*\*/);
  });
});

describe('de volgorde van de route', () => {
  // Eerst de onderdelen los, en pas als ze samen werken de Lego en de baan
  // eromheen: wie bouwt voordat hij de servo kent, bouwt een arm die hij
  // niet kan testen.
  const VOLGORDE = [
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

  it("de pagina's staan in deze volgorde in de zijbalk", () => {
    const positie = (bestand: string) =>
      Number(tekst(bestand).match(/^sidebar_position: ([\d.]+)$/m)?.[1]);
    const volgorde = paginas()
      .sort((a, b) => positie(a) - positie(b))
      .map((f) => f.replace(/\.mdx?$/, ''));
    expect(volgorde).toEqual(VOLGORDE);
  });

  it('elke pagina wijst aan het eind naar de volgende', () => {
    const zonder = VOLGORDE.slice(1, -1).filter((naam, i) => {
      const volgende = VOLGORDE[i + 2];
      const slot = tekst(`${naam}.md`).trimEnd().split('\n').at(-1) ?? '';
      return !slot.includes(`](${volgende})`);
    });
    expect(zonder).toEqual([]);
  });

  it('de pagina waar een blok voor het eerst voorkomt, zegt in welke groep het staat', () => {
    // Een leerling die nog nooit programmeerde, zoekt eerst naar het blok.
    // De groepen komen uit de toolbox van Easybloqs voor de Arduino Nano
    // (leaphy-webbased: src/assets/blockly/base-toolbox.xml en
    // leaphy-toolbox.xml). Getallen, vergelijken en willekeurig getal staan
    // in Getal blokken: zo ziet de docent het in de app, ook al gaf de
    // toolbox in de broncode ze de naam Functies.
    // Per bloktype: de groep, en hoe de les het blok noemt (vet, zoals de
    // leerling het in Easybloqs leest).
    const GROEP: Record<string, [string, string]> = {
      analog_read: ['Sensoren', 'Lees anapin'],
      leaphy_serial_print_line: ['Actuatoren', 'Toon op scherm'],
      leaphy_servo_write: ['Actuatoren', 'Servo'],
      controls_repeat_forever: ['Denk stappen', 'herhaal voor altijd'],
      controls_repeat_ext: ['Denk stappen', 'herhaal'],
      controls_if: ['Denk stappen', 'als … dan'],
      time_delay: ['Denk stappen', 'duurt'],
      logic_compare: ['Getal blokken', '`<`'],
      math_random_int: ['Getal blokken', 'willekeurig getal'],
      variables_set: ['Variabelen', 'stel hoek in op'],
      procedures_defnoreturn: ['Eigen blokken', 'Subprogramma'],
      procedures_callnoreturn: ['Eigen blokken', 'mikken'],
      leaphy_io_analogwrite: ['Actuatoren', 'Zet PWM'],
    };
    const gezien = new Set<string>();
    const zonder: string[] = [];
    for (const naam of VOLGORDE) {
      const inhoud = tekst(`${naam}.md`);
      for (const m of inhoud.matchAll(/from '\.\/blokken\/([^']+\.json)'/g)) {
        const programma = readFileSync(join(CLICK, 'blokken', m[1]), 'utf8');
        for (const [type, [groep, blok]] of Object.entries(GROEP)) {
          if (gezien.has(type) || !programma.includes(`"type": "${type}"`)) continue;
          gezien.add(type);
          if (!inhoud.includes(`**${groep}**`))
            zonder.push(`${naam}: ${type} zonder groep ${groep}`);
          if (!inhoud.includes(`**${blok}`)) zonder.push(`${naam}: ${type} zonder de naam ${blok}`);
        }
      }
    }
    expect(zonder).toEqual([]);
    expect(gezien.size).toBe(Object.keys(GROEP).length);
  });

  it('voor het bouwen is er nog geen arm, alleen het asje van de servo', () => {
    // De servo- en de slaanles komen vóór de Lego. Een les die zegt "de arm
    // gaat naar 0°" laat een leerling zoeken naar iets wat nog niet bestaat.
    // Alleen een zin die zegt dat de arm straks of later komt, mag hem noemen.
    const voorBouwen = VOLGORDE.slice(0, VOLGORDE.indexOf('bouwen')).filter((n) => n !== 'intro');
    const met: string[] = [];
    for (const naam of voorBouwen) {
      for (const zin of tekst(`${naam}.md`).split(/(?<=[.?!])\s+/)) {
        if (/\barm\b/i.test(zin) && !/straks|later/i.test(zin))
          met.push(`${naam}: ${zin.slice(0, 60)}`);
      }
    }
    expect(met).toEqual([]);
  });

  it('geen PDF in de pagina: de lessen staan op de site zelf', () => {
    const met = paginas().filter((f) => /<iframe|\.pdf/.test(tekst(f)));
    expect(met).toEqual([]);
  });

  it('de oude adressen sturen door naar de les die hun inhoud nu heeft', () => {
    // hole-in-one stuurde eerst naar bal-slaan, maar de uitdaging Hole in one
    // staat in de baanles. Een leerling met een oud werkblad kwam dan op de
    // tafelles terecht, zonder de uitdaging.
    const config = readFileSync(join(CLICK, '..', 'docusaurus.config.ts'), 'utf8');
    const DOEL: Record<string, string> = {
      aansluiten: 'ir-sensor',
      'bal-detecteren': 'ir-sensor',
      'hole-in-one': 'hout#hole-in-one',
    };
    for (const [oud, nieuw] of Object.entries(DOEL)) {
      expect(config).toContain(`{ van: '/click_golfer/${oud}', naar: '/click_golfer/${nieuw}' }`);
    }
    expect(tekst('hout.md')).toMatch(/^## Hole in one$/m);
  });
});

describe('elk bestand waar een pagina naar wijst, bestaat', () => {
  // De sectie leunt op downloads en PDF's in `static/`. Docusaurus
  // controleert die paden niet: een hernoemde PDF geeft een lege iframe en
  // een dode downloadknop, zonder dat de build klaagt.
  const verwijzingen: [string, string][] = [];
  for (const bestand of paginas()) {
    const inhoud = tekst(bestand);
    for (const m of inhoud.matchAll(
      /(?:src|href)="\/((?:click_golfer|models|fritzing)\/[^"]+)"/g,
    )) {
      verwijzingen.push([bestand, m[1]]);
    }
    for (const m of inhoud.matchAll(/\]\(@site\/static\/([^)]+)\)/g)) {
      verwijzingen.push([bestand, m[1]]);
    }
  }

  it('vindt de verwijzingen', () => {
    expect(verwijzingen.length).toBeGreaterThan(10);
  });

  it.each(verwijzingen)('%s wijst naar bestaand %s', (_bestand, pad) => {
    expect(existsSync(join(STATIC, pad))).toBe(true);
  });
});
