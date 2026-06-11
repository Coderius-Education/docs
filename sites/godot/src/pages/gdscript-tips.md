# GDScript Tips

Handige tips en trucs voor GDScript. Klik op een onderwerp om het open te klappen.

---

## Variabelen

<details>
<summary>Wat is het verschil tussen <code>var</code> en <code>const</code>?</summary>

- `var` is een variabele die je kunt veranderen
- `const` is een constante die **nooit** verandert

```gdscript
var score = 0         # Kan veranderen
const SPEED = 300.0   # Verandert nooit
```

Gebruik `const` voor waarden die altijd hetzelfde blijven, zoals snelheid of zwaartekracht. Schrijf ze in **HOOFDLETTERS**.

</details>

<details>
<summary>Wat betekent <code>:=</code>?</summary>

Met `:=` laat je Godot het type **automatisch bepalen** op basis van de waarde die je toekent:

```gdscript
var richting := 0.0          # Godot weet: dit is een float
var naam := "Speler"         # Godot weet: dit is een String
var direction := Input.get_axis("ui_left", "ui_right")  # Godot weet: dit is een float
```

Je hoeft het type dan niet zelf op te schrijven.

</details>

<details>
<summary>Waar zet ik mijn variabelen neer?</summary>

Zet variabelen altijd **bovenaan** je script, na `extends` en na je constanten:

```gdscript
extends CharacterBody2D       # 1. Extends

const SPEED = 300.0           # 2. Constanten

var score = 0                 # 3. Variabelen
var op_de_grond = false

func _physics_process(delta): # 4. Functies
    pass
```

</details>

---

## Functies

<details>
<summary>Wat is <code>_physics_process(delta)</code>?</summary>

Dit is een speciale functie die Godot **elk physics-frame** aanroept (standaard 60 keer per seconde). Gebruik deze voor alles wat met beweging en fysica te maken heeft.

```gdscript
func _physics_process(delta: float) -> void:
    velocity += get_gravity() * delta
    move_and_slide()
```

`delta` is de tijd (in seconden) sinds het vorige frame. Dit zorgt ervoor dat je spel even snel draait op snelle en langzame computers.

</details>

<details>
<summary>Wat is het verschil tussen <code>_process</code> en <code>_physics_process</code>?</summary>

| Functie | Wanneer? | Gebruik voor |
|---|---|---|
| `_process(delta)` | Elk frame (variabel) | UI updates, animaties, niet-fysica logica |
| `_physics_process(delta)` | Elk physics-frame (vast, 60x/s) | Beweging, botsingen, fysica |

**Vuistregel:** Gebruik `_physics_process` als je `move_and_slide()` of `velocity` gebruikt.

</details>

<details>
<summary>Hoe maak ik een eigen functie?</summary>

```gdscript
func mijn_functie():
    print("Hallo!")

func bereken_schade(aanval, verdediging):
    var schade = aanval - verdediging
    return schade
```

Aanroepen doe je zo:

```gdscript
mijn_functie()
var resultaat = bereken_schade(10, 3)  # resultaat = 7
```

</details>

---

## If-statements

<details>
<summary>Hoe werkt een if-statement?</summary>

```gdscript
if voorwaarde:
    # Dit gebeurt als de voorwaarde waar is
elif andere_voorwaarde:
    # Dit gebeurt als de eerste niet waar is, maar deze wel
else:
    # Dit gebeurt als geen enkele voorwaarde waar is
```

Voorbeeld:

```gdscript
if score >= 100:
    print("Je hebt gewonnen!")
elif score >= 50:
    print("Bijna!")
else:
    print("Blijf muntjes verzamelen!")
```

</details>

<details>
<summary>Hoe combineer ik meerdere voorwaarden?</summary>

Gebruik `and` en `or`:

```gdscript
# Beide moeten waar zijn
if is_on_floor() and Input.is_action_just_pressed("ui_accept"):
    velocity.y = JUMP_VELOCITY

# Eén van de twee moet waar zijn
if velocity.x > 0 or velocity.x < 0:
    $AnimatedSprite2D.play("run")
```

Met `not` draai je een voorwaarde om:

```gdscript
if not is_on_floor():
    $AnimatedSprite2D.play("jump")
```

</details>

---

## Input

<details>
<summary>Wat is het verschil tussen <code>is_action_pressed</code> en <code>is_action_just_pressed</code>?</summary>

| Functie | Wanneer `true`? | Gebruik voor |
|---|---|---|
| `is_action_pressed("ui_accept")` | **Zolang** je de toets ingedrukt houdt | Bewegen, schieten (continu) |
| `is_action_just_pressed("ui_accept")` | Alleen op het **moment** dat je de toets indrukt | Springen, menu openen (eenmalig) |

```gdscript
# Springen — alleen 1x per keer dat je drukt
if Input.is_action_just_pressed("ui_accept"):
    velocity.y = JUMP_VELOCITY

# Bewegen — zolang je de toets vasthoudt
if Input.is_action_pressed("ui_right"):
    velocity.x = SPEED
```

</details>

<details>
<summary>Wat doet <code>Input.get_axis()</code>?</summary>

`get_axis()` geeft een getal terug tussen `-1` en `1`:

```gdscript
var direction := Input.get_axis("ui_left", "ui_right")
# direction = -1  → links ingedrukt
# direction =  0  → niks ingedrukt
# direction =  1  → rechts ingedrukt
```

Dit is handig omdat je het direct kunt vermenigvuldigen met je snelheid:

```gdscript
velocity.x = direction * SPEED
```

</details>

---

## Nodes & Scenes

<details>
<summary>Wat betekent het <code>$</code>-teken?</summary>

`$` is een snelkoppeling om een **child-node** op te zoeken op naam:

```gdscript
$AnimatedSprite2D              # Zoekt de child-node genaamd "AnimatedSprite2D"
$AnimatedSprite2D.play("run")  # Roept een functie aan op die node
$AnimatedSprite2D.flip_h       # Leest een eigenschap van die node
```

`$AnimatedSprite2D` is hetzelfde als `get_node("AnimatedSprite2D")`, maar korter.

**Let op:** De naam moet **exact** overeenkomen met de naam in de scene tree (hoofdlettergevoelig!).

</details>

<details>
<summary>Wat doet <code>queue_free()</code>?</summary>

`queue_free()` verwijdert een node uit het spel. Het muntje, een vijand, een kogel — alles wat weg moet:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    queue_free()  # Verwijdert DEZE node
```

De node wordt niet direct verwijderd, maar aan het einde van het huidige frame. Zo voorkom je crashes.

</details>

---

## Signals

<details>
<summary>Hoe koppel ik een signal via de editor?</summary>

1. Selecteer de node die het signal verstuurt (bijv. `Area2D`)
2. Ga naar het **Node** tabblad (rechts naast de Inspector)
3. Dubbelklik op het signal (bijv. `body_entered`)
4. Kies de ontvangende node en klik op **Connect**

Godot maakt automatisch een functie aan:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    pass  # Jouw code hier
```

</details>

<details>
<summary>Hoe koppel ik een signal via code?</summary>

```gdscript
func _ready():
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
    print("Botsing!")
```

`_ready()` wordt één keer aangeroepen wanneer de node in de scene tree wordt geplaatst.

</details>

---

## Debuggen

<details>
<summary>Hoe debug ik mijn code?</summary>

Gebruik `print()` om waarden naar de console te schrijven:

```gdscript
print("Hallo!")                  # Tekst
print(velocity)                  # Vector2 waarde
print("Score: ", score)          # Tekst + variabele
print(is_on_floor())             # true of false
```

De output verschijnt in het **Output** paneel onderaan in Godot.

</details>

<details>
<summary>Hoe lees ik een foutmelding?</summary>

Een foutmelding in Godot ziet er zo uit:

```
res://scripts/player.gd:15 - Invalid call. Nonexistent function 'plya' in base 'AnimatedSprite2D'.
```

Lees het zo:
- **`res://scripts/player.gd`** → Het bestand waar de fout zit
- **`:15`** → Op regel 15
- **De rest** → Wat er mis is (in dit geval: de functie `plya` bestaat niet — het moet `play` zijn)

</details>

---

## Veelgebruikte patronen

<details>
<summary>Compleet movement script</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -800.0

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

<details>
<summary>Compleet muntje script</summary>

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.score += 1
    print("Score: ", Global.score)
    queue_free()
```

</details>

<details>
<summary>Compleet global script</summary>

```gdscript
extends Node

var score = 0
var levens = 3

func reset():
    score = 0
    levens = 3
```

Vergeet niet dit script als **Autoload** in te stellen via Project Settings!

</details>
