import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De naslag van robotica (docs/) heeft twee ingangen: Onderdelen, één pagina
// per sensor, actuator of handeling, en RoboCup Junior. Tot november 2026 was
// het één "Bibliotheek" onder Microcontrollers/Arduino Nano RP2040 Connect,
// met 44 pagina's in 16 categorieën die allemaal "Tutorial - …" heetten, met
// spaties in de adressen en een sidebar die niemand opende. Deze test houdt
// de nieuwe vorm vast, en eist dat elk oud adres nog ergens uitkomt.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const ONDERDELEN = join(SITE, 'docs', 'onderdelen');

type Item = string | { type: string; label: string; items: Item[] };
const ids = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : ids(i.items ?? [])));

const pagina = (id: string) => {
  const pad = join(SITE, 'docs', `${id}.mdx`);
  return readFileSync(existsSync(pad) ? pad : pad.replace(/\.mdx$/, '.md'), 'utf8');
};

describe('Onderdelen', () => {
  const sidebar = ids(sidebars.onderdelenSidebar as unknown as Item[]);
  const bestanden = readdirSync(ONDERDELEN)
    .filter((n) => /\.mdx?$/.test(n))
    .map((n) => `onderdelen/${n.replace(/\.mdx?$/, '')}`)
    .sort();

  it('elke pagina in docs/onderdelen staat in de sidebar, en andersom', () => {
    expect([...sidebar].sort()).toEqual(bestanden);
  });

  it('elke pagina heeft een description: die staat op de kaart van het overzicht', () => {
    const zonder = sidebar.filter((id) => !/^description: \S/m.test(pagina(id)));
    expect(zonder).toEqual([]);
  });

  it('niets heet nog "Tutorial"', () => {
    // Zeventien categorieën heetten "Tutorial - …": het woord zei niets en
    // stond voor de naam van het onderdeel.
    const fout = sidebar.filter((id) => /^(#|sidebar_label:|title:).*Tutorial/im.test(pagina(id)));
    expect(fout).toEqual([]);
  });

  it('elke onderdeelpagina heeft de vaste koppen', () => {
    const groepen = (sidebars.onderdelenSidebar as unknown as Item[]).filter(
      (i): i is Exclude<Item, string> => typeof i !== 'string',
    );
    const vast = ['Sensoren', 'Actuatoren'].flatMap(
      (label) => groepen.find((g) => g.label === label)?.items ?? [],
    );
    expect(vast.length).toBeGreaterThan(0);
    const fout: string[] = [];
    for (const id of vast as string[]) {
      const tekst = pagina(id);
      for (const kop of ['## Materiaal', '## Aansluiten'])
        if (!tekst.includes(kop)) fout.push(`${id}: ${kop}`);
    }
    expect(fout).toEqual([]);
  });
});

describe('de naslag heeft korte adressen zonder spaties', () => {
  it('geen pagina en geen map in docs/ heeft een spatie', () => {
    // Een spatie werd %20 in het adres. Downloads (de 3D-modellen) tellen niet:
    // die hebben hun naam uit het tekenprogramma, en lego_auto linkt ernaar.
    const fout: string[] = [];
    const loop = (map: string) => {
      for (const naam of readdirSync(map)) {
        const pad = join(map, naam);
        const map_ = statSync(pad).isDirectory();
        if (naam.includes(' ') && (map_ || /\.mdx?$/.test(naam))) fout.push(pad.slice(SITE.length));
        if (map_) loop(pad);
      }
    };
    loop(join(SITE, 'docs'));
    expect(fout).toEqual([]);
  });
});

describe('elk oud adres van de Bibliotheek stuurt door', () => {
  // De adressen van november 2026, vóór de verhuizing. Docenten hebben ze in
  // werkbladen en bladwijzers; een 404 daar merkt niemand op tijd.
  const OUD = {
    'Tutorial-installatie': ['board', 'editor', 'verbinden', 'REPL', 'package'],
    'Tutorial-ingebouwd-lampje': ['ingebouwd_lampje', 'knipperen', 'ingebouwd_lampje_kleur'],
    'Tutorial-meten is weten': ['pin_nameten', 'board'],
    'Tutorial-debuggen': ['debuggen'],
    'Tutorial-digitale-IR-sensor': ['materiaal', 'wiring'],
    'Tutorial-analoge IR-sensor': ['material', 'analog_ir', 'analog_irs', 'opties'],
    'Tutorial-afstandssensor': ['materiaal', 'wiring'],
    'Tutorial-TOF': [
      'materiaal',
      'wiring_code_zonder_mux',
      'wiring_code_met_mux',
      'wiring_code_2_met_mux',
    ],
    'Tutorial-lampje': ['pak_led', 'code'],
    'Tutorial-RGBled': ['materiaal', 'wiring', 'code'],
    'Tutorial-buzzer': ['materiaal', 'wiring', 'code'],
    'Tutorial-servo': ['materiaal', 'wiring'],
    'Tutorial-Dcmotor': ['materiaal', 'wiring', 'b_let_op', 'code'],
    'Tutorial-oled-scherm': ['materiaal', 'code_met_mux'],
    'Tutorial-batterijen': ['materiaal', 'wiring', 'code'],
    'Tutorial-lijnvolgen': ['lijnvolgen', 'code'],
  };
  const CATEGORIEEN = [
    'installatie',
    'ingebouwd-lampje',
    'meten-is-weten',
    'debuggen',
    'digitale-ir-sensor',
    'analoge-ir-sensor',
    'afstandssensor',
    'time-of-flight',
    'led',
    'rgbled',
    'buzzer',
    'servo-motor',
    'dcmotor',
    'oled-scherm',
    'batterijen',
    'lijnvolgen',
  ].map((c) => `/docs/category/tutorial---${c}`);
  const ROBOCUP = [
    'start',
    'the_material',
    'redden_basis',
    'lijnvolgen',
    'obstakels',
    'evacuatiezone_detectie',
    'rijden_evacuatiezone',
    'vinden_van_ballen',
    'grijpen_van_een_bal',
    'detectie_eindpunt',
    'pinnen_nano_connect',
  ].map((s) => `/docs/Competities/RoboCup-Junior/Redden-Basis/${s}`);

  const oud = [
    ...Object.entries(OUD).flatMap(([map, slugs]) =>
      slugs.map((s) => `/docs/Microcontrollers/Arduino Nano RP2040 Connect/${map}/${s}`),
    ),
    ...CATEGORIEEN,
    ...ROBOCUP,
  ];

  it('elk oud adres heeft een omleiding naar een pagina die bestaat', () => {
    const bron = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');
    const paren = new Map(
      [...bron.matchAll(/\{\s*van: '([^']+)',\s*naar: '([^']+)',?\s*\}/g)].map((m) => [m[1], m[2]]),
    );
    const fout: string[] = [];
    for (const van of oud) {
      const naar = paren.get(van);
      if (!naar) {
        fout.push(`${van}: geen omleiding`);
        continue;
      }
      const id = naar.split('#')[0].replace(/^\/docs\//, '');
      const doc = join(SITE, 'docs', id);
      if (![`${doc}.md`, `${doc}.mdx`, join(doc, 'index.mdx')].some(existsSync)) {
        // RoboCup-bestanden hebben een nummer vooraan.
        const map = join(SITE, 'docs', id.split('/')[0]);
        const naam = id.split('/')[1];
        const metNummer =
          existsSync(map) &&
          readdirSync(map).some((n) => n.replace(/^\d+_/, '').replace(/\.mdx?$/, '') === naam);
        if (!metNummer) fout.push(`${van} -> ${naar}: die pagina bestaat niet`);
      }
    }
    expect(fout).toEqual([]);
  });
});
