---
sidebar_position: 3
slug: /movement-delta
sidebar_label: "Deel 3: Delta"
---

# Het bewegingsscript bouwen — Deel 3: Delta

In je valregel staat een stukje dat je hebt overgetypt zonder uitleg: `* delta`. In deze korte les kom je erachter wat het doet, door het weg te halen.

<GodotVersie />

<GDQuestLes slug="movement-delta" />

## Wat je nu gaat leren

Twee dingen die bij elkaar horen: wat een **parameter** is, en wat **`delta`** doet. Je schrijft geen nieuwe regels; je onderzoekt de regel die er al staat.

## Voorspel: wat betekent 980 per seconde?

`get_gravity()` geeft ongeveer `980` terug. Dat is de valversnelling **per seconde**. Maar je functie draait ongeveer zestig keer per seconde.

**Wat zou er gebeuren als je elke frame die volle 980 zou optellen?**

<details>
<summary>Antwoord</summary>

Dan tel je zestig keer per seconde 980 op, en zit je na één seconde op `58800` in plaats van `980`. Je karakter valt dan zestig keer te snel.

Je moet elke frame dus maar een klein stukje van die seconde meetellen. Precies dat is wat `delta` is.

</details>

## `delta` is een parameter

Kijk naar de eerste regel van je functie:

```gdscript
func _physics_process(delta: float) -> void:
```

Tussen de haakjes staat `delta`. Dat is een **parameter**: informatie die Godot bij elke aanroep aan je functie meegeeft. Jij hoeft hem niet te vullen, je mag hem alleen gebruiken.

Wat er in zit, is de tijd in seconden sinds de vorige frame. Bij zestig frames per seconde is dat ongeveer `0.0167`, oftewel een zestigste.

## Onderzoek: kijk zelf wat er in zit

Zet deze regel bovenin je functie en start met `F5`:

```gdscript
    print(delta)
```

In **Uitvoer** loopt een stroom getallen rond `0.0167`. Ze zijn niet allemaal precies gelijk: heeft je computer het even druk, dan duurt een frame langer en wordt `delta` groter.

Haal de `print` daarna weer weg.

## Waarom `* delta` het probleem oplost

`980 * 0.0167` is ongeveer `16`. Elke frame komt er dus zo'n 16 bij de snelheid, en na zestig frames — één seconde — zit je op ongeveer 980. Precies wat de bedoeling was.

Draait het spel op een snellere computer met 120 frames per seconde, dan is `delta` half zo groot en telt elke frame half zoveel mee. Het resultaat na één seconde blijft hetzelfde.

**Dat is waar het om gaat:** met `delta` gaat je spel overal even snel. Zonder `delta` bepaalt de snelheid van je computer hoe hard je valt.

## Opdracht 5.3.a: haal delta weg en kijk

Verwijder tijdelijk `* delta` uit je valregel, zodat er `velocity += get_gravity()` staat. Start met `F5`.

<details>
<summary>Klik hier voor een tip.</summary>

Kijk niet alleen naar de snelheid, maar ook of je karakter nog netjes op de vloer terechtkomt.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Je karakter schiet vrijwel meteen naar beneden. Vaak zakt hij zelfs dwars door de vloer heen: hij legt per frame zo'n groot stuk af dat hij in één stap voorbij de tegels is, en dan is er niets meer om tegenaan te botsen.

Zet `* delta` terug:

```gdscript
    velocity += get_gravity() * delta
```

Onthoud de vuistregel: **staat er een snelheid per seconde in je berekening, dan hoort er `* delta` bij.**

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```gdscript
extends CharacterBody2D

func _physics_process(delta: float) -> void:
    velocity += get_gravity() * delta

    move_and_slide()
```

</details>

## Er gaat iets mis

<details>
<summary>Godot zegt: <code>Identifier "delta" not declared in the current scope</code></summary>

**Oorzaak:** Je gebruikt `delta` buiten `_physics_process`, bijvoorbeeld in `_ready()` of helemaal bovenaan je script.

**Oplossing:** `delta` bestaat alleen binnen de functie die hem als parameter meekrijgt. Gebruik hem dus alleen binnen `_physics_process`.

</details>

<details>
<summary>Mijn karakter valt nog steeds veel te snel</summary>

**Oorzaak:** `* delta` staat op de verkeerde plek, bijvoorbeeld `velocity += get_gravity() * delta * delta` of alleen achter een deel van de som.

**Oplossing:** De regel hoort precies zo te luiden: `velocity += get_gravity() * delta`.

</details>

---

← [Deel 2 — Vallen](./motor.md) · **Volgende:** [Deel 4 — Je eerste if](./grond.md) →
