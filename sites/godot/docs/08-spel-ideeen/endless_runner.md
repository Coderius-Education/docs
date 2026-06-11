---
sidebar_position: 3
hide_table_of_contents: true
slug: /spel-endless_runner
---

# Endless runner

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Het idee

Een eindeloze platform-loop, zoals Geometry Dash of Subway Surfers. De speler beweegt automatisch vooruit (of de wereld komt op hem af) en moet op het juiste moment springen om obstakels te ontwijken. Hoe langer je het volhoudt, hoe hoger je score.

De kern hier is **procedureel spawnen**: obstakels worden tijdens het spelen aangemaakt — je hoeft niet vooraf een level te bouwen.

## Wat ga je leren?

- Scenes "instantieren" tijdens het spel met `preload()` + `instantiate()`.
- Een `Timer` gebruiken als spawn-klok.
- Oude nodes opruimen met `queue_free()` om geheugen vrij te maken.
- Een meescrollende achtergrond met `ParallaxBackground`.

## Nodes die je nodig hebt

| Node | Waarvoor? |
|---|---|
| `CharacterBody2D` | De speler — springt met `velocity.y` zoals in je platformer. |
| `AnimatedSprite2D` | Loop- en spring-animatie. |
| `Node2D` (spawner) | Een onzichtbare positie waar nieuwe obstakels worden aangemaakt. |
| `Timer` | Stuurt op vaste tijden een `timeout`-signaal → spawn een obstakel. |
| `Area2D` (in obstakel-scene) | Raakt de speler een obstakel → game over. |
| `ParallaxBackground` + `ParallaxLayer` | Een achtergrond die meescrolt voor diepte. |
| `CanvasLayer` + `Label` | Score (op basis van overleefde tijd of gepasseerde obstakels). |

## Handige GDScript-functies

| Functie / property | Wat doet het? |
|---|---|
| `preload("res://obstakel.tscn")` | Laadt de obstakel-scene in geheugen — sneller dan `load()` tijdens het spel. |
| `obstakel_scene.instantiate()` | Maakt een nieuwe kopie van de scene aan. |
| `add_child(nieuw_obstakel)` | Hangt het obstakel in de wereld zodat het zichtbaar wordt. |
| `nieuw_obstakel.position = spawner.position` | Plaats het obstakel op de spawn-positie. |
| `queue_free()` | Roep dit aan in een obstakel zodra het uit beeld verdwijnt. |
| `Timer.timeout` (signal) | Trigger om elke X seconden een nieuw obstakel te spawnen. |
| `randi_range(0, 2)` | Kies een willekeurig type obstakel uit een array. |
| `randf_range(0.5, 1.5)` | Variatie in spawn-interval voor minder voorspelbaarheid. |
| `get_tree().reload_current_scene()` | Herstart bij game over. |

## Externe links

- [Godot Docs — Instancing](https://docs.godotengine.org/en/stable/getting_started/step_by_step/instancing.html) — officiële uitleg over `preload()` + `instantiate()`. **Essentieel voor dit spel.**
- [Godot Docs — ParallaxBackground](https://docs.godotengine.org/en/stable/classes/class_parallaxbackground.html) — meescrollende achtergrond.
- [Godot Docs — Timer](https://docs.godotengine.org/en/stable/classes/class_timer.html) — alle opties van het Timer-node.
- YouTube: zoek "Godot 4 endless runner tutorial" — diverse uitlegvideo's beschikbaar.

## Eerste stappen

1. Bouw je speler als losse scene (`speler.tscn`) — net als in de cursus, maar je hoeft niet vooruit te bewegen.
2. Maak een `obstakel.tscn` met een `StaticBody2D` + `Sprite2D` + `Area2D` (voor game-over-detectie).
3. In je wereld-script:

   ```gdscript
   const ObstakelScene = preload("res://obstakel.tscn")

   func _on_spawn_timer_timeout() -> void:
       var obstakel = ObstakelScene.instantiate()
       obstakel.position = $Spawner.position
       add_child(obstakel)
   ```

4. Geef het obstakel een eigen script dat hem naar links beweegt en `queue_free()` aanroept zodra hij buiten beeld is.
5. Voeg een `ParallaxBackground` toe met één of meer `ParallaxLayer`-children voor de scrollende achtergrond.

Polish: maak de snelheid hoger naarmate de score stijgt, voeg verschillende obstakel-types toe (laag/hoog), of voeg power-ups toe als andere instanced scenes.
