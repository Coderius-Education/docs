---
sidebar_position: 3
hide_table_of_contents: true
slug: /global_variables
---

# Global variables (Autoload)

In de vorige les heb je `var score = 0` in je karakter gezet en vanuit het muntje `body.score += 1` aangeroepen. Dat werkt — totdat je de score op het scherm wilt tonen en je vanuit een Label-script via `get_node("../CharacterBody2D").score` moet gaan zoeken. Eén verschuiving in de Scene Tree en het breekt. In deze les leer je een schonere oplossing: **global variables** die overal in je project beschikbaar zijn.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: een variabele die overal woont

Wat als de score op één vaste plek leefde, buiten alle nodes om, altijd bereikbaar met dezelfde naam? **Hoe zou je dat technisch oplossen?**

<details>
<summary>Antwoord</summary>

Je maakt een apart script (bijvoorbeeld `global.gd`) dat *niet* aan een node hangt. Daarna vertel je Godot via **Autoload**: "laad dit script automatisch bij het opstarten en houd het de hele speelsessie in de lucht". Vanaf dat moment kun je vanuit elk ander script `Global.score` schrijven of lezen — geen `get_node(...)` meer, geen kapotte links als je iets verplaatst.

</details>

## Het probleem in één regel

Variabelen die je in een node-script zet, leven alleen zolang die node bestaat. `Global` lost dat op door buiten de Scene Tree te leven.

## Stap 1: Maak een nieuw script

1. Ga naar **FileSystem** (linksonder).
2. Klik met rechts → **New Script**.
3. Noem het `global.gd`.
4. Zorg dat er **geen node** aan gekoppeld is — het is een los script.

## Stap 2: Voeg je variabelen toe

```gdscript
extends Node

var score = 0
var levens = 3
```

Dat is alles. Dit script bevat variabelen die je overal wilt gebruiken.

## Stap 3: Stel het in als Autoload

Dit is de belangrijkste stap. Door het script als **Autoload** te registreren, laadt Godot het automatisch bij het opstarten en is het overal beschikbaar.

1. Ga naar **Project** → **Project Settings**.
2. Klik bovenin op het tabblad **Autoload**. Zie je het niet meteen? Het tabblad staat naast **General** — eventueel even doorscrollen.
3. Klik op het mapje naast **Path** en kies `global.gd`.
4. Bij **Node Name** vul je `Global` in (met hoofdletter).
5. Klik op **Add**.

`Global` is nu overal beschikbaar in je project.

### Voorspel: wat als je deze stap vergeet?

**Wat denk je dat er gebeurt als je Stap 3 overslaat en meteen `Global.score += 1` in je muntje-script zet?**

<details>
<summary>Antwoord</summary>

Godot crasht zodra die regel wordt uitgevoerd, met een melding als `Identifier "Global" not declared in the current scope`. Het script `global.gd` bestaat wel op schijf — maar Godot kent de **naam** `Global` pas nadat je hem in Autoload hebt geregistreerd. Een script zonder Autoload is als een boek in een gesloten kast: het bestaat, maar niemand kan erbij.

</details>

## Stap 4: Refactor naar `Global.score`

In de vorige les hoogde je de score op via `body.score += 1`. Nu we een `Global` hebben, gebruiken we dat.

**In je muntje-script:**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.score += 1
    print("Score: ", Global.score)
    queue_free()
```

**In je karakter-script:** verwijder de regel `var score = 0`. Die hebben we niet meer nodig — de score leeft voortaan in `Global`.

Overal dezelfde syntax: `Global.variabelnaam`. Geen `get_node(...)`, geen kapotte links bij hernoemen.

## Functies in je global script

Je kunt ook **functies** toevoegen aan je global script:

```gdscript
extends Node

var score = 0
var levens = 3

func reset():
    score = 0
    levens = 3

func verlies_leven():
    levens -= 1
    if levens <= 0:
        print("Game Over!")
```

Deze roep je op dezelfde manier aan:

```gdscript
Global.verlies_leven()
Global.reset()
```

## Samenvatting

| Begrip                | Uitleg                                                         |
| :-------------------: | :------------------------------------------------------------- |
| **Global variable**   | Een variabele die overal in je project beschikbaar is          |
| **Autoload**          | Instelling waarmee Godot een script automatisch laadt bij start |
| **`Global.score`**    | Zo lees of schrijf je een globale variabele                    |
| **`extends Node`**    | Het global script extends `Node` omdat het geen specifiek type nodig heeft |

:::tip
Gebruik global variables voor dingen die je in meerdere scènes nodig hebt: score, levens, instellingen. Gebruik gewone `var` voor dingen die alleen in één node leven.

In de **volgende les** zet je `Global.score` op het scherm met een `Label`.
:::

## Opdracht 6.3.a: voeg `levens` toe aan `Global`

Je hebt nu `Global.score`. Pas dezelfde aanpak toe op `levens`.

Voeg `var levens = 3` toe aan `global.gd` en laat je vijand-script `Global.levens -= 1` doen bij contact (in plaats van `body.levens -= 1` uit de vorige les).

<details>
<summary>Klik hier voor een tip!</summary>

- Open `global.gd` en voeg `var levens = 3` toe onder `var score = 0`.
- Open je vijand-script en vervang `body.levens -= 1` door `Global.levens -= 1`.
- Print de huidige waarde met `print("Levens: ", Global.levens)`.
- Verwijder ook `var levens = 3` uit je karakter-script (zoals je dat met `score` deed).

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

**In `global.gd`:**

```gdscript
extends Node

var score = 0
var levens = 3
```

**In je vijand-script:**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.levens -= 1
    print("Levens: ", Global.levens)
    queue_free()
```

</details>

## Er gaat iets mis

<details>
<summary>Global werkt niet / <code>Global.score</code> geeft een fout</summary>

**Oorzaak:** `Global` is geen ingebouwd Godot-concept. Het is een script dat je zelf als Autoload moet registreren. Zonder die instelling kent Godot de naam `Global` niet.

**Oplossing:**

1. Ga naar **Project → Project Settings → Autoload**.
2. Klik op het mapje naast **Path** en kies `global.gd`.
3. Vul bij **Node Name** precies `Global` in (met hoofdletter G).
4. Klik op **Add**.

</details>

<details>
<summary>Mijn score-variabele reset bij elke nieuwe scène</summary>

**Oorzaak:** Je gebruikt een gewone `var score = 0` in een node-script. Als die node verdwijnt (bij het laden van een nieuwe scène), verdwijnt ook de variabele.

**Oplossing:** Zet de variabele in `global.gd` in plaats van in het node-script. Dat script blijft de hele speelsessie bestaan.

</details>
