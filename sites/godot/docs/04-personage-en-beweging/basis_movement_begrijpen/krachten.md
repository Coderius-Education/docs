---
sidebar_position: 5
slug: /movement-krachten
---

# Het bewegingsscript bouwen — Deel 5: Lopen

Je karakter valt, maar je kunt hem nog niet besturen. In deze les leest je script de pijltjestoetsen uit.

<GodotVersie />

<GDQuestLes slug="movement-krachten" />

## Wat je nu gaat toevoegen

Twee begrippen: een **`const`** voor je loopsnelheid, en **`Input.get_axis()`** om de toetsen uit te lezen.

## Voorspel: hoe vertaal je een toets naar snelheid?

Links indrukken moet `velocity.x` negatief maken, rechts indrukken positief. **Hoeveel verschillende gevallen moet je script uit elkaar houden?**

<details>
<summary>Antwoord</summary>

Drie: links, rechts, en niets. Je zou dat met losse checks kunnen doen, maar Godot heeft er één functie voor die de drie gevallen in één getal stopt: `-1`, `0` of `1`. Dat getal kun je zo vermenigvuldigen met je snelheid.

</details>

## Stap 1: Je loopsnelheid als constante \{#var-const}

Zet deze regel bovenaan je script, ónder `extends` en bóven de functie:

```gdscript
const SPEED = 300.0
```

Een **constante** is een waarde met een naam die nooit verandert terwijl je spel draait. Schrijf ze in hoofdletters, zodat je in één oogopslag ziet dat er niet aan gesleuteld wordt.

**Wat verwacht je dat er gebeurt als je `SPEED` binnen de functie probeert te veranderen, bijvoorbeeld met `SPEED = 500.0`?**

<details>
<summary>Antwoord</summary>

Godot weigert het met een foutmelding. Een `const` staat vast. Waarden die tijdens het spelen wél veranderen — zoals een score of het aantal levens — zet je in een `var`.

</details>

## Stap 2: De toets uitlezen

Zet deze twee regels binnen de functie, ónder het valblok en bóven `move_and_slide()`:

```gdscript
    var direction := Input.get_axis("ui_left", "ui_right")
    velocity.x = direction * SPEED
```

## Stap 3: Wat `Input.get_axis()` teruggeeft

In plaats van twee losse checks doet `get_axis` het in één regel:

- niets ingedrukt → `direction` is `0`
- links ingedrukt → `direction` is `-1`
- rechts ingedrukt → `direction` is `1`

Probeer het: zet `print(direction)` eronder en kijk in **Uitvoer** terwijl je de pijltjes indrukt.

Dat getal vermenigvuldig je met je snelheid: `-1 * 300` is 300 naar links, `1 * 300` is 300 naar rechts, en `0 * 300` is stilstaan. Eén regel, drie gevallen.

:::tip
Bij `var direction :=` staat een dubbele punt vóór het isgelijkteken. Daarmee bepaalt Godot zelf het type van je variabele. Je mag ook gewoon `=` schrijven; zie de [GDScript-tips](/gdscript-tips#variabelen) voor het verschil.
:::

## Stap 4: Test het

Start met `F5`. Je karakter loopt naar links en rechts met de pijltjestoetsen, en valt nog steeds van platforms af.

Laat je de toets los, dan staat hij meteen stil. Dat komt doordat `direction` dan `0` is. In Deel 6 maak je dat stoppen wat netter.

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
    velocity.x = direction * SPEED

    move_and_slide()
```

</details>

## Opdracht 4.4.b: kies je eigen loopsnelheid

Zoek de snelheid die bij jouw level past. Probeer minstens drie waarden voor `SPEED`, bijvoorbeeld `100.0`, `300.0` en `1000.0`, en start telkens opnieuw met `F5`.

<details>
<summary>Klik hier voor een tip.</summary>

Let niet alleen op hoe snel het voelt, maar ook of je nog nauwkeurig op een smal platform kunt landen. Te snel is net zo onspeelbaar als te traag.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Er is geen goede waarde — er is een waarde die bij jouw level past. Twee vuistregels:

- Bij `100.0` voelt je karakter zwaar en duurt oversteken lang.
- Bij `1000.0` schiet je over smalle platforms heen en is precies landen bijna onmogelijk.

Ergens tussen `250.0` en `400.0` speelt een platformer meestal prettig. Noteer welke waarde je kiest; in Deel 7 stem je de sprongkracht daarop af.

</details>

## Er gaat iets mis

<details>
<summary>Mijn karakter beweegt niet als ik op de pijltjes druk</summary>

**Oorzaak:** De regels staan buiten de functie, of de actienamen kloppen niet.

**Oplossing:**

1. Controleer dat beide regels ingesprongen staan binnen `_physics_process`.
2. Controleer de spelling: `"ui_left"` en `"ui_right"`, met een underscore en kleine letters.
3. Staat `move_and_slide()` nog steeds als laatste regel binnen de functie?

**Zelf vinden:** zet `print(direction)` onder de regel die hem uitleest. Blijft er `0` staan terwijl je op de pijltjes drukt, dan komt de toets niet aan en hoef je de rest van je script niet te doorzoeken.

</details>

<details>
<summary>Mijn karakter beweegt alleen omhoog of omlaag</summary>

**Oorzaak:** Je past `velocity` aan in plaats van `velocity.x`, waardoor je ook de valsnelheid overschrijft.

**Oplossing:** De regel hoort te zijn: `velocity.x = direction * SPEED`. Met `.x` raak je alleen de horizontale snelheid aan.

</details>

---

← [Deel 4 — Je eerste if](./grond.md) · **Volgende:** [Deel 6 — Stoppen](./remmen.md) →
