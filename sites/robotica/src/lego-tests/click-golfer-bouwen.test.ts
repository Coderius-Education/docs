import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het tweede deel van de Click Golfer: bouwen, de houten baan, mikken,
// subprogramma's en de extra's. Wat hier vastligt, ging mis in de
// leerling-doorloop.

const CLICK = fileURLToPath(new URL('../../click_golfer', import.meta.url));
const STATIC = fileURLToPath(new URL('../../static', import.meta.url));

function tekst(bestand: string): string {
  return readFileSync(join(CLICK, bestand), 'utf8');
}

function paginas(): string[] {
  return readdirSync(CLICK)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

type Onderdeel = { nr: string; kleur: string; aantal: number };
type Stap = { stap: number; onderdelen: Onderdeel[] };

const STAPPEN: Stap[] = JSON.parse(tekst('bouwstappen.json')).stappen;

function optellen(rijen: Onderdeel[]): Record<string, number> {
  const som: Record<string, number> = {};
  for (const { nr, kleur, aantal } of rijen) {
    const sleutel = `${nr} ${kleur}`;
    som[sleutel] = (som[sleutel] ?? 0) + aantal;
  }
  return som;
}

describe('de onderdelenlijst klopt met de bouwplaatjes', () => {
  // De 26 plaatjes kwamen uit een andere versie dan de tabel, de CSV en het
  // 3D-model: twee busjes waar de lijst er één had, vier blauwe pinnen waar
  // er drie waren, zeventien zwarte pinnen waar de lijst er twaalf zwart en
  // vier geel had. De leerling volgt de plaatjes, dus die zijn leidend; de
  // telling per plaatje staat in click_golfer/bouwstappen.json.
  const PLAATJE = /<img src="\/click_golfer\/bouwen\/stap-(\d+)\.jpg"[^>]*alt="([^"]+)"/g;
  const plaatjes = [...tekst('bouwen.md').matchAll(PLAATJE)].map((m) => ({
    stap: Number(m[1]),
    alt: m[2],
  }));

  it('er is een telling voor elk plaatje op de pagina, in dezelfde volgorde', () => {
    expect(plaatjes.map((p) => p.stap)).toEqual(STAPPEN.map((s) => s.stap));
    expect(STAPPEN).toHaveLength(26);
  });

  it('de tabel in bouwen.md telt op tot wat er op de plaatjes staat', () => {
    const inhoud = tekst('bouwen.md');
    const tabel = inhoud.slice(inhoud.indexOf('## Onderdelenlijst'), inhoud.indexOf('## De toren'));
    const rijen: Onderdeel[] = [
      ...tabel.matchAll(/^\| (\d+) \| [^|]+ \| ([^|]+) \| ([^|]+) \|$/gm),
    ].map((m) => ({ aantal: Number(m[1]), kleur: m[2].trim(), nr: m[3].trim() }));
    expect(optellen(rijen)).toEqual(optellen(STAPPEN.flatMap((s) => s.onderdelen)));
  });

  it('het aantal in de tekst is het aantal Lego-stukjes op de plaatjes', () => {
    const lego = STAPPEN.flatMap((s) => s.onderdelen)
      .filter((o) => o.nr !== '–')
      .reduce((som, o) => som + o.aantal, 0);
    expect(tekst('bouwen.md')).toContain(
      `**${lego} Lego Technic-stukjes** plus de **Leaphy-servo**`,
    );
  });

  it('de CSV voor BrickLink bestelt hetzelfde, en het totaal klopt', () => {
    // Een kleur verandert in BrickLink de kleurcode, niet het onderdeelnummer.
    const KLEUR: Record<string, string> = {
      Black: 'Zwart',
      'Light Bluish Gray': 'Lichtgrijs',
      Blue: 'Blauw',
    };
    const csv = readFileSync(join(STATIC, 'click_golfer/onderdelenlijst.csv'), 'utf8');
    const rijen: Onderdeel[] = [];
    for (const regel of csv.split(/\r?\n/).slice(1)) {
      const velden = regel.match(/("[^"]*"|[^,]*)(,|$)/g)?.map((v) => v.replace(/,$/, '')) ?? [];
      if (!velden[0] || velden.length < 10 || !/^\d+$/.test(velden[8])) continue;
      rijen.push({
        nr: velden[0],
        kleur: KLEUR[velden[6]] ?? velden[6],
        aantal: Number(velden[8]),
      });
    }
    const totaal = Number(csv.match(/^Total qty,.*\r?\n(\d+),/m)?.[1]);
    const lego = STAPPEN.flatMap((s) => s.onderdelen).filter((o) => o.nr !== '–');
    expect(optellen(rijen)).toEqual(optellen(lego));
    // "Total qty" telde de servo niet mee, en dat blijft zo: die bestel je
    // niet bij BrickLink.
    expect(totaal).toBe(rijen.reduce((som, o) => som + o.aantal, 0));
  });

  it('een kleur in de alt-tekst staat ook op dat plaatje', () => {
    // Stap 8 heette "twee zwarte pinnen", maar op het plaatje staan twee
    // lichtgrijze assen met een pin.
    const WOORD: [RegExp, string][] = [
      [/\bzwart/i, 'Zwart'],
      [/\b(licht)?grij[sz]/i, 'Lichtgrijs'],
      [/\bblauw/i, 'Blauw'],
      [/\bgee?l/i, 'Geel'],
      [/\bro(o)?d/i, 'Rood'],
      [/\bwit/i, 'Wit'],
    ];
    const fout: string[] = [];
    for (const { stap, alt } of plaatjes) {
      const kleuren = new Set(STAPPEN.find((s) => s.stap === stap)?.onderdelen.map((o) => o.kleur));
      // Wat al eerder gebouwd is, mag in de tekst staan zonder kleur.
      for (const [woord, kleur] of WOORD) {
        if (woord.test(alt) && !kleuren.has(kleur)) fout.push(`stap ${stap}: ${kleur}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de tip over het 3D-model zegt dat de plaatjes kloppen', () => {
    // Het 3D-model is de andere versie: geel, rood, beige en donkergrijs.
    const inhoud = tekst('bouwen.md');
    const tip = inhoud.slice(
      inhoud.indexOf(':::tip'),
      inhoud.indexOf(':::', inhoud.indexOf(':::tip') + 6),
    );
    expect(tip).toMatch(/kleuren/);
    expect(tip).toMatch(/plaatjes hieronder kloppen/);
  });

  it('de leerling heeft geen werkboek: het woord staat alleen in de bronvermelding', () => {
    const fout: string[] = [];
    for (const bestand of paginas()) {
      for (const regel of tekst(bestand).split('\n')) {
        if (/werkboek/i.test(regel) && !regel.includes('©')) fout.push(`${bestand}: ${regel}`);
      }
    }
    expect(fout).toEqual([]);
  });
});

describe('de stand van de servo ligt vast als de arm op de as komt', () => {
  // De arm komt in stap 12 met een verbinder op de as, niet in stap 11 met
  // het tandwiel. Een tandwiel met een asgat op een kruisas slipt niet.

  it('het caution-blok noemt stap 12, en de servo blijft op 90° tot en met stap 12', () => {
    const inhoud = tekst('bouwen.md');
    const blok = inhoud.slice(
      inhoud.indexOf(':::caution[Eerst de servo op 90°]'),
      inhoud.indexOf('stap-11.jpg'),
    );
    expect(blok).toMatch(/In stap 12 komt de arm op de as/);
    expect(blok).toMatch(/Tot en met stap 12/);
    // Zonder stroom draait de servo niet naar 90°.
    expect(blok).toMatch(/Zet je robot weer aan met \*\*ON\/OFF\*\* en upload/);
  });

  it('nergens slipt het tandwiel, en geen kaart wijst het tandwiel aan als de arm niet goed staat', () => {
    const fout: string[] = [];
    for (const bestand of paginas()) {
      if (/tandwiel[^.]*slipt|slipt[^.]*tandwiel/i.test(tekst(bestand))) fout.push(bestand);
    }
    expect(fout).toEqual([]);
    const kaarten = [
      ...tekst('hout.md').matchAll(/<Probleem titel="([^"]+)">([\s\S]*?)<\/Probleem>/g),
    ];
    for (const [, titel, inhoud] of kaarten) {
      if (!/arm/.test(titel)) continue;
      const oorzaak = inhoud.match(/\*\*Oorzaak:\*\*([^\n]*)/)?.[1] ?? '';
      expect(oorzaak, titel).not.toMatch(/tandwiel/);
    }
  });

  it('de kaart "verkeerde kant op" laat de servo omdraaien, niet 0 en 90 wisselen', () => {
    // Na de baan gaan mikken, subprogramma's en de extra's uit van uithalen
    // naar 0° en slaan naar 90°. Wie 0 en 90 wisselde, mikte daarna van de
    // bal af.
    const kaart = tekst('hout.md').match(
      /<Probleem titel="De arm slaat de verkeerde kant op\.">([\s\S]*?)<\/Probleem>/,
    )?.[1];
    expect(kaart).toBeDefined();
    expect(kaart).toMatch(/snoertje/);
    expect(kaart).not.toMatch(/waar 90 staat komt 0/);
  });
});

describe('de houten baan', () => {
  it('het gat voor de bal heet geen servo-gat: er zit geen servo in het hout', () => {
    const fout = paginas().filter((f) => /servo-gat|gat voor de servo/i.test(tekst(f)));
    expect(fout).toEqual([]);
  });

  it('de pagina zegt wat je nodig hebt en dat de plankjes en het schroefje van de docent komen', () => {
    const inhoud = tekst('hout.md');
    const begin = inhoud.slice(0, inhoud.indexOf('## Stap voor stap'));
    expect(begin).toMatch(/Dit heb je nodig/);
    expect(begin).toMatch(/docent/);
    expect(begin).toMatch(/schroevendraaier/);
    expect(begin).toMatch(/bal/);
  });

  it('Hole in one zegt in welk gat de bal moet', () => {
    const inhoud = tekst('hout.md');
    const sectie = inhoud.slice(inhoud.indexOf('## Hole in one'));
    expect(sectie).toMatch(/ronde gat/);
  });
});

type Blok = {
  type: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, { block?: Blok }>;
  next?: { block?: Blok };
};

function ketting(blok: Blok | undefined): Blok[] {
  const rij: Blok[] = [];
  for (let b = blok; b; b = b.next?.block) rij.push(b);
  return rij;
}

// Alle ketens van blokken onder elkaar in een programma: de bovenste
// blokken, en wat in een input als STACK, DO0 of ELSE staat.
function ketens(blokken: Blok[]): Blok[][] {
  const uit: Blok[][] = [];
  const loop = (eerste: Blok) => {
    const rij = ketting(eerste);
    uit.push(rij);
    for (const b of rij)
      for (const invoer of Object.values(b.inputs ?? {})) if (invoer.block) loop(invoer.block);
  };
  for (const b of blokken) loop(b);
  return uit;
}

function programmas(): [string, Blok[]][] {
  return readdirSync(join(CLICK, 'blokken'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => [f, JSON.parse(readFileSync(join(CLICK, 'blokken', f), 'utf8')).blocks.blocks]);
}

// Wat de robot doet als er een bal ligt, op een rij: de dan-tak van het
// als-blok met de sensor, met de subprogramma's erin uitgeschreven. Een
// herhaal-blok is één stap: daarin mikt de arm met Servo 9 op hoek.
function slag(blokken: Blok[]): Blok[] | undefined {
  const defs = new Map<string, Blok | undefined>();
  for (const b of blokken)
    if (b.type === 'procedures_defnoreturn')
      defs.set(String(b.fields?.NAME), b.inputs?.STACK?.block);
  const zoek = (b: Blok | undefined): Blok | undefined => {
    for (const blok of ketting(b)) {
      if (blok.type === 'controls_if' && JSON.stringify(blok.inputs?.IF0).includes('analog_read'))
        return blok;
      for (const invoer of Object.values(blok.inputs ?? {})) {
        const gevonden = zoek(invoer.block);
        if (gevonden) return gevonden;
      }
    }
    return undefined;
  };
  const als = blokken.map(zoek).find(Boolean);
  if (!als) return undefined;
  const uit = (b: Blok | undefined): Blok[] =>
    ketting(b).flatMap((blok) =>
      blok.type === 'procedures_callnoreturn'
        ? uit(defs.get(String((blok as { extraState?: { name?: string } }).extraState?.name)))
        : [blok],
    );
  return uit(als.inputs?.DO0?.block);
}

describe('de arm rust op 90° in elk programma met de bal', () => {
  // Zie de bal, sla de bal wacht op 90°, haalt uit naar 0° en slaat terug
  // naar 90°; Easybloqs zet de servo bij het opstarten al op 90°. Mikken had
  // na de slag twee keer duurt onder elkaar, en Een naam voor je blokken
  // ook: duurt 500 ms in slaan, en daarna duurt 2000 ms in als … dan.

  it('nergens staan twee duurt-blokken direct na elkaar', () => {
    const fout: string[] = [];
    for (const [bestand, blokken] of programmas()) {
      const rijen = [...ketens(blokken), slag(blokken) ?? []];
      for (const rij of rijen) {
        rij.forEach((b, i) => {
          if (b.type === 'time_delay' && rij[i + 1]?.type === 'time_delay') fout.push(bestand);
        });
      }
    }
    expect(fout).toEqual([]);
  });

  it('na een slag staat de arm niet in de uithaalstand van 0°', () => {
    const fout: string[] = [];
    for (const [bestand, blokken] of programmas()) {
      const rij = slag(blokken);
      if (!rij) continue;
      // Een servo-blok met een vast of willekeurig getal; Servo 9 op hoek
      // in het mikken telt niet.
      const laatste = rij
        .filter(
          (b) =>
            b.type === 'leaphy_servo_write' &&
            ['math_number', 'math_random_int'].includes(b.inputs?.SERVO_ANGLE?.block?.type ?? ''),
        )
        .at(-1);
      const hoek = laatste?.inputs?.SERVO_ANGLE?.block;
      // Een programma zonder servo, zoals bij de IR-sensor, telt niet.
      if (hoek?.type === 'math_number' && hoek.fields?.NUM === 0) fout.push(bestand);
    }
    expect(fout).toEqual([]);
  });
});

describe("Mikken, subprogramma's en de extra's", () => {
  it('Mikken zegt waar het getal voor "stel hoek in op" vandaan komt, en dat herhaal op 10 begint', () => {
    // In Easybloqs heeft "stel hoek in op" een leeg gat; een los getal staat
    // in Getal blokken en begint op 123. Herhaal begint op 10.
    const inhoud = tekst('mikken.md');
    expect(inhoud).toMatch(/stel hoek in op[^\n]*leeg gat[^\n]*\*\*Getal blokken\*\*[^\n]*123/);
    expect(inhoud).toMatch(/\*\*herhaal 50 keer\*\*[^\n]*staat er eerst 10/);
  });

  it('Een naam voor je blokken waarschuwt voor het subprogramma met geef terug', () => {
    // Eigen blokken heeft ook "Subprogramma naam … geef terug": dat blok is
    // rond en past nergens.
    expect(tekst('subprogrammas.md')).toMatch(/\*\*geef terug\*\*/);
  });

  it('het blok om een subprogramma te gebruiken pak je uit Eigen blokken', () => {
    expect(tekst('subprogrammas.md')).toMatch(
      /\*\*Eigen blokken\*\*\. Daar staan nu ook de blokken \*\*mikken\*\* en \*\*slaan\*\*/,
    );
  });

  it('het lampje: de pinnen van het blok Led, de botsing met de servo op D9, en het lampje bij wat je nodig hebt', () => {
    const inhoud = tekst('extras.md');
    const sectie = inhoud.slice(
      inhoud.indexOf('## Een lampje dat meekleurt'),
      inhoud.indexOf('## Willekeurig slaan'),
    );
    for (const pin of ['D11', 'D10', 'D9', 'D8']) expect(sectie).toContain(`**${pin}**`);
    expect(sectie).toMatch(/op D9 zit je servo/);
    expect(sectie).toMatch(/heb je een \*\*RGB-lampje\*\* nodig/);
  });

  it("elk antwoord bij een programmeeropdracht in de extra's toont de blokken", () => {
    // Het antwoord van het lampje was alleen tekst. Het hoofd uit de
    // 3D-printer heeft geen antwoord, en hoort er dus niet bij.
    const inhoud = tekst('extras.md');
    const antwoorden = [
      ...inhoud.matchAll(/<summary>Antwoord<\/summary>([\s\S]*?)<\/details>/g),
    ].map((m) => m[1]);
    expect(antwoorden.length).toBeGreaterThanOrEqual(2);
    for (const antwoord of antwoorden) expect(antwoord).toMatch(/<Blokken programma=/);
  });
});

describe('controlevragen', () => {
  // robotica/CLAUDE.md: na elke uitleg een korte controlevraag in een
  // <details>-blok, of als <Voorspel soort="Controlevraag"> waarin de
  // leerling eerst kiest. De extra's zijn opdrachten, geen uitleg.
  it("elke les behalve de extra's heeft een controlevraag", () => {
    const zonder = paginas().filter(
      (f) =>
        f !== 'extras.md' &&
        !tekst(f).includes('<summary>Controlevraag</summary>') &&
        !/<Voorspel soort="Controlevraag"/.test(tekst(f)),
    );
    expect(zonder).toEqual([]);
  });
});

describe('het antwoord bij het lampje', () => {
  // Het antwoord zei "zet de twee Zet PWM-blokken voor groen erboven", maar
  // een van die twee zet rood uit, en de blokken voor de anders-tak stonden
  // alleen in de opsomming. Elk blok uit lampje.json staat nu in de tekst.
  it('noemt elk Zet PWM-blok uit het programma, met zijn tak', () => {
    const extras = tekst('extras.md');
    for (const blok of [
      'Zet PWM 11 op 0',
      'Zet PWM 10 op 255',
      'Zet PWM 11 op 255',
      'Zet PWM 10 op 0',
    ])
      expect(extras).toContain(`${blok} (`);
    expect(extras).toMatch(/In de anders-tak komen Zet PWM 11 op 255/);
  });
});
