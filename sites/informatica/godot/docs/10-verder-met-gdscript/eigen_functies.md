---
sidebar_position: 1
slug: /eigen_functies
---

# Eigen functies: je script opknippen

Je karakter-script werkt, maar `_physics_process` is een lang blok geworden: vallen, springen, lopen en animaties staan allemaal onder elkaar. Wil je iets aan het springen veranderen, dan zoek je eerst tussen twintig regels. Je knipt het blok op in functies met een eigen naam, zodat elke naam zegt wat dat stuk doet. Waar je knipt en hoe de stukken heten, bepaal je zelf.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/functies/functies', label: 'Functies'},
    {site: 'python', to: '/docs/functies/09a-parameters', label: 'Parameters'},
  ]}
/>

## Je script als beginpunt

De les gaat uit van je karakter-script zoals het is na [Animaties in code](site:godot/docs/animaties_code) en [Een power-up](site:godot/docs/power_up). Zo ziet het eruit:

```gdscript
extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0

var op_de_grond
var staat_stil

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = sprongkracht

    var direction := Input.get_axis("ui_left", "ui_right")
    if direction != 0:
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

func geef_sprongboost() -> void:
    sprongkracht = -1300.0
    print("Boost!")
    await get_tree().create_timer(5.0).timeout
    sprongkracht = -800.0
    print("Boost voorbij")
```

Heb je bij opdracht 7.6.a van `SPEED` een `var snelheid` gemaakt, dan staat bij jou `snelheid` waar hier `SPEED` staat, en heb je onderaan ook `geef_snelheidsboost()`. Voor deze les maakt dat niets uit: laat die functie staan zoals hij is.

## Voorspel: waar knip je?

Lees `_physics_process` van boven naar beneden. **Uit hoeveel stukken bestaat hij, waar begint en eindigt elk stuk, en welke naam zou je elk stuk geven?** Schrijf het op voordat je verder leest.

<details>
<summary>Antwoord</summary>

Vier stukken, elk met een eigen taak:

1. de zwaartekracht: de `if not is_on_floor()` met één regel eronder;
2. springen: de `if` met `ui_accept`;
3. lopen: van `var direction` tot en met de `else`;
4. de animatie kiezen: van `staat_stil = ...` tot en met de laatste `flip_h`.

`move_and_slide()` hoort bij geen van de vier: die beweegt het karakter met wat de stukken erboven in `velocity` zetten.

Namen bedenk je zelf. In deze les heten ze `val`, `spring`, `loop` en `kies_animatie`, maar `zwaartekracht` of `beweeg_opzij` zijn net zo goed. Een goede naam zegt wat het stuk doet, zodat je hem later terugvindt zonder de regels te lezen.

</details>

## Een eigen functie \{#eigen-functie}

Je kent functies al: `_physics_process` en `_ready` roept Godot zelf aan, en `geef_sprongboost()` uit de power-up-les riep je power-up aan. Een functie voor een stuk van je eigen script werkt hetzelfde, alleen roep je hem nu zelf aan:

| Code | Wat doet het? |
| :--- | :--- |
| `func spring() -> void:` | Maakt de functie. Wat ingesprongen staat eronder, hoort erbij |
| `spring()` | Voert die regels uit, op de plek waar de aanroep staat |

Namen met een `_` ervoor laat je aan Godot: `_ready` en `_physics_process` roept Godot zelf aan, en `_on_body_entered` maakte Godot voor je bij een signal. Je eigen functies krijgen een naam zonder `_`, het liefst een werkwoord.

## Stap 1: Knip het vallen eruit

Het eerste stuk doe je samen. Bovenaan `_physics_process` staan de regels voor de zwaartekracht:

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

`delta` hoort bij `_physics_process`: Godot geeft hem mee als het die functie aanroept, en hij bestaat alleen daarbinnen. Een andere functie kent hem niet. Daarom geef je hem door als **parameter**: `val(delta)` stuurt de waarde mee, en `func val(delta: float)` vangt hem op.

## Opdracht 10.1.a: knip de rest zelf op

Knip de drie andere stukken uit je voorspelling elk in een eigen functie, met de namen die jij koos. Daarna staan er in `_physics_process` alleen nog vier aanroepen en `move_and_slide()`.

Start je spel na elke functie die je maakt even met `F5`. Gaat er iets mis, dan weet je zo bij welk stuk.

<details>
<summary>Klik hier voor een tip.</summary>

- Kijk per stuk of het `delta` gebruikt. Alleen dan heeft de functie een parameter nodig.
- Zet de aanroepen in dezelfde volgorde als de stukken stonden.
- `move_and_slide()` blijft in `_physics_process`, als laatste regel.
- De variabelen `op_de_grond` en `staat_stil` bovenaan je script laat je staan.

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
    if direction != 0:
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

func geef_sprongboost() -> void:
    sprongkracht = -1300.0
    print("Boost!")
    await get_tree().create_timer(5.0).timeout
    sprongkracht = -800.0
    print("Boost voorbij")
```

Koos je andere namen, of verdeelde je het anders, dan is dat ook goed, zolang elke functie één ding doet en je spel hetzelfde doet als ervoor. `geef_sprongboost()` blijft onderaan staan zoals hij was; de power-up roept hem aan.

</details>

## Onderzoek: in welke functie zoek je?

Je script is nu opgeknipt. Stel dat er later iets misgaat. **In welke functie kijk je als eerste?**

1. Je karakter kijkt de verkeerde kant op als hij naar links loopt.
2. Na een sprong blijft je karakter in de lucht hangen.
3. Je karakter kan in de lucht steeds opnieuw springen.
4. De loop-animatie speelt, maar je karakter komt niet van zijn plek.

<details>
<summary>Antwoord</summary>

1. `kies_animatie()`: daar staat `flip_h`, die het plaatje omdraait.
2. `val()`: daar komt de zwaartekracht bij `velocity`.
3. `spring()`: daar hoort de controle `is_on_floor()` te staan.
4. In geen van de vier: de animatie kijkt naar `velocity.x`, dus die klopt. Dan ontbreekt `move_and_slide()` in `_physics_process`: zonder die regel verandert `velocity` wel, maar beweegt het karakter niet.

Met één lang blok had je bij elk van die vragen twintig regels moeten lezen. Nu wijst de naam je de weg.

</details>

## Opdracht 10.1.b: dubbel springen

Je karakter mag in de lucht één keer extra springen, ook als hij van een randje is gelopen. Koos je dit bij opdracht 5.7.a al, dan heb je het werkend; zet het nu in `spring()`, en vergelijk daarna je versie met de oplossing. Daarna moet hij eerst weer landen. Je past daarvoor alleen `spring()` aan, en zet bovenaan één variabele.

<details>
<summary>Klik hier voor een tip.</summary>

- Houd in een variabele `extra_sprong` bij of de extra sprong nog over is: `true` of `false`.
- Sta je op de grond, dan zet je hem op `true`.
- Druk je op spatie, dan zijn er twee gevallen: je staat op de grond, of je hangt in de lucht en `extra_sprong` is nog `true`. Alleen in het tweede geval zet je hem op `false`.

Merk op dat je in `_physics_process` niets hoeft te veranderen. Dat levert het opknippen je op: je weet meteen in welke functie je moet zijn.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0

var op_de_grond
var staat_stil
var extra_sprong = true

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
    if is_on_floor():
        extra_sprong = true
    if Input.is_action_just_pressed("ui_accept"):
        if is_on_floor():
            velocity.y = sprongkracht
        elif extra_sprong:
            velocity.y = sprongkracht
            extra_sprong = false


func loop() -> void:
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction != 0:
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

func geef_sprongboost() -> void:
    sprongkracht = -1300.0
    print("Boost!")
    await get_tree().create_timer(5.0).timeout
    sprongkracht = -800.0
    print("Boost voorbij")
```

Heb je `geef_snelheidsboost()` uit opdracht 7.6.a, dan staat die er bij jou ook nog onder.

Loop je van een randje, dan stond je net nog op de grond, dus `extra_sprong` is `true`: je krijgt één sprong in de lucht. Spring je vanaf de grond, dan kost die eerste sprong de extra sprong niet, en heb je er in de lucht ook één.

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
