---
sidebar_position: 1
hide_table_of_contents: true
slug: /spel-flappy_bird
---

# Flappy Bird-kloon

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Het idee

Een vogel die tegen de zwaartekracht in moet vechten. Eén toets indrukken = even een flapje omhoog. Tussen de buizen door zien te komen. Raak je er een, dan is het Game Over. Hoe verder je komt, hoe hoger je score.

Het hart van het spel is hetzelfde als in jouw platformer: `velocity.y` aanpassen op het moment dat de speler een toets indrukt. Maar nu zonder grond — alleen jij houdt de vogel in de lucht.

## Wat ga je leren?

- Een spawner bouwen die met een `Timer` periodiek nieuwe obstakels aanmaakt.
- Scenes "instantieren" met `preload()` + `instantiate()`.
- Een Area2D als game-over-trigger inzetten.
- Score per gepasseerde buis verhogen via een tweede Area2D.

## Nodes die je nodig hebt

| Node | Waarvoor? |
|---|---|
| `CharacterBody2D` | De vogel — gebruikt `velocity.y` voor zwaartekracht en flappen. |
| `AnimatedSprite2D` | Wapperende vleugel-animatie. |
| `CollisionShape2D` | Hitbox van de vogel en van de buizen. |
| `Area2D` | Twee soorten: één raakt-een-buis → game over, één tussen de buizen → score. |
| `StaticBody2D` of `TileMapLayer` | De buis-obstakels zelf. |
| `Timer` | Spawnt periodiek nieuwe buizen. |
| `CanvasLayer` + `Label` | Score bovenin het scherm. |

## Handige GDScript-functies

| Functie / property | Wat doet het? |
|---|---|
| `Input.is_action_just_pressed("ui_accept")` | `true` op het frame dat spatie wordt ingedrukt — perfect voor één flap per druk. |
| `velocity.y = JUMP_VELOCITY` | Snap de verticale snelheid naar een vaste waarde omhoog. |
| `velocity += get_gravity() * delta` | Laat de vogel vallen wanneer er niet wordt geflapt. |
| `move_and_slide()` | Past `velocity` toe op de vogel. |
| `preload("res://buis.tscn")` | Laadt de buis-scene in geheugen, klaar om te instantieren. |
| `instantiate()` + `add_child(...)` | Maakt een nieuwe buis aan en hangt hem in de scene. |
| `queue_free()` | Verwijdert een buis die buiten beeld is — anders blijven ze geheugen vreten. |
| `Timer.timeout` (signal) | Trigger om elke X seconden een nieuwe buis te spawnen. |
| `body_entered` (signal) | Detecteert dat de vogel een buis raakt → game over. |
| `get_tree().reload_current_scene()` | Herstart het level bij game over. |

## Externe links

- [GDQuest](https://www.gdquest.com/) — zoek op "Flappy Bird Godot" voor video-uitleg.
- YouTube: zoek "Godot 4 Flappy Bird tutorial" (kanalen als KidsCanCode of Heartbeast hebben goede uitlegvideo's).
- [Itch.io: gratis vogel-assets](https://itch.io/game-assets/free/tag-bird) — sprite-sheets om mee te beginnen.
- [Godot Docs — Instancing scenes](https://docs.godotengine.org/en/stable/getting_started/step_by_step/instancing.html) — de officiële uitleg over `preload()` + `instantiate()`.

## Eerste stappen

1. Begin met een lege `Node2D` als wereld-root.
2. Bouw de vogel als losse scene (`vogel.tscn`) met `CharacterBody2D` + `AnimatedSprite2D` + `CollisionShape2D`.
3. Schrijf het beweging-script: zwaartekracht in `_physics_process`, een `velocity.y = JUMP_VELOCITY` bij `is_action_just_pressed`.
4. Bouw een `buis.tscn` met twee `StaticBody2D`'s (boven en onder) en een `Area2D` ertussen voor de score-trigger.
5. Voeg een `Timer` toe aan de wereld. Koppel `timeout` aan een script-functie die `buis.tscn` instantieert op een willekeurige hoogte.

Vanaf hier kun je polish toevoegen: een achtergrond, geluidseffecten, een game-over-scherm met de cursus-`start_menu`-techniek.
