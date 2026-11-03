import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
