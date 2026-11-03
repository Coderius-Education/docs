import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De aansluitschema's van de sensoren en actuatoren stonden los op de Nano
// (nano_rp2040_*.svg): een draad van de LED naar D7, een van de servo naar
// 3.3V. In de les zit de Nano op het Leaphy Murphy Shield, met per pin een
// rijtje van drie (de pin, 3V3, GND). Sinds november 2026 staat elk schema op
// het shield, gemaakt in Fritzing 1.0.8 (static/fritzing/shield_*.fzz). Het
// LED-schema had bovendien geen weerstand. Deze test leest de .fzz en eist dat
// het schema dezelfde pinnen gebruikt als de code van de les.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const FRITZING = join(SITE, 'static', 'fritzing');
const ONDERDELEN = join(SITE, 'docs', 'onderdelen');

/** De bestanden in een zip (een .fzz), als tekst. */
function unzip(pad: string): Map<string, string> {
  const buf = readFileSync(pad);
  const uit = new Map<string, string>();
  let eind = buf.length - 22;
  while (buf.readUInt32LE(eind) !== 0x06054b50) eind--;
  let p = buf.readUInt32LE(eind + 16);
  for (let i = 0; i < buf.readUInt16LE(eind + 10); i++) {
    const methode = buf.readUInt16LE(p + 10);
    const grootte = buf.readUInt32LE(p + 20);
    const naamLengte = buf.readUInt16LE(p + 28);
    const naam = buf.toString('utf8', p + 46, p + 46 + naamLengte);
    const lokaal = buf.readUInt32LE(p + 42);
    const start = lokaal + 30 + buf.readUInt16LE(lokaal + 26) + buf.readUInt16LE(lokaal + 28);
    const data = buf.subarray(start, start + grootte);
    uit.set(naam, (methode === 8 ? inflateRawSync(data) : data).toString('utf8'));
    p += 46 + naamLengte + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return uit;
}

/** De pinnen van het shield waar in de sketch iets op aangesloten is, met hun naam. */
function shieldPinnen(fzz: string): string[] {
  return shieldConnectoren(fzz).map((c) => c.naam);
}

/** Idem, met het connector-id erbij. */
function shieldConnectoren(fzz: string): { id: number; naam: string }[] {
  const bestanden = unzip(join(FRITZING, fzz));
  const fz = [...bestanden].find(([n]) => n.endsWith('.fz'))?.[1] ?? '';
  const fzp = [...bestanden].find(([n]) => /^part\.Flitz_shield.*\.fzp$/.test(n))?.[1] ?? '';
  const naam = new Map(
    [...fzp.matchAll(/<connector [^>]*id="(connector\d+)"[^>]*name="([^"]*)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  const shield =
    fz.match(/<instance moduleIdRef="Flitz_shield[^"]*"[\s\S]*?<\/instance>/)?.[0] ?? '';
  const bb = shield.match(/<breadboardView[\s\S]*?<\/breadboardView>/)?.[0] ?? '';
  return [...bb.matchAll(/<connector connectorId="(connector\d+)"[^>]*>[\s\S]*?<\/connector>/g)]
    .filter((m) => /<connect /.test(m[0]))
    .map((m) => ({ id: Number(m[1].slice(9)), naam: naam.get(m[1]) ?? m[1] }));
}

// De rijen van het shield in het onderdeel Flitz_shieldv3: boven de Nano
// GND 0-14, 3V3 15-29 en de pinnen 30-44; eronder de pinnen 75-89, 3V3 90-104
// en GND 105-119 (45-74 is de voet voor de Nano). Een rijtje is een kolom.
const RIJ = (id: number) =>
  id < 15
    ? 'G'
    : id < 30
      ? 'V'
      : id < 45
        ? 'S'
        : id >= 105
          ? 'G'
          : id >= 90
            ? 'V'
            : id >= 75
              ? 'S'
              : '?';
const KOLOM = (id: number) => `${id < 45 ? 'boven' : 'onder'}${id % 15}`;

/** D7, D6~ en A0/D14 worden D7, D6 en D14; 3V3 en GND blijven zoals ze zijn. */
const pinnaam = (naam: string) => naam.match(/D\d+/)?.[0] ?? naam;

const SCHEMAS: Record<string, string> = {
  led: 'shield_led',
  afstandssensor: 'shield_afstandssensor',
  'ir-digitaal': 'shield_ir_digitaal',
  servo: 'shield_servo',
  buzzer: 'shield_buzzer',
  'rgb-led': 'shield_rgb_led',
};

const les = (id: string) => readFileSync(join(ONDERDELEN, `${id}.mdx`), 'utf8');
const aansluiten = (id: string) =>
  les(id)
    .split(/^## Aansluiten$/m)[1]
    ?.split(/^## Code$/m)[0] ?? '';
const codePinnen = (id: string) =>
  new Set(
    [...les(id).matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].flatMap((m) =>
      [...m[1].matchAll(/["'](D\d+)["']/g)].map((p) => p[1]),
    ),
  );

describe('de aansluitschema’s staan op het shield', () => {
  it('het schema gebruikt precies de pinnen uit de code van de les, plus GND', () => {
    const fout: string[] = [];
    for (const [id, schema] of Object.entries(SCHEMAS)) {
      const pinnen = shieldPinnen(`${schema}.fzz`).map(pinnaam);
      const signaal = new Set(pinnen.filter((p) => /^D\d+$/.test(p)));
      const code = codePinnen(id);
      if ([...signaal].sort().join() !== [...code].sort().join())
        fout.push(`${id}: schema ${[...signaal]}, code ${[...code]}`);
      if (!pinnen.includes('GND')) fout.push(`${id}: geen GND in het schema`);
    }
    expect(fout).toEqual([]);
  });

  it('een sensor heeft ook 3V3 in zijn schema, een LED of buzzer niet', () => {
    const met3v3 = Object.entries(SCHEMAS)
      .filter(([, schema]) => shieldPinnen(`${schema}.fzz`).includes('3V3'))
      .map(([id]) => id)
      .sort();
    expect(met3v3).toEqual(['afstandssensor', 'ir-digitaal', 'servo']);
  });

  it('elke les toont zijn schema onder Aansluiten en noemt de pinnen uit de code', () => {
    const fout: string[] = [];
    for (const [id, schema] of Object.entries(SCHEMAS)) {
      const tekst = aansluiten(id);
      if (!tekst.includes(`(@site/static/fritzing/${schema}_bb.png)`))
        fout.push(`${id}: geen ${schema}_bb.png`);
      for (const pin of codePinnen(id))
        if (!tekst.includes(`**${pin}**`)) fout.push(`${id}: Aansluiten noemt ${pin} niet`);
      if (!tekst.includes('<ShieldRijen />'))
        fout.push(`${id}: geen uitleg van de rijen op het shield`);
    }
    expect(fout).toEqual([]);
  });

  it('3V3 en GND zitten op het rijtje van een signaalpin van het onderdeel', () => {
    // De opdrachtgever wil per onderdeel één rijtje met GND, 3V3 en signaal, zodat
    // er een stekker van drie op past; eerst gingen 3V3 en GND naar een buurpin.
    const fout: string[] = [];
    for (const schema of Object.values(SCHEMAS)) {
      const c = shieldConnectoren(`${schema}.fzz`);
      const signaal = new Set(c.filter((x) => RIJ(x.id) === 'S').map((x) => KOLOM(x.id)));
      for (const x of c.filter((x) => RIJ(x.id) !== 'S'))
        if (!signaal.has(KOLOM(x.id))) fout.push(`${schema}: ${x.naam} op een ander rijtje`);
    }
    expect(fout).toEqual([]);
  });

  it('elke draad is een stuk recht omlaag of recht opzij', () => {
    // Schuine draden waren niet te volgen: een draad heeft alleen haakse bochten.
    const fout: string[] = [];
    for (const schema of Object.values(SCHEMAS)) {
      const fz =
        [...unzip(join(FRITZING, `${schema}.fzz`))].find(([n]) => n.endsWith('.fz'))?.[1] ?? '';
      for (const m of fz.matchAll(
        /<instance moduleIdRef="WireModuleID"[\s\S]*?<breadboardView[^>]*>\s*<geometry [^>]*x2="([-\d.e]+)" y2="([-\d.e]+)"/g,
      ))
        if (Math.abs(Number(m[1])) > 0.01 && Math.abs(Number(m[2])) > 0.01)
          fout.push(`${schema}: schuine draad (${m[1]}, ${m[2]})`);
    }
    expect(fout).toEqual([]);
  });

  it('naast het shield lopen draden ver genoeg uit elkaar', () => {
    // Twee draden die naast elkaar omlaag lopen, waren niet uit elkaar te houden.
    // Alleen over het rijtje zelf mogen ze dichter bij elkaar (de pinnen zitten
    // daar 8,9 uit elkaar); daarbuiten minstens 8.
    const fout: string[] = [];
    for (const schema of Object.values(SCHEMAS)) {
      const fz =
        [...unzip(join(FRITZING, `${schema}.fzz`))].find(([n]) => n.endsWith('.fz'))?.[1] ?? '';
      const shield = fz.match(
        /moduleIdRef="Flitz_shield[^"]*"[\s\S]*?<breadboardView[^>]*>\s*<geometry [^>]*x="([-\d.]+)" y="([-\d.]+)"/,
      );
      const [sy0, sy1] = [Number(shield?.[2]), Number(shield?.[2]) + 197.2];
      const lijnen = [
        ...fz.matchAll(
          /<instance moduleIdRef="WireModuleID"[\s\S]*?<breadboardView[^>]*>\s*<geometry [^>]*x="([-\d.e]+)" y="([-\d.e]+)" x1="0" y1="0" x2="([-\d.e]+)" y2="([-\d.e]+)"/g,
        ),
      ]
        .map((m) => m.slice(1, 5).map(Number))
        .filter(([, , dx, dy]) => Math.abs(dx) < 0.01 && Math.abs(dy) > 0.01)
        .map(([x, y, , dy]) => ({ x, van: Math.min(y, y + dy), tot: Math.max(y, y + dy) }))
        // alleen het stuk buiten het shield
        .map((l) => ({ ...l, tot: Math.min(l.tot, sy0), van2: Math.max(l.van, sy1), tot2: l.tot }))
        .flatMap((l) => [
          { x: l.x, van: l.van, tot: l.tot },
          { x: l.x, van: l.van2, tot: l.tot2 },
        ])
        .filter((l) => l.tot - l.van > 1);
      for (const [i, a] of lijnen.entries())
        for (const b of lijnen.slice(i + 1))
          if (Math.min(a.tot, b.tot) - Math.max(a.van, b.van) > 1 && Math.abs(a.x - b.x) < 8)
            fout.push(
              `${schema}: draden ${Math.abs(a.x - b.x).toFixed(1)} uit elkaar bij x ${a.x.toFixed(0)}`,
            );
    }
    expect(fout).toEqual([]);
  });

  it('de pinnamen op het shield blijven leesbaar in de export', () => {
    // De namen bij de rijtjes (-D7-, A0/D14) zijn lijntjes met stroke-width .43px
    // in een <style>-blok. Fritzing schaalt bij de export de coördinaten van een
    // onderdeel zo'n veertien keer op, maar die maat niet: de letters werden
    // haardun en op lesbreedte onleesbaar. Als attribuut schaalt hij mee.
    const fout: string[] = [];
    for (const fzz of readdirSync(FRITZING).filter((n) => n.endsWith('.fzz'))) {
      for (const [naam, inhoud] of unzip(join(FRITZING, fzz)))
        if (/^svg\.breadboard\.Flitz_shield.*\.svg$/.test(naam) && /<style|class="/.test(inhoud))
          fout.push(`${fzz}: ${naam} heeft nog een <style>-blok of klassen`);
    }
    expect(fout).toEqual([]);
  });

  it('het LED-schema heeft de weerstand', () => {
    const fz =
      [...unzip(join(FRITZING, 'shield_led.fzz'))].find(([n]) => n.endsWith('.fz'))?.[1] ?? '';
    expect(fz).toMatch(/moduleIdRef="ResistorModuleID"[\s\S]*?name="resistance" value="220"/);
  });

  it('geen sensor of actuator heeft nog een schema los op de Nano', () => {
    type Item = string | { type: string; label: string; items: Item[] };
    const groepen = (sidebars.onderdelenSidebar as unknown as Item[]).filter(
      (i): i is Exclude<Item, string> =>
        typeof i !== 'string' && ['Sensoren', 'Actuatoren'].includes(i.label),
    );
    const fout = groepen
      .flatMap((g) => g.items as string[])
      .map((id) => id.replace('onderdelen/', ''))
      .filter((id) => /\]\([^)]*nano_rp2040_[^)]*\)/.test(les(id)));
    expect(fout).toEqual([]);
  });
});

// Plaatjes van aansluitschema's die (nog) niet uit een .fzz in static/fritzing
// komen. Zo'n plaatje kan niemand opnieuw maken als er iets niet klopt; deze
// lijst mag alleen korter worden.
const NOG_ZONDER_BRON = new Set<string>([
  'docs/onderdelen/img/tof/wiring_tof.png',
  'docs/onderdelen/img/tof/tof_mux.png',
  'docs/onderdelen/img/tof/2_tof_mux.png',
  'docs/onderdelen/img/oled-scherm/shield_oled_mux.png',
  'docs/onderdelen/img/meten/nano_rp2040_pin_nameten.svg',
  'docs/robocup/redden_basis_bb.png',
  'docs/robocup/aluminium_tape_detectie_bb.png',
  'lego_auto/debuggen_met_scherm/nano_rp2040_oled_mux_ir_sensor_bb.png',
]);

/** Uitsneden van één schema: het plaatje heet anders dan zijn .fzz. */
const UITSNEDE: Record<string, string> = {
  golfbot_bb: 'golfbot',
  golfbot_sensor: 'golfbot',
  golfbot_servo: 'golfbot',
  golfbot_rst: 'golfbot',
  'golfbot_aan-uit': 'golfbot',
};

/** De kleuren die een alt-tekst noemt, met hun kleur in Fritzing. */
const KLEUR: Record<string, string[]> = {
  rood: ['#cc1414'],
  zwart: ['#404040'],
  blauw: ['#418dd9'],
  geel: ['#ffe24d', '#f2c600'],
  groen: ['#47cc79'],
  oranje: ['#ef6100'],
  bruin: ['#8c3b00'],
};
// Alleen een kleur die bij een draad hoort: "de rode draad", "de zwarte naar GND".
// "De blauwe sensor" en "het groene shield" gaan over een onderdeel.
const BIJ_DRAAD = String.raw`(?=\s+(?:draad|draden|draadje|naar|op|in)\b)`;
const KLEURWOORD: [RegExp, string][] = [
  [new RegExp(String.raw`\brode?` + BIJ_DRAAD, 'i'), 'rood'],
  [new RegExp(String.raw`\bzwarte?` + BIJ_DRAAD, 'i'), 'zwart'],
  [new RegExp(String.raw`\bblauwe?` + BIJ_DRAAD, 'i'), 'blauw'],
  [new RegExp(String.raw`\b(?:geel|gele)` + BIJ_DRAAD, 'i'), 'geel'],
  [new RegExp(String.raw`\bgroene?` + BIJ_DRAAD, 'i'), 'groen'],
  [new RegExp(String.raw`\boranje` + BIJ_DRAAD, 'i'), 'oranje'],
  [new RegExp(String.raw`\bbruine?` + BIJ_DRAAD, 'i'), 'bruin'],
];

function lessen(map: string): string[] {
  return readdirSync(join(SITE, map), { recursive: true, encoding: 'utf8' })
    .filter((n) => /\.mdx?$/.test(n))
    .map((n) => join(SITE, map, n));
}

/** Elk plaatje van een aansluitschema in de lessen: bestand, alt-tekst en pad in de site. */
function schemaPlaatjes() {
  const uit: { les: string; alt: string; pad: string }[] = [];
  for (const les of ['docs', 'lego_auto', 'golfbot'].flatMap(lessen)) {
    for (const m of readFileSync(les, 'utf8').matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      const pad = m[2].startsWith('@site/')
        ? m[2].slice(6)
        : relative(SITE, join(les, '..', m[2]));
      const isSchema =
        pad.startsWith('static/fritzing/') || NOG_ZONDER_BRON.has(pad) || /_bb\.(png|svg)$/.test(pad);
      if (isSchema) uit.push({ les: relative(SITE, les), alt: m[1], pad });
    }
  }
  return uit;
}

const bronVan = (pad: string) => {
  const naam = basename(pad).replace(/\.(png|svg)$/, '');
  return UITSNEDE[naam] ?? naam.replace(/_bb$/, '');
};

describe('elk aansluitschema in een les', () => {
  it('komt uit een .fzz in static/fritzing', () => {
    // De batterijhouder, de TOF en de multiplexer stonden er alleen als PNG in,
    // met blauwe draden waar de tekst rood en zwart zei. Niemand kon ze opnieuw
    // maken. Een schema staat nu in static/fritzing, naast zijn .fzz.
    const fout = schemaPlaatjes()
      .filter((p) => !NOG_ZONDER_BRON.has(p.pad))
      .filter((p) => !p.pad.startsWith('static/fritzing/') || !existsSync(join(FRITZING, `${bronVan(p.pad)}.fzz`)))
      .map((p) => `${p.les}: ${p.pad}`);
    expect(fout).toEqual([]);
  });

  it('heeft alleen draden die recht omlaag of recht opzij lopen, in elke .fzz', () => {
    // Op het Golfbot-plaatje liep de oranje draad van de sensor schuin en dan
    // langs de rij van A4, en de servodraden schuin over de pinnen van D8 tot
    // D3; de tekst moest uitleggen dat de hoekjes geen aansluitingen waren.
    const NOG_SCHUIN = new Set(['shield_with_motors.fzz']);
    const fout: string[] = [];
    for (const fzz of readdirSync(FRITZING).filter((n) => n.endsWith('.fzz') && !NOG_SCHUIN.has(n))) {
      const fz = [...unzip(join(FRITZING, fzz))].find(([n]) => n.endsWith('.fz'))?.[1] ?? '';
      for (const m of fz.matchAll(
        /<instance moduleIdRef="WireModuleID"[\s\S]*?<breadboardView[^>]*>\s*<geometry [^>]*x2="([-\d.e]+)" y2="([-\d.e]+)"/g,
      ))
        if (Math.abs(Number(m[1])) > 0.01 && Math.abs(Number(m[2])) > 0.01)
          fout.push(`${fzz}: schuine draad (${m[1]}, ${m[2]})`);
    }
    expect(fout).toEqual([]);
  });

  it('heeft de draadkleuren die zijn alt-tekst noemt', () => {
    // De alt-tekst van de batterijhouder zei "de rode draad op de plus en de
    // zwarte op de min", terwijl beide draden in het plaatje blauw waren.
    const fout: string[] = [];
    for (const p of schemaPlaatjes().filter((p) => p.pad.startsWith('static/fritzing/'))) {
      const fzz = join(FRITZING, `${bronVan(p.pad)}.fzz`);
      if (!existsSync(fzz)) continue;
      const fz = [...unzip(fzz)].find(([n]) => n.endsWith('.fz'))?.[1] ?? '';
      const kleuren = new Set([...fz.matchAll(/<wireExtras [^>]*color="([^"]*)"/g)].map((m) => m[1].toLowerCase()));
      for (const [woord, kleur] of KLEURWOORD)
        if (woord.test(p.alt) && !KLEUR[kleur].some((k) => kleuren.has(k)))
          fout.push(`${p.les}: de alt noemt ${kleur}, maar ${basename(fzz)} heeft geen ${kleur}e draad`);
    }
    expect(fout).toEqual([]);
  });
});
