import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as B from 'blockly/core';
import 'blockly/blocks';
import * as nl from 'blockly/msg/nl';
import { describe, expect, it } from 'vitest';
import { registreer } from '../components/Blokken/leaphy';

// Het tweede deel van de Golfbot: de toren bouwen, de houten baan, de arm
// en de uitbreiding. Wat hier vastligt, ging mis in de leerling-doorloop.

const CLICK = fileURLToPath(new URL('../../golfbot', import.meta.url));
const STATIC = fileURLToPath(new URL('../../static', import.meta.url));

registreer(B, nl as unknown as Record<string, string>);

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
  // telling per plaatje staat in golfbot/bouwstappen.json. De toren (stap 1
  // tot en met 10) staat bij het bouwen, de arm (stap 11 tot en met 26) bij
  // de arm, en elke pagina heeft de lijst van haar eigen stappen.
  const PLAATJE =
    /<img src=\{useBaseUrl\('\/golfbot\/bouwen\/stap-(\d+)\.jpg'\)\}[^>]*alt="([^"]+)"/g;
  const PAGINAS = ['bouwen.md', 'arm.md'];
  const plaatjes = PAGINAS.flatMap((bestand) =>
    [...tekst(bestand).matchAll(PLAATJE)].map((m) => ({ bestand, stap: Number(m[1]), alt: m[2] })),
  );
  const stappenVan = (bestand: string) => {
    const nummers = new Set(plaatjes.filter((p) => p.bestand === bestand).map((p) => p.stap));
    return STAPPEN.filter((s) => nummers.has(s.stap));
  };

  it('er is een telling voor elk plaatje op de pagina, in dezelfde volgorde', () => {
    expect(plaatjes.map((p) => p.stap)).toEqual(STAPPEN.map((s) => s.stap));
    expect(STAPPEN).toHaveLength(26);
  });

  it.each(PAGINAS)('de tabel in %s telt op tot wat er op haar plaatjes staat', (bestand) => {
    const inhoud = tekst(bestand);
    const begin = inhoud.indexOf('## Onderdelenlijst');
    const tabel = inhoud.slice(begin, inhoud.indexOf('\n## ', begin + 1));
    const rijen: Onderdeel[] = [
      ...tabel.matchAll(/^\| (\d+) \| [^|]+ \| ([^|]+) \| ([^|]+) \|$/gm),
    ].map((m) => ({ aantal: Number(m[1]), kleur: m[2].trim(), nr: m[3].trim() }));
    expect(optellen(rijen)).toEqual(optellen(stappenVan(bestand).flatMap((s) => s.onderdelen)));
  });

  it.each(PAGINAS)(
    'het aantal in de tekst van %s is het aantal Lego-stukjes op de plaatjes',
    (bestand) => {
      const lego = stappenVan(bestand)
        .flatMap((s) => s.onderdelen)
        .filter((o) => o.nr !== '–')
        .reduce((som, o) => som + o.aantal, 0);
      expect(tekst(bestand)).toContain(`**${lego} Lego Technic-stukjes**`);
    },
  );

  it('de servo hoort bij de toren', () => {
    expect(tekst('bouwen.md')).toMatch(
      /Lego Technic-stukjes\*\* nodig plus de \*\*Leaphy-servo\*\*/,
    );
  });

  it('de CSV voor BrickLink bestelt hetzelfde, en het totaal klopt', () => {
    // Een kleur verandert in BrickLink de kleurcode, niet het onderdeelnummer.
    const KLEUR: Record<string, string> = {
      Black: 'Zwart',
      'Light Bluish Gray': 'Lichtgrijs',
      Blue: 'Blauw',
    };
    const csv = readFileSync(join(STATIC, 'golfbot/onderdelenlijst.csv'), 'utf8');
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
  // De arm komt met een verbinder op de as (stap 12, of bij een eigen arm
  // met een stukje met een asgat), niet met het tandwiel van stap 11. Een
  // tandwiel met een asgat op een kruisas slipt niet.

  it('het caution-blok staat vóór het tandwiel, en de servo blijft op 90° tot de arm erop zit', () => {
    const inhoud = tekst('arm.md');
    const blok = inhoud.slice(
      inhoud.indexOf(':::caution[Eerst de servo op 90°]'),
      inhoud.indexOf('stap-11.jpg'),
    );
    expect(blok).toMatch(/Straks komt de arm op de as/);
    expect(blok).toMatch(/Tot de arm op de as zit/);
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
      ...tekst('arm.md').matchAll(/<Probleem titel="([^"]+)">([\s\S]*?)<\/Probleem>/g),
    ];
    expect(kaarten.length).toBeGreaterThan(0);
    for (const [, titel, inhoud] of kaarten) {
      if (!/arm/.test(titel)) continue;
      const oorzaak = inhoud.match(/\*\*Oorzaak:\*\*([^\n]*)/)?.[1] ?? '';
      expect(oorzaak, titel).not.toMatch(/tandwiel/);
    }
  });

  it('de kaart "verkeerde kant op" laat de servo omdraaien, niet 0 en 90 wisselen', () => {
    // De lessen gaan uit van uithalen naar 0° en slaan naar 90°. Wie 0 en 90
    // wisselde, mikte daarna van de bal af.
    const kaart = tekst('arm.md').match(
      /<Probleem titel="De arm slaat de verkeerde kant op\.">([\s\S]*?)<\/Probleem>/,
    )?.[1];
    expect(kaart).toBeDefined();
    expect(kaart).toMatch(/snoertje/);
    expect(kaart).not.toMatch(/waar 90 staat komt 0/);
  });

  it('de kaarten over de arm gelden voor de bouwstappen én voor een eigen arm', () => {
    // Wie zelf een arm bedenkt, heeft geen verbinder van stap 12. Een kaart
    // die alleen die verbinder noemt, helpt hem niet.
    for (const titel of [
      'De servo draait, maar de arm beweegt niet mee.',
      'De arm staat scheef, of haalt de bal niet.',
    ]) {
      const kaart = tekst('arm.md').match(
        new RegExp(`<Probleem titel="${titel.replace(/[.,]/g, '\\$&')}">([\\s\\S]*?)</Probleem>`),
      )?.[1];
      expect(kaart, titel).toBeDefined();
      expect(kaart, titel).toMatch(/nagemaakte arm/);
      expect(kaart, titel).toMatch(/zelfgemaakte arm/);
    }
  });
});

describe('de arm', () => {
  it('je kiest tussen de arm namaken en de arm zelf maken', () => {
    const inhoud = tekst('arm.md');
    expect(inhoud).toMatch(/^## Keuze 1: de arm namaken \\\{#namaken\}$/m);
    expect(inhoud).toMatch(/^## Keuze 2: de arm zelf maken \\\{#zelf-maken\}$/m);
    // Allebei beginnen na het tandwiel, met de servo op 90°.
    expect(inhoud.indexOf('## Kies je arm')).toBeGreaterThan(inhoud.indexOf('stap-11.jpg'));
  });

  it('de keuze staat bovenaan als twee kaarten, en elke kaart wijst naar haar deel', () => {
    // Een opsomming met "Arm A" en "Arm B" halverwege de pagina viel weg: een
    // leerling zag niet dat zelf een arm maken ook mag. De kaarten staan nu
    // vóór de eerste kop.
    const inhoud = tekst('arm.md');
    const kaarten = inhoud.indexOf('<Keuzekaarten');
    expect(kaarten).toBeGreaterThan(-1);
    expect(kaarten).toBeLessThan(inhoud.indexOf('\n## '));
    const blok = inhoud.slice(kaarten, inhoud.indexOf('/>', kaarten));
    expect(blok).toMatch(/titel: 'De arm namaken'[^}]*naar: '#namaken'/);
    expect(blok).toMatch(/titel: 'De arm zelf maken'[^}]*naar: '#zelf-maken'/);
  });

  it('een eigen arm zit met een asgat op de as, en wordt getest voordat hij op de baan komt', () => {
    // In een rond gat draait de as door: dan beweegt de arm niet.
    const inhoud = tekst('arm.md');
    const eigen = inhoud.slice(inhoud.indexOf('## Keuze 2'), inhoud.indexOf('## Hole in one'));
    expect(eigen).toMatch(/\*\*asgat\*\*/);
    expect(eigen).toMatch(/rond gat draait de as door/);
    expect(eigen).toMatch(/90°/);
    expect(eigen).toMatch(/<summary>Tip<\/summary>/);
    expect(eigen).toMatch(/Test je arm/);
  });

  it('Hole in one zegt in welk gat de bal moet', () => {
    const inhoud = tekst('arm.md');
    const sectie = inhoud.slice(inhoud.indexOf('## Hole in one'));
    expect(sectie).toMatch(/ronde gat/);
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

  it('de baan komt vóór de arm, en eindigt met een test die je op de robot ziet', () => {
    // De toren heeft nog geen arm. De baanles eindigde met Hole in one, en
    // die kan pas als de arm erop zit.
    const inhoud = tekst('hout.md');
    expect(inhoud).not.toMatch(/^## Hole in one$/m);
    expect(inhoud).toMatch(/^## Ziet de sensor de bal op de baan\?$/m);
    expect(inhoud).toMatch(/de toren van je Golfbot/);
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

describe('de uitbreiding', () => {
  const inhoud = tekst('uitbreiding.md');

  it('je kiest tussen een eigen hoofd en een lampje voor een hole in one', () => {
    expect(inhoud).toMatch(/^## Een eigen hoofd$/m);
    expect(inhoud).toMatch(/^## Een lampje voor een hole in one$/m);
    expect(inhoud).toMatch(/\*\*TinkerCAD\*\*/);
  });

  it('de RGB-led trio: niet het blok Led, want dat stuurt ook D9 aan, en daar zit de servo', () => {
    // Het blok Led stuurt op de Arduino Nano D11, D10 en D9 aan, met de min
    // op D8 (leaphy-webbased-svelte, generators/arduino/leaphy_original.ts).
    // Met de servo op D9 gaat dat mis; daarom rood en groen met draadjes op
    // D11 en D10, en blauw los.
    for (const pin of ['D11', 'D10', 'D9', 'D8']) expect(inhoud).toContain(`**${pin}**`);
    expect(inhoud).toMatch(/\*\*RGB-led trio\*\*/);
    expect(inhoud).toMatch(/Op D9 zit je servo al/);
    expect(inhoud).toMatch(/Het blauwe pinnetje sluit je niet aan/);
    expect(inhoud).not.toMatch(/Ledstrip/);
  });

  it('het programma zet groen met Zet PWM op D10, en alleen op 0 of 255', () => {
    // De servobibliotheek gebruikt de timer van D9 en D10. analogWrite met 0
    // of 255 wordt dan een gewone digitalWrite en werkt; een getal ertussen
    // niet. Op D11 mag alles.
    type B = {
      type?: string;
      fields?: { PIN?: string };
      inputs?: { NUM?: { block?: { fields?: { NUM?: number } } } };
    };
    const pwm: B[] = [];
    const loop = (w: unknown) => {
      if (!w || typeof w !== 'object') return;
      if ((w as B).type === 'leaphy_io_analogwrite') pwm.push(w as B);
      for (const k of Object.values(w)) loop(k);
    };
    loop(JSON.parse(readFileSync(join(CLICK, 'blokken', 'hole-in-one.json'), 'utf8')));
    expect(pwm.map((b) => [b.fields?.PIN, b.inputs?.NUM?.block?.fields?.NUM])).toEqual([
      ['10', 255],
      ['10', 0],
    ]);
    expect(inhoud).toMatch(/groen op het signaal van \*\*D10\*\*/);
    expect(inhoud).toMatch(/Gebruik voor groen alleen 0 en 255/);
  });

  it('de tweede sensor zit op A1 en heeft een eigen grens', () => {
    expect(inhoud).toMatch(/rij van \*\*A1\*\*/);
    expect(inhoud).toMatch(/De eerste sensor blijft op A0/);
    expect(inhoud).toMatch(/^### Een grens voor de tweede sensor$/m);
    const programma = readFileSync(join(CLICK, 'blokken', 'hole-in-one.json'), 'utf8');
    expect(programma).toContain('"PIN": "A1"');
    expect(programma).toContain('"PIN": "A0"');
  });
});

describe('controlevragen', () => {
  // robotica/CLAUDE.md: na elke uitleg een korte controlevraag in een
  // <details>-blok, of als <Voorspel soort="Controlevraag"> waarin de
  // leerling eerst kiest.
  it('elke les heeft een controlevraag', () => {
    const zonder = paginas().filter(
      (f) =>
        !tekst(f).includes('<summary>Controlevraag</summary>') &&
        !/<Voorspel soort="Controlevraag"/.test(tekst(f)),
    );
    expect(zonder).toEqual([]);
  });
});

describe('elke link naar de servo op 90° wijst naar het anker op de armpagina', () => {
  // De ene kaart zei "vóór stap 12 weer op 90°", de volgende "zoals vóór
  // stap 11", en de links gingen naar de bovenkant van de bouwpagina. Het
  // blok "Eerst de servo op 90°" heeft een anker, en elke link gaat daarheen.
  it('het caution-blok heeft een anker', () => {
    const inhoud = tekst('arm.md');
    // Een kale <a id> ziet de ankercontrole van Docusaurus niet.
    expect(inhoud).toMatch(/<Link id="servo-op-90"[^>]*\/>\s*:::caution\[Eerst de servo op 90°\]/);
  });

  it('elke zin over 90° met een link, linkt naar dat anker', () => {
    const zinnen = paginas()
      .flatMap((f) => tekst(f).split(/(?<=[.?])\s+/))
      .filter((z) => /op 90°/.test(z) && /\]\(site:robotica\/golfbot\//.test(z));
    expect(zinnen.length).toBeGreaterThanOrEqual(3);
    for (const zin of zinnen) expect(zin).toMatch(/\]\(site:robotica\/golfbot\/arm#servo-op-90\)/);
  });
});
