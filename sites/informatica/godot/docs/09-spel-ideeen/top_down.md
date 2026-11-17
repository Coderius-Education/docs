---
sidebar_position: 2
slug: /spel-top_down
---

# Top-down dungeon crawler

## Het idee

Een Zelda-achtig spel: je kijkt van bovenaf op de wereld, loopt in vier of acht richtingen door dungeons, raapt items op en komt door deuren naar een volgende kamer. Geen zwaartekracht — alleen jij beslist waar je naartoe gaat.

De grootste verandering ten opzichte van de platformer: je gebruikt **beide** assen van `velocity`, en zwaartekracht laat je weg.

#### Wat ga je leren?

- Bewegen in twee dimensies tegelijk met `Input.get_vector(...)`.
- Een dungeon bouwen met `TileMapLayer`: een vloer, en muren waar je tegenaan botst.
- De camera laten meebewegen met de speler in beide richtingen.
- Per richting de juiste loop-animatie afspelen.

## Nodes: wat je nodig hebt

| Node | Waarvoor? |
|---|---|
| `CharacterBody2D` | De speler — net als in de platformer, maar zonder zwaartekracht. |
| `AnimatedSprite2D` | Vier loop-animaties: `walk_up`, `walk_down`, `walk_left`, `walk_right`. |
| `CollisionShape2D` | Hitbox van de speler. |
| `TileMapLayer` | De dungeon-vloer + muren (muren krijgen een **Physics Layer**). |
| `Camera2D` | Volgt de speler — `Enabled` aan laten staan (standaard). |
| `Area2D` | Voor deuren, items, schakelaars of vijand-zones. |

## GDScript-functies: handig voor dit spel

| Functie / property | Wat doet het? |
|---|---|
| `Input.get_vector("ui_left","ui_right","ui_up","ui_down")` | Geeft een `Vector2` terug met de richting waarin je drukt: links, rechts, omhoog, omlaag of schuin. Schuin ga je even snel als recht. |
| `velocity = direction * SPEED` | Past de richting direct toe op de snelheid — **geen** `+= get_gravity()` deze keer. |
| `move_and_slide()` | Past `velocity` toe en behandelt collisions met muren. |
| `AnimatedSprite2D.play("walk_down")` | Speel de animatie af die bij de huidige richting hoort. |
| `direction.x > 0` / `direction.y > 0` | Kies de juiste animatie op basis van de richting. |
| `body_entered` (signal op `Area2D`) | Detecteert dat de speler een deur, item of vijand-zone raakt. |
| `get_tree().change_scene_to_file(...)` | Wissel naar de volgende kamer/dungeon. |

## Zo begin je

### Bouw de kern

1. Maak een nieuwe scène met een `Node2D` als root.
2. Voeg een `TileMapLayer` toe en teken een eerste kamer (vloer + muren). Vergeet de **Physics Layer** niet op de muren.
3. Bouw je speler-scène (`speler.tscn`): `CharacterBody2D` + `AnimatedSprite2D` + `CollisionShape2D` + `Camera2D`.
4. Vervang in je speler-script de platformer-logica door:

   ```gdscript
   var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
   velocity = direction * SPEED
   move_and_slide()
   ```

5. Voeg een `Area2D` toe als deur en koppel `body_entered` aan `get_tree().change_scene_to_file("res://kamer2.tscn")`, zoals de vlag in [Een tweede level toevoegen](site:godot/docs/tweede_level).

## Uitbreidingen

- Vijanden als `Area2D`: raak je er een, dan is het game over.
- Vijanden die je achterna lopen, met een `NavigationAgent2D` (zie [Wat nu?](site:godot/docs/meer-leren), onder Tegenstanders laten volgen).
- Sleutels die je oppakt zoals een muntje, en een deur die pas opengaat als je er een hebt.
- Meer kamers, met de volgorde in een lijst zoals in [Lijsten: één vlag voor al je levels](site:godot/docs/lijsten).

Meer lezen:

- [Godot Docs: Your first 2D game](https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html): een top-down voorbeeld in de officiële tutorial.
- [Itch.io: top-down assets](https://itch.io/game-assets/free/tag-top-down): gratis tileset- en karakter-packs.
- [Godot Docs: Input.get_vector()](https://docs.godotengine.org/en/stable/classes/class_input.html#class-input-method-get-vector): de officiële uitleg.
