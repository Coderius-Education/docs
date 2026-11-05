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
import { roboticaConfig } from './config';

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
    const drie = analyze(
      files({
        'main.py': 'a = AnalogIR("A0", 2500)\nb = AnalogIR("A1", 2500)\nc = AnalogIR("A2", 2500)',
      }),
      roboticaConfig,
    );
    const gevonden = perId(drie);
    expect(gevonden.get('rb-ir-een')).toBe(true);
    expect(gevonden.get('rb-ir-twee')).toBe(true);
    expect(gevonden.get('rb-ir-vier')).toBe(false);

    const vier = analyze(
      files({
        'main.py': ['A0', 'A1', 'A2', 'A3'].map((p) => `s = AnalogIR("${p}", 2500)`).join('\n'),
      }),
      roboticaConfig,
    );
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

    const eigen = analyze(files({ 'main.py': 'import rijden' }), roboticaConfig);
    expect(perId(eigen).get('py-import-eigen')).toBe(true);
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
