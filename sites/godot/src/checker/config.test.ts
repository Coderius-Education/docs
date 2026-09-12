import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelVoor } from '@coderius/checker/conceptLevel';
import { computeLevelSummary } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { CheckReport, ConceptMatch, ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { godotConfig } from './config';
import niveaus from './niveaus.json';

function files(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: godotConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

// Leest een voorbeeldproject van schijf, net als de helper in fullstack.
// Zelfde afspraak: assereer op benoemde concept-id's en nooit op totalen,
// zodat een nieuwe les deze tests alleen breekt als hij precies deze
// concepten raakt.
function leesFixture(naam: string): ProjectFiles {
  const wortel = join(FIXTURES, naam);
  const result: ProjectFiles = {};

  const loop = (map: string): void => {
    for (const item of readdirSync(map)) {
      const volledig = join(map, item);
      if (statSync(volledig).isDirectory()) {
        loop(volledig);
        continue;
      }
      const path = relative(wortel, volledig).split('\\').join('/');
      const content = readFileSync(volledig, 'utf8');
      result[path] = {
        path,
        kind: godotConfig.classify(path),
        content,
        sizeBytes: content.length,
        tooLarge: false,
      };
    }
  };

  loop(wortel);
  return result;
}

function score(report: CheckReport, id: string): ConceptMatch {
  const match = report.concepts.find((c) => c.id === id);
  if (!match) throw new Error(`concept '${id}' bestaat niet in godotConfig`);
  return match;
}

function verwacht(naam: string, gebruikt: string[], ongebruikt: string[]): void {
  const report = analyze(leesFixture(naam), godotConfig);
  const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

  for (const id of [...gebruikt, ...ongebruikt]) {
    expect(perId.has(id), `concept '${id}' bestaat niet in godotConfig`).toBe(true);
  }
  expect(gebruikt.filter((id) => !perId.get(id))).toEqual([]);
  expect(ongebruikt.filter((id) => perId.get(id))).toEqual([]);
}

describe('godotConfig — voorbeeldprojecten scoren', () => {
  it('een kaal project levert nog niets op', () => {
    // De concepten uit de tabel gaan over wat je met Godot dóét. Een project
    // met alleen een leeg script en een lege scène doet nog niets; dat het
    // hier op nul staat is het bewijs dat niets vals-positief aanslaat.
    const rapport = analyze(leesFixture('minimaal'), godotConfig);
    expect(rapport.concepts.filter((c) => c.used).map((c) => c.id)).toEqual([]);
  });

  it('het cursus-eindproject haalt de nodes en de code van de cursus', () => {
    verwacht(
      'compleet',
      [
        '2d-tilemaplayer',
        '2d-texturerect',
        '2d-characterbody2d',
        '2d-animatedsprite2d',
        '2d-collisionshape2d',
        '2d-camera2d',
        '2d-area2d',
        '2d-canvaslayer',
        '2d-label',
        '2d-control',
        '2d-vboxcontainer',
        '2d-button',
        'gd-signal',
        'gd-volgend-level',
        'gd-globals',
        'gd-instantiate',
        'gd-modulaire-functies',
        'gd-timers',
      ],
      [
        // Dit project is de cursus nagedaan, en dat is precies wat deze vier
        // concepten meten: het gebruikt de waardes en de animatienamen uit de
        // les (SPEED 300.0, sprong -800.0, idle/run/jump) en heeft geen eigen
        // toetsen in project.godot. Wie niets aanpast, heeft het spel nog niet
        // van zichzelf gemaakt.
        'gd-snelheid',
        'gd-sprongkracht',
        'gd-keybindings',
        'gd-animatie',
        // Het bouwt met de nodes die de cursus aanleert, dus er is niets
        // zelf ontdekt.
        '2d-nieuwe-nodes',
        'gd-groups',
        'gd-lijsten',
        'gd-dictionaries',
        'gd-json',
        'gd-loops',
        'gd-tweens',
        // Geen comment legt uit waaróm iets zo is, en elke scène staat in de
        // hoofdmap: overgetypt uit de les, niet zelf ingericht.
        'gd-toelichting',
        'project-inrichting',
      ],
    );
  });

  it('een eigen game telt de dingen die de cursus niet voorzegt', () => {
    verwacht(
      'eigen',
      [
        // Eigen waardes in plaats van die van de tutorial: 450.0 en -1100.0.
        'gd-snelheid',
        'gd-sprongkracht',
        // Eigen toetsen ("duiken", "boost") in een [input]-sectie.
        'gd-keybindings',
        // Eigen animaties ("zwemmen", "drijven"); het "run" dat er ook in
        // staat komt uit de cursus en telt dus niet.
        'gd-animatie',
        // AudioStreamPlayer2D en PathFollow2D staan in geen enkele les.
        '2d-nieuwe-nodes',
        'gd-groups',
        'gd-modulaire-functies',
        'gd-dictionaries',
        'gd-json',
        'gd-loops',
        'gd-tweens',
        'gd-timers',
        'gd-globals',
        // Drie comments met een reden erin (omdat, want, zodat), en de scène
        // staat in een eigen scenes-map.
        'gd-toelichting',
        'project-inrichting',
      ],
      [
        // `var levens = ["hart", "hart", "hart"]` staat er wel, maar wordt
        // nergens gebruikt. Eén voorkomen haalt de drempel niet, en dat is de
        // bedoeling: de tabel vraagt om nuttig gebruik, niet om aanwezigheid.
        'gd-lijsten',
        // Deze game heeft geen menu, geen tweede level en geen signals.
        'gd-signal',
        'gd-volgend-level',
        'gd-instantiate',
        '2d-label',
        '2d-button',
      ],
    );
  });
});

describe('godotConfig — de tabel uit niveaus.json', () => {
  it('geeft elk concept een detectie en elk niveau een geldige waarde', () => {
    // config.ts gooit al bij het laden als een concept geen detectie heeft;
    // deze test legt vast dat de twee bestanden even lang zijn, zodat een
    // rij die uit de tabel verdwijnt niet stil een detectie laat staan.
    expect(godotConfig.concepts.length).toBe(niveaus.concepten.length);
    expect(godotConfig.concepts.map((c) => c.id)).toEqual(niveaus.concepten.map((c) => c.id));
  });

  it('kent elk concept aan een bestaand onderwerp toe', () => {
    const onderwerpen = new Set(godotConfig.subjects.map((s) => s.id));
    expect(
      godotConfig.concepts.filter((c) => !onderwerpen.has(c.subject)).map((c) => c.id),
    ).toEqual([]);
  });

  it('geeft elk concept een niveau per leerroute', () => {
    const routes = (godotConfig.tracks ?? []).map((t) => t.id);
    expect(routes).toEqual(['start', 'verdieping']);
    for (const concept of godotConfig.concepts) {
      expect(
        typeof concept.level,
        `${concept.id} heeft één niveau in plaats van één per route`,
      ).toBe('object');
      for (const route of routes) {
        expect(
          levelVoor(concept, route),
          `${concept.id} heeft geen niveau voor route '${route}'`,
        ).toMatch(/^(basis|gevorderd)$/);
      }
    }
  });

  it('levert per route een andere verdeling op, anders zijn twee routes zinloos', () => {
    const telling = (route: string) =>
      godotConfig.concepts.filter((c) => levelVoor(c, route) === 'basis').length;
    expect(telling('verdieping')).toBeGreaterThan(telling('start'));
  });
});

describe('godotConfig — Bloom als tweede as', () => {
  const bloomIds = niveaus.bloom.map((b) => b.id);

  it('geeft elk concept een denkvaardigheid uit de lijst', () => {
    // config.ts gooit al bij het laden op een onbekende waarde; hier staat
    // vast dat de waarde ook echt meekomt op het concept, want daar hangt de
    // Bloom-ladder straks aan.
    expect(bloomIds).toEqual([
      'onthouden',
      'begrijpen',
      'toepassen',
      'analyseren',
      'evalueren',
      'creëren',
    ]);
    for (const concept of godotConfig.concepts) {
      expect(bloomIds, `${concept.id} heeft geen geldige bloom`).toContain(concept.bloom);
    }
  });

  it('heeft op elke trede van de ladder minstens één concept', () => {
    for (const bloom of bloomIds) {
      expect(
        godotConfig.concepts.filter((c) => c.bloom === bloom).length,
        `geen enkel concept op '${bloom}'`,
      ).toBeGreaterThan(0);
    }
  });

  it('meet nadoen en manipuleren aan hetzelfde stuk code', () => {
    // De cursus-nodes zijn onthouden (nagedaan); de vier "veranderen"-
    // concepten zijn toepassen. Dat onderscheid is de reden dat Bloom geen
    // derde niveau is maar een eigen kolom.
    const bloomVan = new Map(godotConfig.concepts.map((c) => [c.id, c.bloom]));
    expect(bloomVan.get('2d-characterbody2d')).toBe('onthouden');
    expect(bloomVan.get('gd-snelheid')).toBe('toepassen');
    expect(bloomVan.get('gd-toelichting')).toBe('begrijpen');
    expect(bloomVan.get('project-inrichting')).toBe('analyseren');
    expect(bloomVan.get('2d-nieuwe-nodes')).toBe('creëren');
  });

  it('zet alles wat alleen in het gesprek zichtbaar is op handmatig, gegroepeerd per trede', () => {
    const labelVan = new Map(niveaus.bloom.map((b) => [b.id, b.label]));
    const gesprek = godotConfig.concepts.filter((c) => c.subject === 'gesprek');
    expect(gesprek.length).toBeGreaterThan(0);
    for (const c of gesprek) {
      expect(c.detect.type, `${c.id} is een gespreksvraag en hoort handmatig te zijn`).toBe(
        'handmatig',
      );
      // De groepskop is de trede, zodat de docent de ladder ziet zonder dat
      // het rapport Bloom al apart toont.
      expect(c.group, `${c.id} staat onder een andere kop dan zijn trede`).toBe(
        labelVan.get(c.bloom ?? ''),
      );
    }
    // En andersom: buiten het gesprek stelt niets de docent handmatig vast;
    // alles daar komt uit de bestanden.
    for (const c of godotConfig.concepts.filter((c) => c.subject !== 'gesprek')) {
      expect(c.detect.type, `${c.id} hoort uit de bestanden te komen`).not.toBe('handmatig');
    }
  });

  it('laat de gespreksvragen open, ook bij het meest complete project', () => {
    const report = analyze(leesFixture('eigen'), godotConfig);
    const gesprek = new Set(
      godotConfig.concepts.filter((c) => c.subject === 'gesprek').map((c) => c.id),
    );
    const open = report.concepts.filter((m) => gesprek.has(m.id));
    expect(open.length).toBe(gesprek.size);
    expect(open.every((m) => !m.used)).toBe(true);
  });
});

describe('godotConfig — patronen die er net naast zitten', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(godotConfig)).toEqual([]);
  });

  it('telt de waardes uit de cursus niet als eigen waardes', () => {
    const report = analyze(
      files({
        'speler.gd': [
          'const SPEED = 300.0',
          'const JUMP_VELOCITY = -800.0',
          'var sprongkracht = -400.0',
          '$AnimatedSprite2D.play("idle")',
          '$AnimatedSprite2D.play("run")',
        ].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('gd-snelheid')).toBe(false);
    expect(perId.get('gd-sprongkracht')).toBe(false);
    expect(perId.get('gd-animatie')).toBe(false);
  });

  it('telt één cijfer verschil wél als eigen waarde', () => {
    // De grens moet op de waarde liggen en niet op "er staat een getal".
    const report = analyze(
      files({
        'speler.gd': [
          'const SPEED = 300.5',
          'var sprongkracht = -799.0',
          '$AnimatedSprite2D.play("zweven")',
        ].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('gd-snelheid')).toBe(true);
    expect(perId.get('gd-sprongkracht')).toBe(true);
    expect(perId.get('gd-animatie')).toBe(true);
  });

  it('telt alleen comments met een reden erin, en pas vanaf twee', () => {
    const toelichting = (gd: string) =>
      score(analyze(files({ 'speler.gd': gd }), godotConfig), 'gd-toelichting');

    // Benoemen is geen toelichten: dit zegt wát, niet waarom.
    expect(toelichting('# beweging\nvelocity.x = 300 # snelheid\n# sprong').used).toBe(false);
    // Eén reden kan uit de les komen; de tweede is van de leerling zelf.
    const een = toelichting('# omdat de speler anders door de vloer zakt\nmove_and_slide()');
    expect(een.count).toBe(1);
    expect(een.used).toBe(false);
    // Een comment achter code telt net zo goed als een regel erboven, en een
    // hoofdletter maakt niet uit.
    const twee = toelichting(
      ['velocity.y = 0  # Want anders blijft hij vallen', '# zodat de camera meebeweegt'].join(
        '\n',
      ),
    );
    expect(twee.used).toBe(true);
    // Een reden in een string is tekst voor de speler, geen toelichting.
    expect(toelichting('print("Je verliest, want je viel")\nprint("omdat")').used).toBe(false);
  });

  it('ziet een scènes-map als eigen inrichting, een scripts-map niet', () => {
    const inrichting = (paden: string[]) =>
      score(
        analyze(files(Object.fromEntries(paden.map((p) => [p, '']))), godotConfig),
        'project-inrichting',
      );

    // Precies wat de cursus voorschrijft: scripts en assets in een map, de
    // scènes in de hoofdmap.
    expect(
      inrichting(['project.godot', 'wereld.tscn', 'scripts/speler.gd', 'assets/idle.png']).used,
    ).toBe(false);
    expect(inrichting(['project.godot', 'scenes/wereld.tscn', 'scripts/speler.gd']).used).toBe(
      true,
    );
    // Ook een andere mapnaam telt; het gaat om het ordenen, niet om de naam.
    expect(inrichting(['project.godot', 'levels/level2.TSCN']).used).toBe(true);
  });

  it('telt node-types in GDScript-tekst niet mee als scene-node', () => {
    // De 2d-concepten lezen alleen .tscn: "extends CharacterBody2D" in een
    // script is geen bewijs dat de scène die node echt bevat.
    const report = analyze(
      files({ 'speler.gd': 'extends CharacterBody2D\nvar timer = Timer.new()' }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('2d-characterbody2d')).toBe(false);
  });

  it('ziet RichTextLabel en TextureButton niet aan voor Label en Button', () => {
    const report = analyze(
      files({
        'menu.tscn': [
          '[gd_scene format=3]',
          '',
          '[node name="Menu" type="Control"]',
          '',
          '[node name="Uitleg" type="RichTextLabel" parent="."]',
          '',
          '[node name="Zwevend" type="Label3D" parent="."]',
          '',
          '[node name="Plaatje" type="TextureButton" parent="."]',
        ].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('2d-label')).toBe(false);
    expect(perId.get('2d-button')).toBe(false);
    expect(perId.get('2d-control')).toBe(true);
    // Drie nodes die de cursus niet aanleert: precies wat "zelf ontdekken"
    // hoort te zien.
    expect(perId.get('2d-nieuwe-nodes')).toBe(true);
  });

  it('negeert ext_resource-regels; alleen [node ...]-regels tellen', () => {
    const report = analyze(
      files({
        'level.tscn': [
          '[gd_scene load_steps=2 format=3]',
          '',
          '[ext_resource type="Texture2D" path="res://assets/idle.png" id="1"]',
          '[ext_resource type="PackedScene" path="res://timer_hulp.tscn" id="2"]',
          '',
          '[node name="Level" type="Node2D"]',
        ].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    for (const id of ['2d-characterbody2d', '2d-animatedsprite2d', '2d-label', 'gd-timers']) {
      expect(perId.get(id), `${id} hoort niet te matchen op ext_resource`).toBe(false);
    }
    // Texture2D en PackedScene zijn geen nodes, dus ook niet "zelf ontdekt".
    expect(perId.get('2d-nieuwe-nodes')).toBe(false);
  });

  it('elk 2D-concept leest alleen .tscn en eist een [node-regel', () => {
    // Geen realistische .tscn-regel buiten [node ...] bevat type="Button",
    // dus een weggevallen "\[node "-prefix is met fixtures alleen niet te
    // vangen. Daarom deze structurele bewaking op het patroon zelf.
    const nodes = godotConfig.concepts.filter((c) => c.subject === '2d');
    expect(nodes.length).toBe(13);
    for (const c of nodes) {
      expect(c.detect.type, `${c.id} hoort regex-detectie te hebben`).toBe('regex');
      if (c.detect.type === 'regex') {
        expect(c.detect.in, `${c.id} hoort alleen tscn te lezen`).toEqual(['tscn']);
        expect(
          c.detect.pattern.source.startsWith('\\[node '),
          `${c.id} hoort op een [node-regel te matchen`,
        ).toBe(true);
      }
    }
  });

  it('leest project.godot als tekst, anders blijven keybindings onzichtbaar', () => {
    const project = leesFixture('eigen');
    expect(project['project.godot'].kind).toBe('godot');
    expect(godotConfig.textKinds).toContain('godot');
    expect(godotConfig.classify('level.TSCN')).toBe('tscn');
  });

  it('houdt beide niveaus gevuld in elke route, en elk onderwerp bezet', () => {
    // De LevelSummary-chips verbergen 0/0, dus een niveau dat leegvalt
    // verdwijnt stil uit het rapport. Per onderwerp eisen we dat niet: in
    // Verdieping staat volgens de tabel élk 2D-concept op basis, en dat is
    // de bedoeling — daar is niets meer gevorderd aan.
    const report = analyze(files({}), godotConfig);
    for (const route of ['start', 'verdieping']) {
      const samenvatting = computeLevelSummary(report, godotConfig, route);
      expect(samenvatting.basis.total, `geen basis-concepten in ${route}`).toBeGreaterThan(0);
      expect(samenvatting.gevorderd.total, `geen gevorderd-concepten in ${route}`).toBeGreaterThan(
        0,
      );
      for (const onderwerp of samenvatting.bySubject) {
        expect(
          onderwerp.basis.total + onderwerp.gevorderd.total,
          `${onderwerp.subject} heeft geen concepten in ${route}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
