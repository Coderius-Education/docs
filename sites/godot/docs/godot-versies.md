---
sidebar_position: 92
hide_table_of_contents: true
slug: /godot-versies
---

# Godot-versies & compatibiliteit

**Na deze pagina:** weet je welke Godot-versie het curriculum gebruikt en waar je op moet letten als je een andere versie hebt.

## Doel-versie

Het curriculum is geschreven voor **Godot 4.5.x** (4.5.1-stable was de meest recente versie op het moment van schrijven).

In de [installatie-les](/docs/installatie) lees je waar je deze versie downloadt. Controleer na installatie via menu **Help → About Godot** dat je echt `4.5.x` draait.

## Minimum-vereisten per concept

Sommige nodes en functies zijn pas in een specifieke 4.x-versie toegevoegd. Voor een student die per ongeluk een oudere editor heeft:

| Concept | Minimum-versie | Tutorial |
|---|---|---|
| `TileMapLayer` | **4.3+** | [Level tekenen met een TileMap](/docs/tilemap_opzetten) |
| `get_gravity()` op `CharacterBody2D` | **4.2+** | [Sprite movement](/docs/sprite_movement) |
| `move_and_slide()` zonder parameters | **4.0+** | [Sprite movement](/docs/sprite_movement) |
| `AnimatedSprite2D` met `SpriteFrames` | **4.0+** | [Animaties](/docs/animaties) |
| `Area2D.body_entered`-signal | **4.0+** | [Signals & muntje](/docs/signals_muntje) |
| Autoload-mechanisme | **4.0+** | [Global variables](/docs/global_variables) |

In `<` 4.3 heet de tile-node `TileMap` (zonder "Layer"). De tutorial werkt dan met aanpassingen, maar de Paint-tool / Physics Layer-workflow is anders georganiseerd.

## Latere versies (4.6 en hoger)

Toekomstige minor-versies van Godot **kunnen** UI-paden of property-namen verschuiven. Bekende risicogebieden:

- **Project Settings**-navigatie (Autoload-tabblad, Main Scene-instelling, Default Texture Filter).
- **TileSet-editor**-toolbar (Paint-knop, Physics Layer-dropdown).
- **Anchors Preset** in `TextureRect`.
- Menu-volgorde **Editor → Editor Layout**.

Als je tijdens een tutorial een menu-item niet kunt vinden:

1. Typ de naam in de **zoekbalk** bovenin Project Settings (werkt voor de meeste settings).
2. Bekijk de officiële [Godot Docs](https://docs.godotengine.org/) voor jouw versie.
3. Meld het op de [GitHub-repository van dit curriculum](https://github.com/Coderius-Education/Godot/issues) — dan kunnen we de tutorial bijwerken.

## Externe afhankelijkheden

Het curriculum gebruikt drie externe bronnen die offline kunnen gaan:

| Bron | Gebruikt in | Wat als hij offline is? |
|---|---|---|
| [GDQuest learn-gdscript](https://gdquest.github.io/learn-gdscript/) | [Start GDScript](/docs/start_gdscript) | Gebruik de officiële [GDScript-docs](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html). |
| [Pixel Adventure asset pack](https://pixelfrog-assets.itch.io/pixel-adventure-1) | [Bestanden downloaden](/docs/bestanden-downloaden) | Andere gratis pixel-art packs op [itch.io](https://itch.io/game-assets/free/tag-2d) of [opengameart.org](https://opengameart.org/) werken ook. Belangrijk: zorg dat het pack `.png`-sprites bevat. |
| [Godot online editor](https://editor.godotengine.org/) | [Installatie](/docs/installatie) (Chromebook-route) | Offline gaan is onwaarschijnlijk (officieel Godot). Anders: installeer Godot lokaal op een ander apparaat. |

## Hoe houden we dit up-to-date?

Bij elke nieuwe Godot-minor-release (bv. 4.6):

1. Doorloop het curriculum één keer in de nieuwe versie.
2. Noteer afwijkingen in de UI-paden.
3. Werk de bovenstaande tabellen bij.
4. Update de versie-banner bovenaan elke tutorial.
