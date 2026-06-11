---
sidebar_position: 1
hide_table_of_contents: true
slug: /tweede_level
---

# Een tweede level toevoegen

Tijd om je spel uit te breiden. In deze les maak je een tweede level en zorg je dat de speler automatisch overschakelt zodra hij het einde van het eerste level bereikt.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: hoe laad je een ander level?

Stel je hebt twee level-scènes: `level1.tscn` en `level2.tscn`. **Hoe denk je dat je in code zegt: "Stop met level 1 en start level 2"?**

<details>
<summary>Antwoord</summary>

In Godot doe je dat met één regel:

```gdscript
get_tree().change_scene_to_file("res://level2.tscn")
```

- `get_tree()` geeft je toegang tot de **SceneTree**, het systeem dat al je scènes beheert.
- `change_scene_to_file()` laadt een andere scène en vervangt de huidige.
- `res://` is het projectpad — alles wat in jouw projectmap zit, bereik je via `res://` gevolgd door de bestandsnaam.

</details>

## Stap 1: Maak `level2.tscn`

1. Klik op **Scene** → **New Scene** en kies **2D Scene**. Godot maakt een `Node2D` als root.
2. Bouw een nieuw level op zoals je in [Level tekenen met een TileMap](../03-level-bouwen/tilemap_opzetten.md) en [Collision op je tegels](../03-level-bouwen/tilemap_collision.md) hebt geleerd. Maak hem iets anders dan level 1 — bijvoorbeeld een hogere uitdaging of een ander decor.
3. Voeg een speler toe (sleep `karakter.tscn` vanuit het FileSystem, óf bouw de `CharacterBody2D`-structuur opnieuw op zoals in [Een speelbaar karakter](../04-personage-en-beweging/sprite.md)).
4. Sla op via `Ctrl + S` als `level2.tscn`.

:::tip
Zorg dat je level 1-bestand `level1.tscn` heet (of pas later het pad in je script aan). Sla `world.tscn` eventueel opnieuw op als `level1.tscn` voor duidelijkheid.
:::

## Stap 2: Voeg een vlag toe aan level 1

Aan het einde van level 1 plaats je een "vlag" die de overgang triggert. De opzet lijkt op het muntje uit [Signals & een muntje oppakken](../06-signals-en-score/signals_muntje.md).

1. Open `level1.tscn`.
2. Klik met rechts op de hoofd-node → **Add Child Node** → `Area2D`.
3. Hernoem de `Area2D` naar `Vlag`.
4. Voeg eronder een `Sprite2D` toe en sleep een vlag- of deur-afbeelding naar **Texture**.
5. Voeg ook een `CollisionShape2D` toe met een `RectangleShape2D` (of `CircleShape2D`).
6. Plaats de `Vlag` op de plek waar het level eindigt.

Je Scene Tree ziet er nu zo uit:

```
Level1 (Node2D)
├── ...
└── Vlag (Area2D)
    ├── Sprite2D
    └── CollisionShape2D
```

## Stap 3: Koppel het `body_entered`-signaal

1. Selecteer de `Vlag`-node.
2. Klik op het script-icoontje of klik met rechts → **Attach Script** → **Create**. Sla op als `vlag.gd`.
3. Ga naar het **Node**-tabblad rechts naast de Inspector.
4. Dubbelklik op `body_entered`, kies de `Vlag`-node als ontvanger en klik op **Connect**.

Godot voegt deze functie toe aan je script:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    pass # hier komt je code
```

## Stap 4: Vervang `pass` door de scene-switch

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    get_tree().change_scene_to_file("res://level2.tscn")
```

| Code                                              | Wat doet het?                                                     |
| :------------------------------------------------ | :---------------------------------------------------------------- |
| `get_tree()`                                      | Geeft toegang tot het SceneTree-systeem                           |
| `change_scene_to_file("res://level2.tscn")`       | Vervangt de huidige scène door `level2.tscn`                      |
| `res://`                                          | Verwijst naar je projectmap — `level2.tscn` zit in de hoofdmap    |

:::tip
Heb je `level2.tscn` in een submap opgeslagen? Pas het pad dan aan: `res://levels/level2.tscn` voor een bestand in een `levels`-map.
:::

## Stap 5: Test

Start het spel met `F5` vanaf level 1. Loop je speler naar de vlag — zodra je hem raakt, opent level 2.

Je `Global.score` blijft staan tijdens de overgang (dankzij [Global variables](../06-signals-en-score/global_variables.md)). Wil je per level opnieuw beginnen? Roep `Global.reset()` aan in `_on_body_entered` vóór de scene-switch.

## Opdracht 7.1.a: voeg een derde level toe

Je hebt nu twee levels en kunt switchen. Breid uit: maak een derde level en zorg dat de speler vanuit level 2 daarheen gaat.

<details>
<summary>Klik hier voor een tip!</summary>

- Maak `level3.tscn` op dezelfde manier als level 2.
- Voeg ook in level 2 een `Vlag`-node toe met dezelfde structuur.
- Verbind het `body_entered`-signaal en laad `res://level3.tscn`.

Bonus: voeg op level 3 een vlag toe die teruggaat naar level 1 — dan kan je speler eindeloos rondlopen.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

**Stappen:**

1. Maak `level3.tscn` (Scene → New Scene → 2D Scene → bouw met tegels).
2. Open `level2.tscn` en voeg een `Vlag (Area2D)` met `Sprite2D` + `CollisionShape2D` toe.
3. Koppel een script en het `body_entered`-signaal.
4. Vul de callback:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    get_tree().change_scene_to_file("res://level3.tscn")
```

5. (Bonus) Doe in level 3 hetzelfde, maar dan naar `res://level1.tscn`.

</details>

## Er gaat iets mis

<details>
<summary>Mijn spel crasht met "Cannot open file 'res://level2.tscn'"</summary>

**Oorzaak:** Het pad in je script komt niet overeen met de werkelijke bestandsnaam of -locatie.

**Oplossing:**

1. Open het **FileSystem**-paneel linksonder en zoek `level2.tscn`.
2. Klik met rechts op het bestand → **Copy Path**. Plak dat exact in je script.
3. Let op hoofdletters: `Level2.tscn` is niet hetzelfde als `level2.tscn`.

</details>

<details>
<summary>Mijn speler verdwijnt na de overgang</summary>

**Oorzaak:** `level2.tscn` bevat geen `CharacterBody2D` — elke scène heeft zijn eigen nodes, de speler uit level 1 verdwijnt mee.

**Oplossing:** Voeg in `level2.tscn` zelf een speler toe (zoals in Stap 1 punt 3). Geavanceerder is om de speler als Autoload te draaien zodat hij blijft bestaan over scènes heen — maar dat valt buiten deze les.

</details>

<details>
<summary>Mijn level switcht niet bij contact</summary>

**Oorzaak:** Het signaal is niet (correct) gekoppeld, of de speler heeft geen `CollisionShape2D`.

**Oplossing:**

1. Selecteer de `Vlag` en open het **Node**-tabblad. Staat er een groen pijltje bij `body_entered`?
2. Heeft de speler een `CollisionShape2D` met een **Shape** ingesteld?
3. Heeft de `Vlag` zelf ook een `CollisionShape2D` met **Shape**?

</details>
