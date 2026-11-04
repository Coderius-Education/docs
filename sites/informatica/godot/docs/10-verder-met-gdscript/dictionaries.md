---
sidebar_position: 3
slug: /dictionaries
---

# Dictionaries: muntjes van brons, zilver en goud

Elk muntje is nu één punt waard. Een goud muntje dat tien punten oplevert, maakt je level spannender: je springt er een extra keer voor. Je kunt daar drie muntje-scènes voor maken, maar dan heb je drie scripts die bijna gelijk zijn. Met een **dictionary** zet je de waarde van elke soort in één tabel.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/data/11a-dictionaries-basis', label: 'Dictionaries'},
  ]}
/>

## Voorspel: wat print dit?

```gdscript
extends Node

var waardes = {"brons": 1, "zilver": 5, "goud": 10}

func _ready() -> void:
    print(waardes["goud"])
    print(waardes["brons"] + waardes["zilver"])
```

**Welke twee getallen verschijnen er in Uitvoer?**

<details>
<summary>Antwoord</summary>

```
10
6
```

`waardes["goud"]` zoekt de sleutel `"goud"` op en geeft wat erbij hoort: `10`. In de tweede regel tel je de waarde van brons (`1`) en zilver (`5`) op.

</details>

## Een dictionary in GDScript \{#dictionary}

Een lijst zoek je op met een plek: `levels[0]`. Een dictionary zoek je op met een **sleutel**: een woord dat je zelf kiest. Je schrijft hem met accolades, en elke sleutel krijgt met een dubbele punt zijn waarde:

```gdscript
var waardes = {"brons": 1, "zilver": 5, "goud": 10}
```

|             Code              | Wat doet het?                                         |
| :---------------------------: | :---------------------------------------------------- |
| `waardes["goud"]`             | De waarde bij de sleutel `"goud"`                     |
| `waardes["platina"] = 25`     | Zet er een sleutel bij, of verandert de waarde        |
| `waardes.has("platina")`      | `true` als de sleutel erin staat                      |
| `waardes.get("hout", 0)`      | De waarde, of `0` als de sleutel er niet in staat     |

Dat is hetzelfde als in Python. Alleen `has` is anders: in Python schrijf je `"platina" in waardes`.

## Stap 1: De waarde uit de tabel

Open het script van je muntje. Nu staat er `Global.score += 1`. Zet er een tabel boven, en een variabele met de soort van dit muntje:

```gdscript
extends Area2D

const WAARDES = {"brons": 1, "zilver": 5, "goud": 10}

var soort = "goud"

func _on_body_entered(body: Node2D) -> void:
    Global.score += WAARDES[soort]
    print("Score: ", Global.score)
    queue_free()
```

De tabel verandert niet tijdens het spel, dus het is een `const`, met een naam in hoofdletters. Zo deed je het ook met `SPEED`.

Start je spel en pak een muntje. In **Uitvoer** gaat de score met tien omhoog.

## Stap 2: Elk muntje een eigen soort \{#export}

Nu is elk muntje goud. Je wilt per muntje in je level kunnen kiezen welke soort het is. Zet daarvoor `@export` voor de variabele:

```gdscript
@export var soort = "brons"
```

Sla op en selecteer een muntje in je level. In de Inspector staat nu een veld Soort, met `brons` erin. Dat veld komt van `@export`: het zet een variabele uit je script in de Inspector, zodat je hem per node kunt invullen zonder het script te veranderen.

Zet bij een paar muntjes `zilver` of `goud` in het veld, en speel je level. Elk muntje telt nu zijn eigen waarde.

Wil je er later een soort bij, platina voor 25 punten? Dan zet je één sleutel in de tabel, en verder hoeft er niets te veranderen.

## Opdracht 10.3.a: de kleur van de soort

Je ziet nog niet welk muntje goud is. Geef elk muntje bij de start de kleur van zijn soort, met een tweede dictionary.

<details>
<summary>Klik hier voor een tip.</summary>

- Maak een tweede `const` met de sleutels `"brons"`, `"zilver"` en `"goud"`, en als waardes `Color.SANDY_BROWN`, `Color.SILVER` en `Color.GOLD`.
- Elke node heeft een eigenschap `modulate`: een kleur die over de afbeelding heen gaat.
- De kleur hoeft maar één keer gezet te worden, als het muntje in het level verschijnt. Welke functie roept Godot dan aan?

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends Area2D

const WAARDES = {"brons": 1, "zilver": 5, "goud": 10}
const KLEUREN = {"brons": Color.SANDY_BROWN, "zilver": Color.SILVER, "goud": Color.GOLD}

@export var soort = "brons"

func _ready() -> void:
    modulate = KLEUREN[soort]


func _on_body_entered(body: Node2D) -> void:
    Global.score += WAARDES[soort]
    print("Score: ", Global.score)
    queue_free()
```

`modulate` mengt de kleur met die van je afbeelding. Een witte of grijze afbeelding kleurt het mooist; een geel muntje wordt met zilver alleen wat donkerder.

</details>

## Er gaat iets mis

<details>
<summary>Invalid access to property or key 'Goud' on a base object of type 'Dictionary'.</summary>

```
Invalid access to property or key 'Goud' on a base object of type 'Dictionary'.
```

**Oorzaak:** de sleutel staat niet in je dictionary. Hier staat in de Inspector `Goud` in het veld Soort, met een hoofdletter. Voor een dictionary is `Goud` een ander woord dan `goud`. Godot zoekt dan precies die sleutel, en die bestaat niet.

**Oplossing:** zoek in je level het muntje dat je net pakte, en verbeter het veld Soort in de Inspector.

Wil je dat het spel bij een tikfout doorgaat, gebruik dan `get` met een reservewaarde:

```gdscript
    Global.score += WAARDES.get(soort, 1)
```

Dan telt een onbekende soort als één punt. Let op dat je de tikfout dan niet meer opmerkt: het spel werkt, maar je goud muntje is maar één punt waard.

</details>

<details>
<summary>Ik zie geen veld Soort in de Inspector</summary>

**Oorzaak:** `@export` ontbreekt, of je hebt het script nog niet opgeslagen. Zonder `@export` is `soort` een gewone variabele die alleen in het script bestaat.

**Oplossing:** zet `@export` vóór `var soort`, sla het script op met `Ctrl + S`, en klik daarna opnieuw op een muntje.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
