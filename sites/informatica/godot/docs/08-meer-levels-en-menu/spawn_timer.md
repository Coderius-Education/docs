---
sidebar_position: 4
slug: /spawn_timer
---

# Automatisch spawnen met een Timer

In de [vorige les](./spawnen.md) spawn je muntjes bij de start van het level, met vaste coördinaten in `_ready()`. In deze les laat je het level dat zélf blijven doen terwijl je speelt: elke paar seconden een nieuw muntje, steeds op een andere plek.

<GodotVersie />

## Voorspel: hoe doe je "elke 2 seconden"?

Je wilt dat `spawn_muntje()` elke 2 seconden wordt aangeroepen. **Hoe zou Godot dat oplossen?** Denk aan wat je in [Signals & een muntje oppakken](../07-signals-en-score/signals_muntje.md) leerde over hoe nodes elkaar iets laten weten.

<details>
<summary>Antwoord</summary>

Met een node en een signal — zoals bijna alles in Godot:

- De node heet **`Timer`**: een onzichtbare stopwatch die telkens opnieuw aftelt.
- Zodra de tijd om is, stuurt hij het signal **`timeout`**. Daar koppel je je spawn-functie aan, net zoals je `body_entered` aan het muntje koppelde.

</details>

## Stap 1: Een `Timer` toevoegen \{#timer}

1. Open `level1.tscn`.
2. Klik met rechts op de root-node → **Add Child Node** → `Timer`.
3. Stel hem in via de Inspector:

| Eigenschap | Waarde | Betekenis |
| :--- | :---: | :--- |
| **Wait Time** | `2` | Aantal seconden per aftel-ronde |
| **One Shot** | uit | Uit = telkens opnieuw aftellen; aan = maar één keer |
| **Autostart** | aan | Begin met aftellen zodra het level start |

De `Timer` is onzichtbaar in het spel — het is puur een stopwatch, geen afbeelding.

## Stap 2: Koppel het `timeout`-signal

1. Selecteer de `Timer` in de Scene Tree.
2. Ga naar het **Node**-tabblad rechts naast de Inspector.
3. Dubbelklik op `timeout`, kies de root-node (met `level1.gd`) als ontvanger en klik op **Connect**.

Godot voegt deze functie toe aan `level1.gd`:

```gdscript
func _on_timer_timeout() -> void:
    pass # hier komt je code
```

Deze functie wordt vanaf nu elke 2 seconden aangeroepen.

## Stap 3: Een willekeurige plek met `randf_range()` \{#willekeurig}

Elke keer op exact dezelfde plek spawnen is saai. **`randf_range()`** geeft een willekeurig getal tussen twee grenzen:

```gdscript
randf_range(50, 1000)
```

Elke aanroep levert een ander getal op tussen `50` en `1000` — bijvoorbeeld `312.7`, dan `891.2`, dan `144.9`. Gebruik het als x-coördinaat en elk muntje verschijnt ergens anders:

```gdscript
func _on_timer_timeout() -> void:
    spawn_muntje(randf_range(50, 1000), 100)
```

Vervang `1000` door de breedte van jouw level, en `100` door een hoogte boven je vloer.

## Stap 4: Test

Je hele `level1.gd` ziet er nu zo uit:

```gdscript
extends Node2D

const MUNTJE = preload("res://muntje.tscn")

func _ready() -> void:
    spawn_muntje(200, 100)

func spawn_muntje(x: float, y: float) -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(x, y)
    add_child(nieuw_muntje)

func _on_timer_timeout() -> void:
    spawn_muntje(randf_range(50, 1000), 100)
```

Start met `F5` en blijf even kijken: elke 2 seconden verschijnt er ergens een nieuw muntje. Je score kan nu eindeloos oplopen.

De `Timer`-instellingen staan ook in de [Nodes cheatsheet](/cheatsheet#spawnen).

## Opdracht 8.4.a: spawn ook vijanden

Muntjes verzamelen zonder gevaar is te makkelijk. Laat het level óók vijanden spawnen, langzamer dan de muntjes — bijvoorbeeld één per 5 seconden. Gebruik de vijand-scène uit [Opdracht 7.1.a](../07-signals-en-score/signals_muntje.md).

<details>
<summary>Klik hier voor een tip.</summary>

Je hebt drie dingen nodig, allemaal een herhaling van deze les:

- Een tweede `const` met `preload("res://vijand.tscn")` en een functie `spawn_vijand(x, y)`.
- Een tweede `Timer`-node — geef hem een duidelijke naam zoals `VijandTimer` en een langere Wait Time.
- Koppel het `timeout`-signal van díe timer; Godot noemt de functie dan `_on_vijand_timer_timeout()`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Voeg een `Timer` toe, hernoem hem naar `VijandTimer`, zet **Wait Time** op `5` en **Autostart** aan, en koppel `timeout` aan de root. Breid `level1.gd` uit:

```gdscript
extends Node2D

const MUNTJE = preload("res://muntje.tscn")
const VIJAND = preload("res://vijand.tscn")

func _ready() -> void:
    spawn_muntje(200, 100)

func spawn_muntje(x: float, y: float) -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(x, y)
    add_child(nieuw_muntje)

func spawn_vijand(x: float, y: float) -> void:
    var nieuwe_vijand = VIJAND.instantiate()
    nieuwe_vijand.position = Vector2(x, y)
    add_child(nieuwe_vijand)

func _on_timer_timeout() -> void:
    spawn_muntje(randf_range(50, 1000), 100)

func _on_vijand_timer_timeout() -> void:
    spawn_vijand(randf_range(50, 1000), 100)
```

Elke timer telt onafhankelijk af: muntjes elke 2 seconden, vijanden elke 5.

</details>

## Er gaat iets mis

<details>
<summary>Er spawnt helemaal niets</summary>

**Oorzaak:** De Timer telt niet af, of het signal is niet gekoppeld.

**Oplossing:**

1. Selecteer de `Timer` en controleer dat **Autostart** aanstaat. (Zonder Autostart start een Timer pas als je in code `start()` aanroept.)
2. Open het **Node**-tabblad. Staat er een groen pijltje bij `timeout`?
3. Controleer dat de functienaam in je script exact overeenkomt met wat Godot heeft gekoppeld.

**Zelf vinden:** zet een `print("timer")` als eerste regel in `_on_timer_timeout`. Blijft Uitvoer leeg, dan gaat het om de Timer of het signal en hoef je je spawn-code niet te doorzoeken.

</details>

<details>
<summary>Er spawnt maar één keer iets, daarna niets meer</summary>

**Oorzaak:** **One Shot** staat aan — de Timer telt dan één keer af en stopt.

**Oplossing:** Selecteer de `Timer` en zet **One Shot** uit in de Inspector.

</details>

<details>
<summary>De muntjes spawnen buiten mijn level of in de grond</summary>

**Oorzaak:** De grenzen van `randf_range()` of de vaste y-waarde passen niet bij jouw level.

**Oplossing:** Meet je level na in de editor: selecteer een tegel aan de linker- en rechterrand en lees **Position** af. Gebruik die x-waarden als grenzen, en een y die ruim boven je vloer ligt.

</details>

Staat je fout er niet bij? In [Fouten zoeken](../05-bewegingsscript/fouten-zoeken.md) staat hoe je hem zelf opspoort.
