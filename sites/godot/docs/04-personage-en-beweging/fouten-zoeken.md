---
sidebar_position: 5
slug: /fouten-zoeken
---

# Fouten zoeken

Je hebt net een script van nul opgebouwd. Grote kans dat er onderweg iets misging: een regel die niet insprong, een naam met een hoofdletter te veel, of een spel dat startte maar niets deed.

Dat hoort erbij. Wat je nu leert is niet hoe je fouten voorkomt, maar hoe je ze **zelf terugvindt** — want vanaf hier ga je dingen bouwen waarvan het antwoord niet in deze cursus staat.

<GodotVersie />

## Drie soorten fouten \{#drie-soorten}

Ze zien er anders uit en vragen een andere eerste stap. Bepaal daarom altijd eerst welke je voor je hebt.

| Wat je ziet | Wat het is | Waar je begint |
| :--- | :--- | :--- |
| Rode tekst in **Uitvoer**, spel start niet | Je code klopt niet als taal | De foutmelding lezen |
| Spel draait, maar er gebeurt niets | Je code draait niet, of doet niets zichtbaars | `print()` op drie plekken |
| Spel doet iets, maar iets anders dan je wilde | Je code klopt, je denkwerk niet | Halveren |

De derde is de lastigste, want er is niets kapot. Alleen jij weet dat het niet klopt.

## Een foutmelding lezen \{#foutmelding-lezen}

Een melding in Uitvoer ziet er zo uit:

```
res://scripts/speler.gd:15 - Invalid call. Nonexistent function 'plya' in base 'AnimatedSprite2D'.
```

Lees hem in drie stukken:

1. **`res://scripts/speler.gd`** — in welk bestand het misgaat.
2. **`:15`** — op welke regel. Dubbelklik op de melding en Godot springt er meteen naartoe.
3. **De rest** — wat er mis is. Hier: de functie `plya` bestaat niet. Dat is een typefout voor `play`.

De laatste zin is vaak Engels en klinkt technischer dan hij is. Zoek de woorden die je herkent: een naam die je zelf hebt getypt, of een node-type uit je scène.

<GDQuestLes nummer={2} />

:::tip
Krijg je meerdere meldingen tegelijk? Los alleen de **bovenste** op en start opnieuw. De rest is vaak gevolgschade en verdwijnt vanzelf.
:::

## Print op drie plekken \{#print-drie}

Draait je spel zonder foutmelding, maar gebeurt er niets? Dan weet je nog niets — en dat is precies het probleem. `print()` maakt zichtbaar wat je code doet.

Werk van groot naar klein, in deze volgorde:

```gdscript
func _physics_process(delta: float) -> void:
    print("de functie draait")

    if not is_on_floor():
        print("ik val")
        velocity += get_gravity() * delta

    print(velocity)
    move_and_slide()
```

1. **Draait deze code überhaupt?** Zet een `print("de functie draait")` bovenaan. Zie je niets, dan ligt het niet aan de regels eronder maar aan het script zelf: hangt het wel aan de goede node?
2. **Komt hij in dit blok?** Zet een `print()` binnen de `if`. Zie je die niet, dan is je voorwaarde nooit waar.
3. **Wat zit er in?** Print de waarde zelf, bijvoorbeeld `print(velocity)`. Nu zie je of het getal is wat je verwachtte.

Haal je prints daarna weg. Een `print` in `_physics_process` levert zestig regels per seconde op, en dan zie je de echte melding niet meer.

## Halveer je probleem \{#halveren}

Weet je niet welke regel de boosdoener is, zet dan de helft uit met een `#` ervoor en kijk of het probleem blijft.

```gdscript
    # if Input.is_action_just_pressed("ui_accept") and is_on_floor():
    #     velocity.y = JUMP_VELOCITY
```

- Blijft de fout? Dan zit hij in het deel dat je hebt laten staan.
- Is de fout weg? Dan zit hij in wat je zojuist hebt uitgezet.

Herhaal dit met de helft die overblijft. Na een paar keer heb je nog twee of drie regels over, en daar zit hij.

Dit werkt ook buiten je code: zet een node tijdelijk op onzichtbaar, of haal een tegel weg. De vraag is steeds dezelfde — verandert het probleem als ik dit wegneem?

## Vergelijk met iets dat wél werkt \{#vergelijken}

In Godot zit een fout vaak niet in je code maar in de editor: een signal dat niet verbonden is, een `Shape` die leeg is, een node die net anders heet.

Heb je twee dingen die op elkaar lijken en werkt er één? Zet ze dan naast elkaar en schrijf de verschillen op. Klik beide nodes aan en vergelijk de Inspector regel voor regel. Meestal vind je hem binnen een minuut, en meestal is het iets kleins dat je nooit had bedacht.

## De vier vragen \{#vier-vragen}

Als je echt vastzit, beantwoord deze vier op papier of hardop. Ze dwingen je van "het werkt niet" naar iets dat je kunt onderzoeken.

1. **Wat verwacht ik precies?** Niet "hij moet springen", maar "als ik spatie druk moet `velocity.y` op `-400` staan".
2. **Wat gebeurt er precies?** Niet "niets", maar "de print binnen de `if` verschijnt nooit".
3. **Waar lopen die twee voor het eerst uit elkaar?** Dat is de plek waar je moet zoeken.
4. **Wat is mijn eerstvolgende test?** Eén concrete handeling, waarvan je van tevoren weet wat het betekent als hij lukt of mislukt.

Kom je er met een klasgenoot of docent niet uit, dan zijn dit ook precies de vier dingen die je moet kunnen vertellen.

## Opdracht 4.5.a: het spel start niet

Dit script hoort te werken, maar Godot weigert het. Wat is er mis?

```gdscript
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void
    velocity.x = SPEED
    move_and_slide()
```

<details>
<summary>Klik hier voor een tip.</summary>

Godot noemt in de melding een regelnummer. Kijk niet alleen naar díe regel, maar ook naar het einde van de regel erboven.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

De dubbele punt aan het eind van de `func`-regel ontbreekt:

```gdscript
func _physics_process(delta: float) -> void:
```

Elke regel die een blok opent — `func`, `if`, `else`, `for` — eindigt op een dubbele punt.

</details>

## Opdracht 4.5.b: het spel draait, maar er gebeurt niets

Geen foutmelding, en toch beweegt het karakter niet.

```gdscript
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void:
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
```

<details>
<summary>Klik hier voor een tip.</summary>

Gebruik de methode uit "Print op drie plekken". Zet `print(velocity)` als laatste regel. Als `velocity` wél verandert maar je karakter niet beweegt, wie moet die snelheid dan nog uitvoeren?

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

`move_and_slide()` ontbreekt. De snelheid wordt netjes uitgerekend, maar niemand verplaatst het karakter. Voeg toe als laatste regel binnen de functie:

```gdscript
    move_and_slide()
```

Dit is een goed voorbeeld van de tweede soort fout: er is niets kapot, er ontbreekt iets.

</details>

## Opdracht 4.5.c: het spel doet iets anders dan bedoeld

Dit karakter zou moeten springen bij een druk op de spatiebalk, maar hij blijft aan het plafond plakken zolang je de toets vasthoudt.

```gdscript
    if Input.is_action_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VELOCITY
```

<details>
<summary>Klik hier voor een tip.</summary>

Er is geen foutmelding en er ontbreekt niets. Vraag jezelf af hoe vaak deze `if` waar is terwijl je de spatie vasthoudt.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

`is_action_pressed` is waar zolang je de toets vasthoudt, dus elke frame krijgt je karakter opnieuw de volle sprongkracht. Gebruik `is_action_just_pressed`, dat alleen waar is op het frame dat je indrukt:

```gdscript
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VELOCITY
```

Zie [Deel 4 — Springen](./basis_movement_begrijpen/afsluiter.md) voor het volledige verhaal.

</details>

## Waar staan de veelgemaakte fouten? \{#foutenindex}

Elke les in deze cursus eindigt met een blok **Er gaat iets mis** waarin de fouten staan die bij dat onderwerp horen. Zoek daar eerst, voordat je zelf gaat graven.

| Waar het misgaat | Kijk hier |
| :--- | :--- |
| Installatie en projectmap | [Installatie](../01-aan-de-slag/installatie.md), [Je projectmap terugvinden](../exporteren.md) |
| Editor, scènes en bestanden | [De Godot-interface](../02-editor-leren-kennen/interface.md), [Bestanden downloaden](../02-editor-leren-kennen/bestanden-downloaden.md) |
| Level en tegels | [Level tekenen](../03-level-bouwen/tilemap_opzetten.md), [Collision op je tegels](../03-level-bouwen/tilemap_collision.md) |
| Beweging en springen | [Deel 2](./basis_movement_begrijpen/motor.md), [Deel 3](./basis_movement_begrijpen/krachten.md), [Deel 4](./basis_movement_begrijpen/afsluiter.md) |
| Camera | [Camera die de speler volgt](./camera2d.md) |
| Animaties | [Animaties maken](../05-animaties/animaties.md), [Animaties in code](../05-animaties/animaties_code.md) |
| Signals en score | [Signals & een muntje](../06-signals-en-score/signals_muntje.md), [Score op het scherm](../06-signals-en-score/score_op_scherm.md) |
| Levels, menu en spawnen | [Een tweede level](../07-meer-levels-en-menu/tweede_level.md), [Een startmenu](../07-meer-levels-en-menu/start_menu.md), [Spawnen](../07-meer-levels-en-menu/spawnen.md), [Timer](../07-meer-levels-en-menu/spawn_timer.md) |

Losse code-voorbeelden staan in de [GDScript-tips](/gdscript-tips), en alle node-instellingen in de [Nodes cheatsheet](/cheatsheet).

---

← [Deel 4 — Springen](./basis_movement_begrijpen/afsluiter.md) · **Volgende:** [Camera die de speler volgt](./camera2d.md) →
