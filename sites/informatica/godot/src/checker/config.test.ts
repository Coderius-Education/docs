import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelVoor } from '@coderius/checker/conceptLevel';
import { geldigeTrack } from '@coderius/checker/leerdoelen';
import { computeLevelSummary, voorstelOnderdelen } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { CheckReport, ConceptMatch, ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { BLOOM, moeilijkheidVoorstel } from '@coderius/shared/leerdoelen';
import { describe, expect, it } from 'vitest';
import { blokkenInVolgorde, functies } from '../godot-tests/lessen';
import leerdoelen from '../leerdoelen.json';
import {
  CURSUS_FUNCTIES,
  CURSUS_SNELHEID,
  CURSUS_SPRONG,
  godotConfig,
  ingebouwdeScripts,
} from './config';

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
        // Les 6.2 wisselt de animatie in code (idle, run, jump).
        'gd-animatie',
      ],
      [
        // Dit project is de cursus nagedaan, en dat is precies wat deze drie
        // concepten meten: het gebruikt de waardes uit de les (SPEED 300.0,
        // sprong -800.0 en de -1300.0 van de power-up) en heeft geen eigen
        // toetsen in project.godot. Wie niets aanpast, heeft het spel nog niet
        // van zichzelf gemaakt. Animatie veranderen telt wel: dat is een
        // animatie wisselen in code, en dat leert les 6.2.
        'gd-snelheid',
        'gd-sprongkracht',
        'gd-keybindings',
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
        // Het wisselt animaties in code ("zwemmen", "drijven", "run").
        'gd-animatie',
        // AudioStreamPlayer2D en PathFollow2D staan in geen enkele les.
        '2d-nieuwe-nodes',
        'gd-groups',
        'gd-modulaire-functies',
        'gd-dictionaries',
        'gd-json',
        'gd-loops',
        'gd-tweens',
        // De timeout van de Klok hangt aan tel_op: een timer die iets doet, en
        // een signal uit de editor.
        'gd-timers',
        'gd-signal',
        'gd-globals',
        // Drie comments met een reden erin (omdat, want, zodat), en de scène
        // staat in een eigen scenes-map.
        'gd-toelichting',
        'project-inrichting',
      ],
      [
        // `var levens = ["hart", "hart", "hart"]` staat er wel, maar wordt
        // nergens gebruikt. Eén voorkomen haalt de drempel niet, en dat is de
        // bedoeling: een lijst telt als hij gebruikt wordt, niet als hij er staat.
        'gd-lijsten',
        // AudioStreamPlayer2D en PathFollow2D: de volger hoort bij een pad, dus
        // dat is hooguit één soort, en meer ontdekken vraagt er drie.
        '2d-nieuwe-nodes-meer',
        // Deze game heeft geen menu en geen tweede level.
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
      // De nodes van het menu zijn op niveau 1 gevorderd (november 2026).
      ['2D', 'Control', G, B, B],
      ['2D', 'Startscherm', G, B, B],
      // De rijen over nieuwe nodes noemen het aantal dat de nakijker telt.
      ['2D', 'zelf ontdekken en toepassen van 1 nieuwe node', G, B, B],
      // Niet van het blad: op niveau 3 en 4 had 2D geen gevorderd concept,
      // dus telde 2D daar niet mee voor gevorderd. De docent voegde deze rij
      // toe (november 2026); op niveau 1 hoort hij er niet bij.
      ['2D', 'zelf ontdekken en toepassen van 3 nieuwe nodes (drie soorten of meer)', null, G, G],
      ['GDScript', 'snelheid veranderen', B, B, B],
      ['GDScript', 'sprongkracht veranderen', B, B, B],
      ['GDScript', 'keybindings hernoemen', B, B, B],
      ['GDScript', 'animatie veranderen', B, B, B],
      ['GDScript', 'signal toepassen', B, B, B],
      // Niveau 1 sinds november 2026: naar volgend level gevorderd, globals
      // basis, en lijsten, dictionaries, JSON, loops en tweens expert. De
      // woorden "nuttig gebruik" zijn uit de namen: wat de nakijker als
      // gebruik telt, is niet veranderd.
      ['GDScript', 'naar volgend level', G, B, B],
      ['GDScript', 'globals', B, B, B],
      ['GDScript', 'instantiate', G, G, B],
      ['GDScript', 'groups', G, G, B],
      ['GDScript', 'modulaire eigen functies', G, E, G],
      ['GDScript', 'lijsten', E, E, G],
      ['GDScript', 'dictionaries', E, E, G],
      ['GDScript', 'lezen en schrijven JSON', E, E, G],
      ['GDScript', 'loops', E, E, G],
      ['GDScript', 'tweens', E, G, G],
      ['GDScript', 'timers (bijvoorbeeld await)', G, G, B],
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
    // Niveau 3 heeft expert, zoals het blad: modulaire functies, lijsten,
    // dictionaries, loops en JSON. Niveau 1 sinds november 2026 ook: lijsten,
    // dictionaries, JSON, loops en tweens. Niveau 4 niet.
    expect(telling('3', 'expert')).toBe(5);
    expect(telling('1', 'expert')).toBe(5);
    expect(telling('4', 'expert')).toBe(0);
  });

  it('stelt op niveau 1 gevorderd voor bij de nagedane cursus, en expert bij een eigen game', () => {
    // Wat de indeling van november 2026 voor een leerling betekent. De cursus
    // nagedaan heeft het menu (Control en Startscherm zijn op niveau 1
    // gevorderd) en de vlag naar level 2: eerst was dat basis, omdat 2D
    // alleen met een zelf gevonden node op gevorderd kwam. Een eigen game met
    // een dictionary, JSON, loops en tweens is expert; eerst gevorderd. Op
    // niveau 3 en 4 is er niets veranderd.
    const voorstel = (fixture: string, niveau: string) =>
      moeilijkheidVoorstel(
        voorstelOnderdelen(analyze(leesFixture(fixture), godotConfig), godotConfig, niveau),
      ).moeilijkheid;
    expect(voorstel('minimaal', '1')).toBe('niet-aan-basis');
    expect(voorstel('compleet', '1')).toBe('gevorderd');
    expect(voorstel('eigen', '1')).toBe('expert');
    for (const niveau of ['3', '4']) {
      expect(voorstel('compleet', niveau), niveau).toBe('basis');
      expect(voorstel('eigen', niveau), niveau).toBe('basis');
    }
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
    // De cursus-nodes zijn onthouden (nagedaan); de "veranderen"-
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
        ].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('gd-snelheid')).toBe(false);
    expect(perId.get('gd-sprongkracht')).toBe(false);
  });

  it('telt één cijfer verschil wél als eigen waarde', () => {
    // De grens moet op de waarde liggen en niet op "er staat een getal".
    const report = analyze(
      files({
        'speler.gd': ['const SPEED = 300.5', 'var sprongkracht = -799.0'].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('gd-snelheid')).toBe(true);
    expect(perId.get('gd-sprongkracht')).toBe(true);
  });

  // Issue 227: "play animations are not detected from within gdscript".
  // Animatie veranderen is: in code een animatie wisselen, ook met de namen
  // uit de les. Eerst telde alleen een eigen naam, en die alleen letterlijk in
  // `play("lopen")`; een les nagedaan, een variabele, een if-expressie,
  // `animation =` of `play_backwards` zag de nakijker niet.
  const animatie = (...regels: string[]) => {
    const report = analyze(
      files({ 'speler.gd': ['extends CharacterBody2D', ...regels].join('\n') }),
      godotConfig,
    );
    return report.concepts.find((c) => c.id === 'gd-animatie')?.used;
  };

  it('herkent een animatie die in code wisselt, op elke manier', () => {
    const gevallen: Record<string, string[]> = {
      // Zoals les 6.2, met de namen uit de les.
      'zoals de les': ['func _ready():', "\t$AnimatedSprite2D.play('run')"],
      'spiegelen zoals de les': ['func _ready():', '\t$AnimatedSprite2D.flip_h = true'],
      'if-expressie met de namen uit de les': [
        'func _ready():',
        '\t$AnimatedSprite2D.play("run" if velocity.x else "idle")',
      ],
      'variabele met een naam uit de les': [
        'func _ready():',
        '\tvar naam = "run"',
        '\t$AnimatedSprite2D.play(naam)',
      ],
      letterlijk: ['func _ready():', '\t$AnimatedSprite2D.play("lopen")'],
      'via @onready': [
        '@onready var anim = $AnimatedSprite2D',
        'func _ready():',
        "\tanim.play('lopen')",
      ],
      'naam in een variabele': [
        'func _ready():',
        '\tvar naam = "idle"',
        '\tif velocity.x:',
        '\t\tnaam = "lopen"',
        '\t$AnimatedSprite2D.play(naam)',
      ],
      'variabele na de aanroep': [
        'func _ready():',
        '\t$AnimatedSprite2D.play(naam)',
        'func kies():',
        '\tnaam = "lopen"',
      ],
      'getypte StringName': [
        'var naam: StringName = &"lopen"',
        'func _ready():',
        '\t$AnimatedSprite2D.play(naam)',
      ],
      'if-expressie': [
        'func _ready():',
        '\t$AnimatedSprite2D.play("idle" if velocity.x == 0 else "lopen")',
      ],
      'animation =': [
        'func _ready():',
        '\t$AnimatedSprite2D.animation = "lopen"',
        '\t$AnimatedSprite2D.play()',
      ],
      play_backwards: ['func _ready():', '\t$AnimatedSprite2D.play_backwards("lopen")'],
      AnimationPlayer: ['func _ready():', '\t$AnimationPlayer.play("aanval")'],
      // De vorm die een leerling met is_on_floor() het vaakst schrijft.
      'if-expressie met een aanroep': [
        'func _physics_process(delta):',
        '\t$AnimatedSprite2D.play("idle" if is_on_floor() else "vallen")',
      ],
      StringName: ['func _ready():', '\t$AnimatedSprite2D.play(StringName("lopen"))'],
      'animation = variabele': [
        'var naam = "lopen"',
        'func _ready():',
        '\t$AnimatedSprite2D.animation = naam',
      ],
      current_animation: ['func _ready():', '\t$AnimationPlayer.current_animation = "aanval"'],
      'AnimationTree travel': [
        '@onready var staat = $AnimationTree.get("parameters/playback")',
        'func _ready():',
        '\tstaat.travel("aanval")',
      ],
      'eigen functie': [
        'func _ready():',
        '\tspeel("lopen")',
        'func speel(naam: String):',
        '\t$AnimatedSprite2D.play(naam)',
      ],
      'eigen functie, aanroep erna': [
        'func speel(naam):',
        '\t$AnimatedSprite2D.play(naam)',
        'func _ready():',
        '\tspeel("lopen")',
      ],
      dictionary: [
        'const ANIMATIES = {"links": "lopen_links", "rechts": "lopen_rechts"}',
        'func _ready():',
        '\t$AnimatedSprite2D.play(ANIMATIES[richting])',
      ],
      lijst: [
        'func _ready():',
        '\t$AnimatedSprite2D.play(namen[0])',
        'var namen: Array[String] = ["zwemmen", "duiken"]',
      ],
    };
    for (const [naam, regels] of Object.entries(gevallen))
      expect(animatie(...regels), naam).toBe(true);
  });

  it('telt code die geen animatie wisselt niet', () => {
    const gevallen: Record<string, string[]> = {
      // Een geluid heeft geen naam: play() of play(vanaf_seconde).
      geluid: ['func _ready():', '\t$Geluid.play()', '\t$Geluid.play(1.5)'],
      'animatie opvragen': [
        'func _ready():',
        '\tif $AnimatedSprite2D.animation == "lopen":',
        '\t\tpass',
      ],
      'spiegeling opvragen': [
        'func _ready():',
        '\tif $AnimatedSprite2D.flip_h == true:',
        '\t\tpass',
      ],
      'tekst die niet naar play gaat': [
        'var tekst = "Game over"',
        'func _ready():',
        '\tprint(tekst)',
      ],
      'een functie die op play eindigt': ['func _ready():', '\tdisplay("hallo")'],
      'eigen functie zonder animatie': [
        'func _ready():',
        '\tzeg("hallo")',
        'func zeg(tekst):',
        '\tprint(tekst)',
      ],
      'tween.play()': ['func _ready():', '\tvar t = create_tween()', '\tt.play()'],
    };
    for (const [naam, regels] of Object.entries(gevallen))
      expect(animatie(...regels), naam).toBe(false);
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
    expect(drie.delen).toEqual(['Marker2D', 'Path2D', 'RayCast2D']);
  });

  it('telt een CanvasModulate in twee scènes als één nieuwe node', () => {
    // Bij een leerling stond er "nieuwe nodes (2×)": de nakijker telde de
    // treffers, en een CanvasModulate in level 1 en level 2 las zo als twee
    // nieuwe nodes. De rij telt nu soorten en noemt ze.
    const canvas = (naam: string) => `[node name="${naam}" type="CanvasModulate" parent="."]`;
    const rapport = analyze(
      files({
        'level1.tscn': `[node name="Level1" type="Node2D"]\n\n${canvas('Donker')}`,
        'level2.tscn': `[node name="Level2" type="Node2D"]\n\n${canvas('Donker')}\n\n${canvas('Rood')}`,
      }),
      godotConfig,
    );
    const een = score(rapport, '2d-nieuwe-nodes');
    // Drie keer een CanvasModulate, in twee scènes: één soort, en dus geen
    // "(3×)" achter de rij. Node2D kent de cursus en telt niet.
    expect(een).toMatchObject({ used: true, count: 1, delen: ['CanvasModulate'] });
    // Een klik op de rij toont nog steeds alle drie de plekken.
    expect(een.plekken).toHaveLength(3);
    const meer = score(rapport, '2d-nieuwe-nodes-meer');
    expect(meer.used).toBe(false);
    expect(meer.delen).toEqual(['CanvasModulate']);
    // Met een tweede soort erbij telt de rij twee.
    const twee = score(
      analyze(
        files({ 'a.tscn': `${canvas('A')}\n[node name="M" type="Marker2D" parent="."]` }),
        godotConfig,
      ),
      '2d-nieuwe-nodes',
    );
    expect(twee).toMatchObject({ used: true, count: 2, delen: ['CanvasModulate', 'Marker2D'] });
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
      // Expert hoort bij niveau 1 en 3, niet bij 4; valt hij weg, dan
      // verdwijnt ook de tegel en de keuze in het blok Cijfer.
      if (route !== '4') {
        expect(
          samenvatting.expert.total,
          `geen expert-concepten op niveau ${route}`,
        ).toBeGreaterThan(0);
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
    // Het overzicht noemt hem apart, niet als GDScript.
    expect(report.fileStats.byKind.addon).toBe(1);
    expect(report.fileStats.byKind.gd).toBe(0);
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

  it('maakt van \\" in een ingebouwd script weer een gewoon aanhalingsteken', () => {
    // Een `\"` werd eerst een spatie en een aanhalingsteken: `play( "run ")`.
    // Een naam was dan `run `, met een spatie (issue 227). De regels houden
    // hun lengte, zodat een treffer op dezelfde plek in het bestand staat.
    const tscn = [
      '[sub_resource type="GDScript" id="1"]',
      'script/source = "extends Node',
      'func _ready():',
      '\t$A.play(\\"run\\") # \\"commentaar\\"',
      '"',
    ].join('\n');
    const uit = ingebouwdeScripts(tscn);
    expect(uit).toContain('\t$A.play("run")');
    expect(uit).not.toContain('commentaar');
    expect(uit.split('\n').map((r) => r.length)).toEqual(tscn.split('\n').map((r) => r.length));
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
    // Lezen én schrijven, zoals de rij zegt; één van de twee is niet genoeg.
    expect(json('func f():\n\tvar d = JSON.parse_string(tekst)')).toBe(false);
    expect(json('func f():\n\tvar d = JSON.parse_string(tekst)\n\tvar t = JSON.stringify(d)')).toBe(
      true,
    );
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
    // Wie de les volgt, heeft het concept. Uitgezonderd: de drie concepten die
    // juist meten dat je níet de waarde van de les gebruikt, en loops: de les
    // toont één lus (en call_group als afkorting), en nuttig gebruik vraagt er
    // twee. Die tweede schrijft de leerling zelf. Animatie veranderen hoort
    // er sinds issue 227 niet meer bij: dat is een animatie wisselen in code.
    // En een signal: de les koppelt hem in de editor, en die koppeling staat
    // in de scène, niet in de code. De fixture compleet heeft de [connection].
    const ANDERS = ['gd-snelheid', 'gd-sprongkracht', 'gd-keybindings', 'gd-loops', 'gd-signal'];
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

// De review van de upload tool van Godot (november 2026): drie lezers draaiden
// elk geval hieronder op de nakijker. Per test: wat een leerling schreef die
// de les volgde of het net iets anders deed, en wat de nakijker moet zeggen.
describe('godotConfig — review van de upload tool', () => {
  const gebruikt = (entries: Record<string, string>) =>
    new Map(alleMatches(analyze(files(entries), godotConfig)).map((c) => [c.id, c.used]));
  const een = (id: string, entries: Record<string, string>) => gebruikt(entries).get(id);
  const PROJECT_MET_GLOBAL = '[autoload]\n\nGlobal="*res://global.gd"\n';

  it('een lijst in de global, gebruikt in een ander script (les 10.2)', () => {
    const project = {
      'project.godot': PROJECT_MET_GLOBAL,
      'global.gd':
        'extends Node\nvar level_volgorde = ["res://level1.tscn", "res://level2.tscn"]\n',
      'vlag.gd': [
        'extends Area2D',
        'func _on_body_entered(body):',
        '\tvar nu = Global.level_volgorde.find(get_tree().current_scene.scene_file_path)',
        '\tif nu + 1 < Global.level_volgorde.size():',
        '\t\tget_tree().change_scene_to_file(Global.level_volgorde[nu + 1])',
      ].join('\n'),
    };
    expect(een('gd-lijsten', project)).toBe(true);
    // Een dictionary in de global, gebruikt met Global.prijzen["goud"].
    expect(
      een('gd-dictionaries', {
        'project.godot': PROJECT_MET_GLOBAL,
        'global.gd': 'extends Node\nvar prijzen = {"goud": 10}\n',
        'muntje.gd': 'extends Area2D\nfunc waarde():\n\treturn Global.prijzen["goud"]\n',
      }),
    ).toBe(true);
    // Zonder gebruik telt een lijst in de global niet.
    expect(
      een('gd-lijsten', {
        'project.godot': PROJECT_MET_GLOBAL,
        'global.gd': 'extends Node\nvar levels = []\n',
      }),
    ).toBe(false);
  });

  it('een dictionary met punt-toegang, en een lijst uit de Inspector', () => {
    expect(
      een('gd-dictionaries', {
        'a.gd': 'var speler = {"score": 0}\nfunc f():\n\tspeler.score += 1\n',
      }),
    ).toBe(true);
    expect(
      een('gd-lijsten', {
        'a.gd':
          '@export var vijanden: Array[PackedScene]\nfunc f():\n\tadd_child(vijanden.pick_random().instantiate())\n',
      }),
    ).toBe(true);
  });

  it('snelheid: een sprint en andere namen voor de snelheid', () => {
    for (const code of [
      'const SPRINT_SPEED = 500.0',
      'const LOOPSNELHEID = 250.0',
      'const MOVE_SPEED = 250.0',
      'const SPEED = 300.0 * 1.5',
    ])
      expect(een('gd-snelheid', { 'speler.gd': code }), code).toBe(true);
    // Het sjabloon van Godot en de waarde uit de les tellen niet; de snelheid
    // van een animatie is geen loopsnelheid, en een sprong geen snelheid.
    for (const code of [
      'const SPEED = 300.0\nfunc f():\n\tvelocity.x = direction * SPEED',
      'func f():\n\t$Anim.speed_scale = 2.0',
      'const JUMP_SPEED = -600.0',
      // Verdubbelen is de power-up uit les 7.6; de oplossing daar (600.0)
      // telt ook niet.
      'func geef_snelheidsboost():\n\tsnelheid = snelheid * 2',
      'velocity.x = direction * SPEED * 2',
      'func f():\n\t$Camera2D.position_smoothing_speed = 3.0',
    ])
      expect(een('gd-snelheid', { 'speler.gd': code }), code).toBe(false);
    // Een instelling van de camera in de scène (les 5.4) is geen loopsnelheid.
    expect(
      een('gd-snelheid', {
        'level.tscn': '[node name="Camera2D" type="Camera2D"]\nposition_smoothing_speed = 3.0',
      }),
    ).toBe(false);
  });

  it('sprongkracht: ook met een Nederlandse of andere naam', () => {
    for (const code of [
      'const SPRINGKRACHT = -600.0',
      'var springkracht = -600.0',
      'const JUMP_SPEED = -600.0',
    ])
      expect(een('gd-sprongkracht', { 'speler.gd': code }), code).toBe(true);
    expect(een('gd-sprongkracht', { 'speler.gd': 'const JUMP_VELOCITY = -400.0' })).toBe(false);
    // Een teller voor een dubbele sprong is geen sprongkracht.
    for (const code of [
      'var jump_count = 0',
      'const MAX_JUMPS = 2',
      'var coyote_jump_time = 0.1',
      'var aantal_sprongen = 0',
    ])
      expect(een('gd-sprongkracht', { 'speler.gd': code }), code).toBe(false);
  });

  it('een snelheid die in de Inspector is aangepast (@export)', () => {
    const scene = [
      '[gd_scene load_steps=2 format=3]',
      '[ext_resource type="Script" path="res://speler.gd" id="1"]',
      '[node name="Speler" type="CharacterBody2D"]',
      'script = ExtResource("1")',
      'speed = 450.0',
    ].join('\n');
    expect(
      een('gd-snelheid', { 'speler.gd': '@export var speed = 300.0', 'speler.tscn': scene }),
    ).toBe(true);
    // De snelheid van een animatie in de scène telt niet.
    expect(
      een('gd-snelheid', {
        'speler.tscn': '[node name="Anim" type="AnimatedSprite2D"]\nspeed_scale = 2.0',
      }),
    ).toBe(false);
  });

  it('groups: de eerste node uit een groep ophalen', () => {
    expect(
      een('gd-groups', {
        'a.gd': 'func f():\n\tvar s = get_tree().get_first_node_in_group("speler")',
      }),
    ).toBe(true);
  });

  it('naar het volgende level: ook uitgesteld, maar niet de startknop van het menu', () => {
    for (const code of [
      'func _on_body_entered(body):\n\tget_tree().call_deferred("change_scene_to_file", "res://level2.tscn")',
      'func _on_body_entered(body):\n\tget_tree().change_scene_to_file.call_deferred("res://level2.tscn")',
    ])
      expect(een('gd-volgend-level', { 'vlag.gd': code }), code).toBe(true);
    // Het menu uit les 8.2: de knop Start laadt level 1, dat is geen volgend level.
    expect(
      een('gd-volgend-level', {
        'menu.gd':
          'extends Control\n\nfunc _on_start_pressed() -> void:\n\tGlobal.reset()\n\tget_tree().change_scene_to_file("res://level1.tscn")\n',
      }),
    ).toBe(false);
  });

  it('een signal: gekoppeld in de editor, ook met een eigen naam, en niet zonder koppeling', () => {
    const muntje =
      '[node name="Muntje" type="Area2D"]\n[connection signal="body_entered" from="." to="." method="muntje_geraakt"]\n';
    const project = {
      'muntje.tscn': muntje,
      'muntje.gd': 'extends Area2D\nfunc muntje_geraakt(body):\n\tqueue_free()\n',
    };
    expect(een('gd-signal', project)).toBe(true);
    // Een handler die nergens aan hangt, is precies de fout uit les 7.1.
    expect(
      een('gd-signal', { 'muntje.gd': 'extends Area2D\nfunc _on_body_entered(body):\n\tpass\n' }),
    ).toBe(false);
    // Twee handlers met een eigen naam zijn geen modulaire eigen functies.
    expect(
      een('gd-modulaire-functies', {
        'menu.tscn':
          '[node name="Menu" type="Control"]\n[connection signal="pressed" from="Start" to="." method="start_knop"]\n[connection signal="pressed" from="Stop" to="." method="stop_knop"]\n',
        'menu.gd': 'extends Control\nfunc start_knop():\n\tpass\nfunc stop_knop():\n\tpass\n',
      }),
    ).toBe(false);
  });

  it('een TileMap uit Godot 4.2 is de tilemap uit de les, geen zelf ontdekte node', () => {
    const level = {
      'level.tscn':
        '[node name="Level" type="Node2D"]\n[node name="TileMap" type="TileMap" parent="."]\n',
    };
    expect(een('2d-tilemaplayer', level)).toBe(true);
    expect(een('2d-nieuwe-nodes', level)).toBe(false);
  });

  it('een StaticBody2D of HBoxContainer is zelf ontdekt: geen les noemt ze', () => {
    expect(een('2d-nieuwe-nodes', { 'a.tscn': '[node name="P" type="StaticBody2D"]' })).toBe(true);
    expect(een('2d-nieuwe-nodes', { 'a.tscn': '[node name="R" type="HBoxContainer"]' })).toBe(true);
  });

  it('een pad met zijn volger, of een parallax met zijn laag, is één soort', () => {
    const scene = ['Path2D', 'PathFollow2D', 'ParallaxBackground', 'ParallaxLayer']
      .map((t) => `[node name="${t}" type="${t}"]`)
      .join('\n');
    expect(een('2d-nieuwe-nodes-meer', { 'a.tscn': scene })).toBe(false);
    // Parallax2D (Godot 4.3) staat op zichzelf: dat is wel een eigen soort.
    expect(
      een('2d-nieuwe-nodes-meer', {
        'a.tscn': ['Parallax2D', 'PointLight2D', 'AudioStreamPlayer2D']
          .map((t) => `[node name="${t}" type="${t}"]`)
          .join('\n'),
      }),
    ).toBe(true);
    expect(
      een('2d-nieuwe-nodes-meer', {
        'a.tscn': `${scene}\n[node name="Licht" type="PointLight2D"]`,
      }),
    ).toBe(true);
  });

  it('tweens: een echte tween, niet het woord Tween', () => {
    expect(een('gd-tweens', { 'a.gd': 'var t: Tween' })).toBe(false);
    expect(een('gd-tweens', { 'a.gd': 'func f():\n\tprint("Tween komt later")' })).toBe(false);
    expect(
      een('gd-tweens', {
        'a.gd':
          'func f():\n\tvar t = create_tween()\n\tt.tween_property(self, "scale", Vector2(2, 2), 0.3)',
      }),
    ).toBe(true);
  });

  it('een variabele die animation heet, is geen animatie', () => {
    expect(een('gd-animatie', { 'a.gd': 'var animation = 0' })).toBe(false);
  });

  it('een autoload uit een addon is geen eigen global', () => {
    expect(
      een('gd-globals', {
        'project.godot':
          '[autoload]\n\nDialogic="*res://addons/dialogic/Core/DialogicGameHandler.gd"\n',
        'a.gd': 'func f():\n\tDialogic.start("intro")\n\tDialogic.paused = true\n',
      }),
    ).toBe(false);
  });

  it('een menu met TextureButtons is ook een startscherm', () => {
    expect(
      een('2d-startscherm', {
        'menu.tscn':
          '[node name="Menu" type="Control"]\n[node name="Start" type="TextureButton" parent="."]\n',
      }),
    ).toBe(true);
  });

  it('eigen toetsen: een actie met een toets eraan, niet een lege [input]', () => {
    const toets =
      '[input]\n\nui_accept={\n"deadzone": 0.5,\n"events": [Object(InputEventKey,"resource_local_to_scene":false,"keycode":87)\n]\n}\n';
    expect(een('gd-keybindings', { 'project.godot': toets })).toBe(true);
    // Eerst een actie zonder toets, dan een met: de tweede telt.
    expect(
      een('gd-keybindings', {
        'project.godot': toets.replace(
          '[input]\n\n',
          '[input]\n\naanval={\n"deadzone": 0.5,\n"events": []\n}\n',
        ),
      }),
    ).toBe(true);
    expect(
      een('gd-keybindings', {
        'project.godot': '[input]\n\nspringen={\n"deadzone": 0.5,\n"events": []\n}\n',
      }),
    ).toBe(false);
  });

  it('JSON: lezen én schrijven', () => {
    expect(een('gd-json', { 'a.gd': 'func f():\n\tprint(JSON.stringify({"a": 1}))' })).toBe(false);
    expect(
      een('gd-json', {
        'a.gd': 'func f(t):\n\tvar s = JSON.stringify({"a": 1})\n\tvar d = JSON.parse_string(t)',
      }),
    ).toBe(true);
    // Lezen zoals de documentatie van Godot het laat zien: een JSON-object.
    expect(
      een('gd-json', {
        'a.gd':
          'func f(t):\n\tvar s = JSON.stringify({"a": 1})\n\tvar json = JSON.new()\n\tjson.parse(t)',
      }),
    ).toBe(true);
  });

  it('een timer die niets doet, is geen nuttig gebruik', () => {
    expect(een('gd-timers', { 'a.tscn': '[node name="Timer" type="Timer"]' })).toBe(false);
    // De timer uit les 8.4: timeout gekoppeld in de editor.
    expect(
      een('gd-timers', {
        'level.tscn':
          '[node name="Timer" type="Timer" parent="."]\nautostart = true\n[connection signal="timeout" from="Timer" to="." method="_on_timer_timeout"]\n',
      }),
    ).toBe(true);
    expect(
      een('gd-timers', { 'a.gd': 'func f():\n\tawait get_tree().create_timer(5.0).timeout' }),
    ).toBe(true);
    // Een Timer-node die je start en waarop je wacht.
    expect(
      een('gd-timers', { 'a.gd': 'func f():\n\t$Cooldown.start()\n\tawait $Cooldown.timeout' }),
    ).toBe(true);
  });

  it('scènes in een addon zijn geen eigen mappen', () => {
    expect(
      gebruikt({ 'addons/dialogue/views/ballon.tscn': '[node name="B" type="Control"]' }).get(
        'project-inrichting',
      ),
    ).toBe(false);
  });

  it('het overzicht telt addon, export en wat Godot zelf maakt apart', () => {
    const kinds = Object.fromEntries(
      [
        'addons/dialogue/a.gd',
        'addons/dialogue/b.tscn',
        'export/spel.exe',
        'export/spel.pck',
        'web/index.wasm',
        'icon.svg.import',
        'speler.gd.uid',
        'speler.gd',
      ].map((p) => [p, godotConfig.classify(p)]),
    );
    expect(kinds).toEqual({
      'addons/dialogue/a.gd': 'addon',
      'addons/dialogue/b.tscn': 'addon',
      'export/spel.exe': 'export',
      'export/spel.pck': 'export',
      'web/index.wasm': 'export',
      'icon.svg.import': 'intern',
      'speler.gd.uid': 'intern',
      'speler.gd': 'gd',
    });
  });

  it('waarschuwt bij een upload zonder scènes, zonder code, of alleen een export', () => {
    const w = (entries: Record<string, string>) => analyze(files(entries), godotConfig).warnings;
    expect(w({ 'speler.gd': 'extends CharacterBody2D' }).join(' ')).toMatch(
      /geen scène \(\.tscn\).*project\.godot/,
    );
    expect(w({ 'project.godot': 'config_version=5' }).join(' ')).toMatch(
      /geen script \(\.gd\) en geen scène/,
    );
    expect(w({ 'index.pck': 'x', 'index.html': '<html>' }).join(' ')).toMatch(
      /export van je game \(index\.pck\)/,
    );
    // Eén melding, niet ook nog de algemene over geen leesbare code.
    expect(w({ 'index.pck': 'x', 'index.html': '<html>' })).toHaveLength(1);
    // Een gewoon project krijgt geen van deze meldingen.
    expect(
      w({ 'speler.gd': 'extends Node', 'level.tscn': '[node name="L" type="Node2D"]' }),
    ).toEqual([]);
  });
});
