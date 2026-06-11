---
sidebar_position: 2
hide_table_of_contents: true
slug: /sprite_movement
---

# Beweging toevoegen

Je karakter staat op het scherm, maar doet niets. Tijd om hem te laten lopen, springen en vallen. Het mooie is: Godot geeft je een compleet startscript cadeau zodra je een script aan een `CharacterBody2D` koppelt.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: wat zit er in dat standaardscript?

Godot genereert automatisch een startscript zodra je een script aan een `CharacterBody2D` hangt. **Wat denk je dat dat script in grote lijnen doet?** Denk aan: bewegen, springen, vallen.

Op deze pagina hoef je nog geen code te begrijpen — gewoon klikken, draaien, testen. In [Het bewegingsscript begrijpen](./basis_movement_begrijpen/skelet.md) ontleed je het regel voor regel.

<details>
<summary>Bekijk het standaardscript (hoeft nu niet)</summary>

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

Een paar dingen die je waarschijnlijk al herkent:

- `SPEED` en `JUMP_VELOCITY` — vaste waarden voor snelheid en sprongkracht.
- `is_on_floor()` — checkt of het karakter de grond raakt.
- `Input.is_action_just_pressed("ui_accept")` — spatiebalk indrukken.
- `move_and_slide()` — past de beweging toe.

In [Het bewegingsscript begrijpen](./basis_movement_begrijpen/skelet.md) krijgt elke regel zijn eigen uitleg.

</details>

## Stap 1: Koppel een script aan je `CharacterBody2D`

1. Selecteer je `CharacterBody2D` in de Scene Tree.
2. Klik op het script-icoontje bovenaan de Inspector (of klik met rechts → **Attach Script**).
3. Laat alles op de standaardwaarden staan en klik op **Create**.
4. Godot opent automatisch het script. Klik op **OK** bij een eventuele pop-up over het gebruik van een template.

## Stap 2: Test je karakter

Start het spel met `F5` en probeer:

- **Pijltjestoetsen links/rechts** — bewegen.
- **Spatiebalk** — springen.
- Loop van een platform af — je valt naar beneden.

<iframe width="100%" height="500px" src="https://www.youtube.com/embed/5V9f3MT86M8?start=570&end=712" title="Start Your Game Creation Journey Today! (Godot beginner tutorial)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Er gaat iets mis

<details>
<summary>Mijn karakter beweegt niet</summary>

**Oorzaak:** Het script is niet gekoppeld aan de `CharacterBody2D`, of de input-acties zijn niet ingesteld.

**Oplossing:**

1. Controleer of je `CharacterBody2D` een script-icoontje heeft in de Scene Tree.
2. Dubbelklik op het script en controleer of de code er zo uitziet:

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0

func _physics_process(delta: float) -> void:
    ...
    move_and_slide()
```

3. Controleer of `move_and_slide()` aanwezig is — zonder deze regel beweegt er niets.

</details>

<details>
<summary>Mijn karakter zweeft of valt niet</summary>

**Oorzaak:** De zwaartekrachtcode ontbreekt in het script.

**Oplossing:** Controleer of dit stukje aanwezig is in `_physics_process`:

```gdscript
if not is_on_floor():
    velocity += get_gravity() * delta
```

</details>

<details>
<summary>Ik zie een fout: "CharacterBody2D: move_and_slide called without physics frame"</summary>

**Oorzaak:** `move_and_slide()` staat buiten `_physics_process`.

**Oplossing:** Zorg dat `move_and_slide()` altijd als laatste regel **binnen** `_physics_process` staat.

</details>
