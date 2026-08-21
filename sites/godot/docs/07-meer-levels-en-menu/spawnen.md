---
sidebar_position: 3
slug: /spawnen
---

# Spawnen: nodes maken in code

Tot nu toe heb je elke node met de hand in de editor gezet: muntjes gesleept, vijanden geplaatst, tegels getekend. Maar veel spellen maken dingen aan **terwijl het spel draait** — een nieuwe vijand elke paar seconden, een kogel bij elke druk op de knop. Dat aanmaken tijdens het spel heet **spawnen**. In deze les spawn je de muntjes uit [Signals & een muntje oppakken](../06-signals-en-score/signals_muntje.md) met code in plaats van met slepen.

<GodotVersie />

## Voorspel: wat heeft je code nodig?

In de editor sleep je `muntje.tscn` vanuit het FileSystem naar je level. **Welke twee dingen moet je code weten of doen om datzelfde voor elkaar te krijgen?**

<details>
<summary>Antwoord</summary>

Precies wat jij ook doet bij het slepen:

1. **Welk bestand** het is — je code heeft het pad naar `muntje.tscn` nodig.
2. **Waar het komt te hangen** — een nieuwe node moet als child in de Scene Tree geplaatst worden, anders bestaat hij wel maar zie je hem niet.

In GDScript zijn dat drie functies: `preload()`, `instantiate()` en `add_child()`.

</details>

## De scène inladen met `preload()` \{#preload}

```gdscript
const MUNTJE = preload("res://muntje.tscn")
```

**`preload()`** leest een scène-bestand in en bewaart het als bouwtekening in een constante. Het bestand wordt één keer geladen bij het starten van je spel — daarna kun je er zo vaak je wilt exemplaren van maken. Het pad werkt hetzelfde als bij `change_scene_to_file()` in [Een tweede level toevoegen](./tweede_level.md): `res://` gevolgd door de bestandsnaam.

**Let op:** de bouwtekening zelf is nog geen muntje in je level. Vergelijk het met de scène in je FileSystem-paneel: die staat ook pas in je spel als je hem ergens neerzet.

## Een exemplaar maken met `instantiate()` \{#instantiate}

```gdscript
var nieuw_muntje = MUNTJE.instantiate()
nieuw_muntje.position = Vector2(200, 100)
add_child(nieuw_muntje)
```

| Code | Wat doet het? |
| :--- | :--- |
| `MUNTJE.instantiate()` | Maakt een nieuw exemplaar van de bouwtekening |
| `nieuw_muntje.position = Vector2(200, 100)` | Zet het op x = 200, y = 100 |
| `add_child(nieuw_muntje)` | Hangt het in de Scene Tree, onder de node waar dit script op staat |

Zonder de laatste regel bestaat het muntje wel in het geheugen, maar hangt het nergens — en wat niet in de Scene Tree hangt, wordt niet getekend.

## Stap 1: Een script op je level-root

1. Open `level1.tscn`.
2. Selecteer de root-node en klik op het script-icoontje → **Attach Script** → **Create**. Sla op als `level1.gd`.

Dit is het eerste script op een level-root. Muntjes, vlaggen en je karakter hebben elk hun eigen script; het level-script is de plek voor code die over het level als geheel gaat — zoals spawnen.

## Stap 2: Spawn een muntje bij de start

Zet dit in `level1.gd`:

```gdscript
extends Node2D

const MUNTJE = preload("res://muntje.tscn")

func _ready() -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(200, 100)
    add_child(nieuw_muntje)
```

**`_ready()`** is, net als `_physics_process()`, een functie die Godot zelf aanroept — maar dan één keer, zodra de node in de Scene Tree verschijnt. Alles wat bij de start van een level moet gebeuren, hoort daar.

Start met `F5`. Er hangt nu een muntje op `(200, 100)` dat je nooit in de editor hebt gesleept. Oppakken werkt meteen: het exemplaar heeft dezelfde children en hetzelfde script als de scène waaruit het gemaakt is.

## Stap 3: Maak er een eigen functie van

Straks wil je vanaf meerdere plekken kunnen spawnen. Verplaats de drie regels daarom naar een eigen functie met de positie als parameters:

```gdscript
extends Node2D

const MUNTJE = preload("res://muntje.tscn")

func _ready() -> void:
    spawn_muntje(200, 100)

func spawn_muntje(x: float, y: float) -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(x, y)
    add_child(nieuw_muntje)
```

Het spel doet exact hetzelfde als in Stap 2, maar een extra muntje spawnen is nu één regel. In de [volgende les](./spawn_timer.md) laat je een Timer deze functie aanroepen.

Deze drie functies staan ook kort bij elkaar in de [GDScript-tips](/gdscript-tips#nodes-scenes).

## Opdracht 7.3.a: spawn een rij muntjes

Laat `_ready()` een rij van drie muntjes spawnen, naast elkaar met gelijke tussenruimte, op een plek waar je karakter erbij kan.

<details>
<summary>Klik hier voor een tip.</summary>

Roep `spawn_muntje()` drie keer aan met dezelfde y en een x die telkens een vast aantal pixels opschuift. Kijk in de editor welke coördinaten boven je vloer liggen: selecteer een node en lees **Position** af in de Inspector.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends Node2D

const MUNTJE = preload("res://muntje.tscn")

func _ready() -> void:
    spawn_muntje(200, 100)
    spawn_muntje(250, 100)
    spawn_muntje(300, 100)

func spawn_muntje(x: float, y: float) -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(x, y)
    add_child(nieuw_muntje)
```

De y-waarde `100` past bij een vloer die lager ligt — vul hier coördinaten in die bij jouw level passen.

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>Preload file "res://muntje.tscn" does not exist</code></summary>

**Oorzaak:** Het pad in `preload()` klopt niet met de werkelijke bestandsnaam of -locatie.

**Oplossing:** Zoek `muntje.tscn` in het FileSystem-paneel, klik met rechts → **Copy Path** en plak dat pad in je script. Let op hoofdletters: `Muntje.tscn` is een ander bestand dan `muntje.tscn`.

</details>

<details>
<summary>Het spel draait, maar ik zie geen gespawnd muntje</summary>

**Oorzaak:** Twee mogelijke oorzaken:

1. `add_child()` ontbreekt — het muntje is gemaakt, maar hangt niet in de Scene Tree.
2. De positie ligt buiten beeld, bijvoorbeeld boven het scherm (negatieve y) of voorbij de rand van je level.

**Oplossing:**

- Controleer dat `add_child(nieuw_muntje)` in je functie staat.
- Kies een positie waarvan je zeker weet dat hij in beeld is: zet in de editor tijdelijk een node op die plek en lees **Position** af.

</details>

<details>
<summary>Foutmelding: <code>Invalid call. Nonexistent function 'instantiate' in base 'String'</code></summary>

**Oorzaak:** Je roept `instantiate()` aan op het pad zelf, bijvoorbeeld `"res://muntje.tscn".instantiate()`. Alleen het resultaat van `preload()` heeft die functie.

**Oplossing:** Eerst inladen, dan instantiëren:

```gdscript
# FOUT
var nieuw_muntje = "res://muntje.tscn".instantiate()

# GOED
const MUNTJE = preload("res://muntje.tscn")
var nieuw_muntje = MUNTJE.instantiate()
```

</details>
