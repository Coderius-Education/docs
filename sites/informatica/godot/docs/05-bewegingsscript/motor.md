---
sidebar_position: 2
slug: /movement-motor
sidebar_label: "Deel 2: Vallen"
---

# Het bewegingsscript bouwen — Deel 2: Vallen

Je functie draait, maar je karakter staat stil. In deze les geef je hem snelheid, zodat hij valt.

<GodotVersie />

<GDQuestLes slug="movement-motor" />

## Wat je nu gaat toevoegen

Eén regel, met twee nieuwe begrippen: **`velocity`** en **`+=`**. Na deze les valt je karakter naar beneden.

## Voorspel: waar bewaart Godot de snelheid?

`move_and_slide()` verplaatst je karakter op basis van zijn snelheid. **Waar denk je dat die snelheid staat — moet je hem zelf aanmaken, of bestaat hij al?**

<details>
<summary>Antwoord</summary>

Hij bestaat al. Elke `CharacterBody2D` heeft een eigenschap `velocity`, en door `extends CharacterBody2D` is die van jou. Je hoeft hem niet aan te maken; je hoeft hem alleen te veranderen.

Zulke kant-en-klare eigenschappen van een node heten member variables.

</details>

## Stap 1: Snelheid opbouwen \{#velocity}

Zet deze regel **boven** `move_and_slide()`, binnen de functie:

```gdscript
func _physics_process(delta: float) -> void:
    velocity += get_gravity() * delta

    move_and_slide()
```

`get_gravity()` geeft de zwaartekracht van je project terug, standaard `(0, 980)`. Dat is geen snelheid maar een versnelling: elke seconde komt er 980 bij je snelheid.

Het stukje `* delta` laat je even voor wat het is — dat is Deel 3.

## Stap 2: Wat `velocity` is

`velocity` is de snelheid van je karakter: een X en een Y in één waarde. Zet tijdelijk `print(velocity)` boven `move_and_slide()` en kijk in **Uitvoer** terwijl je speelt:

```
(0, 16.33)
(0, 32.67)
(0, 49)
```

De X blijft `0`, want je beweegt niet zijwaarts. De Y wordt elke frame `16.33` groter: dat is die 980 verdeeld over zestig frames. Steeds hetzelfde stukje erbij, en juist daardoor val je steeds sneller.

Je kunt `.x` en `.y` los aanspreken, bijvoorbeeld `velocity.y = 0`. Dat gebruik je vanaf Deel 5.

## Stap 3: Waarom `+=` en niet `=`

`velocity += iets` is de korte schrijfwijze van `velocity = velocity + iets`. De zwaartekracht wordt dus **opgeteld bij de snelheid die er al was**, frame na frame. Zo bouwt valsnelheid zich op: na één seconde val je hard, na twee seconden harder.

**Wat zou er gebeuren als je `+=` vervangt door `=`?**

<details>
<summary>Antwoord</summary>

Je karakter zakt met een constante, hele lage snelheid naar beneden in plaats van versneld. Elke frame zet je `velocity` dan terug op één klein stapje, in plaats van het op te bouwen. Het voelt als zweven, niet als vallen.

</details>

## Stap 4: Test het

Start met `F5` en zet je karakter in de editor boven de grond, of loop van een platform af.

Hij valt en blijft op de vloer liggen. Besturing komt vanaf Deel 5.

:::caution
Let op de volgorde: `move_and_slide()` blijft de **laatste** regel in de functie. Eerst reken je de snelheid uit, dan pas laat je Godot verplaatsen. Andersom loopt alles één frame achter.
:::

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
<summary>Mijn karakter valt door de vloer heen</summary>

**Oorzaak:** De vloer heeft geen collision, of je karakter heeft geen `CollisionShape2D`.

**Oplossing:**

1. Controleer of je tegels een Physics Layer hebben ([Collision op je tegels](../03-level-bouwen/tilemap_collision.md)).
2. Controleer of je `CharacterBody2D` een `CollisionShape2D` als child heeft, mét een **Shape** ingesteld.

</details>

<details>
<summary>Mijn karakter valt niet, hij blijft zweven</summary>

**Oorzaak:** De regel staat op het verkeerde inspringniveau, of `move_and_slide()` ontbreekt.

**Oplossing:** De regel met `velocity` hoort één niveau in te springen, binnen de functie. En `move_and_slide()` blijft als laatste regel staan.

**Zelf vinden:** zet `print(velocity)` boven `move_and_slide()`. Blijft daar `(0, 0)` staan, dan wordt je valregel niet uitgevoerd. Verandert `velocity` wél maar beweegt er niets, dan ligt het bij `move_and_slide()`.

</details>

<details>
<summary>Foutmelding: <code>Identifier "velocity" not declared in the current scope</code></summary>

**Oorzaak:** De eerste regel van je script klopt niet. `velocity` bestaat alleen als je script van een `CharacterBody2D` erft.

**Oplossing:** Controleer dat er bovenaan `extends CharacterBody2D` staat.

</details>

---

← [Deel 1 — Een script dat draait](./skelet.md) · **Volgende:** [Deel 3 — Delta](./delta.md) →
