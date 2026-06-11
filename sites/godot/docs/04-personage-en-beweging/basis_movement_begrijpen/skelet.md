---
sidebar_position: 1
hide_table_of_contents: true
slug: /basis_movement_begrijpen
---

# Het bewegingsscript begrijpen — Deel 1: Het skelet

Het bewegingsscript dat Godot voor je genereerde lijkt op het eerste gezicht ondoorgrondelijk: 17 regels code met losse termen als `velocity`, `delta` en `move_and_slide()`. Maar onder de motorkap bestaat het script uit **vier logische blokken**, met elk een eigen doel. We pakken ze één voor één — verspreid over **vier deeltjes** — eerst snappen, dan veranderen, dan zelf bouwen.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Het hele script in vogelvlucht

Dit is wat Godot voor je heeft gegenereerd. Je hoeft het nu nog niet te snappen — herken alleen de vier blokken:

```gdscript
extends CharacterBody2D                              # Blok 1: het skelet

const SPEED = 300.0
const JUMP_VELOCITY = -400.0

func _physics_process(delta: float) -> void:         # Blok 2: de motor
    if not is_on_floor():                            # Blok 3a: zwaartekracht
        velocity += get_gravity() * delta

    if Input.is_action_just_pressed("ui_accept") \   # Blok 3b: springen
       and is_on_floor():
        velocity.y = JUMP_VELOCITY

    var direction := Input.get_axis("ui_left", "ui_right")  # Blok 3c: lopen
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)

    move_and_slide()                                 # Blok 4: toepassen
```

We pakken nu elk blok los, met steeds een **voorspel**, een **test** in je eigen project en een **uitleg**. Dit eerste deel doet **Blok 1**: het skelet.

---

## Blok 1: Het skelet — wie ben je en wat is je snelheid?

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0
```

### `extends CharacterBody2D` — wat doet dit?

**Wat denk je dat er gebeurt als je de eerste regel weghaalt?**

<details>
<summary>Antwoord</summary>

Godot crasht met een foutmelding. `extends CharacterBody2D` betekent: "dit script *is* een `CharacterBody2D`, met daarbovenop wat extra eigen code". Zonder die regel weet Godot niet welke node-soort je script aanstuurt — en functies zoals `is_on_floor()` en `move_and_slide()` zijn niet beschikbaar.

Analogie: een `CharacterBody2D` is een "basisrecept". Met `extends` zeg je: ik bak hetzelfde recept, plus mijn eigen toevoegingen.

</details>

### `const` versus `var` — waarom kiezen we hier `const`?

**Wat verwacht je dat er gebeurt als je `const SPEED = 300.0` ergens in `_physics_process` probeert te veranderen, bijvoorbeeld `SPEED = 500.0`?**

<details>
<summary>Antwoord</summary>

Godot weigert: `const`-variabelen zijn vaste waarden die nooit veranderen. Een prima keuze voor instellingen die je per niveau wilt afstemmen maar niet *tijdens* het spelen. Voor waarden die wel veranderen tijdens het spel (bijvoorbeeld `score`) gebruik je `var`.

</details>

### Modify: `SPEED` en `JUMP_VELOCITY` aanpassen

1. Verander `const SPEED = 300.0` naar `1000.0`. Start met `F5`. → Karakter racet.
2. Verander `const JUMP_VELOCITY = -400.0` naar `-800.0`. Start met `F5`. → Karakter springt veel hoger.

### Waarom is `JUMP_VELOCITY` negatief?

**Wat zou er gebeuren als je `JUMP_VELOCITY = 400.0` (positief) maakt?**

<details>
<summary>Antwoord</summary>

Je karakter "springt" **naar beneden** — hij dweilt direct door de vloer of versnelt naar beneden. In Godot is het coördinatenstelsel namelijk omgekeerd aan wiskunde:

- Linksboven op het scherm is `x=0` en `y=0`.
- Naar **rechts** wordt `x` hoger (positief).
- Naar **beneden** wordt `y` hoger (positief).
- Naar **boven** wordt `y` dus *lager* (negatief).

Daarom moet `JUMP_VELOCITY` negatief zijn om omhoog te bewegen.

![Godot coördinatenstelsel](../../images/coordinaten.svg)

</details>

---

**Volgende:** [Deel 2 — De motor (`_physics_process`)](./motor.md) →
