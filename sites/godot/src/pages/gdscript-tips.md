# GDScript Tips

Handige tips en trucs voor GDScript. Klik op een onderwerp om het open te klappen.

---

## Variabelen \{#variabelen}

<details>
<summary>Wat is het verschil tussen <code>var</code> en <code>const</code>?</summary>

- `var` is een variabele die je kunt veranderen
- `const` is een constante die **nooit** verandert

```gdscript
var score = 0         # Kan veranderen
const SPEED = 300.0   # Verandert nooit
```

Gebruik `const` voor waarden die altijd hetzelfde blijven, zoals snelheid of zwaartekracht. Schrijf ze in hoofdletters, zoals `SNELHEID`.

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

## Functies \{#functies}

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

<details>
<summary>Hoe geef ik een waarde terug uit een functie? (<code>return</code>)</summary>

Met `return` stuur je een antwoord terug naar de plek waar de functie werd aangeroepen. Achter de pijl zet je wat voor soort waarde dat is.

```gdscript
func is_game_over() -> bool:
    return levens <= 0

func aantal_muntjes() -> int:
    return get_tree().get_nodes_in_group("muntjes").size()
```

Gebruiken doe je zo:

```gdscript
if Global.is_game_over():
    print("Einde")
```

`-> void` betekent dat een functie niets teruggeeft. Dat is hetzelfde als een Python-functie zonder `return`, die daar `None` oplevert.

</details>

---

## Lussen en lijsten \{#lussen}

<details>
<summary>Hoe herhaal ik iets een vast aantal keer? (<code>for</code> + <code>range</code>)</summary>

Precies zoals in Python:

```gdscript
for i in range(3):
    print(i)
```

Dit print `0`, `1`, `2`. De stopwaarde zelf doet niet mee: `range(3)` stopt vóór de 3.

</details>

<details>
<summary>Hoe loop ik door een lijst?</summary>

```gdscript
var kleuren = ["rood", "groen", "blauw"]

for kleur in kleuren:
    print(kleur)
```

De lusvariabele (`kleur`) krijgt elke ronde het volgende item. In een game gebruik je dit vaak op een group:

```gdscript
for vijand in get_tree().get_nodes_in_group("vijanden"):
    vijand.stop()
```

</details>

<details>
<summary>Lijsten: van Python naar GDScript</summary>

De vorm is gelijk — blokhaken, index vanaf 0 — maar een paar namen verschillen:

| Python | GDScript | Let op |
|---|---|---|
| `len(lijst)` | `lijst.size()` | |
| `lijst.append(x)` | `lijst.append(x)` | gelijk |
| `lijst.remove(x)` | `lijst.erase(x)` | |
| `sorted(lijst)` | `lijst.sort()` | GDScript sorteert de lijst **zelf**; Python geeft een kopie terug |

```gdscript
var scores = [3, 1, 2]
scores.append(5)
scores.sort()
print(scores.size())   # 4
print(scores[0])       # 1
```

</details>

---

## If-statements \{#if-statements}

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

## Input \{#input}

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

## Nodes & Scenes \{#nodes-scenes}

<details>
<summary>Wat betekent het <code>$</code>-teken?</summary>

`$` is een snelkoppeling om een **child-node** op te zoeken op naam:

```gdscript
$AnimatedSprite2D              # Zoekt de child-node genaamd "AnimatedSprite2D"
$AnimatedSprite2D.play("run")  # Roept een functie aan op die node
$AnimatedSprite2D.flip_h       # Leest een eigenschap van die node
```

`$AnimatedSprite2D` is hetzelfde als `get_node("AnimatedSprite2D")`, maar korter.

**Let op:** De naam moet **exact** overeenkomen met de naam in de scene tree (hoofdlettergevoelig).

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

<details>
<summary>Hoe spawn ik een scène in code? (<code>preload</code> + <code>instantiate</code>)</summary>

Drie stappen: scène-bestand inladen, een exemplaar maken, in de Scene Tree hangen.

```gdscript
const MUNTJE = preload("res://muntje.tscn")

func spawn_muntje(x: float, y: float) -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(x, y)
    add_child(nieuw_muntje)
```

- `preload()` — laadt het bestand één keer, bij het starten van je spel
- `instantiate()` — maakt een nieuw exemplaar van die bouwtekening
- `add_child()` — hangt het exemplaar in de Scene Tree; zonder deze regel zie je niets

</details>

---

## Signals \{#signals}

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

## Debuggen \{#debuggen}

De methode om zélf een onbekende fout te vinden staat in [Fouten zoeken](/docs/fouten-zoeken). Hieronder alleen de losse hulpmiddelen.

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

```
res://scripts/player.gd:15 - Invalid call. Nonexistent function 'plya' in base 'AnimatedSprite2D'.
```

Bestand → regelnummer → wat er mis is. Dubbelklik op de melding en Godot springt naar die regel.

Uitgebreider, met de veelvoorkomende meldingen erbij: [Een foutmelding lezen](/docs/fouten-zoeken#foutmelding-lezen).

</details>

---

## Veelgebruikte patronen \{#patronen}

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
<summary>Compleet spawner script (level met Timer)</summary>

```gdscript
extends Node2D

const MUNTJE = preload("res://muntje.tscn")

func spawn_muntje(x: float, y: float) -> void:
    var nieuw_muntje = MUNTJE.instantiate()
    nieuw_muntje.position = Vector2(x, y)
    add_child(nieuw_muntje)

func _on_timer_timeout() -> void:
    spawn_muntje(randf_range(50, 1000), 100)
```

Vereist een `Timer`-node in de scène met het `timeout`-signal gekoppeld.

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

Vergeet niet dit script als **Autoload** in te stellen via Project Settings.

</details>
