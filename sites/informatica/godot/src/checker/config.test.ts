import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelVoor } from '@coderius/checker/conceptLevel';
import { geldigeTrack } from '@coderius/checker/leerdoelen';
import { computeLevelSummary } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { CheckReport, ConceptMatch, ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { BLOOM } from '@coderius/shared/leerdoelen';
import { describe, expect, it } from 'vitest';
import { blokkenInVolgorde, functies } from '../godot-tests/lessen';
import leerdoelen from '../leerdoelen.json';
import { CURSUS_FUNCTIES, CURSUS_SNELHEID, CURSUS_SPRONG, godotConfig } from './config';

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

// Concepten uit de leerdoelen en die onder Ook gebruikt, samen.
const alleMatches = (report: CheckReport): ConceptMatch[] => [
  ...report.concepts,
  ...(report.extra ?? []),
];

function score(report: CheckReport, id: string): ConceptMatch {
  const match = alleMatches(report).find((c) => c.id === id);
  if (!match) throw new Error(`concept '${id}' bestaat niet in godotConfig`);
  return match;
}

function verwacht(naam: string, gebruikt: string[], ongebruikt: string[]): void {
  const report = analyze(leesFixture(naam), godotConfig);
  const perId = new Map(alleMatches(report).map((c) => [c.id, c.used]));

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
        '2d-startscherm',
        '2d-vboxcontainer',
        '2d-button',
        'gd-signal',
        'gd-volgend-level',
        'gd-globals',
        'gd-instantiate',
        // De power-up van 7.6 wacht met create_timer.
        'gd-timers',
        // Groups staan in 7.5 in het hoofdpad: de muntjes tellen.
        'gd-groups',
      ],
      [
        // Dit project is de cursus nagedaan, en dat is precies wat deze vier
        // concepten meten: het gebruikt de waardes en de animatienamen uit de
        // les (SPEED 300.0, sprong -800.0 en de -1300.0 van de power-up,
        // idle/run/jump) en heeft geen eigen
        // toetsen in project.godot. Wie niets aanpast, heeft het spel nog niet
        // van zichzelf gemaakt.
        'gd-snelheid',
        'gd-sprongkracht',
        'gd-keybindings',
        'gd-animatie',
        // Het bouwt met de nodes die de cursus aanleert, dus er is niets
        // zelf ontdekt.
        '2d-nieuwe-nodes',
        '2d-nieuwe-nodes-meer',
        // Zijn enige eigen functies, reset() en spawn_muntje(), staan zo in
        // hoofdstuk 7 en 8: overgetypt, niet zelf opgeknipt.
        'gd-modulaire-functies',
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
        // AudioStreamPlayer2D en PathFollow2D zijn twee soorten; meer
        // ontdekken vraagt er drie.
        '2d-nieuwe-nodes-meer',
        // Deze game heeft geen menu, geen tweede level en geen signals.
        'gd-signal',
        'gd-volgend-level',
        'gd-instantiate',
        '2d-label',
        '2d-button',
        '2d-startscherm',
      ],
    );
  });
});

describe('godotConfig — de leerdoelen', () => {
  it('zijn het tabblad Godot van het beoordelingsblad (Beoordeling_INF.xlsx)', () => {
    // Per rij: onderwerp, concept, en de drie kolommen van het blad, als
    // niveau 1, 3 en 4. Verandert het blad, dan veranderen dit lijstje en
    // src/leerdoelen.json samen.
    const B = 'basis';
    const G = 'gevorderd';
    const E = 'expert';
    const blad = [
      ['2D', 'TileMapLayer', B, B, B],
      ['2D', 'TextureRect', B, B, B],
      ['2D', 'CharacterBody2D', B, B, B],
      ['2D', 'AnimatedSprite2D', B, B, B],
      ['2D', 'CollisionShape2D', B, B, B],
      ['2D', 'Camera2D', B, B, B],
      ['2D', 'Area2D', B, B, B],
      ['2D', 'CanvasLayer', B, B, B],
      ['2D', 'Label', B, B, B],
      ['2D', 'Control', B, B, B],
      ['2D', 'Startscherm', B, B, B],
      ['2D', 'zelf ontdekken en toepassen van nieuwe nodes', G, B, B],
      // Niet van het blad: op niveau 3 en 4 had 2D geen gevorderd concept,
      // dus telde 2D daar niet mee voor gevorderd. De docent voegde deze rij
      // toe (november 2026); op niveau 1 hoort hij er niet bij.
      [
        '2D',
        'zelf ontdekken en toepassen van meerdere nieuwe nodes (drie soorten of meer)',
        null,
        G,
        G,
      ],
      ['GDScript', 'snelheid veranderen', B, B, B],
      ['GDScript', 'sprongkracht veranderen', B, B, B],
      ['GDScript', 'keybindings hernoemen', B, B, B],
      ['GDScript', 'animatie veranderen', B, B, B],
      ['GDScript', 'signal toepassen', B, B, B],
      ['GDScript', 'naar volgend level', B, B, B],
      ['GDScript', 'nuttig gebruik globals', G, B, B],
      ['GDScript', 'nuttig gebruik instantiate', G, G, B],
      ['GDScript', 'groups', G, G, B],
      ['GDScript', 'modulaire eigen functies', G, E, G],
      ['GDScript', 'nuttig gebruik lijsten', G, E, G],
      ['GDScript', 'nuttig gebruik dictionaries', G, E, G],
      ['GDScript', 'lezen en schrijven JSON', G, E, G],
      ['GDScript', 'nuttige gebruik loops', G, E, G],
      ['GDScript', 'tweens', G, G, G],
      ['GDScript', 'nuttig gebruik timers (bijvoorbeeld await)', G, G, B],
    ];
    const label = new Map(leerdoelen.onderwerpen.map((o) => [o.id, o.label]));
    expect(leerdoelen.niveaus).toEqual(['1', '3', '4']);
    expect(
      leerdoelen.concepten.map((c) => [label.get(c.onderwerp), c.concept, c['1'], c['3'], c['4']]),
    ).toEqual(blad);
  });

  it('geeft elk concept uit de leerdoelen een detectie, en niets meer', () => {
    // leerdoelenNaarConfig gooit al bij het laden als een rij geen detectie
    // heeft, of een detectie geen rij; deze test legt de volgorde vast.
    expect(godotConfig.concepts.map((c) => c.id)).toEqual(leerdoelen.concepten.map((c) => c.id));
  });

  it('wijst bij elk concept een les aan', () => {
    // Wat de cursus nergens behandelde, kreeg een les in hoofdstuk 10. Een
    // nieuwe rij zonder les is een concept waarop je beoordeelt maar dat de
    // leerling nergens kan leren. Dat de les bestaat, controleert de build.
    const zonderLes = leerdoelen.concepten.filter((c) => !('les' in c) || !c.les).map((c) => c.id);
    expect(zonderLes).toEqual([]);
  });

  it('maakt van de niveaus de leerroutes', () => {
    expect(godotConfig.tracks).toEqual([
      { id: '1', label: 'Niveau 1' },
      { id: '3', label: 'Niveau 3' },
      { id: '4', label: 'Niveau 4' },
    ]);
    for (const concept of godotConfig.concepts) {
      for (const route of ['1', '3', '4']) {
        expect(levelVoor(concept, route), `${concept.id} op niveau ${route}`).toMatch(
          /^(basis|gevorderd|expert)$/,
        );
      }
    }
  });

  it('kent de eigen functies die hoofdstuk 1 tot en met 9 voorzegt', () => {
    // Komt er in een les een functie bij, dan telt hij anders stil mee als
    // "modulaire eigen functies" voor wie hem overtypt.
    const inDeLessen = new Set<string>();
    for (const b of blokkenInVolgorde()) {
      if (b.hoofdstuk > 9) continue;
      for (const f of functies(b.code).keys()) if (!f.startsWith('_')) inDeLessen.add(f);
    }
    expect([...inDeLessen].sort()).toEqual([...CURSUS_FUNCTIES].sort());
  });

  it('telt een eigen functie wel, ook naast een uit de cursus', () => {
    const telt = (code: string) =>
      score(analyze(files({ 'global.gd': code }), godotConfig), 'gd-modulaire-functies').used;
    expect(telt('extends Node\n\nfunc reset() -> void:\n\tpass\n\nfunc stop():\n\tpass\n')).toBe(
      false,
    );
    expect(telt('extends Node\n\nfunc reset_alles():\n\tpass\n\nfunc stoppen():\n\tpass\n')).toBe(
      true,
    );
  });

  it('opent een bewaarde beoordeling met een oude leerroute op het niveau dat ervoor kwam', () => {
    // Zonder omzetting opende een beoordeling op "verdieping" stil op niveau 1.
    expect(geldigeTrack(godotConfig, 'start')).toBe('1');
    expect(geldigeTrack(godotConfig, 'verdieping')).toBe('3');
    const ids = (godotConfig.tracks ?? []).map((t) => t.id);
    for (const naar of Object.values(godotConfig.oudeLeerroutes ?? {})) expect(ids).toContain(naar);
  });

  it('levert per niveau een andere verdeling op, anders zijn de niveaus zinloos', () => {
    const telling = (route: string, m: string) =>
      godotConfig.concepts.filter((c) => levelVoor(c, route) === m).length;
    expect(telling('4', 'basis')).toBeGreaterThan(telling('1', 'basis'));
    // Alleen niveau 3 heeft expert, zoals het blad: modulaire functies,
    // lijsten, dictionaries, loops en JSON.
    expect(telling('3', 'expert')).toBe(5);
    expect(telling('1', 'expert') + telling('4', 'expert')).toBe(0);
  });

  it('zet wat buiten het blad valt onder Ook gebruikt, en niet meer als gesprek', () => {
    expect((godotConfig.extra ?? []).map((c) => c.id)).toEqual([
      '2d-vboxcontainer',
      '2d-button',
      'gd-toelichting',
      'project-inrichting',
    ]);
    // De gespreksvragen kiest de docent nu als denkvaardigheid in het blok
    // Cijfer; de nakijker heeft geen handmatige concepten meer.
    expect(godotConfig.concepts.filter((c) => c.detect.type === 'handmatig')).toEqual([]);
    expect(godotConfig.leerdoelen).toBeDefined();
    // Een oude beoordeling met Gesprek-vinkjes krijgt daar zijn denkvaardigheid
    // uit; elke trede moet er een uit de lijst van Bloom zijn.
    const treden = BLOOM.denkvaardigheden.map((d) => d.id);
    for (const [id, trede] of Object.entries(godotConfig.oudeVinkjes ?? {})) {
      expect(id).toMatch(/^gesprek-/);
      expect(treden).toContain(trede);
    }
    expect(Object.keys(godotConfig.oudeVinkjes ?? {})).toHaveLength(10);
  });
});

describe('godotConfig — Bloom als tweede as', () => {
  const bloomIds = BLOOM.denkvaardigheden.map((b) => b.id);

  it('geeft elk concept een denkvaardigheid uit de lijst', () => {
    for (const concept of godotConfig.concepts) {
      expect(bloomIds, `${concept.id} heeft geen geldige bloom`).toContain(concept.bloom);
    }
  });

  it('meet nadoen en manipuleren aan hetzelfde stuk code', () => {
    // De cursus-nodes zijn onthouden (nagedaan); de vier "veranderen"-
    // concepten zijn toepassen. Dat onderscheid is de reden dat Bloom geen
    // derde niveau is maar een eigen kolom.
    const bloomVan = new Map(godotConfig.concepts.map((c) => [c.id, c.bloom]));
    expect(bloomVan.get('2d-characterbody2d')).toBe('onthouden');
    expect(bloomVan.get('gd-snelheid')).toBe('toepassen');
    expect(bloomVan.get('2d-nieuwe-nodes')).toBe('creëren');
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
    const perId = new Map(alleMatches(report).map((c) => [c.id, c.used]));

    expect(perId.get('2d-label')).toBe(false);
    expect(perId.get('2d-button')).toBe(false);
    expect(perId.get('2d-control')).toBe(true);
    // Drie nodes die de cursus niet aanleert: precies wat "zelf ontdekken"
    // hoort te zien, en drie soorten, dus ook "meerdere".
    expect(perId.get('2d-nieuwe-nodes')).toBe(true);
    expect(perId.get('2d-nieuwe-nodes-meer')).toBe(true);
  });

  it('telt bij meerdere nieuwe nodes soorten, geen nodes', () => {
    const meer = (...soorten: string[]) =>
      score(
        analyze(
          files(
            Object.fromEntries(
              soorten.map((soort, i) => [
                `scene${i}.tscn`,
                `[node name="Iets${i}" type="${soort}"]`,
              ]),
            ),
          ),
          godotConfig,
        ),
        '2d-nieuwe-nodes-meer',
      );
    // Drie keer een Marker2D is één soort: één nieuwe node, geen drie.
    expect(meer('Marker2D', 'Marker2D', 'Marker2D').used).toBe(false);
    expect(meer('Marker2D', 'Path2D').used).toBe(false);
    // Drie soorten, ook verspreid over scènes, en een bekende node telt niet.
    const drie = meer('Marker2D', 'Path2D', 'Timer', 'RayCast2D');
    expect(drie.used).toBe(true);
    expect(drie.delen).toEqual(['marker2d', 'path2d', 'raycast2d']);
  });

  it('ziet een startscherm alleen in een scène met een Control bovenaan', () => {
    const startscherm = (tscn: string) =>
      score(analyze(files({ 'scene.tscn': tscn }), godotConfig), '2d-startscherm').used;
    // Het menu uit de les: de bovenste node is een Control, met een knop erin.
    expect(
      startscherm(
        '[node name="Menu" type="Control"]\n\n[node name="Start" type="Button" parent="."]',
      ),
    ).toBe(true);
    // Een pauzescherm in de HUD van een level, met een knop elders: geen
    // startscherm. Dat telde eerst wel.
    expect(
      startscherm(
        [
          '[node name="Level" type="Node2D"]',
          '[node name="Pauze" type="Control" parent="HUD"]',
          '[node name="Knop" type="Button" parent="Speler"]',
        ].join('\n\n'),
      ),
    ).toBe(false);
    // Een Control bovenaan zonder knop is ook geen startscherm.
    expect(startscherm('[node name="Menu" type="Control"]')).toBe(false);
    // Een menu op een CanvasLayer wel; een losse HUD-scène met een pauzeknop niet.
    const knop = '\n\n[node name="Start" type="Button" parent="."]';
    expect(startscherm(`[node name="Menu" type="CanvasLayer"]${knop}`)).toBe(true);
    expect(startscherm(`[node name="HUD" type="Control"]${knop}`)).toBe(false);
    expect(startscherm(`[node name="Pauzemenu" type="CanvasLayer"]${knop}`)).toBe(false);
  });

  it('ziet het startscherm zoals Godot 4.7 het opslaat, met unique_id', () => {
    // Zo schreef Godot 4.7.2 headless een Control met een Button erin weg.
    // Het patroon eiste eerst "Control"] direct na het type en vond dit
    // nooit; de voorbeeldprojecten waren met de hand geschreven, zonder id.
    const opgeslagen = [
      '[gd_scene format=3]',
      '[node name="Menu" type="Control" unique_id=810606303]\nlayout_mode = 3\nanchors_preset = 0',
      '[node name="Start" type="Button" parent="." unique_id=159633435]\nlayout_mode = 0',
    ].join('\n\n');
    const gebruikt = (tscn: string) =>
      score(analyze(files({ 'menu.tscn': tscn }), godotConfig), '2d-startscherm').used;
    expect(gebruikt(opgeslagen)).toBe(true);
    // En een Control met unique_id dieper in een level blijft geen startscherm.
    expect(
      gebruikt(
        '[node name="Level" type="Node2D" unique_id=1]\n\n[node name="Pauze" type="Control" parent="HUD" unique_id=2]\n\n[node name="Knop" type="Button" parent="Pauze" unique_id=3]',
      ),
    ).toBe(false);
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
    // Ook de nodes onder Ook gebruikt (VBoxContainer, Button).
    const nodes = [...godotConfig.concepts, ...(godotConfig.extra ?? [])].filter(
      (c) => c.subject === '2d',
    );
    expect(nodes.length).toBe(15);
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

  it('houdt de moeilijkheden van elk niveau gevuld, en elk onderwerp bezet', () => {
    // De LevelSummary-chips verbergen 0/0, dus een niveau dat leegvalt
    // verdwijnt stil uit het rapport.
    const report = analyze(files({}), godotConfig);
    for (const route of ['1', '3', '4']) {
      const samenvatting = computeLevelSummary(report, godotConfig, route);
      expect(samenvatting.basis.total, `geen basis-concepten in ${route}`).toBeGreaterThan(0);
      expect(samenvatting.gevorderd.total, `geen gevorderd-concepten in ${route}`).toBeGreaterThan(
        0,
      );
      // Expert hoort bij niveau 3 en nergens anders; valt hij weg, dan
      // verdwijnt ook de tegel en de keuze in het blok Cijfer.
      if (route === '3') {
        expect(samenvatting.expert.total, 'geen expert-concepten op niveau 3').toBeGreaterThan(0);
      } else {
        expect(samenvatting.expert.total, `expert op niveau ${route}`).toBe(0);
      }
      // Project heeft alleen een concept onder Ook gebruikt.
      for (const onderwerp of samenvatting.bySubject.filter((o) => o.subject !== 'project')) {
        expect(
          onderwerp.basis.total + onderwerp.gevorderd.total + onderwerp.expert.total,
          `${onderwerp.subject} heeft geen concepten in ${route}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe('godotConfig — wat niet van de leerling is, en wat er net naast ligt', () => {
  const gebruikt = (entries: Record<string, string>) =>
    new Map(alleMatches(analyze(files(entries), godotConfig)).map((c) => [c.id, c.used]));

  it('telt een addon uit de Asset Library niet als eigen werk', () => {
    // Een dialoog-addon tilde een nagedane cursus van basis naar expert.
    const addon = [
      'extends Node',
      'var regels: Array = []',
      'func laad():',
      '\tfor r in regels:',
      '\t\tprint(JSON.stringify(r))',
      '\tvar t = create_tween()',
    ].join('\n');
    const report = analyze(files({ 'addons/dialoog/dialoog.gd': addon }), godotConfig);
    expect(report.concepts.filter((c) => c.used).map((c) => c.id)).toEqual([]);
    expect(report.warnings.join(' ')).toContain('addons/dialoog/dialoog.gd');
  });

  it('telt niets in commentaar', () => {
    const perId = gebruikt({
      'speler.gd': [
        'extends CharacterBody2D',
        '# const SPEED = 450.0',
        '#func _on_body_entered(body):',
        '# get_tree().change_scene_to_file("res://level2.tscn")',
        'var x = 1 # TODO: Tween',
      ].join('\n'),
    });
    for (const id of ['gd-snelheid', 'gd-signal', 'gd-volgend-level', 'gd-tweens']) {
      expect(perId.get(id), id).toBe(false);
    }
  });

  it('herkent gewone schrijfwijzen van Godot 4', () => {
    const perId = gebruikt({
      'speler.gd': [
        'extends CharacterBody2D',
        'const SPEED: float = 450.0',
        '@export var jump_velocity: float = -900.0',
        'signal geraakt',
        'func _ready():',
        '\tgeraakt.connect(_raak)',
        '\t$Anim.play(&"zwemmen")',
        '\tvar t = Timer.new()',
        '\tSpel.punten += 1',
        '\tSpel.levens -= 1',
        'func _raak():',
        '\tpass',
        'func _bereken():',
        '\tget_tree().change_scene_to_packed(load("res://x.tscn"))',
      ].join('\n'),
      'project.godot': '[autoload]\n\nSpel="*res://spel.gd"\n',
    });
    for (const id of [
      'gd-snelheid',
      'gd-sprongkracht',
      'gd-signal',
      'gd-animatie',
      'gd-timers',
      'gd-globals',
      'gd-modulaire-functies',
      'gd-volgend-level',
    ]) {
      expect(perId.get(id), id).toBe(true);
    }
  });

  it('leest een script dat in een scène zit (Built-in Script)', () => {
    const perId = gebruikt({
      'level.tscn': [
        '[gd_scene format=3]',
        '[sub_resource type="GDScript" id="1"]',
        'script/source = "extends Node2D',
        '',
        'func _ready():',
        '\tvar t = create_tween()',
        '\tprint(\\"#klaar\\") # create_timer',
        '"',
        '[node name="Level" type="Node2D"]',
      ].join('\n'),
    });
    expect(perId.get('gd-tweens')).toBe(true);
    // Het commentaar in het ingebouwde script telt niet.
    expect(perId.get('gd-timers')).toBe(false);
  });

  it('telt een lijst of dictionary pas als je hem ook gebruikt', () => {
    const lijst = (code: string) => gebruikt({ 'a.gd': `extends Node\n${code}` }).get('gd-lijsten');
    const dict = (code: string) =>
      gebruikt({ 'a.gd': `extends Node\n${code}` }).get('gd-dictionaries');
    expect(lijst('var v: Array[Node] = []')).toBe(false);
    expect(lijst('var v: Array[Node] = []\nfunc f():\n\tv.append(self)')).toBe(true);
    expect(lijst('var namen = ["a", "b"]\nfunc f():\n\tfor n in namen:\n\t\tprint(n)')).toBe(true);
    expect(dict('func f(a, b):\n\tif a.has(1) and b.has(2):\n\t\tpass')).toBe(false);
    // Zoals de les: maken en er met een sleutel iets uithalen.
    expect(
      dict('const WAARDES = {"goud": 10}\nvar soort = "goud"\nfunc f():\n\tprint(WAARDES[soort])'),
    ).toBe(true);
  });

  it('telt FileAccess op een tekstbestand niet als JSON', () => {
    const json = (code: string) => gebruikt({ 'a.gd': `extends Node\n${code}` }).get('gd-json');
    expect(json('func f():\n\tvar b = FileAccess.open("user://a.txt", FileAccess.READ)')).toBe(
      false,
    );
    expect(json('func f():\n\tvar d = JSON.parse_string(tekst)')).toBe(true);
  });

  it('kent elke snelheid en sprongkracht die een les toekent', () => {
    // De power-up zet -1300.0 en zijn oplossing 600.0; die stonden niet in de
    // lijst, en wie de cursus nadeed kreeg zo "veranderen".
    const naam = /\b(SPEED|snelheid|JUMP_VELOCITY|sprongkracht)\s*(?::\s*\w+\s*)?=\s*(-?[\d.]+)/g;
    const ontbreekt = new Set<string>();
    for (const b of blokkenInVolgorde()) {
      if (b.fout || b.hoofdstuk > 9) continue;
      for (const m of b.code.matchAll(naam)) {
        const lijst = /SPEED|snelheid/.test(m[1]) ? CURSUS_SNELHEID : CURSUS_SPRONG;
        if (!lijst.includes(m[2])) ontbreekt.add(`${m[1]} = ${m[2]} (${b.plek})`);
      }
    }
    expect([...ontbreekt]).toEqual([]);
  });

  it('vindt elk GDScript-concept in de code van zijn eigen les', () => {
    // Wie de les volgt, heeft het concept. Uitgezonderd: de vier concepten die
    // juist meten dat je níet de waarde van de les gebruikt, en loops: de les
    // toont één lus (en call_group als afkorting), en nuttig gebruik vraagt er
    // twee. Die tweede schrijft de leerling zelf.
    const ANDERS = ['gd-snelheid', 'gd-sprongkracht', 'gd-keybindings', 'gd-animatie', 'gd-loops'];
    const mis: string[] = [];
    for (const c of leerdoelen.concepten) {
      if (!c.id.startsWith('gd-') || ANDERS.includes(c.id)) continue;
      const lessen: string[] = Array.isArray(c.les) ? c.les : [c.les];
      const blokken = blokkenInVolgorde().filter(
        (b) =>
          lessen.includes(b.plek.replace(/^\d+-/, '').replace(/\.mdx?:\d+$/, '')) &&
          !b.fout &&
          !b.opdracht,
      );
      const project = Object.fromEntries(blokken.map((b, i) => [`les${i}.gd`, b.code]));
      if (!gebruikt(project).get(c.id)) mis.push(`${c.id} (${c.les}, ${blokken.length} blokken)`);
    }
    expect(mis).toEqual([]);
  });
});
