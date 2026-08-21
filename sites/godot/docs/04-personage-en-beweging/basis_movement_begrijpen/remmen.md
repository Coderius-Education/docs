---
sidebar_position: 6
slug: /movement-remmen
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

Alleen als de speler niets indrukt. Je hebt dus twee gevallen die elkaar uitsluiten: wél een toets ingedrukt (lopen) of géén toets ingedrukt (afremmen).

Voor precies dat soort tweedeling bestaat `else`: het blok dat draait wanneer de `if` niet opgaat.

</details>

## Stap 1: Twee gevallen met `if` en `else`

Vervang je regel `velocity.x = direction * SPEED` door dit:

```gdscript
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)
```

De `else` hoort op hetzelfde niveau als de `if` erboven; de regels eronder springen allebei één niveau verder in.

## Stap 2: `if direction:` zonder vergelijking

Er staat geen `==` of `!=` in die `if`. Dat mag, omdat GDScript het getal `0` als "onwaar" behandelt en elk ander getal als "waar":

- `direction` is `0` → de `if` is onwaar → de `else` draait, je remt af.
- `direction` is `-1` of `1` → de `if` is waar → je loopt.

**Doet `if direction != 0:` precies hetzelfde?**

<details>
<summary>Antwoord</summary>

Ja. `if direction:` is een kortere schrijfwijze van `if direction != 0:`. Kies wat jij duidelijker vindt en houd het consequent.

</details>

## Stap 3: Wat `move_toward()` doet

`move_toward(huidige, doel, stap)` geeft een waarde terug die dichter bij het doel ligt, en hoogstens `stap` groot.

Met `move_toward(velocity.x, 0, SPEED)` breng je je snelheid dus richting nul, met stappen ter grootte van `SPEED`. Omdat je snelheid ook `SPEED` was, sta je meteen stil.

**Wat gebeurt er als je de hele `else`-tak weghaalt?**

<details>
<summary>Antwoord</summary>

Je karakter blijft voor eeuwig doorrijden zodra je één keer een pijltje hebt ingedrukt. Zonder `else` zet niemand de snelheid ooit terug naar nul.

</details>

## Stap 4: Test het

Start met `F5`. Lopen en stoppen werken als voorheen — maar nu heb je een plek waar je het afremmen kunt bijstellen.

## Opdracht 4.4.c: laat je karakter uitglijden

Maak de stap in `move_toward` kleiner dan `SPEED` en kijk wat er gebeurt. Zoek een waarde waarbij je karakter nog nét bestuurbaar blijft.

<details>
<summary>Klik hier voor een tip.</summary>

De derde waarde tussen de haakjes bepaalt hoe groot een remstap is. Kleiner betekent langer doorglijden. Probeer eerst een flink verschil, bijvoorbeeld tien keer kleiner, zodat je het effect goed ziet.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
    else:
        velocity.x = move_toward(velocity.x, 0, 30)
```

Bij `30` glijdt je karakter duidelijk door, alsof hij op ijs loopt. Bij `300` (gelijk aan `SPEED`) staat hij meteen stil.

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
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)

    move_and_slide()
```

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>Expected end of statement</code> bij de else-regel</summary>

**Oorzaak:** De dubbele punt achter `else` ontbreekt, of `else` staat niet op hetzelfde niveau als de `if`.

**Oplossing:** Er hoort `else:` te staan, precies even ver ingesprongen als de `if` erboven.

</details>

<details>
<summary>Mijn karakter blijft doorrijden na loslaten</summary>

**Oorzaak:** De `else`-tak ontbreekt, of de regel eronder springt niet in.

**Oplossing:** Vergelijk je code met het script hierboven. De regel met `move_toward` hoort binnen de `else` te staan.

</details>

---

← [Deel 5 — Lopen](./krachten.md) · **Volgende:** [Deel 7 — Springen](./afsluiter.md) →
