---
sidebar_position: 1
slug: /tweede_level
---

# Een tweede level toevoegen

Tijd om je spel uit te breiden. In deze les maak je een tweede level en zorg je dat de speler automatisch overschakelt zodra hij het einde van het eerste level bereikt.

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

## Stap 1: Level 2 maken

### Karakter als eigen scène

Level 2 heeft hetzelfde karakter nodig als level 1, met zijn script, zijn animaties en zijn camera. Dat karakter zit nu in je eerste level, `world.tscn`. Bewaar het als eigen scène, dan kun je het in elk level zetten, net als `muntje.tscn`:

1. Open `world.tscn`.
2. Klik in de Scene Tree met rechts op je `CharacterBody2D` en kies **Save Branch as Scene**.
3. Sla op als `karakter.tscn`.

In het FileSystem staat nu `karakter.tscn`, met je karakter en alles wat eronder hangt.

Doe hetzelfde met de `CanvasLayer` waar je score in staat, en sla die op als `scorebord.tscn`. Zonder scorebord zie je in level 2 geen score.

### Hernoemen en bouwen

#### Hernoem `world.tscn`

Je eerste level heet nog `world.tscn`. Vanaf deze les heet het `level1.tscn`: de lessen hierna gaan van die naam uit.

1. Klik in het **FileSystem**-paneel met rechts op `world.tscn` en kies **Rename**. Noem het bestand `level1.tscn`.
2. Ga naar **Project** → **Project Settings** en typ `main scene` in de zoekbalk bovenin. Staat daar een ander bestand dan `level1.tscn`, klik dan op het mapje en kies `level1.tscn`.

De Main Scene is de scène die start als je op `F5` drukt. Die stelde je in bij [Je eerste 2D-scène](site:godot/docs/scene).

#### Bouw level 2

1. Klik op **Scene** → **New Scene** en kies **2D Scene**. Godot maakt een `Node2D` als root.
2. Bouw een nieuw level op zoals je in [Level tekenen met een TileMap](site:godot/docs/tilemap_opzetten) en [Collision op je tegels](site:godot/docs/tilemap_collision) hebt geleerd. Maak het iets anders dan level 1, bijvoorbeeld moeilijker of met een ander decor.
3. Sleep `karakter.tscn` en `scorebord.tscn` vanuit het FileSystem naar je level, zoals je dat met `muntje.tscn` deed.
4. Sla op via `Ctrl + S` als `level2.tscn`.

## Stap 2: De vlag

Aan het einde van level 1 plaats je een "vlag" die de overgang triggert. De opzet lijkt op het muntje uit [Signals & een muntje oppakken](site:godot/docs/signals_muntje).

1. Open `level1.tscn`.
2. Klik met rechts op de hoofd-node → **Add Child Node** → `Area2D`.
3. Hernoem de `Area2D` naar `Vlag`.
4. Voeg eronder een `Sprite2D` toe en sleep een vlag- of deur-afbeelding naar **Texture**.
5. Voeg ook een `CollisionShape2D` toe met een `RectangleShape2D` (of `CircleShape2D`).
6. Plaats de `Vlag` op de plek waar het level eindigt.

Je Scene Tree ziet er nu zo uit:

```
Node2D (de root van level 1)
├── ...
└── Vlag (Area2D)
    ├── Sprite2D
    └── CollisionShape2D
```

## Stap 3: `body_entered` koppelen

De vlag krijgt een script, en het `body_entered`-signaal dat je van het muntje kent.

1. Selecteer de `Vlag`-node.
2. Klik op het script-icoontje of klik met rechts → **Attach Script** → **Create**. Sla op als `vlag.gd`.
3. Ga naar het **Node**-tabblad rechts naast de Inspector.
4. Dubbelklik op `body_entered`, kies de `Vlag`-node als ontvanger en klik op **Connect**.

Godot voegt deze functie toe aan je script:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    pass # hier komt je code
```

## Stap 4: Naar level 2 \{#change-scene}

Vervang in `vlag.gd` de regel met `pass` door de scene-switch:

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

Start het spel met `F5` vanaf level 1 en loop naar de vlag: zodra je hem raakt, opent level 2. Je `Global.score` blijft staan tijdens de overgang (dankzij [Global variables (Autoload)](site:godot/docs/global_variables)), en het scorebord in level 2 laat hem zien. Wil je per level opnieuw beginnen? Roep `Global.reset()` aan in `_on_body_entered` vóór de scene-switch.

## Opdracht 8.1.a: voeg een derde level toe

Je hebt nu twee levels en kunt switchen. Breid uit: maak een derde level en zorg dat de speler vanuit level 2 daarheen gaat.

<details>
<summary>Klik hier voor een tip.</summary>

- Maak `level3.tscn` op dezelfde manier als level 2.
- Voeg ook in level 2 een `Vlag`-node toe met dezelfde structuur.
- Verbind het `body_entered`-signaal en laad `res://level3.tscn`.

Bonus: voeg op level 3 een vlag toe die teruggaat naar level 1 — dan kan je speler eindeloos rondlopen.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

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
<summary>Foutmelding: <code>Cannot open file 'res://Level2.tscn'.</code></summary>

**Oorzaak:** Het pad in je script komt niet overeen met de werkelijke bestandsnaam of -locatie. Je spel blijft dan in het level waar je was, en in Uitvoer staat deze melding. Hier staat er een hoofdletter in het pad die de bestandsnaam niet heeft.

{/* verwacht-runtime-fout: Cannot open file 'res://Level2.tscn'. */}

```gdscript
# FOUT
extends Area2D

func _ready() -> void:
    get_tree().change_scene_to_file("res://Level2.tscn")
```

**Oplossing:**

1. Open het **FileSystem**-paneel linksonder en zoek `level2.tscn`.
2. Klik met rechts op het bestand → **Copy Path**. Plak dat exact in je script.
3. Let op hoofdletters: `Level2.tscn` is niet hetzelfde als `level2.tscn`.
4. Staat het bestand in een submap, dan hoort die in het pad: `res://levels/level2.tscn` voor een bestand in een `levels`-map.

</details>

<details>
<summary>Mijn speler verdwijnt na de overgang</summary>

**Oorzaak:** `level2.tscn` bevat geen `CharacterBody2D` — elke scène heeft zijn eigen nodes, de speler uit level 1 verdwijnt mee.

**Oplossing:** Sleep `karakter.tscn` in `level2.tscn`, zoals in het tabblad Level 2 maken, stap Hernoemen en bouwen. Geavanceerder is om de speler als Autoload te draaien zodat hij blijft bestaan over scènes heen — maar dat valt buiten deze les.

</details>

<details>
<summary>Mijn level switcht niet bij contact</summary>

**Oorzaak:** Het signaal is niet (correct) gekoppeld, of de speler heeft geen `CollisionShape2D`.

**Oplossing:**

1. Selecteer de `Vlag` en open het **Node**-tabblad. Staat er een groen pijltje bij `body_entered`?
2. Heeft de speler een `CollisionShape2D` met een **Shape** ingesteld?
3. Heeft de `Vlag` zelf ook een `CollisionShape2D` met **Shape**?
4. Start `F5` het level waar je de vlag in zette? Kijk in Project → Project Settings, bij `main scene`, of daar `level1.tscn` staat.

**Zelf vinden:** zet een `print("vlag geraakt")` in `_on_body_entered`. Zo weet je meteen of het probleem in de scène zit (de functie wordt nooit aangeroepen) of in het pad naar je level.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
