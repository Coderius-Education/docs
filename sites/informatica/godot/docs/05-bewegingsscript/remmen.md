---
sidebar_position: 6
slug: /movement-remmen
sidebar_label: "Deel 6: Stoppen"
---

# Het bewegingsscript bouwen — Deel 6: Stoppen

Je karakter loopt, en staat meteen stil zodra je de toets loslaat. Dat werkt, maar het voelt hard. In deze les geef je hem een echte rem.

<GodotVersie />

<GDQuestLes slug="movement-remmen" />

## Wat je nu gaat toevoegen

Twee begrippen: **`else`** om iets te doen als de voorwaarde níét klopt, en **`move_toward()`** om een waarde stapsgewijs ergens naartoe te brengen.

## Voorspel: wanneer moet je karakter afremmen?

Nu staat er één regel die altijd draait: `velocity.x = direction * SPEED`. Bij loslaten is `direction` nul, dus de snelheid springt in één klap naar nul.

**Als je dat afremmen wilt regelen, wanneer moet dat dan gebeuren?**

<details>
<summary>Antwoord</summary>

Alleen als de speler niets indrukt, dus als `direction` `0` is. Je hebt twee gevallen die elkaar uitsluiten: géén toets ingedrukt (afremmen) of wél een toets ingedrukt (lopen).

Voor precies dat soort tweedeling bestaat `else`: het blok dat draait wanneer de `if` niet opgaat.

</details>

## Stap 1: Twee gevallen met `if` en `else`

Vervang je regel `velocity.x = direction * SPEED` door dit:

```gdscript
    if direction == 0:
        velocity.x = move_toward(velocity.x, 0, SPEED)
    else:
        velocity.x = direction * SPEED
```

De `else` hoort op hetzelfde niveau als de `if` erboven; de regels eronder springen allebei één niveau verder in.

## Stap 2: Wat `direction == 0` vraagt

`==` betekent "is gelijk aan". De `if` vraagt dus precies wat je in de voorspelling bedacht: drukt de speler niets in?

- `direction` is `0` → de `if` is waar → je remt af.
- `direction` is `-1` of `1` → de `if` is onwaar → de `else` draait, je loopt.

In tutorials en in het sjabloon van Godot zie je vaak `if direction:`, met de twee takken andersom: eerst lopen, en remmen in de `else`. Dat doet hetzelfde, omdat GDScript het getal `0` als onwaar behandelt en elk ander getal als waar. In deze cursus stel je de vraag rechtstreeks: is `direction` nul?

## Stap 3: Wat `move_toward()` doet

`move_toward(huidige, doel, stap)` geeft een waarde terug die dichter bij het doel ligt, en hoogstens `stap` groot.

Met `move_toward(velocity.x, 0, SPEED)` breng je je snelheid dus richting nul, met stappen ter grootte van `SPEED`. Omdat je snelheid ook `SPEED` was, sta je meteen stil.

**Wat gebeurt er als je de hele `else`-tak weghaalt?**

<details>
<summary>Antwoord</summary>

Je karakter komt niet meer van zijn plek. Alleen de `else` zet `velocity.x` op `direction * SPEED`; wat overblijft, remt alleen af, en vanaf stilstand blijft dat nul.

</details>

## Stap 4: Test het

Start met `F5`. Lopen en stoppen werken als voorheen — maar nu heb je een plek waar je het afremmen kunt bijstellen.

## Opdracht 5.6.a: laat je karakter uitglijden

Maak de stap in `move_toward` kleiner dan `SPEED` en kijk wat er gebeurt. Zoek een waarde waarbij je karakter nog nét bestuurbaar blijft.

<details>
<summary>Klik hier voor een tip.</summary>

De derde waarde tussen de haakjes bepaalt hoe groot een remstap is. Kleiner betekent langer doorglijden. Probeer eerst een flink verschil, bijvoorbeeld tien keer kleiner, zodat je het effect goed ziet.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
    if direction == 0:
        velocity.x = move_toward(velocity.x, 0, 30)
```

Bij `30` gaat er elke frame 30 van je snelheid van 300 af: je karakter glijdt nog tien frames door, een zesde seconde. Dat zie je net. Bij `10` is het een halve seconde, en dat voelt als ijs. Bij `300` (gelijk aan `SPEED`) staat hij meteen stil.

Wat "nog nét bestuurbaar" is, hangt af van je level: hoe smaller je platforms, hoe minder glijden je jezelf kunt veroorloven.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    var direction := Input.get_axis("ui_left", "ui_right")
    if direction == 0:
        velocity.x = move_toward(velocity.x, 0, SPEED)
    else:
        velocity.x = direction * SPEED

    move_and_slide()
```

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>Expected ":" after "else".</code></summary>

**Oorzaak:** De dubbele punt achter `else` ontbreekt.

{/* verwacht-fout: Expected ":" after "else". */}

```gdscript
# FOUT
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    var direction := Input.get_axis("ui_left", "ui_right")
    if direction == 0:
        velocity.x = move_toward(velocity.x, 0, SPEED)
    else
        velocity.x = direction * SPEED

    move_and_slide()
```

**Oplossing:** Er hoort `else:` te staan, met de dubbele punt, net als achter de `if`.

</details>

<details>
<summary>Foutmelding: <code>Expected statement, found "else" instead.</code></summary>

**Oorzaak:** `else` staat verder ingesprongen dan de `if` erboven. Dan hoort hij bij de regel met `move_toward`, en daar kan geen `else` komen.

{/* verwacht-fout: Expected statement, found "else" instead. */}

```gdscript
# FOUT
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    var direction := Input.get_axis("ui_left", "ui_right")
    if direction == 0:
        velocity.x = move_toward(velocity.x, 0, SPEED)
        else:
        velocity.x = direction * SPEED

    move_and_slide()
```

**Oplossing:** Laat `else:` precies even ver inspringen als de `if` waar hij bij hoort.

</details>

<details>
<summary>Mijn karakter blijft doorrijden na loslaten</summary>

**Oorzaak:** In de regel met `move_toward` staan de eerste twee waardes andersom. `move_toward(0, velocity.x, SPEED)` brengt `0` naar je snelheid toe, en dat geeft je snelheid ongewijzigd terug: hij blijft rijden.

**Oplossing:** eerst wat je verandert, dan waar het naartoe moet:

```gdscript
# FOUT
        velocity.x = move_toward(0, velocity.x, SPEED)

# GOED
        velocity.x = move_toward(velocity.x, 0, SPEED)
```

**Zelf vinden:** zet een `print("remmen")` vlak onder `if direction == 0:`. Zie je die regel nooit verschijnen als je de toets loslaat, dan wordt het remmen niet bereikt.

</details>

---

← [Deel 5 — Lopen](site:godot/docs/movement-krachten) · **Volgende:** [Deel 7 — Springen](site:godot/docs/movement-afsluiter) →
