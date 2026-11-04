---
sidebar_position: 2
slug: /lijsten
---

# Lijsten: één vlag voor al je levels

In [Een tweede level](site:godot/docs/tweede_level) kreeg elk level een eigen vlag met een eigen script. Die scripts verschillen maar in één woord: de naam van het volgende level. Bij tien levels heb je tien bijna gelijke scripts, en wil je de volgorde veranderen, dan pas je er een paar aan. Met een **lijst** zet je de volgorde op één plek, en werkt dezelfde vlag in elk level.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/data/10a-lijsten-basis', label: 'Lijsten'},
  ]}
/>

## Voorspel: wat print dit?

```gdscript
extends Node

var levels = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]

func _ready() -> void:
    print(levels[1])
    print(levels.size())
```

**Welke twee regels verschijnen er in Uitvoer?** Denk het eerst uit. Wil je het daarna proberen: maak een nieuwe scène met een lege `Node`, hang dit script eraan, en start alleen die scène met `F6`.

<details>
<summary>Antwoord</summary>

```
res://level2.tscn
3
```

Een lijst telt vanaf `0`, net als in Python. `levels[0]` is level 1, dus `levels[1]` is het tweede item: level 2. `size()` geeft het aantal items, en dat zijn er drie.

</details>

## Een lijst in GDScript \{#lijst}

Een lijst (in Godot heet hij een `Array`) schrijf je met blokhaken, en de items scheid je met komma's. Op Python lijkt het sterk, maar een paar namen zijn anders:

|            Code             | Wat doet het?                                          | In Python      |
| :-------------------------: | :----------------------------------------------------- | :------------- |
| `levels[0]`                 | Het eerste item                                        | hetzelfde      |
| `levels.size()`             | Hoeveel items er in de lijst staan                     | `len(levels)`  |
| `levels.find("res://level2.tscn")` | Op welke plek dat item staat, of `-1` als het er niet in staat | – (nieuw) |
| `levels.append("res://level4.tscn")` | Zet een item achteraan erbij                  | hetzelfde      |

## Stap 1: Zet de volgorde in een lijst

Open `vlag.gd`, het script van de vlag in level 1. Zet bovenaan, onder `extends Area2D`, een lijst met al je levels in de volgorde waarin je ze speelt. Hier zijn dat er drie, zoals na opdracht 8.1.a; heb je er twee, zet er dan twee in.

```gdscript
extends Area2D

var levels = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]
```

Heten jouw levels anders, of staan ze in een map? Gebruik dan dezelfde paden als in je `change_scene_to_file`.

## Stap 2: Waar ben je nu?

De vlag moet weten in welk level hij staat. Dat vraag je aan Godot:

```gdscript
get_tree().current_scene.scene_file_path
```

Dat geeft het pad van de scène die nu speelt, bijvoorbeeld `"res://level1.tscn"`. Met `find` zoek je op waar dat pad in je lijst staat:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    var nu = levels.find(get_tree().current_scene.scene_file_path)
    print(nu)
```

Start je spel en loop naar de vlag. In **Uitvoer** zie je `0`: je staat in het eerste level van de lijst.

## Stap 3: Naar het volgende level

Het volgende level staat één plek verder in de lijst. Maar na het laatste level is er geen volgende, dus dat controleer je eerst:

```gdscript
extends Area2D

var levels = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]

func _on_body_entered(body: Node2D) -> void:
    var nu = levels.find(get_tree().current_scene.scene_file_path)
    var volgende = nu + 1
    if volgende < levels.size():
        get_tree().change_scene_to_file(levels[volgende])
    else:
        get_tree().change_scene_to_file("res://menu.tscn")
```

Na het laatste level ga je terug naar het menu uit [Een startmenu](site:godot/docs/start_menu).

## Stap 4: Dezelfde vlag in elk level

Elk level heeft een vlag nodig, ook het laatste: daar brengt hij je terug naar het menu. Heeft een level er nog geen, bouw hem dan zoals in [Een tweede level](site:godot/docs/tweede_level), Stap 2 en 3, en kies bij het script `vlag.gd` in plaats van een nieuw script.

Heeft een level al een vlag met een eigen script, open dan dat level, selecteer de `Vlag`-node en sleep `vlag.gd` vanuit **FileSystem** op de node. De koppeling met `body_entered` blijft staan, want de functie heet in elk script `_on_body_entered`.

Start het spel vanaf level 1 en speel alle levels uit. Na het laatste level kom je in het menu.

Wil je de volgorde omgooien, dan pas je alleen de lijst aan. Een nieuw level zet je in de lijst en geef je een vlag met `vlag.gd`; de vlaggen in de andere levels hoef je niet meer open te maken.

## Opdracht 10.2.a: welk level speel je?

Zet linksboven in elk level een `Label` met de tekst `Level 2 van 3`, met het juiste nummer. Het label rekent dat zelf uit.

<details>
<summary>Klik hier voor een tip.</summary>

- Bouw het label zoals de score in [Score op het scherm](site:godot/docs/score_op_scherm): een `CanvasLayer` met een `Label` erin, en een script aan het label.
- De tekst verandert niet tijdens het level, dus je zet hem één keer in `_ready()`, niet elke frame in `_process`.
- `find` geeft `0` voor het eerste level. Wat moet je erbij optellen om `1` te krijgen?
- Het label heeft ook de lijst nodig. Kopiëren werkt, maar dan staat hij op twee plekken. Kijk of je hem in `Global` kunt zetten, met een naam die niet op `levens` lijkt.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Zet de lijst in `global.gd`, onder de variabelen die er al staan, zodat de vlag en het label dezelfde gebruiken. Geef hem daar een langere naam: `levels` verschilt maar één letter van `levens`, dat er ook staat, en dan is `Global.levens.find(...)` een tikfout die je lang zoekt.

```gdscript
var level_volgorde = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]
```

Het script van het label:

```gdscript
extends Label

func _ready() -> void:
    var nu = Global.level_volgorde.find(get_tree().current_scene.scene_file_path)
    text = "Level " + str(nu + 1) + " van " + str(Global.level_volgorde.size())
```

En in `vlag.gd` haal je de eigen lijst weg en schrijf je overal `Global.level_volgorde` waar `levels` stond:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    var nu = Global.level_volgorde.find(get_tree().current_scene.scene_file_path)
    var volgende = nu + 1
    if volgende < Global.level_volgorde.size():
        get_tree().change_scene_to_file(Global.level_volgorde[volgende])
    else:
        get_tree().change_scene_to_file("res://menu.tscn")
```

</details>

## Er gaat iets mis

<details>
<summary>Invalid access of index '3' on a base object of type: 'Array'.</summary>

```
Invalid access of index '3' on a base object of type: 'Array'.
```

**Oorzaak:** je vraagt een item op dat niet bestaat. Een lijst met drie items heeft de plekken `0`, `1` en `2`; plek `3` is er niet. Dat gebeurt als je na het laatste level toch `levels[volgende]` opvraagt.

Zo zie je de melding zelf, in een los script aan een lege `Node` (start de scène met `F6`):

{/* verwacht-runtime-fout: Invalid access of index '3' on a base object of type: 'Array'. */}

```gdscript
# FOUT
extends Node

var levels = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]

func _ready() -> void:
    var volgende = 3
    print(levels[volgende])
```

**Oplossing:** controleer eerst of `volgende < levels.size()`, zoals in Stap 3. Let op het `<`: met `<=` zit je er precies één naast.

</details>

<details>
<summary>Na level 1 begint level 1 opnieuw</summary>

**Oorzaak:** `find` vond het pad van je level niet in de lijst en gaf `-1`. Dan is `volgende` gelijk aan `0`, en dat is level 1. Meestal klopt het pad in de lijst niet precies, bijvoorbeeld omdat je levels in een map `levels/` staan.

**Oplossing:** schrijf de paden in de lijst precies zoals ze in FileSystem staan. Klik met rechts op een scène in FileSystem en kies **Copy Path** om het pad te kopiëren.

**Zelf vinden:** print `get_tree().current_scene.scene_file_path` en `nu` in `_on_body_entered`. Zie je `-1`, leg het geprinte pad dan naast je lijst.

</details>

<details>
<summary>Cannot open file 'res://level4.tscn'.</summary>

```
Cannot open file 'res://level4.tscn'.
```

**Oorzaak:** in je lijst staat een level dat niet bestaat. Je hebt bijvoorbeeld drie levels, en in de lijst staat ook al `level4.tscn`, dat je nog wilde maken. Je blijft dan in het level waar je was.

{/* verwacht-runtime-fout: Cannot open file 'res://level4.tscn'. */}

```gdscript
# FOUT
extends Node

func _ready() -> void:
    get_tree().change_scene_to_file("res://level4.tscn")
```

**Oplossing:** zet alleen levels in de lijst die in FileSystem staan, met precies dat pad.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
