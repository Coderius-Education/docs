import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeLevelSummary } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { roboticaConfig } from './config';

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
  const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

  for (const id of [...gebruikt, ...ongebruikt]) {
    expect(perId.has(id), `concept '${id}' bestaat niet in roboticaConfig`).toBe(true);
  }
  expect(gebruikt.filter((id) => !perId.get(id))).toEqual([]);
  expect(ongebruikt.filter((id) => perId.get(id))).toEqual([]);
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
    const perId = new Map(drie.concepts.map((c) => [c.id, c.used]));
    expect(perId.get('rb-ir-een')).toBe(true);
    expect(perId.get('rb-ir-twee')).toBe(true);
    expect(perId.get('rb-ir-vier')).toBe(false);

    const vier = analyze(
      files({
        'main.py': ['A0', 'A1', 'A2', 'A3'].map((p) => `s = AnalogIR("${p}", 2500)`).join('\n'),
      }),
      roboticaConfig,
    );
    expect(new Map(vier.concepts.map((c) => [c.id, c.used])).get('rb-ir-vier')).toBe(true);
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
          'print(read_distance(19, 18))',
        ].join('\n'),
      }),
      roboticaConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));
    expect(perId.get('rb-servo')).toBe(true);
    expect(perId.get('rb-afstand')).toBe(true);
  });

  it('laat handmatige concepten altijd op niet-toegepast staan', () => {
    // Ook als het script de woorden letterlijk bevat: dit stelt de docent
    // vast, niet de regex.
    const report = analyze(
      files({ 'main.py': '# frame gebouwd, batterijen erin, rijdt om obstakels heen' }),
      roboticaConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));
    for (const id of ['rb-frame', 'rb-robot-compleet', 'rb-batterijen', 'rb-obstakel-omheen']) {
      expect(perId.get(id), id).toBe(false);
    }
  });

  it('rekent `while True:` niet als boolean, maar een vergelijking wel', () => {
    // De lus staat in elk script van de cursus; hem laten meetellen zou dit
    // concept tot een gratis vinkje maken.
    const lus = analyze(
      files({ 'main.py': 'while True:\n    lampje.on()\n    sleep(0.5)' }),
      roboticaConfig,
    );
    expect(new Map(lus.concepts.map((c) => [c.id, c.used])).get('py-boolean')).toBe(false);

    for (const regel of ['klaar = True', 'if kleur == "wit":', 'if afstand >= 100:']) {
      const report = analyze(files({ 'main.py': `while True:\n    ${regel}` }), roboticaConfig);
      const perId = new Map(report.concepts.map((c) => [c.id, c.used]));
      expect(perId.get('py-boolean'), regel).toBe(true);
    }
  });

  it('eist de exacte bestandsnaam main.py', () => {
    // Het bord voert bij het aanzetten alleen main.py uit; robot.py doet niets.
    const goed = analyze(files({ 'main.py': 'x = 1' }), roboticaConfig);
    const fout = analyze(files({ 'robot.py': 'x = 1' }), roboticaConfig);
    expect(new Map(goed.concepts.map((c) => [c.id, c.used])).get('rb-main-py')).toBe(true);
    expect(new Map(fout.concepts.map((c) => [c.id, c.used])).get('rb-main-py')).toBe(false);
  });

  it('ziet een eigen module los van de bibliotheek van het bord', () => {
    const bord = analyze(
      files({ 'main.py': 'from machine import Pin\nfrom time import sleep' }),
      roboticaConfig,
    );
    expect(new Map(bord.concepts.map((c) => [c.id, c.used])).get('py-import-eigen')).toBe(false);

    const eigen = analyze(files({ 'main.py': 'import rijden' }), roboticaConfig);
    expect(new Map(eigen.concepts.map((c) => [c.id, c.used])).get('py-import-eigen')).toBe(true);
  });

  it('houdt een dictionary uit de buurt van een set', () => {
    const dict = analyze(files({ 'main.py': 'kleuren = {"rood": 1}' }), roboticaConfig);
    const dictIds = new Map(dict.concepts.map((c) => [c.id, c.used]));
    expect(dictIds.get('py-dict')).toBe(true);
    expect(dictIds.get('py-tuple-set')).toBe(false);

    const set = analyze(files({ 'main.py': 'namen = {"jan", "sam"}' }), roboticaConfig);
    const setIds = new Map(set.concepts.map((c) => [c.id, c.used]));
    expect(setIds.get('py-tuple-set')).toBe(true);
    expect(setIds.get('py-dict')).toBe(false);
  });

  it('de niveaus verschuiven tussen start en verdieping', () => {
    // Vijf concepten verschillen per route, en niet allemaal dezelfde kant op:
    // vier robotica-onderdelen zakken van gevorderd naar basis, en `imports`
    // gaat juist omhoog. Netto verschuiven er dus drie naar basis. Zonder
    // tracks zou dezelfde robot in beide routes hetzelfde scoren.
    const report = analyze(leesFixture('compleet'), roboticaConfig);
    const start = computeLevelSummary(report, roboticaConfig, 'start');
    const verdieping = computeLevelSummary(report, roboticaConfig, 'verdieping');

    expect(verdieping.basis.total).toBe(start.basis.total + 3);
    expect(verdieping.gevorderd.total).toBe(start.gevorderd.total - 3);
    // Het totaal blijft gelijk: er verdwijnt geen concept uit een route.
    expect(verdieping.basis.total + verdieping.gevorderd.total).toBe(
      start.basis.total + start.gevorderd.total,
    );
  });

  it('precies deze concepten hebben een niveau per route', () => {
    // Een verschuiving hoort een bewuste keuze te zijn, geen bijvangst.
    const perRoute = roboticaConfig.concepts
      .filter((c) => typeof c.level !== 'string')
      .map((c) => c.id)
      .sort();

    expect(perRoute).toEqual([
      'py-import',
      'rb-afstand',
      'rb-bal-detecteren',
      'rb-ir-vier',
      'rb-obstakel-stoppen',
    ]);
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
