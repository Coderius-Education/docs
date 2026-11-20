import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inTrack, levelVoor } from '@coderius/checker/conceptLevel';
import { geldigeTrack } from '@coderius/checker/leerdoelen';
import { computeLevelSummary } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { CheckReport, ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import leerdoelenJson from '../leerdoelen.json';
import { LEAPHY_MODULES, roboticaConfig } from './config';

// Concepten uit de leerdoelen en die onder Ook gebruikt, samen.
const perId = (report: CheckReport) =>
  new Map([...report.concepts, ...(report.extra ?? [])].map((c) => [c.id, c.used]));

// Asserteert op benoemde concept-id's in plaats van op totalen, zodat een
// nieuwe les deze tests niet breekt. Elke genoemde id moet wel bestaan —
// anders wordt een assertie stilletjes betekenisloos.

function files(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: roboticaConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

function leesFixture(naam: string): ProjectFiles {
  const wortel = join(FIXTURES, naam);
  const gevonden: ProjectFiles = {};

  const loop = (map: string): void => {
    for (const item of readdirSync(map)) {
      const volledig = join(map, item);
      if (statSync(volledig).isDirectory()) {
        loop(volledig);
        continue;
      }
      const path = relative(wortel, volledig).split('\\').join('/');
      const content = readFileSync(volledig, 'utf8');
      gevonden[path] = {
        path,
        kind: roboticaConfig.classify(path),
        content,
        sizeBytes: content.length,
        tooLarge: false,
      };
    }
  };

  loop(wortel);
  return gevonden;
}

function verwacht(naam: string, gebruikt: string[], ongebruikt: string[]): void {
  const report = analyze(leesFixture(naam), roboticaConfig);
  const gevonden = perId(report);

  for (const id of [...gebruikt, ...ongebruikt]) {
    expect(gevonden.has(id), `concept '${id}' bestaat niet in roboticaConfig`).toBe(true);
  }
  expect(gebruikt.filter((id) => !gevonden.get(id))).toEqual([]);
  expect(ongebruikt.filter((id) => gevonden.get(id))).toEqual([]);
}

describe('roboticaConfig — voorbeeldprojecten scoren', () => {
  it('het knipperscript uit Deel 2 levert alleen de eerste concepten op', () => {
    verwacht(
      'minimaal',
      ['py-import', 'py-variabele', 'py-while', 'rb-main-py'],
      [
        // Dit script heeft `while True:` en verder geen enkele boolean. Zou
        // py-boolean hier aanslaan, dan stond het concept al aangevinkt bij
        // het allereerste script dat een leerling typt.
        'py-boolean',
        'py-if-else',
        'py-for',
        'py-fstring',
        'py-functie',
        'rb-ir-een',
        'rb-motoren',
        'rb-scherm',
        'rb-afstand',
      ],
    );
  });

  it('de lijnvolger met afstandssensor herkent wat er echt in staat', () => {
    verwacht(
      'compleet',
      [
        'py-import',
        'py-variabele',
        'py-rekenen',
        'py-fstring',
        'py-boolean',
        'py-if-else',
        'py-elif',
        'py-and-or',
        'py-while',
        'py-functie-parameters',
        'rb-ir-een',
        'rb-ir-twee',
        'rb-scherm',
        'rb-motoren',
        'rb-afstand',
        'rb-main-py',
      ],
      // Even belangrijk: de nakijker vinkt niet zomaar alles aan. Dit script
      // heeft twee sensoren en geen servo, en het bouwwerk kan hij per
      // definitie niet zien.
      [
        'rb-ir-vier',
        'rb-servo',
        'py-for',
        'py-range',
        'py-break',
        'py-continue',
        'py-lijst',
        'py-dict',
        'py-return',
        'py-import-eigen',
        'rb-frame',
        'rb-robot-compleet',
        'rb-lijnvolgen-twee',
      ],
    );
  });

  it('leest de fixture zoals de checker een upload ziet', () => {
    const gevonden = leesFixture('compleet');
    expect(gevonden['main.py'].kind).toBe('py');
    expect(roboticaConfig.classify('foto.jpg')).toBe('image');
    expect(roboticaConfig.classify('bouwplan.pdf')).toBe('other');
    expect(roboticaConfig.textKinds).toEqual(['py']);
    expect(roboticaConfig.imageKinds).toEqual(['image']);
  });

  it('herkent precies de beeldformaten die je ook mag kiezen', () => {
    // Loopt dit uiteen, dan verschijnt een foto uit een zip wel in de
    // fotostrip terwijl je diezelfde foto niet kunt selecteren.
    const uitAccept = roboticaConfig.accept
      .split(',')
      .filter((ext) => ext !== '.zip' && ext !== '.py');

    for (const ext of uitAccept) {
      expect(roboticaConfig.classify(`foto${ext}`), ext).toBe('image');
    }
    for (const ext of ['.gif', '.bmp', '.svg', '.heic']) {
      expect(roboticaConfig.classify(`foto${ext}`), ext).toBe('other');
    }
  });
});

describe('roboticaConfig', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(roboticaConfig)).toEqual([]);
  });

  it('telt sensoren en houdt twee van vier uit elkaar', () => {
    // Het enige verschil tussen deze twee concepten is de drempel; zonder
    // minCount zouden ze allebei aanslaan op één sensor.
    // Elke sensor wordt gelezen en wat hij leest komt in een if: alleen het
    // aantal verschilt.
    const script = (pinnen: string[]) =>
      pinnen
        .map(
          (p, i) =>
            `s${i} = AnalogIR("${p}", 2500)\nif s${i}.black_or_white() == "black":\n    print(${i})`,
        )
        .join('\n');
    const drie = analyze(files({ 'main.py': script(['A0', 'A1', 'A2']) }), roboticaConfig);
    const gevonden = perId(drie);
    expect(gevonden.get('rb-ir-een')).toBe(true);
    expect(gevonden.get('rb-ir-twee')).toBe(true);
    expect(gevonden.get('rb-ir-vier')).toBe(false);

    const vier = analyze(files({ 'main.py': script(['A0', 'A1', 'A2', 'A3']) }), roboticaConfig);
    expect(perId(vier).get('rb-ir-vier')).toBe(true);
  });

  it('herkent de sensoren die niet in de fixtures zitten', () => {
    // Zonder deze test zou een kapotte regex voor precies deze twee de hele
    // suite stil groen laten.
    const report = analyze(
      files({
        'main.py': [
          'from leaphymicropython.actuators.servo import set_servo_angle',
          'from leaphymicropython.sensors.sonar import read_distance',
          'set_servo_angle("D6", 180)',
          'print(read_distance("D7", "D8"))',
        ].join('\n'),
      }),
      roboticaConfig,
    );
    const gevonden = perId(report);
    expect(gevonden.get('rb-servo')).toBe(true);
    expect(gevonden.get('rb-afstand')).toBe(true);
  });

  it('laat handmatige concepten altijd op niet-toegepast staan', () => {
    // Ook als het script de woorden letterlijk bevat: dit stelt de docent
    // vast, niet de regex.
    const report = analyze(
      files({ 'main.py': '# frame gebouwd, batterijen erin, rijdt om obstakels heen' }),
      roboticaConfig,
    );
    const gevonden = perId(report);
    for (const id of ['rb-frame', 'rb-robot-compleet', 'rb-batterijen', 'rb-obstakel-omheen']) {
      expect(gevonden.get(id), id).toBe(false);
    }
  });

  it('rekent `while True:` niet als boolean, maar een vergelijking wel', () => {
    // De lus staat in elk script van de cursus; hem laten meetellen zou dit
    // concept tot een gratis vinkje maken.
    const lus = analyze(
      files({ 'main.py': 'while True:\n    lampje.on()\n    sleep(0.5)' }),
      roboticaConfig,
    );
    expect(perId(lus).get('py-boolean')).toBe(false);

    for (const regel of ['klaar = True', 'if kleur == "wit":', 'if afstand >= 100:']) {
      const report = analyze(files({ 'main.py': `while True:\n    ${regel}` }), roboticaConfig);
      const gevonden = perId(report);
      expect(gevonden.get('py-boolean'), regel).toBe(true);
    }
  });

  it('eist de exacte bestandsnaam main.py', () => {
    // Het bord voert bij het aanzetten alleen main.py uit; robot.py doet niets.
    const goed = analyze(files({ 'main.py': 'x = 1' }), roboticaConfig);
    const fout = analyze(files({ 'robot.py': 'x = 1' }), roboticaConfig);
    expect(perId(goed).get('rb-main-py')).toBe(true);
    expect(perId(fout).get('rb-main-py')).toBe(false);
  });

  it('ziet een eigen module los van de bibliotheek van het bord', () => {
    const bord = analyze(
      files({ 'main.py': 'from machine import Pin\nfrom time import sleep' }),
      roboticaConfig,
    );
    expect(perId(bord).get('py-import-eigen')).toBe(false);

    const eigen = analyze(
      files({ 'main.py': 'import rijden', 'rijden.py': 'def vooruit():\n    pass' }),
      roboticaConfig,
    );
    expect(perId(eigen).get('py-import-eigen')).toBe(true);
    // Een module zonder bestand in het project is niet van de leerling:
    // struct, framebuf en ssd1306 telden eerst als eigen module.
    for (const code of ['import rijden', 'import struct', 'from ssd1306 import SSD1306_I2C']) {
      expect(
        perId(analyze(files({ 'main.py': code }), roboticaConfig)).get('py-import-eigen'),
        code,
      ).toBe(false);
    }
  });

  it('houdt een dictionary uit de buurt van een set', () => {
    const dict = analyze(files({ 'main.py': 'kleuren = {"rood": 1}' }), roboticaConfig);
    const dictIds = perId(dict);
    expect(dictIds.get('py-dict')).toBe(true);
    expect(dictIds.get('py-tuple-set')).toBe(false);

    const set = analyze(files({ 'main.py': 'namen = {"jan", "sam"}' }), roboticaConfig);
    const setIds = perId(set);
    expect(setIds.get('py-tuple-set')).toBe(true);
    expect(setIds.get('py-dict')).toBe(false);
  });

  it('volgt het tabblad robotica van het beoordelingsblad', () => {
    // Het blad zoals de docent het invulde: start is niveau 1, verdieping is
    // niveau 4, en niveau 3 zit daartussen. X is "hoort niet bij dit niveau"
    // (null in leerdoelen.json): niveau 4 laat functies met parameters, een
    // eigen module en tuples / sets weg, niveau 3 daarbovenop lijsten,
    // lijst-methodes, continue en break. Twee spelfouten zijn hersteld
    // ("calibreren", "afstandsensor").
    const B = 'basis';
    const G = 'gevorderd';
    const X = null;
    const blad = [
      ['Python', 'variabele', B, B, B],
      ['Python', 'rekenen (+, -, *, /)', B, B, B],
      ['Python', 'f-strings', B, B, B],
      ['Python', 'booleans', B, B, B],
      ['Python', 'if / else', B, B, B],
      ['Python', 'if / elif / else', G, G, G],
      ['Python', 'while-loop', B, B, B],
      ['Python', 'functie zonder parameters en return', B, G, G],
      ['Python', 'Functie met parameters', B, X, X],
      ['Python', 'Lijst-methodes', B, X, G],
      ['Python', 'imports', B, B, B],
      ['Robotica', 'het frame bouwen', B, B, B],
      ['Robotica', 'één IR-sensor uitlezen en kalibreren', B, B, B],
      ['Robotica', 'twee IR-sensoren uitlezen en kalibreren', B, B, B],
      ['Robotica', 'waardes van IR-sensoren tonen op scherm', B, B, B],
      ['Robotica', 'Motoren aansturen', B, B, B],
      ['Robotica', 'hele robot gebouwd (lego + motoren + IR-sensoren + schermpje)', B, B, B],
      ['Robotica', 'robot laten werken op batterijen', B, B, B],
      ['Robotica', 'lijnvolgen met twee IR-sensoren', B, B, B],
      ['Robotica', 'lijnvolgen met vier IR-sensoren', G, B, B],
      ['Robotica', 'afstandssensor uitlezen', G, B, B],
      ['Robotica', 'obstakel detecteren en stoppen', G, B, B],
      ['Robotica', 'bal detecteren', G, G, G],
      ['Python', 'and / or', G, G, G],
      ['Python', 'continue', G, X, G],
      ['Python', 'break', G, X, G],
      ['Python', 'Lijsten', G, X, G],
      ['Python', 'zelf python module schrijven en importeren in ander bestand', G, X, X],
      ['Python', 'tuples / sets', G, X, X],
      ['Robotica', 'om obstakel heen rijden', G, G, G],
      ['Robotica', 'langs muren rijden', G, G, G],
      ['Robotica', 'bal grijpen', G, G, G],
      ['Robotica', 'groot gedeelte Redden Basis', G, G, G],
    ];
    const label = new Map(leerdoelenJson.onderwerpen.map((o) => [o.id, o.label]));
    expect(leerdoelenJson.niveaus).toEqual(['1', '3', '4']);
    expect(
      leerdoelenJson.concepten.map((c) => [
        label.get(c.onderwerp),
        c.concept,
        c['1'],
        c['3'],
        c['4'],
      ]),
    ).toEqual(blad);
  });

  it('geeft elk concept uit de leerdoelen een detectie, en zet de rest onder Ook gebruikt', () => {
    expect(roboticaConfig.concepts.map((c) => c.id)).toEqual(
      leerdoelenJson.concepten.map((c) => c.id),
    );
    expect((roboticaConfig.extra ?? []).map((c) => c.id)).toEqual([
      'py-print',
      'py-string-methoden',
      'py-for',
      'py-range',
      'py-return',
      'py-dict',
      'py-dict-loop',
      'rb-servo',
      'rb-main-py',
    ]);
  });

  it('wijst bij elk concept een les aan', () => {
    // Een les uit de Lego-auto of RoboCup, en voor Python wat de robotcursus
    // niet zelf uitlegt een les van de python-cursus. Dat de les bestaat,
    // controleert de build (en cross-links voor de python-cursus).
    expect(leerdoelenJson.concepten.filter((c) => !c.les).map((c) => c.id)).toEqual([]);
  });

  it('maakt van de niveaus de leerroutes, en opent een oude beoordeling op het goede niveau', () => {
    expect(roboticaConfig.tracks).toEqual([
      { id: '1', label: 'Niveau 1' },
      { id: '3', label: 'Niveau 3' },
      { id: '4', label: 'Niveau 4' },
    ]);
    // Een beoordeling van vóór de leerdoelen had start of verdieping, en
    // verdieping is nu niveau 4.
    expect(geldigeTrack(roboticaConfig, 'start')).toBe('1');
    expect(geldigeTrack(roboticaConfig, 'verdieping')).toBe('4');
  });

  it('laat op niveau 3 en 4 weg wat het blad daar weghaalt', () => {
    const weg = (route: string) =>
      roboticaConfig.concepts.filter((c) => !inTrack(c, route)).map((c) => c.id);
    expect(weg('1')).toEqual([]);
    expect(weg('4')).toEqual(['py-functie-parameters', 'py-import-eigen', 'py-tuple-set']);
    expect(weg('3')).toEqual([
      'py-functie-parameters',
      'py-lijst-methoden',
      'py-continue',
      'py-break',
      'py-lijst',
      'py-import-eigen',
      'py-tuple-set',
    ]);
    // Wat weg is, telt in die leerroute niet mee, ook niet als het in de
    // code staat: met tuples in het project blijft het totaal op niveau 4
    // drie lager dan op niveau 1.
    const report = analyze(leesFixture('compleet'), roboticaConfig);
    const totaal = (route: string) => {
      const s = computeLevelSummary(report, roboticaConfig, route);
      return s.basis.total + s.gevorderd.total + s.expert.total;
    };
    expect(totaal('1')).toBe(33);
    expect(totaal('4')).toBe(30);
    expect(totaal('3')).toBe(26);
  });

  it('de niveaus verschuiven tussen niveau 1 en 4', () => {
    // Zonder meer niveaus zou dezelfde robot in elke route hetzelfde
    // scoren. Volgens het blad gaan op niveau 4 drie robotica-onderdelen van
    // gevorderd naar basis, en twee Python-concepten juist naar gevorderd.
    const naar = (van: string, naar: string, route: string) =>
      roboticaConfig.concepts
        .filter(
          (c) => inTrack(c, route) && levelVoor(c, '1') === van && levelVoor(c, route) === naar,
        )
        .map((c) => c.id);
    expect(naar('gevorderd', 'basis', '4')).toEqual([
      'rb-ir-vier',
      'rb-afstand',
      'rb-obstakel-stoppen',
    ]);
    expect(naar('basis', 'gevorderd', '4')).toEqual(['py-functie', 'py-lijst-methoden']);
    expect(naar('basis', 'gevorderd', '3')).toEqual(['py-functie']);
  });

  it('elk handmatig concept staat in Bouwen of Rijgedrag', () => {
    // De scheidslijn van deze nakijker: staat het in het bestand, of doet de
    // robot het. Een handmatig concept bij Sensoren of Python zou betekenen
    // dat er iets niet gedetecteerd wordt dat dat wel zou moeten.
    const scheef = roboticaConfig.concepts
      .filter((c) => c.detect.type === 'handmatig')
      .filter((c) => c.group !== 'Bouwen' && c.group !== 'Rijgedrag')
      .map((c) => c.id);

    expect(scheef).toEqual([]);
  });
});

describe('roboticaConfig — wat niet van de leerling is, en wat er net naast ligt', () => {
  const ids = (entries: Record<string, string>) => perId(analyze(files(entries), roboticaConfig));
  const vier = 'from leaphymicropython.sensors.linesensors import AnalogIR\n';

  it('telt de meegeleverde bibliotheek niet als eigen code', () => {
    const report = analyze(
      files({
        'main.py': 'from machine import Pin\nlampje = Pin("LED", Pin.OUT)\n',
        'lib/leaphymicropython/sensors/tof.py':
          'def get_distance(self):\n    waardes = [1, 2]\n    for w in waardes:\n        if w > 1 and w < 3:\n            break\n',
      }),
      roboticaConfig,
    );
    const gebruikt = new Map(report.concepts.map((c) => [c.id, c.used]));
    for (const id of ['rb-afstand', 'py-lijst', 'py-break', 'py-and-or']) {
      expect(gebruikt.get(id), id).toBe(false);
    }
    expect(report.warnings.join(' ')).toContain('lib/leaphymicropython/sensors/tof.py');
  });

  it('telt niets in commentaar of een docstring', () => {
    const perId = ids({
      'main.py': [
        '"""Rijdt als wit or zwart: sensoren = [a, b]."""',
        '# x1 = AnalogIR("A0", 2500)',
        '# x2 = AnalogIR("A1", 2500)',
        '# x3 = AnalogIR("A2", 2500)',
        '# x4 = AnalogIR("A3", 2500)',
        '# tof = TimeOfFlight(sda_gpio_pin="SDA", scl_gpio_pin="SCL")',
      ].join('\n'),
    });
    for (const id of ['rb-ir-een', 'rb-ir-vier', 'rb-afstand', 'py-and-or', 'py-lijst']) {
      expect(perId.get(id), id).toBe(false);
    }
  });

  it('eist vier sensoren in één script, en telt digitale en die uit een lijst mee', () => {
    const sensor = (pin: string) =>
      `s_${pin} = AnalogIR("${pin}", 2500)\nif s_${pin}.black_or_white() == "black":\n    print(1)\n`;
    expect(
      ids({
        'test_een.py': vier + sensor('A0'),
        'main.py': vier + sensor('A0') + sensor('A1'),
        'main_oud.py': vier + sensor('A2') + sensor('A3'),
      }).get('rb-ir-vier'),
    ).toBe(false);
    expect(
      ids({ 'main.py': vier + ['A0', 'A1', 'A2', 'A3'].map(sensor).join('') }).get('rb-ir-vier'),
    ).toBe(true);
    const digitaal = ['D14', 'D15', 'D16', 'D17']
      .map((p) => `s_${p} = Pin("${p}", Pin.IN)\nif s_${p}.value() == 1:\n    print(1)\n`)
      .join('');
    expect(ids({ 'main.py': `from machine import Pin\n${digitaal}` }).get('rb-ir-vier')).toBe(true);
    const lijst = `${vier}sensoren = [AnalogIR(p, 2500) for p in ["A0", "A1", "A2", "A3"]]\nwaarden = [s.black_or_white() for s in sensoren]\nif waarden[0] == "black":\n    print(1)\n`;
    expect(ids({ 'main.py': lijst }).get('rb-ir-vier')).toBe(true);
    // Een knop met PULL_UP is geen sensor.
    expect(ids({ 'main.py': 'knop = Pin("D7", Pin.IN, Pin.PULL_UP)' }).get('rb-ir-een')).toBe(
      false,
    );
  });

  it('telt een functie met parameters ook als functie', () => {
    // Op niveau 3 en 4 telt "met parameters" niet mee; eerst gaf
    // `def stuur(a, b)` daar niets, en `def rechtdoor()` wel gevorderd.
    const perId = ids({ 'main.py': 'def stuur(links, rechts):\n    print(links, rechts)\n' });
    expect(perId.get('py-functie')).toBe(true);
    expect(perId.get('py-functie-parameters')).toBe(true);
    expect(
      ids({ 'main.py': 'class R:\n    def rijd(self):\n        print(self)\n' }).get(
        'py-functie-parameters',
      ),
    ).toBe(false);
  });

  it('herkent gewone vormen en geen schijntreffers', () => {
    expect(ids({ 'main.py': 'if waarde < 2500:\n    pass' }).get('py-boolean')).toBe(true);
    expect(ids({ 'main.py': 'def f() -> int:\n    return 1' }).get('py-boolean')).toBe(false);
    expect(ids({ 'main.py': 'teller += 1' }).get('py-rekenen')).toBe(true);
    expect(ids({ 'main.py': 'x = snelheid*2' }).get('py-rekenen')).toBe(true);
    expect(ids({ 'main.py': 'print(f"afstand={afstand}")' }).get('py-tuple-set')).toBe(false);
    expect(ids({ 'oud/main.py': 'print(1)', 'robot.py': 'print(2)' }).get('rb-main-py')).toBe(
      false,
    );
    expect(ids({ 'main.py': 'print(1)' }).get('rb-main-py')).toBe(true);
  });
});

// De review van de upload tool (november 2026): drie lezers op de herkenning,
// de leerdoelen en het uploaden in Chromium. Elk geval faalde op de code van
// daarvoor.
describe('roboticaConfig — review van de upload tool', () => {
  const ids = (entries: Record<string, string>) => perId(analyze(files(entries), roboticaConfig));
  const IR = 'from leaphymicropython.sensors.linesensor import AnalogIR\n';
  const LES = fileURLToPath(new URL('../../lego_auto/', import.meta.url));
  /** Het eerste python-blok onder een kop van een les. */
  const blokOnder = (les: string, kop: string) => {
    const md = readFileSync(join(LES, `${les}.md`), 'utf8');
    const deel = md.slice(md.indexOf(kop));
    return /```python[^\n]*\n([\s\S]*?)```/.exec(deel)?.[1] ?? '';
  };

  it('geeft bij elk Je script van de Lego-auto wat die les toevoegt', () => {
    const gebruikt = (les: string) => {
      const report = analyze(files({ 'main.py': blokOnder(les, '## Je script') }), roboticaConfig);
      return report.concepts.filter((c) => c.used).map((c) => c.id);
    };
    const lessen: [string, string[], string[]][] = [
      ['analoog_ir/deel3_een_sensor', ['rb-ir-een'], ['rb-ir-twee']],
      ['analoog_ir/deel4_twee_sensoren', ['rb-ir-twee'], ['rb-scherm']],
      ['debuggen_met_scherm/deel5_scherm', ['rb-scherm'], ['rb-motoren']],
      ['motoren/deel6_draaien', ['rb-motoren'], ['py-if-else']],
      ['lijnvolgen/deel7_rechtdoor', ['py-if-else', 'py-boolean', 'py-and-or'], ['py-elif']],
      ['lijnvolgen/vier_sensoren', ['rb-ir-vier', 'py-elif'], ['rb-afstand']],
      ['afstand/stoppen', ['rb-afstand', 'py-elif'], ['py-lijst', 'py-functie']],
    ];
    for (const [les, wel, niet] of lessen) {
      const lijst = gebruikt(les);
      for (const id of wel) expect(lijst, `${les}: ${id}`).toContain(id);
      for (const id of niet) expect(lijst, `${les}: ${id}`).not.toContain(id);
    }
  });

  it('telt een IR-sensor pas als hij gelezen wordt, en vier pas als ze in een if komen', () => {
    // Bij Uitlezen en tonen van Deel 9 staan de buitenste sensoren alleen op
    // het scherm; de les zegt zelf dat een sensor dan nog niets doet.
    const tonen = blokOnder('lijnvolgen/vier_sensoren', '## Stap 2');
    expect(tonen).toContain('buiten_links.black_or_white()');
    expect(ids({ 'main.py': tonen }).get('rb-ir-vier')).toBe(false);
    expect(ids({ 'main.py': `${IR}links = AnalogIR("A0", 2500)\n` }).get('rb-ir-een')).toBe(false);
    // Aangemaakt in een eigen module, gelezen in main.py.
    expect(
      ids({
        'sensoren.py': `${IR}links = AnalogIR("A0", 2500)\nrechts = AnalogIR("A1", 2500)\n`,
        'main.py':
          'from sensoren import links, rechts\nprint(links.black_or_white(), rechts.black_or_white())\n',
      }).get('rb-ir-twee'),
    ).toBe(true);
  });

  it('herkent elke vorm van een IR-sensor uit de bibliotheek', () => {
    const lees = (namen: string[]) =>
      `print(${namen.map((n) => `${n}.black_or_white()`).join(', ')})\n`;
    const vormen: [string, string][] = [
      [
        'pin_name',
        `${IR}a = AnalogIR(pin_name="A0", above_black=2500)\nb = AnalogIR(pin_name="A1")\n${lees(['a', 'b'])}`,
      ],
      [
        'hulpfunctie',
        `${IR}def sensor(pin):\n    return AnalogIR(pin, 2500)\nss = [sensor("A0"), sensor("A1")]\nprint(ss[0].black_or_white())\n`,
      ],
      [
        'lijst over regels',
        `${IR}pinnen = [\n    "A0",\n    "A1",\n]\nss = [AnalogIR(p, 2500) for p in pinnen]\nprint(ss[0].get_analog_value())\n`,
      ],
      [
        'alias',
        `from leaphymicropython.sensors.linesensor import AnalogIR as IR\na = IR("A0", 2500)\nb = IR("A1", 2500)\n${lees(['a', 'b'])}`,
      ],
      [
        'mode=',
        'from machine import Pin\na = Pin("D14", mode=Pin.IN)\nb = Pin("D15", Pin.IN, Pin.PULL_DOWN)\nprint(a.value(), b.value())\n',
      ],
      [
        'machine.Pin',
        'import machine\na = machine.Pin("D14", machine.Pin.IN)\nb = machine.Pin("D15", machine.Pin.IN)\nprint(a.value(), b.value())\n',
      ],
    ];
    for (const [naam, script] of vormen) {
      expect(ids({ 'main.py': script }).get('rb-ir-twee'), naam).toBe(true);
    }
    // Een lijst A-pinnen zonder AnalogIR is de joystick of de potmeter (ADC).
    const joystick =
      'from machine import ADC\npinnen = ["A0", "A1", "A2", "A3"]\nfor p in pinnen:\n    print(ADC(p).read_u16())\n';
    expect(ids({ 'main.py': joystick }).get('rb-ir-een')).toBe(false);
  });

  it('telt het scherm alleen als het een waarde van een IR-sensor toont', () => {
    const scherm =
      'from leaphymicropython.actuators.oled_screen import OLEDSH1106\noled = OLEDSH1106(width=128, height=64, channel=7)\n';
    const zonder = [
      `${scherm}oled.text("Hallo robot", 0, 0)\noled.show()\n`,
      `${scherm}teller = 0\nwhile True:\n    teller += 1\n    oled.text(f"{teller}", 0, 0)\n`,
      `${scherm}${IR}links = AnalogIR("A0", 2500)\nprint(links.black_or_white())\nafstand = 10\noled.text(f"{afstand}", 0, 0)\n`,
    ];
    for (const s of zonder) expect(ids({ 'main.py': s }).get('rb-scherm'), s).toBe(false);
    const met = `${scherm}${IR}links = AnalogIR("A0", 2500)\nkleur = links.black_or_white()\noled.text(f"L: {kleur}", 0, 0)\n`;
    expect(ids({ 'main.py': met }).get('rb-scherm')).toBe(true);
    // Via een eigen functie, zoals in de fixture compleet.
    const viaFunctie = `${scherm}${IR}links = AnalogIR("A0", 2500)\ndef toon(regel):\n    oled.text(regel, 0, 0)\n    oled.show()\nkleur = links.black_or_white()\ntoon(f"L: {kleur}")\n`;
    expect(ids({ 'main.py': viaFunctie }).get('rb-scherm')).toBe(true);
  });

  it('telt geen lege elif of lege functie', () => {
    const skelet =
      'while True:\n    if a == 1:\n        print(1)\n    elif b == 1:\n        # TODO\n        pass\n';
    expect(ids({ 'main.py': skelet }).get('py-elif')).toBe(false);
    expect(ids({ 'main.py': skelet.replace('pass', 'print(2)') }).get('py-elif')).toBe(true);
    expect(ids({ 'main.py': 'if a:\n    x = 1\nelif b: x = 2\n' }).get('py-elif')).toBe(true);
    const leeg = ids({ 'main.py': 'def rijden():\n    pass\n\ndef stuur(snelheid): ...\n' });
    expect(leeg.get('py-functie')).toBe(false);
    expect(leeg.get('py-functie-parameters')).toBe(false);
    expect(
      ids({ 'main.py': 'def stuur(\n    links,\n    rechts,\n):\n    print(links)\n' }).get(
        'py-functie-parameters',
      ),
    ).toBe(true);
  });

  it('leest geen code in tekst, en herkent rekenen zonder spaties', () => {
    for (const [regel, id] of [
      ['print("<- links")', 'py-boolean'],
      ['oled.text("Obstakel > stop", 0, 0)', 'py-boolean'],
      ['print("links and rechts")', 'py-and-or'],
      ['print(f"zwart or wit: {kleur}")', 'py-and-or'],
      ['print("DCMotors()")', 'rb-motoren'],
      ['print("Links - Rechts")', 'py-rekenen'],
      ['while(True):\n    pass', 'py-boolean'],
    ]) {
      expect(ids({ 'main.py': regel }).get(id), regel).toBe(false);
    }
    for (const regel of ['teller = teller+1', 'traag = snelheid-55', 'x = a % 2']) {
      expect(ids({ 'main.py': regel }).get('py-rekenen'), regel).toBe(true);
    }
    expect(ids({ 'main.py': 'DREMPEL = 2500' }).get('py-variabele')).toBe(true);
    expect(ids({ 'main.py': 'm = DCMotor("D2", "D3")' }).get('rb-motoren')).toBe(true);
  });

  it('herkent tuples, sets, lijsten en lijst-methoden zoals een leerling ze schrijft', () => {
    for (const regel of [
      'kleuren = [(255, 0, 0), (0, 255, 0)]',
      'for r, g, b in kleuren:\n    print(r)',
      'def f():\n    return (1, 2)',
      'meting = (links.get_analog_value(), rechts.get_analog_value())',
      'wit, zwart = 800, 5000',
      'if kleur in {"black", "zwart"}:\n    print(1)',
    ]) {
      expect(ids({ 'main.py': regel }).get('py-tuple-set'), regel).toBe(true);
    }
    expect(ids({ 'main.py': 'for pin in ["A0", "A1"]:\n    print(pin)' }).get('py-lijst')).toBe(
      true,
    );
    expect(ids({ 'main.py': 'metingen = []\nprint(1)' }).get('py-lijst')).toBe(false);
    expect(ids({ 'main.py': 'x = maak(pins=["A0"])' }).get('py-lijst')).toBe(false);
    expect(ids({ 'main.py': 'metingen = []\nmetingen.append(1)' }).get('py-lijst')).toBe(true);
    for (const regel of ['i = "abc".index("b")', 'os.remove("oud.py")']) {
      expect(ids({ 'main.py': regel }).get('py-lijst-methoden'), regel).toBe(false);
    }
    expect(ids({ 'main.py': 'metingen.clear()' }).get('py-lijst-methoden')).toBe(true);
    expect(ids({ 'main.py': 'while True:\n    if x: break' }).get('py-break')).toBe(true);
    expect(ids({ 'main.py': 'while True:\n    if x: continue' }).get('py-continue')).toBe(true);
  });

  it('eist main.py met kleine letters', () => {
    expect(ids({ 'Main.py': 'print(1)' }).get('rb-main-py')).toBe(false);
  });

  it('kijkt bij de bibliotheek naar hele mappen', () => {
    const tof =
      'from leaphymicropython.sensors.tof import TimeOfFlight\ntof = TimeOfFlight(channel=0)\n';
    // Een projectmap met de naam van de bibliotheek erin is van de leerling.
    expect(ids({ 'leaphymicropython_robot/main.py': tof }).get('rb-afstand')).toBe(true);
    // De download van GitHub, met zijn voorbeelden, is dat niet.
    const download = ids({
      'main.py': 'print(1)',
      'leaphy-micropython-main/examples/lijst.py': 'x = [1]\nfor i in x:\n    continue\n',
      'leaphy-micropython-main/.github/workflows/check.py': 'y = [1]\nprint(y)\n',
    });
    expect(download.get('py-continue')).toBe(false);
    expect(download.get('py-lijst')).toBe(false);
    // Een eigen module in lib/ telt, het pakket van Leaphy daar niet.
    const lib = ids({
      'main.py': 'import motoren',
      'lib/motoren.py':
        'from leaphymicropython.actuators.dcmotor import DCMotors\nm = DCMotors()\n',
      'lib/leaphymicropython/sensors/tof.py': 'def get_distance():\n    return 1\n',
    });
    expect(lib.get('rb-motoren')).toBe(true);
    expect(lib.get('py-import-eigen')).toBe(true);
    expect(lib.get('rb-afstand')).toBe(false);
  });

  it('herkent de bibliotheek ook als alleen de map lib/ gekozen is', () => {
    // Dan valt lib/leaphymicropython/ van de paden af (de gemeenschappelijke
    // map), en stonden de modules van Leaphy als eigen code in het rapport.
    const api = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../lego-tests/leaphy-api.json', import.meta.url)),
        'utf8',
      ),
    ) as { modules: Record<string, unknown> };
    const uitApi = Object.keys(api.modules)
      .map((m) => m.split('.').slice(1).join('/'))
      .sort();
    const hier = Object.entries(LEAPHY_MODULES)
      .flatMap(([map, namen]) => namen.split(' ').map((n) => `${map}/${n}`))
      .sort();
    expect(hier).toEqual(uitApi);
    const report = analyze(
      files({
        'sensors/tof.py': 'waardes = [1, 2]\nfor w in waardes:\n    break\n',
        'actuators/dcmotor.py': 'class DCMotors:\n    pass\n',
      }),
      roboticaConfig,
    );
    expect(perId(report).get('py-lijst')).toBe(false);
    expect(report.warnings.join(' ')).toContain('alleen de bibliotheek');
    // Een eigen map sensoren/ met een eigen naam is van de leerling.
    expect(ids({ 'sensors/mijn_sensor.py': 'x = [1]\nprint(x)\n' }).get('py-lijst')).toBe(true);
  });

  it('herkent een eigen module ook als tweede naam of uit een pakket', () => {
    const module = 'def vooruit():\n    print(1)\n';
    expect(
      ids({ 'main.py': 'import time, rijden', 'rijden.py': module }).get('py-import-eigen'),
    ).toBe(true);
    expect(
      ids({ 'main.py': 'from robot.rijden import vooruit', 'robot/rijden.py': module }).get(
        'py-import-eigen',
      ),
    ).toBe(true);
  });

  it('waarschuwt bij een upload die de docent niet kan beoordelen', () => {
    const meldingen = (entries: Record<string, string>) =>
      analyze(files(entries), roboticaConfig).warnings.join('\n');
    const foto = { 'robot.jpg': 'data:image/jpeg;base64,eA==' };
    // Alleen de map lib/ van het bord.
    expect(meldingen({ 'leaphymicropython/sensors/tof.py': 'x = 1' })).toContain(
      'alleen de bibliotheek',
    );
    // De naam die een download van het bord kreeg.
    expect(meldingen({ 'main (1).py': 'print(1)', ...foto })).toContain(
      'Je script heet main (1).py',
    );
    expect(meldingen({ 'robot.py': 'print(1)', ...foto })).toContain('geen main.py');
    // Alleen main.py, zonder de modules die hij importeert.
    expect(
      meldingen({
        'main.py': 'from motoren import vooruit\nimport sensoren\nimport time\n',
        ...foto,
      }),
    ).toContain('Je code importeert motoren en sensoren');
    expect(meldingen({ 'main.py': 'print(1)' })).toContain('geen foto');
    // Een gewone upload: geen melding.
    expect(
      meldingen({
        'main.py': 'from machine import Pin\nimport rijden\n',
        'rijden.py': 'print(1)',
        ...foto,
      }),
    ).toBe('');
  });
});
