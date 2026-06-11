---
sidebar_position: 2
hide_table_of_contents: true
slug: /animaties_code
---

# Animaties in code

Je hebt nu drie animaties — `idle`, `run` en `jump` — maar ze spelen nog niet automatisch op het juiste moment. In deze les koppel je de animaties aan wat je karakter doet: op de grond rennen, in de lucht springen, of stilstaan.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: welke informatie heb je nodig?

**Welke vragen moet je script per frame beantwoorden om de juiste animatie te kiezen?**

<details>
<summary>Antwoord</summary>

Drie vragen:

1. Staat mijn karakter op de grond?
2. Beweegt mijn karakter, en welke kant op?
3. Staat mijn karakter stil?

Voor elk van deze drie maken we een variabele.

</details>

## Stap 1: Variabelen voor de toestand

Plaats deze twee variabelen bovenaan je script (onder `JUMP_VELOCITY`, boven `_physics_process`):

```gdscript
var op_de_grond
var staat_stil
```

<details>
<summary>Hoe ziet je hele script er nu uit?</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0        # gebruik jouw eigen waarde
const JUMP_VELOCITY = -800.0

var op_de_grond
var staat_stil

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

## Stap 2: `op_de_grond` invullen en de jump-animatie

Welke functie kun je gebruiken om te checken of je hoofdpersoon op de grond staat?

- Geef `op_de_grond` de waarde van die functie.
- Speel de `jump`-animatie af als de hoofdpersoon **niet** op de grond staat.

<details>
<summary>Bekijk het antwoord</summary>

```gdscript
op_de_grond = is_on_floor()
if not op_de_grond:
    $AnimatedSprite2D.play('jump')

move_and_slide()
```

Voeg dit toe **vóór** `move_and_slide()` in je `_physics_process`.

</details>

## Stap 3: De idle-animatie als je stilstaat

`velocity.x` houdt de horizontale snelheid bij.

- Bij welke waarde staat je hoofdpersoon stil?
- Hoe zet je de `idle`-animatie aan als hij stilstaat?

<details>
<summary>Bekijk het antwoord</summary>

`velocity.x == 0` betekent stilstaan. Voeg de check toe boven je animatie-keten:

```gdscript
staat_stil = velocity.x == 0
op_de_grond = is_on_floor()
if not op_de_grond:
    $AnimatedSprite2D.play('jump')
elif staat_stil:
    $AnimatedSprite2D.play('idle')

move_and_slide()
```

Let op `elif`: de `idle`-animatie wordt alleen geprobeerd als `jump` níet aan is — anders zou je elke frame twee animaties tegelijk starten.

</details>

## Stap 4: De run-animatie en spiegelen

- Bij welke waarde van `velocity.x` loopt je hoofdpersoon naar links? En naar rechts?
- Speel de `run`-animatie af als hij niet stilstaat.
- Met `$AnimatedSprite2D.flip_h = true` spiegel je het plaatje (kijkt links). Met `false` kijkt hij weer rechts.

<details>
<summary>Bekijk het antwoord</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -800.0

var op_de_grond
var staat_stil

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

    staat_stil = velocity.x == 0
    op_de_grond = is_on_floor()
    if not op_de_grond:
        $AnimatedSprite2D.play('jump')
    elif staat_stil:
        $AnimatedSprite2D.play('idle')
    elif velocity.x > 0:
        $AnimatedSprite2D.play('run')
        $AnimatedSprite2D.flip_h = false
    elif velocity.x < 0:
        $AnimatedSprite2D.play('run')
        $AnimatedSprite2D.flip_h = true

    move_and_slide()
```

</details>

## Er gaat iets mis

<details>
<summary>Mijn karakter speelt altijd de <code>jump</code>-animatie, ook op de grond</summary>

**Oorzaak:** De variabele `op_de_grond` wordt niet (op tijd) bijgewerkt. Daardoor blijft `not op_de_grond` waar.

**Oplossing:** Zorg dat `op_de_grond = is_on_floor()` **boven** je if/elif-keten staat — niet eronder en niet binnen een if-blok.

</details>

<details>
<summary>Mijn karakter kijkt de verkeerde kant op tijdens het rennen</summary>

**Oorzaak:** `flip_h` staat op de verkeerde waarde.

**Oplossing:** Onthoud:

- `flip_h = false` → karakter kijkt **rechts** (standaard).
- `flip_h = true` → karakter kijkt **links** (gespiegeld).

Dus bij `velocity.x < 0` (links bewegen): `flip_h = true`.

</details>

<details>
<summary>De idle-animatie start niet als ik stilsta</summary>

**Oorzaak:** Twee mogelijke oorzaken:

1. De volgorde van je `if` / `elif` is verkeerd: `velocity.x > 0` of `< 0` wordt eerder waar dan `staat_stil`.
2. `staat_stil = velocity.x == 0` wordt nooit waar omdat `move_toward` heel kleine waardes (0.0001) overlaat.

**Oplossing:**

- Controleer dat `elif staat_stil:` staat tussen `if not op_de_grond:` en `elif velocity.x > 0:`.
- Werk `staat_stil` bij **vlak voor** je if-keten, niet helemaal bovenaan je script.

</details>
