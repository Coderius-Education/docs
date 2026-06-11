---
sidebar_position: 3
hide_table_of_contents: true
slug: /movement-krachten
---

# Het bewegingsscript begrijpen — Deel 3: De drie krachten

In [Deel 2](./motor.md) zag je hoe `_physics_process` 60× per seconde draait. In *die* functie werken drie krachten op je karakter: **zwaartekracht** trekt hem naar beneden, **springen** geeft hem een omhoog-zetje, en **horizontaal lopen** beweegt hem links of rechts. Elke kracht is een eigen sub-blok.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Blok 3: De drie krachten op je karakter

### 3a. Zwaartekracht

```gdscript
if not is_on_floor():
    velocity += get_gravity() * delta
```

#### Wat is `velocity`?

`velocity` is **een Vector2 met de snelheid van je karakter** — een X en een Y samen in één variabele. Voeg `print(velocity)` toe boven `move_and_slide()` en kijk in **Uitvoer**:

```gdscript
print(velocity)
move_and_slide()
```

- Stilstaan: `(0, 0)` — geen beweging.
- Naar rechts lopen: `(300, 0)` — 300 pixels/sec naar rechts, 0 verticaal.
- Naar links lopen: `(-300, 0)`.
- Vallend: `(0, 200)`, daarna `(0, 400)`, daarna `(0, 600)` — verticaal versneld!

Je kunt `.x` en `.y` los aanspreken (`velocity.x = 100`) — handig om alleen horizontaal of alleen verticaal aan te passen.

#### Waarom `+=` en niet `=`?

`velocity += iets` is een verkorting voor `velocity = velocity + iets`. Dus de zwaartekracht wordt **opgeteld bij de bestaande snelheid**, frame na frame. Zo bouwt valsnelheid zich op: na 1 seconde val je hard, na 2 seconden harder.

**Wat zou er gebeuren als je `+=` vervangt door `=`?**

<details>
<summary>Antwoord</summary>

Je karakter valt steeds in een constant tempo, niet versneld. Want elke frame zet je `velocity` weer terug op `get_gravity() * delta` — een klein getal — in plaats van het op te bouwen. Je krijgt een soort "zacht zwevend" effect dat niet meer als zwaartekracht voelt.

</details>

#### Wat doet `get_gravity()`?

Een ingebouwde Godot-functie die de zwaartekracht-vector teruggeeft, standaard ongeveer `(0, 980)` — 980 pixels/sec² naar beneden. Je hoeft dit getal niet zelf in te stellen; Godot leest het uit Project Settings.

#### Waarom de `if not is_on_floor()`-check?

**Wat denk je dat er gebeurt als je deze check weghaalt en altijd zwaartekracht toepast?**

<details>
<summary>Antwoord</summary>

Je `velocity.y` blijft eeuwig groeien terwijl je op de grond staat. Fysiek houdt de collision je tegen, maar je verticale snelheid loopt onzichtbaar op tot enorme waarden. Spring je dan, dan moet `velocity.y = JUMP_VELOCITY` eerst dat hele bouwwerk terugzetten — vaak werkt het, maar bij hoge waarden krijg je rare effecten.

Vandaar: alleen zwaartekracht toepassen **als je niet op de grond staat**.

</details>

#### Wat doet `is_on_floor()` eigenlijk?

Geeft `true` als je karakter de vloer raakt, anders `false`. Test het: voeg `print(is_on_floor())` toe vlak boven `if not is_on_floor()`:

```gdscript
print(is_on_floor())
if not is_on_floor():
    velocity += get_gravity() * delta
```

In **Uitvoer** zie je `true` zolang je op de grond staat, `false` tijdens een sprong of val:

![Uitvoer-paneel met true/false-output van is_on_floor()](../../images/is_on_floor.png)

#### Predict: wat als je `* delta` weglaat?

Dus: `velocity += get_gravity()` zonder `* delta`. Wat denk je?

<details>
<summary>Antwoord</summary>

Je karakter valt **veel** sneller — `get_gravity()` is `(0, 980)`. Zonder `* delta` tel je elke frame `980` op bij `velocity.y`. Bij 60 FPS is dat 60× per seconde, dus na één seconde heb je `velocity.y = 58.800` (in plaats van `980`).

Dit is precies waarom we `delta` gebruiken: het maakt de snelheid framerate-onafhankelijk.

</details>

### 3b. Springen

```gdscript
if Input.is_action_just_pressed("ui_accept") and is_on_floor():
    velocity.y = JUMP_VELOCITY
```

#### `just_pressed` versus `pressed` — waarom maakt dat uit?

In Godot zijn er twee manieren om naar een toets te kijken:

| Functie                              | Wanneer geeft hij `true`?                    |
| :----------------------------------- | :------------------------------------------- |
| `Input.is_action_pressed("ui_accept")`     | Zolang je de toets ingedrukt **houdt**       |
| `Input.is_action_just_pressed("ui_accept")` | Alleen op het ene frame dat je de toets **indrukt** |

**Wat denk je dat er gebeurt als je `just_pressed` vervangt door `pressed`?**

<details>
<summary>Antwoord</summary>

Je karakter "stuitert" continu omhoog zolang je de spatie ingedrukt houdt. Want elk frame voldoet `pressed` aan de check, dus elk frame zet je `velocity.y` opnieuw op `JUMP_VELOCITY`. Hij komt nooit naar beneden zolang je drukt.

Met `just_pressed` activeert de sprong maar één frame — daarna moet de speler de spatie loslaten en opnieuw indrukken voor een nieuwe sprong.

</details>

`ui_accept` is een standaard input-actie van Godot — gekoppeld aan de spatiebalk en Enter. Je kunt de toets-binding aanpassen in **Project → Project Settings → Input Map**.

<details>
<summary>Klik om WASD-besturing toe te voegen (W = springen, A = links, D = rechts)</summary>

Veel platformers laten je naast de pijltjestoetsen ook met WASD spelen. Dat doe je door **extra toetsen te koppelen aan bestaande acties** — `ui_accept`, `ui_left` en `ui_right`. Zo zonder de pijltjestoetsen te slopen.

**Stap 1 — Open de Input Map**

1. Klik bovenin op **Project → Project Settings**.
2. Klik bovenaan op het tabblad **Input Map** (naast *General*).
3. In de lijst onder *All Actions* zie je `ui_accept`, `ui_left`, `ui_right` en meer staan. Klap een actie open met het pijltje ervoor — je ziet de huidige toetsen (Space, Enter, →, ←, etc.).

**Stap 2 — Voeg W toe aan `ui_accept`**

1. Zoek `ui_accept` in de lijst en klik op het **plus-icoontje (+)** rechts ernaast.
2. Een venster verschijnt: *"Press a key…"* — druk gewoon op de **W**-toets.
3. Klik op **OK**. De W staat nu als extra binding bij `ui_accept`.

**Stap 3 — Doe hetzelfde voor A (links) en D (rechts)**

1. Bij `ui_left`: klik op **+**, druk **A**, klik **OK**.
2. Bij `ui_right`: klik op **+**, druk **D**, klik **OK**.

**Stap 4 — Test**

Start je spel met `F5`. Je kunt nu met WASD én met de pijltjestoetsen + spatie spelen — beide werken tegelijk.

:::tip
Wil je een toets juist *vervangen* in plaats van toevoegen? Klap de actie open, klik op het **prullenbak-icoontje** naast de toets die je wilt weghalen.
:::

:::tip
Wil je een eigen actie aanmaken (bijvoorbeeld `schieten`)? Type bovenaan een naam in en klik op **Add**. Daarna voeg je toetsen toe op precies dezelfde manier. In je script gebruik je hem dan met `Input.is_action_just_pressed("schieten")`.
:::

</details>

#### Waarom de extra `and is_on_floor()`?

**Wat denk je dat er gebeurt zonder deze tweede check?**

<details>
<summary>Antwoord</summary>

Je kunt **in de lucht** springen. Tijdens een sprong (al in de lucht) drukt de speler nog een keer spatie → `velocity.y = JUMP_VELOCITY` → tweede sprong vanuit de lucht. Klinkt cool, maar maakt platforming triviaal: gewoon vier keer springen om elk gat over te vliegen.

De `and is_on_floor()`-check zorgt dat je alleen kunt springen wanneer je daadwerkelijk op de grond staat.

**Bonus:** wil je toch dubbel kunnen springen? Dan voeg je een variabele toe die het aantal extra sprongen bijhoudt. Eerst eens nadenken — kun je deze zelf schrijven?

</details>

#### `=` versus `+=` bij springen — een belangrijk detail

We gebruiken `velocity.y = JUMP_VELOCITY` (gewone toewijzing), niet `+=`. Dat is bewust.

**Stel je voor: je karakter valt al met `velocity.y = 200`. Wat gebeurt er als je `velocity.y += JUMP_VELOCITY` (`+= -400`) gebruikt in plaats van `=`?**

<details>
<summary>Antwoord</summary>

Met `+=` wordt je `velocity.y = 200 + (-400) = -200`. Je springt dus, maar slechts met half de kracht omdat je val-snelheid wordt verrekend.

Met `=` *vervang* je de bestaande verticale snelheid volledig: `velocity.y = -400`. Een sprong is altijd even hoog, ongeacht hoe hard je net viel. Veel voorspelbaarder gevoel.

</details>

### 3c. Horizontaal lopen

```gdscript
var direction := Input.get_axis("ui_left", "ui_right")
if direction:
    velocity.x = direction * SPEED
else:
    velocity.x = move_toward(velocity.x, 0, SPEED)
```

#### `Input.get_axis(...)` — een handige truc

In plaats van twee `Input.is_action_pressed`-checks doet `get_axis` het in één regel:

- Druk je **niets** → `direction = 0`
- Druk je **links** in → `direction = -1`
- Druk je **rechts** in → `direction = +1`

Probeer het: voeg `print(direction)` toe onder de regel en kijk in **Uitvoer** terwijl je beweegt.

#### `:=` versus `=` bij `var direction`

Het `:=`-pijltje is **type-inferentie**: Godot bekijkt zelf de waarde rechts (`-1`, `0` of `+1`) en concludeert dat `direction` een `float` is. Je hoeft het type niet zelf op te schrijven.

Dit is hetzelfde als:
```gdscript
var direction: float = Input.get_axis("ui_left", "ui_right")
```

Beide werken; de `:=`-vorm is korter. Geen verschil in snelheid of gedrag.

#### `if direction:` — wat is dat voor check?

Geen `==` of `!=` te zien — gewoon `if direction:`. Hoe werkt dat?

GDScript behandelt het getal `0` als "onwaar" en alle andere getallen als "waar" (een truc die in veel programmeertalen werkt). Dus:

- `direction = 0` → `if direction:` is `false` → ga naar `else`.
- `direction = -1` of `+1` → `if direction:` is `true` → voer de loop-code uit.

**Predict: doet `if direction != 0:` exact hetzelfde?**

<details>
<summary>Antwoord</summary>

Ja, exact hetzelfde. `if direction:` is gewoon een kortere schrijfwijze van `if direction != 0:`. Sommige programmeurs vinden `!= 0` duidelijker; anderen vinden de korte vorm netter.

</details>

#### `velocity.x = direction * SPEED`

Hier zit de logica om naar links of rechts te bewegen:

- Druk links → `direction = -1` → `velocity.x = -1 * 300 = -300` → karakter beweegt naar links met 300 pixels/sec.
- Druk rechts → `direction = +1` → `velocity.x = +1 * 300 = +300` → karakter beweegt naar rechts.

Eén regel, twee richtingen. Compact en symmetrisch.

#### `else: velocity.x = move_toward(velocity.x, 0, SPEED)` — afremmen

Als de speler niets drukt (`direction = 0`), willen we het karakter laten **stoppen** — maar niet abrupt. `move_toward(huidige, doel, stap)` geeft een waarde terug die dichter bij `doel` ligt, maximaal `stap` per aanroep.

Voorbeeld: stel `velocity.x = 300` en het doel is `0` met stap `300`:

- 1e frame: `move_toward(300, 0, 300)` → `0`. Karakter staat direct stil.

Met een **kleinere stap** dan SPEED kun je een sliding-effect maken — de speler glijdt nog een eindje door na het loslaten van de toets. Probeer eens `move_toward(velocity.x, 0, 50)` en kijk wat er gebeurt.

**Predict: wat als je deze hele `else`-tak weghaalt?**

<details>
<summary>Antwoord</summary>

Je karakter blijft eeuwig op `velocity.x = 300` (of -300) rondrijden, zelfs als je niets indrukt. De `else` is wat hem laat stoppen wanneer je geen toets aanraakt.

</details>

---

← [Deel 2 — De motor](./motor.md) · **Volgende:** [Deel 4 — De afsluiter en je eigen script bouwen](./afsluiter.md) →
