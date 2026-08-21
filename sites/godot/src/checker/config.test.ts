import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeLevelSummary } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { godotConfig } from './config';

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
  it('een kaal project levert alleen de eerste-lessen-concepten op', () => {
    verwacht(
      'minimaal',
      [
        'gd-extends',
        'gd-var',
        'gd-func',
        'gd-ready',
        'gd-print',
        'nd-scene-file',
        'nd-project-file',
      ],
      [
        'gd-const',
        'gd-if',
        'gd-process',
        'gd-physics-process',
        'mv-velocity',
        'mv-move-and-slide',
        'mv-is-on-floor',
        'mv-gravity',
        'mv-move-toward',
        'in-pressed',
        'in-just-pressed',
        'in-get-axis',
        'nd-node-access',
        'nd-queue-free',
        'nd-preload',
        'nd-change-scene',
        'nd-signal-connect',
        'nd-signal-handler',
        'nd-global',
        // 'extends CharacterBody2D' staat wél in speler.gd, maar sc-* leest
        // alleen .tscn-bestanden; het kale world.tscn bevat enkel een Node2D.
        'sc-characterbody2d',
        'sc-sprite',
        'sc-collisionshape2d',
        'sc-camera2d',
        'sc-tilemaplayer',
        'sc-area2d',
        'sc-timer',
        'sc-canvaslayer',
        'sc-label',
        'sc-button',
      ],
    );
  });

  it('het cursus-eindproject herkent wat er echt in staat', () => {
    verwacht(
      'compleet',
      [
        'gd-extends',
        'gd-var',
        'gd-const',
        'gd-func',
        'gd-if',
        'gd-print',
        'gd-ready',
        'gd-process',
        'gd-physics-process',
        'mv-velocity',
        'mv-move-and-slide',
        'mv-is-on-floor',
        'mv-gravity',
        'mv-move-toward',
        'in-just-pressed',
        'in-get-axis',
        'nd-node-access',
        'nd-queue-free',
        'nd-preload',
        'nd-change-scene',
        'nd-signal-connect',
        'nd-signal-handler',
        'nd-global',
        'nd-scene-file',
        'nd-project-file',
        'sc-characterbody2d',
        'sc-sprite',
        'sc-collisionshape2d',
        'sc-camera2d',
        'sc-tilemaplayer',
        'sc-area2d',
        'sc-timer',
        'sc-canvaslayer',
        'sc-label',
        'sc-button',
      ],
      // De nakijker vinkt niet zomaar alles aan: het eindproject gebruikt
      // is_action_just_pressed, en dat mag niet als is_action_pressed tellen.
      ['in-pressed'],
    );
  });

  it('leest de fixture zoals de checker een upload ziet', () => {
    const project = leesFixture('compleet');
    // Als classify of textKinds wijzigt, valt het hier meteen op.
    expect(project['scripts/speler.gd'].kind).toBe('gd');
    expect(project['speler.tscn'].kind).toBe('tscn');
    expect(project['project.godot'].kind).toBe('godot');
    expect(godotConfig.textKinds).toContain('tscn');
    expect(godotConfig.classify('level.TSCN')).toBe('tscn');
  });
});

describe('godotConfig', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(godotConfig)).toEqual([]);
  });

  it('herkent een Godot-project aan de projectbestanden', () => {
    const report = analyze(
      files({
        'project.godot': null,
        'scenes/Main.tscn': null,
        'scripts/Speler.gd': 'extends CharacterBody2D',
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('nd-project-file')).toBe(true);
    expect(perId.get('nd-scene-file')).toBe(true);
  });

  it('herkent geen scene-bestand in een map zonder .tscn', () => {
    const report = analyze(files({ 'scripts/Speler.gd': 'extends Node' }), godotConfig);
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('nd-project-file')).toBe(false);
    expect(perId.get('nd-scene-file')).toBe(false);
  });

  it('herkent is_action_pressed los van is_action_just_pressed', () => {
    // in-pressed komt niet in de fixtures voor; zonder deze test zou een
    // kapotte regex voor precies dit concept stil de hele suite groen laten.
    const report = analyze(
      files({ 'speler.gd': 'if Input.is_action_pressed("ui_right"):\n\tvelocity.x = SPEED' }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('in-pressed')).toBe(true);
    expect(perId.get('in-just-pressed')).toBe(false);
  });

  it('laat lookalike-namen niet meetellen', () => {
    const report = analyze(
      files({
        'speler.gd': [
          'var prefetch_data = prefetch(x)',
          'var mijn_preload_iets = 1',
          'var pad = move_towards_thuis',
          'var prijs = "kost $ 5 euro"',
        ].join('\n'),
      }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('nd-preload')).toBe(false);
    expect(perId.get('mv-move-toward')).toBe(false);
    // Kanttekening: "$5" (zonder spatie) zou wél matchen — het $-patroon eist
    // alleen een woordteken na het $-teken. Dat is bestaand gedrag; in
    // GDScript-strings komt het zelden voor.
    expect(perId.get('nd-node-access')).toBe(false);
  });

  it('telt node-types in GDScript-tekst niet mee als scene-node', () => {
    // sc-* leest alleen .tscn: "extends CharacterBody2D" in een script is
    // geen bewijs dat de scène die node echt bevat.
    const report = analyze(
      files({ 'speler.gd': 'extends CharacterBody2D\nvar timer = Timer.new()' }),
      godotConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('sc-characterbody2d')).toBe(false);
    expect(perId.get('sc-timer')).toBe(false);
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

    expect(perId.get('sc-label')).toBe(false);
    expect(perId.get('sc-button')).toBe(false);
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

    for (const id of ['sc-characterbody2d', 'sc-sprite', 'sc-timer', 'sc-label']) {
      expect(perId.get(id), `${id} hoort niet te matchen op ext_resource`).toBe(false);
    }
  });

  it('elk scene-concept leest alleen .tscn en eist een [node-regel', () => {
    // Geen realistische .tscn-regel buiten [node ...] bevat type="Timer" of
    // type="Button", dus een weggevallen "\[node "-prefix is met fixtures
    // alleen niet te vangen. Daarom deze structurele bewaking op het patroon.
    const scene = godotConfig.concepts.filter((c) => c.id.startsWith('sc-'));
    expect(scene.length).toBe(10);
    for (const c of scene) {
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

  it('houdt vijf basis- en vijf gevorderd-concepten in het scene-onderwerp', () => {
    // De LevelSummary-chips verbergen 0/0-niveaus; dit vangt een per ongeluk
    // leeggevallen niveau af.
    const report = analyze(files({}), godotConfig);
    const scene = computeLevelSummary(report, godotConfig).bySubject.find(
      (s) => s.subject === 'scene',
    );

    expect(scene?.basis.total).toBe(5);
    expect(scene?.gevorderd.total).toBe(5);
  });
});
