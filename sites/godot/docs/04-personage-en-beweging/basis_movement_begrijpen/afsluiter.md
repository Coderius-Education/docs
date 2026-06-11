---
sidebar_position: 4
hide_table_of_contents: true
slug: /movement-afsluiter
---

# Het bewegingsscript begrijpen — Deel 4: De afsluiter en je eigen script bouwen

In [Deel 3](./krachten.md) heb je de drie krachten (zwaartekracht, springen, lopen) één voor één ontleed. Tot nu toe hebben we alleen `velocity` ingesteld — maar dat verplaatst je karakter nog niet. Eén regel rondt het verhaal af, en daarna bouw je het script zelf opnieuw op.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Blok 4: De afsluiter — `move_and_slide()`

```gdscript
move_and_slide()
```

Tot nu toe hebben we alleen `velocity` ingesteld — maar dat verplaatst je karakter nog niet. `move_and_slide()` is de **trigger** die zegt: "Godot, kijk naar mijn `velocity`, kijk naar collisions, en verplaats me correct."

In één regel doet Godot voor je:

- Je karakter verplaatsen op basis van `velocity` en `delta`.
- Collisions detecteren met de wereld (tegels, andere bodies).
- "Sliden" langs muren in plaats van vast te blijven kleven.

#### Waarom helemaal **onderaan** de functie?

**Wat denk je dat er gebeurt als je `move_and_slide()` als eerste regel in `_physics_process` zet?**

<details>
<summary>Antwoord</summary>

Dan past Godot de beweging toe op basis van de `velocity` van de **vorige** frame, niet op je nieuwe aanpassingen (zwaartekracht, springen, lopen) die je daaronder doet. Je krijgt een vreemde vertraging van één frame, of input voelt "traag".

Houd de volgorde: eerst alle aanpassingen aan `velocity`, dan als laatste `move_and_slide()`.

</details>

---

## Make-opdracht: bouw het script zelf op

Je begrijpt nu elke regel. Tijd om het script vanaf nul zelf te schrijven — zo merk je écht wat blijft hangen.

**Opdracht:**

1. Maak een back-up: kopieer je huidige script naar een tekstbestand of plak het in een comment-blok onderaan.
2. Verwijder al je code (alles boven die back-up).
3. Bouw het opnieuw op, blok voor blok, en test telkens:
   - **Skelet:** `extends CharacterBody2D`, de twee `const`s, en een lege `_physics_process(delta: float) -> void:` met alleen `move_and_slide()` erin. Test → karakter beweegt niet, maar crasht ook niet.
   - **Voeg zwaartekracht toe** (Blok 3a). Test → karakter valt.
   - **Voeg springen toe** (Blok 3b). Test → karakter kan springen met spatie.
   - **Voeg lopen toe** (Blok 3c). Test → karakter loopt links/rechts.

<details>
<summary>Klik hier voor een tip!</summary>

- Werk **één blok tegelijk** af. Krijg je fouten? Eerst dit blok werkend voor je verder gaat.
- Vergeet niet: `move_and_slide()` blijft altijd als laatste regel binnen `_physics_process` staan.
- De volgorde van de blokken binnen `_physics_process` maakt iets uit. Houd: zwaartekracht → springen → lopen → `move_and_slide()`.

</details>

<details>
<summary>Klik hier voor de oplossing (volledig script)!</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VELOCITY

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
<summary>Mijn script geeft een Indentation-fout</summary>

**Oorzaak:** Je hebt tabs en spaties door elkaar gebruikt. GDScript is streng: elke regel binnen dezelfde functie moet op dezelfde manier ingesprongen zijn (allemaal tabs óf allemaal spaties).

**Oplossing:**

1. Selecteer de regel die de fout geeft.
2. Verwijder de inspringing aan het begin volledig.
3. Druk **één keer op Tab** om opnieuw in te springen (Godot gebruikt standaard tabs).

</details>

<details>
<summary>Ik zie niets in de Uitvoer als ik <code>print()</code> gebruik</summary>

**Oorzaak:** Het Uitvoer-paneel staat niet open, of je hebt het spel nog niet gestart.

**Oplossing:**

1. Klik onderaan het scherm op het tabblad **Uitvoer** (of **Output**).
2. Start het spel met `F5`.
3. Beweeg je karakter — nu verschijnen de print-regels.

</details>

<details>
<summary>Het karakter beweegt niet meer nadat ik iets aanpaste</summary>

**Oorzaak:** Vaak is `move_and_slide()` per ongeluk verwijderd, of staat een regel niet meer correct ingesprongen binnen `_physics_process`.

**Oplossing:**

1. Controleer dat `move_and_slide()` als laatste regel **binnen** `_physics_process` staat (dus ingesprongen).
2. Controleer dat alle regels op dezelfde inspringing staan.

</details>

<details>
<summary>Mijn karakter springt niet, of springt vreemd</summary>

**Oorzaak:** Vaak een verkeerde teken-keuze: `JUMP_VELOCITY` is positief in plaats van negatief, of `=` is `+=` geworden bij `velocity.y`.

**Oplossing:**

1. Controleer dat `JUMP_VELOCITY` een **negatief** getal is (`-400.0`, niet `400.0`).
2. Controleer dat de regel `velocity.y = JUMP_VELOCITY` is, niet `velocity.y += JUMP_VELOCITY`.

</details>

<details>
<summary>Mijn karakter blijft eindeloos doorglijden na links/rechts loslaten</summary>

**Oorzaak:** De `else`-tak met `move_toward` is weg, of de stap is veel te klein.

**Oplossing:**

1. Controleer dat na de `if direction:` een `else:`-tak komt met `velocity.x = move_toward(velocity.x, 0, SPEED)`.
2. De derde parameter (de stap) bepaalt hoe snel je afremt. `SPEED` als stap = direct stoppen. Kleinere waardes geven een glij-effect — bewuste keuze of bug.

</details>

---

← [Deel 3 — De drie krachten](./krachten.md)
