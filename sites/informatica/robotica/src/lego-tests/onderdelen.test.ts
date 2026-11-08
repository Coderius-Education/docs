import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { verdeel } from '../components/OnderdelenOverzicht/verdeel';

// De naslag van robotica (docs/) heeft twee ingangen: Onderdelen, één pagina
// per sensor, actuator of handeling, en RoboCup Junior. Tot november 2026 was
// het één "Bibliotheek" onder Microcontrollers/Arduino Nano RP2040 Connect,
// met 44 pagina's in 16 categorieën die allemaal "Tutorial - …" heetten, met
// spaties in de adressen en een sidebar die niemand opende. Deze test houdt
// de nieuwe vorm vast, en eist dat elk oud adres nog ergens uitkomt.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const ONDERDELEN = join(SITE, 'docs', 'onderdelen');

type Item =
  | string
  | {
      type: string;
      label: string;
      items: Item[];
      collapsed?: boolean;
      customProps?: Record<string, unknown>;
    };
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

  // De kaarten op de overzichtspagina (src/components/OnderdelenOverzicht)
  // lezen sidebar_custom_props uit de frontmatter. De description was te lang
  // voor een kaart (drie tot vijf regels per onderdeel), en zonder foto
  // herkende je het onderdeel dat op tafel ligt niet.
  const kaart = (id: string, veld: string) =>
    pagina(id)
      .match(/^sidebar_custom_props:\n((?: {2}.*\n)+)/m)?.[1]
      .match(new RegExp(`^ {2}${veld}: (.+)$`, 'm'))?.[1];
  const groepen = (sidebars.onderdelenSidebar as unknown as Item[]).filter(
    (i): i is Exclude<Item, string> => typeof i !== 'string',
  );
  const pagina_s = sidebar.filter((id) => id !== 'onderdelen/index');

  it('elke pagina heeft een korte regel voor zijn kaart', () => {
    const fout = pagina_s.filter((id) => {
      const kort = kaart(id, 'kort');
      return !kort || kort.length > 50 || kort.endsWith('.');
    });
    expect(fout).toEqual([]);
  });

  it('elke kaart heeft een foto die bestaat, behalve in een groep met stappen', () => {
    const fout: string[] = [];
    for (const groep of groepen.filter((g) => g.customProps?.weergave !== 'stappen'))
      for (const id of groep.items as string[]) {
        const foto = kaart(id, 'foto');
        if (!foto || !existsSync(join(ONDERDELEN, 'img', foto))) fout.push(`${id}: ${foto}`);
      }
    expect(fout).toEqual([]);
  });

  it('elke sensor en actuator zegt waar hij op aangesloten wordt', () => {
    const fout = groepen
      .filter((g) => ['Sensoren', 'Actuatoren'].includes(g.label))
      .flatMap((g) => g.items as string[])
      .filter((id) => !kaart(id, 'aansluiting'));
    expect(fout).toEqual([]);
  });

  it('Aan de slag is een rij stappen, met Er gaat iets mis als losse regel', () => {
    const start = groepen.find((g) => g.label === 'Aan de slag');
    expect(start?.customProps?.weergave).toBe('stappen');
    const hulp = (start?.items as string[]).filter((id) => kaart(id, 'hulp') === 'true');
    expect(hulp).toEqual(['onderdelen/er-gaat-iets-mis']);
  });

  it('elke groep in de sidebar staat standaard dicht', () => {
    // Met alle vier de groepen open stond de sidebar vol met 19 pagina's.
    // Docusaurus klapt de groep van de open pagina zelf open.
    const open = groepen.filter((g) => g.collapsed !== true).map((g) => g.label);
    expect(groepen.length).toBeGreaterThan(0);
    expect(open).toEqual([]);
  });

  it('het overzicht past op één scherm: drie kolommen en geen inhoudsopgave', () => {
    // Met kaarten onder elkaar was de pagina 1800 pixels hoog bij 1280 × 720.
    // Nu staan de groepen in drie kolommen (verdeel.ts), en houdt de pagina
    // geen kwart van de breedte vrij voor een inhoudsopgave die leeg is.
    // Of het echt past, meet alleen een browser (zie CLAUDE.md).
    const kolommen = verdeel(
      groepen.map((g) => g.items.length + 1),
      3,
    ).map((kolom) => kolom.map((i) => groepen[i].label));
    expect(kolommen).toEqual([['Aan de slag', 'Op de robot'], ['Sensoren'], ['Actuatoren']]);
    expect(pagina('onderdelen/index')).toMatch(/^hide_table_of_contents: true$/m);
  });

  it('verdeel zet elke groep in de kolom die tot dan het kortst is', () => {
    expect(verdeel([4, 8, 7, 3], 3)).toEqual([[0, 3], [1], [2]]);
    expect(verdeel([5, 5], 3)).toEqual([[0], [1]]);
    expect(verdeel([2, 2, 2, 2], 2)).toEqual([
      [0, 2],
      [1, 3],
    ]);
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
