---
sidebar_position: 3
slug: /spel-endless_runner
---

# Endless runner

## Het idee

Een eindeloze platform-loop, zoals Geometry Dash of Subway Surfers. De speler beweegt automatisch vooruit (of de wereld komt op hem af) en moet op het juiste moment springen om obstakels te ontwijken. Hoe langer je het volhoudt, hoe hoger je score.

De kern hier is **procedureel spawnen**: obstakels worden tijdens het spelen aangemaakt — je hoeft niet vooraf een level te bouwen.

#### Wat ga je leren?

- Scenes "instantiëren" tijdens het spel met `preload()` + `instantiate()` — dat ken je uit [Spawnen: nodes maken in code](site:godot/docs/spawnen).
- Een `Timer` gebruiken als spawn-klok, zoals in [Automatisch spawnen met een Timer](site:godot/docs/spawn_timer).
- Oude nodes opruimen met `queue_free()` om geheugen vrij te maken.
- Een achtergrond die meeschuift met `ParallaxBackground`. Die node staat niet in de cursus: je zoekt hem op zoals in [Wat nu?](site:godot/docs/meer-leren), onder Zelf een nieuwe node ontdekken.

## Nodes: wat je nodig hebt

| Node | Waarvoor? |
|---|---|
| `CharacterBody2D` | De speler — springt met `velocity.y` zoals in je platformer. |
| `AnimatedSprite2D` | Loop- en spring-animatie. |
| `Node2D` (spawner) | Een onzichtbare positie waar nieuwe obstakels worden aangemaakt. |
| `Timer` | Stuurt op vaste tijden een `timeout`-signaal → spawn een obstakel. |
| `Area2D` (in de obstakel-scène) | Raakt de speler een obstakel → game over. |
| `ParallaxBackground` + `ParallaxLayer` | Een achtergrond die meescrollt voor diepte. |
| `CanvasLayer` + `Label` | Score (op basis van overleefde tijd of gepasseerde obstakels). |

## GDScript-functies: handig voor dit spel

| Functie / property | Wat doet het? |
|---|---|
| `preload("res://obstakel.tscn")` | Leest de obstakel-scène in, klaar om er exemplaren van te maken. |
| `obstakel_scene.instantiate()` | Maakt een nieuw exemplaar van de scène. |
| `add_child(nieuw_obstakel)` | Hangt het obstakel in de wereld zodat het zichtbaar wordt. |
| `nieuw_obstakel.position = spawner.position` | Plaats het obstakel op de spawn-positie. |
| `queue_free()` | Roep dit aan in een obstakel dat links uit beeld is. |
| `Timer.timeout` (signal) | Trigger om elke X seconden een nieuw obstakel te spawnen. |
| `randi_range(0, 2)` | Een willekeurig heel getal van 0 tot en met 2, om een soort obstakel te kiezen. |
| `randf_range(0.5, 1.5)` | Variatie in spawn-interval voor minder voorspelbaarheid. |
| `get_tree().reload_current_scene()` | Laadt de scène opnieuw: het spel begint van voren af aan. |

## Zo begin je

### Bouw de kern

1. Bouw je speler als losse scène (`speler.tscn`), zoals `karakter.tscn` in [Een tweede level toevoegen](site:godot/docs/tweede_level). Hij hoeft niet vooruit te bewegen: de obstakels komen naar hem toe.
2. Maak een `obstakel.tscn`: een `Area2D` met een `Sprite2D` en een `CollisionShape2D`, zoals het muntje. Koppel `body_entered` aan een functie die `get_tree().reload_current_scene()` aanroept: game over.
3. Laat het obstakel in zijn eigen script naar links schuiven: `position.x -= 300 * delta` in `_process(delta)`. Roep `queue_free()` aan zodra `position.x` links van je scherm ligt.

### De spawner

In je wereld-script maakt een Timer steeds een nieuw obstakel:

```gdscript
const OBSTAKEL = preload("res://obstakel.tscn")

func _on_spawn_timer_timeout() -> void:
    var obstakel = OBSTAKEL.instantiate()
    obstakel.position = $Spawner.position
    add_child(obstakel)
```

Dit is de spawner uit [Spawnen: nodes maken in code](site:godot/docs/spawnen) en [Automatisch spawnen met een Timer](site:godot/docs/spawn_timer), met een `$Spawner`-node als spawn-positie in plaats van losse coördinaten.

Voeg als laatste een `ParallaxBackground` toe met één of meer `ParallaxLayer`-children voor de schuivende achtergrond.

## Uitbreidingen

- Een hogere snelheid naarmate de score stijgt.
- Verschillende soorten obstakels, laag en hoog, met hun scènes in een lijst (zie [Lijsten: één vlag voor al je levels](site:godot/docs/lijsten)).
- Power-ups die op je af komen, zoals in [Een power-up: tijdelijk hoger springen](site:godot/docs/power_up).
- Een highscore die blijft, zoals in [JSON: een highscore die blijft](site:godot/docs/json_opslaan).

Meer lezen:

- [Godot Docs: Instancing](https://docs.godotengine.org/en/stable/getting_started/step_by_step/instancing.html): verdieping op `preload()` en `instantiate()`.
- [Godot Docs: ParallaxBackground](https://docs.godotengine.org/en/stable/classes/class_parallaxbackground.html): de achtergrond die meeschuift.
- [Godot Docs: Timer](https://docs.godotengine.org/en/stable/classes/class_timer.html): alle opties van de Timer-node.
