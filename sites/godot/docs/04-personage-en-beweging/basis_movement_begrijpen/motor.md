---
sidebar_position: 2
hide_table_of_contents: true
slug: /movement-motor
---

# Het bewegingsscript begrijpen — Deel 2: De motor

In [Deel 1](./skelet.md) zag je het skelet — `extends CharacterBody2D` plus twee constanten. Nu de motor die alles aandrijft: de functie die Godot **60× per seconde** automatisch aanroept.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Blok 2: De motor — `_physics_process(delta)` als kloppend hart

```gdscript
func _physics_process(delta: float) -> void:
    ...
```

### Wat doet `_physics_process`?

Godot roept deze functie **automatisch ongeveer 60 keer per seconde aan**. Alles wat erin staat gebeurt dus continu. Dat is waarom je karakter beweegt: 60× per seconde rekent Godot de nieuwe positie uit.

**Wat verwacht je dat er gebeurt als je `_physics_process` vervangt door `_ready`?**

<details>
<summary>Antwoord</summary>

`_ready` draait maar één keer (bij start van de scène). Je karakter beweegt dus exact één frame en stopt daarna. Geen continue beweging meer.

</details>

### `_process` versus `_physics_process` — wat is het verschil?

Godot heeft *twee* "draait-elke-frame"-functies. Welke je kiest hangt af van of er physics in het spel zijn:

| Functie                 | Wanneer gebruik je het?                              |
| :---------------------- | :--------------------------------------------------- |
| `_process(delta)`       | UI-elementen, timers, animatie-logica zonder physics |
| `_physics_process(delta)` | Beweging, zwaartekracht, botsingen — alles waar physics bij komt kijken |

Voor het bewegingsscript kiezen we `_physics_process` omdat Godot's physics-engine (botsingen, `move_and_slide`) hierop synchroniseert.

### Wat is `delta`?

`delta` is de tijd in seconden **sinds de vorige aanroep van de functie**. Bij 60 FPS dus ongeveer `0.0167` (1 / 60). Bij 30 FPS ongeveer `0.033`.

**Voeg deze regel toe boven `if not is_on_floor()` en start het spel:**

```gdscript
print(delta)
```

Wat zie je in **Uitvoer**?

<details>
<summary>Antwoord</summary>

Een lange stroom getallen rond `0.0167` (60 FPS). Soms wat hoger als je computer een drukke seconde heeft. `delta` is dus geen vast getal — het schommelt met de framerate.

</details>

### Waarom delta erbij vermenigvuldigen?

We gebruiken `delta` om beweging **framerate-onafhankelijk** te maken. Zonder `delta` zou een snelle PC (120 FPS) je karakter twee keer zo snel laten bewegen als een trage (60 FPS). *Mét* `delta` is de afgelegde afstand per seconde altijd hetzelfde, ongeacht hoeveel frames je PC trekt.

### `-> void` — wat betekent dat?

Het pijltje zegt: "deze functie geeft niets terug". Veel ingebouwde Godot-functies geven `void` terug — ze *doen* iets (snelheid aanpassen, animatie afspelen) in plaats van iets te berekenen dat je later gebruikt.

---

← [Deel 1 — Het skelet](./skelet.md) · **Volgende:** [Deel 3 — De drie krachten](./krachten.md) →
