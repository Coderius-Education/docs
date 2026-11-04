---
sidebar_position: 4
slug: /json_opslaan
---

# JSON: een highscore die blijft

Je score staat in `Global`, en die is weg zodra je het spel afsluit. Een highscore die er morgen nog staat, moet in een bestand. Je schrijft hem als **JSON**: dezelfde tekstvorm die je in Python met `json.dump` maakte.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/bestanden/14e-json', label: 'JSON'},
    {site: 'python', to: '/docs/bestanden/14f-json-bestand', label: 'JSON in een bestand'},
  ]}
/>

## Voorspel: wat wordt de tekst?

Een dictionary kun je niet zomaar in een bestand zetten: een bestand bevat tekst. `JSON.stringify` maakt van een dictionary tekst:

```gdscript
extends Node

func _ready() -> void:
    print(JSON.stringify({"highscore": 40, "naam": "Sam"}))
```

**Wat print dit?** En wat zou er in Python uitkomen met `json.dumps`?

<details>
<summary>Antwoord</summary>

```
{"highscore":40,"naam":"Sam"}
```

Bijna hetzelfde als je dictionary, maar zonder spaties. Python zet er na elke dubbele punt en komma wel een spatie: `{"highscore": 40, "naam": "Sam"}`. Allebei is het JSON, en allebei lezen ze het andere weer in.

Die tekst kan in een bestand, en een bestand blijft staan als je het spel afsluit. Je score in `Global` niet: bij de volgende start begint `global.gd` weer bij `var score = 0`.

</details>

## Een bestand in `user://` \{#json}

Je kent `res://` al: de map van je project. Na het [exporteren](site:godot/docs/exporteren) zit die map ingepakt in je spel, en dan kan je spel er niet meer in schrijven. Voor bestanden die het spel zelf maakt, is er `user://`:

| Pad       | Wat staat erin?                                 | Kan je spel erin schrijven? |
| :-------- | :---------------------------------------------- | :-------------------------- |
| `res://`  | Je project: scènes, scripts, afbeeldingen       | in de editor wel, na het exporteren niet |
| `user://` | Wat je spel zelf bewaart, zoals een highscore   | altijd                      |

Speel je vanuit de editor, dan lukt schrijven in `res://` dus wel. Gebruik het toch niet: je spel werkt dan tot je het exporteert, en daarna niet meer.

## Stap 1: Een highscore bijhouden

Zet in `global.gd`, onder de variabelen die er al staan:

```gdscript
var highscore = 0

func controleer_highscore() -> void:
    if score > highscore:
        highscore = score
```

Roep `Global.controleer_highscore()` aan op het moment dat een potje klaar is. In je spel kan dat op twee plekken.

Je gaat game over. Dat gebeurt in je vijand-script uit opdracht 7.3.a: daar gaat er een leven af. Kijk in `_on_body_entered` met `is_game_over()` of het het laatste was. De rest van je vijand-script, zoals `stop()` uit opdracht 7.5.b, blijft staan.

{/* compileer-als: extends Area2D */}

```gdscript
func _on_body_entered(body: Node2D) -> void:
    Global.levens -= 1
    print("Levens: ", Global.levens)
    if Global.is_game_over():
        Global.controleer_highscore()
    queue_free()
```

Of je haalt het laatste level. Heb je de vlag uit [Lijsten](site:godot/docs/lijsten), dan is dat in de `else`, vlak voordat je teruggaat naar het menu:

```gdscript
    else:
        Global.controleer_highscore()
        get_tree().change_scene_to_file("res://menu.tscn")
```

Heb je die vlag niet, zet de regel dan in het script van de vlag in je laatste level, vóór `change_scene_to_file`.

## Stap 2: De highscore wegschrijven

Nu de highscore het potje overleeft, moet hij ook het afsluiten overleven. Zet in `global.gd` een functie die hem in een bestand zet:

```gdscript
const BESTAND = "user://highscore.json"

func bewaar_highscore() -> void:
    var gegevens = {"highscore": highscore}
    var bestand = FileAccess.open(BESTAND, FileAccess.WRITE)
    bestand.store_string(JSON.stringify(gegevens))
```

|                   Code                   | Wat doet het?                                                    |
| :--------------------------------------: | :--------------------------------------------------------------- |
| `FileAccess.open(BESTAND, FileAccess.WRITE)` | Opent het bestand om in te schrijven. Bestaat het nog niet, dan maakt Godot het |
| `JSON.stringify(gegevens)`               | Maakt van je dictionary een tekst: `{"highscore":40}`             |
| `bestand.store_string(...)`              | Schrijft die tekst in het bestand                                 |

Roep hem aan in `controleer_highscore`, zodat een nieuwe highscore meteen wordt bewaard:

```gdscript
func controleer_highscore() -> void:
    if score > highscore:
        highscore = score
        bewaar_highscore()
```

Speel een potje uit. Kies daarna in Godot **Project** en dan **Open User Data Folder**. Er gaat een map open met `highscore.json` erin. Open het bestand met een teksteditor, zoals Kladblok: er staat `{"highscore":40}`, of jouw score.

## Stap 3: De highscore inlezen

Bij de start van het spel lees je het bestand weer in. Een Autoload maakt Godot als allereerste, dus `_ready()` in `global.gd` is de goede plek:

```gdscript
func _ready() -> void:
    lees_highscore()


func lees_highscore() -> void:
    if not FileAccess.file_exists(BESTAND):
        return
    var bestand = FileAccess.open(BESTAND, FileAccess.READ)
    var gegevens = JSON.parse_string(bestand.get_as_text())
    highscore = int(gegevens["highscore"])
```

De eerste keer dat iemand je spel speelt, is er nog geen bestand. Daarom kijk je eerst met `file_exists`, en stop je met `return` als het er niet is. De highscore blijft dan `0`.

`JSON.parse_string` doet het omgekeerde van `stringify`: van de tekst maakt hij weer een dictionary. Waarom er `int()` omheen staat, lees je bij [Er gaat iets mis](#er-gaat-iets-mis).

## Stap 4: Alles bij elkaar

Zo ziet `global.gd` eruit met de highscore erbij, en met wat er uit de eerdere lessen al in stond: `reset()`, `verlies_leven()` en `is_game_over()` uit [Global variables](site:godot/docs/global_variables), en de lijst `level_volgorde` uit opdracht 10.2.a van [Lijsten](site:godot/docs/lijsten). Heb je de lijst niet in `Global` gezet, dan laat je die regel weg. Heeft jouw versie nog meer, dan laat je dat staan.

```gdscript
extends Node

const BESTAND = "user://highscore.json"

var score = 0
var levens = 3
var level_volgorde = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]
var highscore = 0

func _ready() -> void:
    lees_highscore()


func reset():
    score = 0
    levens = 3


func verlies_leven():
    levens -= 1
    if levens <= 0:
        print("Game Over!")


func is_game_over() -> bool:
    return levens <= 0


func controleer_highscore() -> void:
    if score > highscore:
        highscore = score
        bewaar_highscore()


func bewaar_highscore() -> void:
    var gegevens = {"highscore": highscore}
    var bestand = FileAccess.open(BESTAND, FileAccess.WRITE)
    bestand.store_string(JSON.stringify(gegevens))


func lees_highscore() -> void:
    if not FileAccess.file_exists(BESTAND):
        return
    var bestand = FileAccess.open(BESTAND, FileAccess.READ)
    var gegevens = JSON.parse_string(bestand.get_as_text())
    highscore = int(gegevens["highscore"])
```

Speel een potje, sluit het spel, en start opnieuw. Print `Global.highscore` in het menu: hij staat er nog.

## Opdracht 10.4.a: de highscore in het menu

Zet in het menu uit [Een startmenu](site:godot/docs/start_menu) een `Label` onder de knoppen, met de tekst `Highscore: 40`, of welke highscore er bewaard is.

<details>
<summary>Klik hier voor een tip.</summary>

- Voeg een `Label` toe in de `VBoxContainer` en hernoem het naar `Highscore`.
- In `menu.gd` zet je de tekst in `_ready()`. Het label staat ín de `VBoxContainer`, dus het pad is `$VBoxContainer/Highscore`: eerst de node waarin hij zit, een schuine streep, dan zijn eigen naam.
- `Global.highscore` is een getal. Voor tekst gebruik je `str()`, net als bij de score op het scherm.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Zet in `menu.gd`, onder `extends Control`, deze functie. De functies van je knoppen blijven eronder staan zoals ze waren.

```gdscript
func _ready() -> void:
    $VBoxContainer/Highscore.text = "Highscore: " + str(Global.highscore)
```

</details>

## Opdracht 10.4.b: hoe vaak is er gespeeld?

Houd bij hoe vaak iemand op Start heeft gedrukt, ook over het afsluiten heen, en toon dat in het menu: `Gespeeld: 5 keer`.

<details>
<summary>Klik hier voor een tip.</summary>

- Je dictionary mag meer dan één sleutel hebben: `{"highscore": highscore, "gespeeld": gespeeld}`.
- De functie schrijft nu meer dan de highscore. Geef hem een naam die dat zegt, zoals `bewaar_gegevens()`, en pas de aanroep mee aan.
- Wat je wegschrijft, moet je ook weer inlezen. Een oud bestand heeft nog geen sleutel `"gespeeld"`; met `get` en een reservewaarde gaat dat goed.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

In `global.gd` komt `gespeeld` erbij, en heten de functies voor het bestand nu `bewaar_gegevens` en `lees_gegevens`:

```gdscript
extends Node

const BESTAND = "user://highscore.json"

var score = 0
var levens = 3
var level_volgorde = ["res://level1.tscn", "res://level2.tscn", "res://level3.tscn"]
var highscore = 0
var gespeeld = 0

func _ready() -> void:
    lees_gegevens()


func reset():
    score = 0
    levens = 3


func verlies_leven():
    levens -= 1
    if levens <= 0:
        print("Game Over!")


func is_game_over() -> bool:
    return levens <= 0


func controleer_highscore() -> void:
    if score > highscore:
        highscore = score
        bewaar_gegevens()


func bewaar_gegevens() -> void:
    var gegevens = {"highscore": highscore, "gespeeld": gespeeld}
    var bestand = FileAccess.open(BESTAND, FileAccess.WRITE)
    bestand.store_string(JSON.stringify(gegevens))


func lees_gegevens() -> void:
    if not FileAccess.file_exists(BESTAND):
        return
    var bestand = FileAccess.open(BESTAND, FileAccess.READ)
    var gegevens = JSON.parse_string(bestand.get_as_text())
    highscore = int(gegevens["highscore"])
    gespeeld = int(gegevens.get("gespeeld", 0))
```

In `menu.gd` zet je een tweede regel in `_ready()`, voor een label `Gespeeld`:

```gdscript
func _ready() -> void:
    $VBoxContainer/Highscore.text = "Highscore: " + str(Global.highscore)
    $VBoxContainer/Gespeeld.text = "Gespeeld: " + str(Global.gespeeld) + " keer"
```

En in `_on_start_pressed()` tel je er één bij en bewaar je meteen, vóór de regels die er al stonden:

```gdscript
func _on_start_pressed() -> void:
    Global.gespeeld += 1
    Global.bewaar_gegevens()
    Global.reset()
    get_tree().change_scene_to_file("res://level1.tscn")
```

Het tellen staat in het menu en niet in `reset()`: die roep je misschien ook aan bij elk nieuw level, en dan telt hij levels in plaats van potjes.

</details>

## Er gaat iets mis

<details>
<summary>Mijn highscore staat er als 40.0</summary>

**Oorzaak:** JSON maakt geen verschil tussen hele getallen en kommagetallen. Bij het inlezen maakt Godot van elk getal een kommagetal, dus `40` komt terug als `40.0`.

**Oplossing:** zet er `int()` omheen bij het inlezen, zoals in Stap 3: `highscore = int(gegevens["highscore"])`.

**Zelf vinden:** print `gegevens` in `lees_highscore`. Je ziet dan `{ "highscore": 40.0 }`: het bestand zelf is goed, het inlezen maakt er een kommagetal van.

</details>

<details>
<summary>Na het opnieuw starten is mijn highscore weer 0</summary>

**Oorzaak:** het bestand wordt niet geschreven, of niet gelezen. Vaak wordt `controleer_highscore()` niet aangeroepen op de plek waar jouw potje eindigt: je ging game over, maar alleen de vlag roept hem aan. Of `lees_highscore()` staat niet in `_ready()`.

**Oplossing:** kijk of je vijand-script én de vlag van je laatste level `Global.controleer_highscore()` aanroepen, zoals in Stap 1, en of `_ready()` in `global.gd` `lees_highscore()` aanroept.

**Zelf vinden:** open met **Open User Data Folder** de map van je spel. Staat er geen `highscore.json`, dan wordt er niets geschreven: zet een `print` in `bewaar_highscore`. Staat het bestand er wel, met de goede score erin, dan wordt het niet gelezen: zet een `print` in `lees_highscore`.

</details>

<details>
<summary>Invalid access to property or key 'highscore' on a base object of type 'Nil'.</summary>

```
Invalid access to property or key 'highscore' on a base object of type 'Nil'.
```

**Oorzaak:** `JSON.parse_string` kon de tekst in het bestand niet lezen, en gaf `null` terug. Dat gebeurt als je het bestand met de hand hebt aangepast en er een aanhalingsteken of accolade uit is gegaan. In **Uitvoer** staat erboven `Parse JSON failed`.

Zo zie je de melding zelf, in een los script aan een lege `Node` (start de scène met `F6`):

{/* verwacht-runtime-fout: Invalid access to property or key 'highscore' on a base object of type 'Nil'. */}

```gdscript
# FOUT
extends Node

func _ready() -> void:
    var gegevens = JSON.parse_string("{highscore: 40")
    print(gegevens["highscore"])
```

**Oplossing:** verbeter het bestand, of gooi het weg; bij de volgende highscore maakt het spel een nieuw. Wil je dat het spel zo'n kapot bestand overslaat, controleer dan eerst wat je terugkrijgt:

```gdscript
    var gegevens = JSON.parse_string(bestand.get_as_text())
    if gegevens == null:
        return
```

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
