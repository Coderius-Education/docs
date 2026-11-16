---
sidebar_position: 1
slug: /spel-flappy_bird
---

# Flappy Bird-kloon

## Het idee

Een vogel die tegen de zwaartekracht in moet vechten. Eén toets indrukken = even een flapje omhoog. Tussen de buizen door zien te komen. Raak je er een, dan is het Game Over. Hoe verder je komt, hoe hoger je score.

Het hart van het spel is hetzelfde als in jouw platformer: `velocity.y` aanpassen op het moment dat de speler een toets indrukt. Maar nu zonder grond — alleen jij houdt de vogel in de lucht.

## Wat ga je leren?

- Een spawner bouwen die met een `Timer` periodiek nieuwe obstakels aanmaakt — de techniek uit [Automatisch spawnen met een Timer](site:godot/docs/spawn_timer).
- Scenes "instantiëren" met `preload()` + `instantiate()` (zie [Spawnen: nodes maken in code](site:godot/docs/spawnen)).
- Een `Area2D` gebruiken voor game over: raakt de vogel een buis, dan begint het level opnieuw.
- De score ophogen met een `Area2D` in het gat tussen de buizen.

## Nodes die je nodig hebt

| Node | Waarvoor? |
|---|---|
| `CharacterBody2D` | De vogel — gebruikt `velocity.y` voor zwaartekracht en flappen. |
| `AnimatedSprite2D` | Wapperende vleugel-animatie. |
| `CollisionShape2D` | Hitbox van de vogel en van de buizen. |
| `Area2D` | Drie per buis: de bovenste en de onderste helft (raak je die, dan is het game over) en één in het gat ertussen (vlieg je daardoor, dan krijg je een punt). |
| `Timer` | Spawnt periodiek nieuwe buizen. |
| `CanvasLayer` + `Label` | Score bovenin het scherm. |

## Handige GDScript-functies

| Functie / property | Wat doet het? |
|---|---|
| `Input.is_action_just_pressed("ui_accept")` | `true` op het frame waarop je spatie indrukt: één flap per druk. |
| `velocity.y = JUMP_VELOCITY` | Zet de verticale snelheid in één keer op een vaste waarde omhoog. |
| `velocity += get_gravity() * delta` | Laat de vogel vallen wanneer er niet wordt geflapt. |
| `move_and_slide()` | Past `velocity` toe op de vogel. |
| `preload("res://buis.tscn")` | Leest de buis-scène in, klaar om er exemplaren van te maken. |
| `instantiate()` + `add_child(...)` | Maakt een nieuwe buis aan en hangt hem in de scène. |
| `queue_free()` | Verwijdert een buis die links uit beeld is. Zonder die regel blijven alle buizen bestaan. |
| `Timer.timeout` (signal) | Trigger om elke X seconden een nieuwe buis te spawnen. |
| `body_entered` (signal) | Gaat af als de vogel een buis raakt, of door het gat vliegt. |
| `get_tree().reload_current_scene()` | Laadt de scène opnieuw: het level begint van voren af aan. |

## Eerste stappen: bouw de kern

1. Begin met een lege `Node2D` als wereld-root.
2. Bouw de vogel als losse scène (`vogel.tscn`) met `CharacterBody2D` + `AnimatedSprite2D` + `CollisionShape2D`.
3. Schrijf het bewegingsscript: zwaartekracht in `_physics_process`, en `velocity.y = JUMP_VELOCITY` bij `is_action_just_pressed`.
4. Bouw `buis.tscn`: een `Node2D` met drie `Area2D`'s eronder, elk met een `CollisionShape2D`. De bovenste en de onderste zijn de buis, de derde zit in het gat ertussen.
5. Koppel `body_entered` van de twee buis-helften aan een functie die `get_tree().reload_current_scene()` aanroept: game over. Koppel `body_entered` van het gat aan een functie die de score ophoogt.
6. Geef `buis.tscn` een script dat de buis in `_process(delta)` naar links schuift (`position.x -= 200 * delta`) en `queue_free()` aanroept zodra `position.x` links van je scherm ligt.
7. Voeg een `Timer` toe aan de wereld. Koppel `timeout` aan een functie die een buis spawnt, rechts buiten beeld en op een willekeurige hoogte (`randf_range`).

### Mogelijke uitbreidingen

- Een achtergrond, en geluid bij een flap en bij een punt. Een node voor geluid zoek je op zoals in [Wat nu?](site:godot/docs/meer-leren), onder Zelf een nieuwe node ontdekken.
- Een game-over-scherm met je score, gebouwd zoals [Een startmenu](site:godot/docs/start_menu).
- Buizen die sneller komen naarmate je score stijgt.
- Een highscore die blijft, zoals in [JSON: een highscore die blijft](site:godot/docs/json_opslaan).

Meer lezen:

- [Itch.io: gratis vogel-assets](https://itch.io/game-assets/free/tag-bird): sprite-sheets om mee te beginnen.
- [Godot Docs: Instancing scenes](https://docs.godotengine.org/en/stable/getting_started/step_by_step/instancing.html): verdieping op `preload()` en `instantiate()` uit [Spawnen: nodes maken in code](site:godot/docs/spawnen).
