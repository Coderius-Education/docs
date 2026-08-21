---
sidebar_position: 2
slug: /animaties_code
---

# Animaties in code

Je hebt nu drie animaties — `idle`, `run` en `jump` — maar ze spelen nog niet automatisch op het juiste moment. In deze les koppel je de animaties aan wat je karakter doet: op de grond rennen, in de lucht springen, of stilstaan.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/beslissen/05a-booleans-en-vergelijken', label: 'Booleans en vergelijken'},
  ]}
/>

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

Dit is een `var` zónder `=`, en dat is nieuw. Zo'n regel maakt de variabele alvast aan, maar geeft hem nog geen waarde. Dat is hier precies de bedoeling: de echte waarde verandert elk frame, dus die vullen we straks pas in binnen `_physics_process`. Waar variabelen in je script horen te staan lees je terug in de [GDScript-tips](/gdscript-tips#variabelen).

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

## Nieuw stukje GDScript: het `$`-teken \{#dollar-teken}

In deze les gebruik je voor het eerst regels als deze:

```gdscript
$AnimatedSprite2D.play('run')
```

Het `$`-teken pakt een **child-node** uit je Scene Tree, op naam. `$AnimatedSprite2D` betekent: zoek de child die `AnimatedSprite2D` heet, en daarvan roep je vervolgens `.play('run')` aan. Het is een korte schrijfwijze voor `get_node("AnimatedSprite2D")`.

**Let op:** de naam achter `$` moet précies overeenkomen met de naam in je Scene Tree, inclusief hoofdletters. Heb je jouw node `Speler` of `Animaties` genoemd, dan schrijf je dus `$Animaties.play('run')` — of je hernoemt de node terug naar `AnimatedSprite2D`, zodat je code gelijk blijft aan die van deze les.

Meer hierover staat in de [GDScript-tips](/gdscript-tips#nodes-scenes).

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

## Opdracht 5.2.a: de idle-animatie als je stilstaat

`velocity.x` houdt de horizontale snelheid bij. Vul de twee gaten in:

```gdscript
    staat_stil = # vul aan: wanneer staat je karakter stil?
    op_de_grond = is_on_floor()
    if not op_de_grond:
        $AnimatedSprite2D.play('jump')
    elif staat_stil:
        # vul aan: speel de idle-animatie af

    move_and_slide()
```

**Zo weet je dat het klopt:** start met `F5`. Sta je stil op de grond, dan speelt `idle`. Loop je, dan niet.

<details>
<summary>Klik hier voor een tip.</summary>

Voor het eerste gat: welke waarde heeft `velocity.x` precies als er niemand op een toets drukt en je karakter is uitgeremd?

Voor het tweede gat: kijk naar de regel erboven, in de `if`. Dezelfde vorm, andere animatienaam.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

`velocity.x == 0` betekent stilstaan. Tot nu toe zag je `==` alleen bínnen een `if`, maar zo'n vergelijking is zelf ook een waarde: `true` of `false`. Die waarde kun je in een variabele bewaren:

| `velocity.x` | `velocity.x == 0` | `staat_stil` wordt |
|:---:|:---:|:---:|
| `0` | `true` | `true` |
| `300` | `false` | `false` |

Voeg de check toe boven je animatie-keten:

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

## Opdracht 5.2.b: de run-animatie en spiegelen

Nu de laatste twee takken van de keten. Met `$AnimatedSprite2D.flip_h = true` spiegel je het plaatje zodat je karakter naar links kijkt; met `false` kijkt hij weer naar rechts.

```gdscript
    elif velocity.x > 0:
        # vul aan: speel run af en laat hem naar rechts kijken
    elif velocity.x < 0:
        # vul aan: speel run af en laat hem naar links kijken
```

**Zo weet je dat het klopt:** loop naar rechts en je karakter rent naar rechts; loop naar links en hij rent gespiegeld terug.

<details>
<summary>Klik hier voor een tip.</summary>

Elke tak heeft twee regels nodig: één om de animatie te starten en één om `flip_h` goed te zetten. Bedenk bij welke richting `velocity.x` negatief is.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

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
2. `staat_stil` wordt bijgewerkt vóórdat `move_toward` de snelheid op `0` heeft gezet, en houdt dan een frame lang de oude waarde vast.

Over dat tweede: met stap `SPEED` (zoals in [Deel 3 — Lopen](../04-personage-en-beweging/basis_movement_begrijpen/krachten.md)) maakt `move_toward` de snelheid in één frame exact `0`. Alleen als je bewust een kleinere stap koos voor een glij-effect, blijft `velocity.x` nog een paar frames ongelijk aan nul en start `idle` iets later — dat is dan geen bug, maar het gevolg van het glijden.

**Oplossing:**

- Controleer dat `elif staat_stil:` staat tussen `if not op_de_grond:` en `elif velocity.x > 0:`.
- Werk `staat_stil` bij **vlak voor** je if-keten, dus ná de regel met `move_toward`.

</details>

Staat je fout er niet bij? In [Fouten zoeken](../04-personage-en-beweging/fouten-zoeken.md) staat hoe je hem zelf opspoort.
