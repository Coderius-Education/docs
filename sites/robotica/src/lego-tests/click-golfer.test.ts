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
    expect(tekst('microcontroller.md')).toMatch(/Kies de robot \*\*Arduino Nano\*\*/);
    const verkeerd = paginas().filter((f) => /Leaphy Click/.test(tekst(f)));
    expect(verkeerd).toEqual([]);

    // De blokken op de site zijn Nederlands; de leerling moet zien waar hij
    // Easybloqs ook op Nederlands zet, anders staat er 'Read anapin' waar de
    // les 'Lees anapin' zegt.
    expect(tekst('microcontroller.md')).toMatch(/\*\*Meer…\*\* en daarna \*\*Taal\*\*/);
  });

  it('de eerste les noemt de knoppen en meldingen van Easybloqs letterlijk', () => {
    // Een leerling van groep 7/8 zoekt op zijn scherm naar precies de woorden
    // uit de les. Deze teksten komen uit de Nederlandse vertaling van
    // Easybloqs (leaphy-webbased, src/assets/i18n/nl.json). Het scherm opent
    // met een knop rechts naast de blokken, niet via het blok Toon op scherm;
    // en omdat het Leaphy-blok maar één keer loopt, direct na de upload, is
    // de zin weg voordat het scherm opengaat. Daarom de RST-knop.
    const inhoud = tekst('microcontroller.md');
    for (const label of [
      'Upload naar robot',
      'Code compileren',
      'Code uploaden',
      'Upload voltooid',
      'Ga terug naar code scherm',
      'Toon output op scherm',
      'Geen robot geselecteerd',
      'Web serial wordt niet ondersteund',
      'RST',
    ]) {
      expect(inhoud).toContain(`**${label}**`);
    }
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
    'ir-sensor',
    'servo',
    'bal-slaan',
    'bouwen',
    'hout',
    'mikken',
    'extras',
  ];

  it("de pagina's staan in deze volgorde in de zijbalk", () => {
    const positie = (bestand: string) =>
      Number(tekst(bestand).match(/^sidebar_position: (\d+)$/m)?.[1]);
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

  it('geen PDF in de pagina: de lessen staan op de site zelf', () => {
    const met = paginas().filter((f) => /<iframe|\.pdf/.test(tekst(f)));
    expect(met).toEqual([]);
  });

  it('de oude adressen sturen door', () => {
    const config = readFileSync(join(CLICK, '..', 'docusaurus.config.ts'), 'utf8');
    for (const oud of ['aansluiten', 'bal-detecteren', 'hole-in-one']) {
      expect(config).toMatch(new RegExp(`van: '/click_golfer/${oud}'`));
    }
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
