---
sidebar_position: 1
slug: /eigen_functies
---

# Eigen functies: je script opknippen

Je karakter-script werkt, maar `_physics_process` is een lang blok geworden: vallen, springen, lopen en animaties staan allemaal onder elkaar. Wil je iets aan het springen veranderen, dan zoek je eerst tussen dertig regels. Je knipt het blok nu op in functies met een eigen naam, zodat elke naam zegt wat dat stuk doet.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/functies/functies', label: 'Functies'},
    {site: 'python', to: '/docs/functies/09a-parameters', label: 'Parameters'},
  ]}
/>

## Voorspel: wat doet dit script?

Dit is een karakter-script dat al is opgeknipt. Lees alleen `_physics_process`.

```gdscript
extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0

func _physics_process(delta: float) -> void:
    val(delta)
    spring()
    loop()
    move_and_slide()


func val(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta


func spring() -> void:
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = sprongkracht


func loop() -> void:
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)
```

**Wat doet dit karakter elke frame, en in welke volgorde?**

<details>
<summary>Antwoord</summary>

Eerst valt hij als hij in de lucht hangt, dan springt hij als je op spatie drukt, dan loopt hij naar links of rechts, en tot slot beweegt hij. Dat lees je uit vier namen, zonder één `if` te hoeven volgen.

Het doet precies hetzelfde als je script uit [Bewegingsscript 7](site:godot/docs/movement-afsluiter). Er is geen regel bijgekomen of weggegaan, de regels staan alleen in een functie met een naam.

</details>

## Een eigen functie \{#eigen-functie}

Je kent functies al: `_physics_process` en `_ready` roept Godot zelf aan, en `geef_sprongboost()` uit [de power-up](site:godot/docs/power_up) riep je power-up aan. Een functie voor een stuk van je eigen script werkt hetzelfde, alleen roep je hem nu zelf aan:

|        Code         | Wat doet het?                                                   |
| :-----------------: | :-------------------------------------------------------------- |
| `func spring() -> void:` | Maakt de functie. Wat ingesprongen staat eronder, hoort erbij |
| `spring()`          | Voert die regels uit, op de plek waar de aanroep staat           |

Een functie die met een `_` begint, is van Godot. De namen zonder `_` bedenk je zelf. Kies een werkwoord dat zegt wat het stuk doet: `spring`, `loop`, `kies_animatie`.

## Stap 1: Knip het vallen eruit

Open je karakter-script. Bovenaan `_physics_process` staan de regels voor de zwaartekracht:

```gdscript
    if not is_on_floor():
        velocity += get_gravity() * delta
```

Maak onderaan je script een nieuwe functie, buiten `_physics_process`, en zet die twee regels erin:

```gdscript
func val(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta
```

Haal ze daarna weg uit `_physics_process`, en zet op hun plek één regel: `val(delta)`.

Start je spel met `F5`. Je karakter valt zoals altijd. Er is niets veranderd aan wat het spel doet, alleen aan hoe je script eruitziet.

## Waarom `delta` mee moet

`delta` hoort bij `_physics_process`: Godot geeft hem mee als je functie wordt aangeroepen, en hij bestaat alleen binnen die functie. Een andere functie kent hem niet. Daarom geef je hem door als **parameter**: `val(delta)` stuurt de waarde mee, en `func val(delta: float)` vangt hem op.

`spring()` en `loop()` hebben geen `delta` nodig, dus daar staat niets tussen de haakjes.

## Stap 2: Springen en lopen

Doe hetzelfde met het springen en het lopen. Je `_physics_process` wordt dan zo kort als in de voorspelling:

```gdscript
func _physics_process(delta: float) -> void:
    val(delta)
    spring()
    loop()
    move_and_slide()
```

Test na elke functie die je maakt even met `F5`. Gaat er iets mis, dan weet je zo in welke stap.

## Onderzoek: maakt de volgorde uit?

Zet `spring()` boven `val(delta)` en start je spel. Merk je verschil? Zet daarna `move_and_slide()` helemaal bovenaan.

<details>
<summary>Antwoord</summary>

`spring()` en `val(delta)` omdraaien merk je nauwelijks: allebei passen ze alleen `velocity` aan, en pas `move_and_slide()` beweegt het karakter.

Met `move_and_slide()` bovenaan beweeg je met de `velocity` van de vórige frame. Je karakter reageert dan steeds één frame te laat. Bij zestig frames per seconde zie je dat niet, maar het is een fout die je later bij het debuggen veel tijd kan kosten. Daarom blijft `move_and_slide()` als laatste staan.

</details>

## Opdracht 10.1.a: een functie voor de animaties

Heb je de animaties uit [Animaties in code](site:godot/docs/animaties_code) in je script staan? Dan is dat het langste stuk dat nog in `_physics_process` staat. Knip het eruit in een functie `kies_animatie()`.

<details>
<summary>Klik hier voor een tip.</summary>

Alles vanaf `staat_stil = velocity.x == 0` tot en met de laatste `flip_h` hoort bij de animaties. De variabelen `op_de_grond` en `staat_stil` bovenaan je script mogen blijven staan. Zet de aanroep `kies_animatie()` vlak boven `move_and_slide()`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0

var op_de_grond
var staat_stil

func _physics_process(delta: float) -> void:
    val(delta)
    spring()
    loop()
    kies_animatie()
    move_and_slide()


func val(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta


func spring() -> void:
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = sprongkracht


func loop() -> void:
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)


func kies_animatie() -> void:
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
```

Heb je `geef_sprongboost()` uit de power-up-les in je script, dan staat die er ook nog onder. Die blijft zoals hij is.

</details>

## Opdracht 10.1.b: dubbel springen

Je karakter mag één keer extra springen in de lucht. Daarna moet hij eerst weer landen. Je past daarvoor alleen de functie `spring()` aan, en voegt bovenaan één variabele toe.

<details>
<summary>Klik hier voor een tip.</summary>

- Houd in een variabele `sprongen_over` bij hoeveel sprongen je nog hebt.
- Sta je op de grond, dan zet je hem terug op `2`.
- Druk je op spatie en is hij groter dan `0`, dan spring je en tel je er één af.

Merk op dat je in `_physics_process` niets hoeft te veranderen. Dat is precies wat het opknippen je oplevert: je weet meteen in welke functie je moet zijn.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0
var sprongen_over = 2

func _physics_process(delta: float) -> void:
    val(delta)
    spring()
    loop()
    move_and_slide()


func val(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta


func spring() -> void:
    if is_on_floor():
        sprongen_over = 2
    if Input.is_action_just_pressed("ui_accept") and sprongen_over > 0:
        velocity.y = sprongkracht
        sprongen_over -= 1


func loop() -> void:
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)
```

</details>

## Er gaat iets mis

<details>
<summary>Identifier "delta" not declared in the current scope.</summary>

```
Identifier "delta" not declared in the current scope.
```

**Oorzaak:** je hebt de regels met `delta` naar een eigen functie verhuisd, maar `delta` niet meegegeven. Hij bestaat alleen in `_physics_process`.

Zo ziet dat eruit:

{/* verwacht-fout: Identifier "delta" not declared in the current scope. */}

```gdscript
# FOUT
extends CharacterBody2D

func _physics_process(delta: float) -> void:
    val()
    move_and_slide()


func val() -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta
```

**Oplossing:** geef hem mee als parameter, bij de aanroep én bij de functie:

```gdscript
extends CharacterBody2D

func _physics_process(delta: float) -> void:
    val(delta)
    move_and_slide()


func val(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta
```

</details>

<details>
<summary>Mijn karakter springt niet meer, en er staat geen fout</summary>

**Oorzaak:** de functie `spring()` bestaat, maar niemand roept hem aan. Een functie maken voert hem nog niet uit. Vaak is de aanroep weggegaan toen je de regels uit `_physics_process` knipte.

**Oplossing:** kijk of `spring()` in `_physics_process` staat, vóór `move_and_slide()`.

**Zelf vinden:** zet `print("spring")` als eerste regel in `spring()`. Zie je in **Uitvoer** geen stroom van `spring`, dan wordt de functie niet aangeroepen.

</details>

<details>
<summary>Standalone lambdas cannot be accessed. Consider assigning it to a variable.</summary>

```
Standalone lambdas cannot be accessed. Consider assigning it to a variable.
```

**Oorzaak:** je nieuwe functie staat ingesprongen, binnen `_physics_process`. Een `func` binnen een andere functie leest Godot als iets anders: een *lambda*, een functie zonder vaste plek in je script. Die heb je hier niet nodig, en daarom klinkt de melding vreemd.

{/* verwacht-fout: Standalone lambdas cannot be accessed. Consider assigning it to a variable. */}

```gdscript
# FOUT
extends CharacterBody2D

func _physics_process(delta: float) -> void:
    val(delta)
    move_and_slide()

    func val(delta: float) -> void:
        if not is_on_floor():
            velocity += get_gravity() * delta
```

**Oplossing:** haal de inspringing weg, zodat `func` helemaal links staat, net als `func _physics_process`.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
