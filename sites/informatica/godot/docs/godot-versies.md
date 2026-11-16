---
sidebar_position: 92
slug: /godot-versies
les_tabs: false
---

# Godot-versies & compatibiliteit

De cursus is geschreven voor één versie van Godot. Op deze pagina staat welke, en waar je op let als jij een andere versie hebt. Je komt hier via de link Godot 4.7 bovenaan elke pagina.

## De versie van de cursus

De cursus is geschreven voor **Godot 4.7.x**.

In [Installatie](site:godot/docs/installatie) lees je waar je deze versie downloadt. Controleer na het installeren via het menu **Help → About Godot** dat je `4.7.x` hebt.

## Heb je een oudere versie?

Sommige nodes en functies bestaan pas vanaf een bepaalde versie. In de tabel zie je vanaf welke versie een onderdeel van de cursus werkt:

| Onderdeel | Werkt vanaf | Les |
|---|---|---|
| `TileMapLayer` | **4.3** | [Level tekenen met een TileMap](site:godot/docs/tilemap_opzetten) |
| `get_gravity()` op `CharacterBody2D` | **4.2** | [Deel 2 — Vallen](site:godot/docs/movement-motor) |
| `move_and_slide()` zonder parameters | **4.0** | [Deel 1 — Een script dat draait](site:godot/docs/basis_movement_begrijpen) |
| `AnimatedSprite2D` met `SpriteFrames` | **4.0** | [Animaties aanmaken](site:godot/docs/animaties) |
| Het signal `body_entered` van `Area2D` | **4.0** | [Signals & een muntje oppakken](site:godot/docs/signals_muntje) |
| Autoload | **4.0** (tot en met 4.3 een eigen tabblad in Project Settings, vanaf 4.4 onder **Globals**) | [Global variables (Autoload)](site:godot/docs/global_variables) |

In versies ouder dan 4.3 heet de tile-node `TileMap` (zonder "Layer"). De lessen over het level kun je dan nog volgen, maar het tekenen en de Physics Layer zitten op een andere plek.

## Heb je een nieuwere versie?

Een nieuwere versie van Godot kan een menu of een instelling op een andere plek hebben. Dat gebeurt het vaakst bij:

- **Project Settings** (Autoload onder Globals, de Main Scene, Default Texture Filter).
- De werkbalk van de **TileSet-editor** (de Paint-knop, de Physics Layer).
- **Anchors Preset** bij een `TextureRect`.
- Het menu **Editor → Editor Layout**.

:::note[Editor-thema]
Sinds **Godot 4.6** is het standaard editor-thema grijs ("Modern") in plaats van het oude blauwe thema. Sommige schermafbeeldingen in deze cursus zien er daardoor nog blauw uit; de stappen blijven hetzelfde. Wil je het oude uiterlijk terug? Ga naar **Editor → Editor Settings → Interface → Theme** en kies `Classic`.
:::

Kun je in een les een menu-item niet vinden?

1. Typ de naam in de **zoekbalk** bovenin Project Settings. Dat werkt voor de meeste instellingen.
2. Bekijk de officiële [Godot Docs](https://docs.godotengine.org/) voor jouw versie.
3. Meld het bij je docent, of op de [GitHub-pagina van de cursus](https://github.com/Coderius-Education/docs/issues). Dan passen we de les aan.

## Als een site van iemand anders niet werkt

De cursus gebruikt drie sites die niet van ons zijn. Werkt er een niet, dan kun je zo verder:

| Site | Gebruikt in | Wat doe je dan? |
|---|---|---|
| [GDQuest learn-gdscript](https://gdquest.github.io/learn-gdscript/) | [Deel 1 — Een script dat draait](site:godot/docs/basis_movement_begrijpen) en de delen erna | Gebruik de officiële [GDScript-docs](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html). |
| [Pixel Adventure asset pack](https://pixelfrog-assets.itch.io/pixel-adventure-1) | [Bestanden downloaden](site:godot/docs/bestanden-downloaden) | Andere gratis pixel-art packs op [itch.io](https://itch.io/game-assets/free/tag-2d) of [opengameart.org](https://opengameart.org/) werken ook, zolang er `.png`-sprites in zitten. |
| [Godot online editor](https://editor.godotengine.org/) | [Installatie](site:godot/docs/installatie) (de route voor een Chromebook) | Installeer Godot op een ander apparaat. |

## Voor docenten: de cursus bijhouden

Bij een nieuwe versie van Godot (bijvoorbeeld 4.8) lopen we de cursus één keer door in die versie, noteren we waar een menu of instelling anders is, en werken we deze pagina en het versienummer van de cursus bij.
