---
sidebar_position: 8
slug: /fouten-zoeken
---

# Fouten zoeken

Je hebt net een script van nul opgebouwd, en grote kans dat er onderweg iets misging: een regel die niet insprong, een naam met een hoofdletter te veel, of een spel dat startte maar niets deed. Dat hoort erbij. Wat je nu leert is niet hoe je fouten voorkomt, maar hoe je ze **zelf terugvindt**: vanaf hier ga je dingen bouwen waarvan het antwoord niet in deze cursus staat.

## Drie soorten \{#drie-soorten}

Er zijn drie soorten fouten. Ze zien er anders uit en vragen een andere eerste stap. Bepaal daarom altijd eerst welke je voor je hebt.

| Wat je ziet | Wat het is | Waar je begint |
| :--- | :--- | :--- |
| Rode tekst in **Uitvoer**, spel start niet | Je code klopt niet als taal | De foutmelding lezen |
| Spel draait, maar er gebeurt niets | Je code draait niet, of doet niets zichtbaars | `print()` op drie plekken |
| Spel doet iets, maar iets anders dan je wilde | Je code klopt, je denkwerk niet | Halveren |

De derde is de lastigste, want er is niets kapot. Alleen jij weet dat het niet klopt.

Een foutmelding lezen kun je los oefenen bij GDQuest:

<GDQuestLes slug="fouten-zoeken" />

## Meldingen

### Een foutmelding lezen \{#foutmelding-lezen}

Een melding in Uitvoer ziet er zo uit:

```
res://scripts/speler.gd:15 - Invalid call. Nonexistent function 'plya' in base 'AnimatedSprite2D'.
```

Lees hem in drie stukken:

1. **`res://scripts/speler.gd`** — in welk bestand het misgaat.
2. **`:15`** — op welke regel. Dubbelklik op de melding en Godot springt er meteen naartoe.
3. **De rest** — wat er mis is. Hier: de functie `plya` bestaat niet. Dat is een typefout voor `play`, waarmee je in hoofdstuk 6 een animatie afspeelt.

De laatste zin is vaak Engels en klinkt technischer dan hij is. Zoek de woorden die je herkent: een naam die je zelf hebt getypt, of een node-type uit je scène.

**Tip:** krijg je meerdere meldingen tegelijk, los dan alleen de bovenste op en start opnieuw. De rest is vaak gevolgschade en verdwijnt vanzelf.

### Tijdens het spelen \{#runtime-meldingen}

Sommige fouten merk je pas tijdens het spelen, niet bij het starten. Je spel draait dan al even. Vanaf hoofdstuk 6, als je script met andere nodes gaat praten, kom je er drie vaak tegen. Elk heeft in dit tabblad een eigen stap; kom hier terug als je er een ziet.

- `null instance` in de melding: je vraagt iets aan een node die er niet is.
- `Invalid access` in de melding: de node bestaat, maar heeft die eigenschap niet.
- Geen melding, en toch gebeurt er niets: een functie is nooit aangeroepen.

### `null instance`

De melding `Attempt to call function 'x' in base 'null instance' on a null instance` betekent: je vraagt iets aan een node die er niet is. **`null`** betekent leeg: de variabele bestaat, maar er zit geen node in. Vlak erboven zegt Godot welke node hij niet vond:

```
Node not found: "Sprite" (relative to "/root/Level1/CharacterBody2D").
Attempt to call function 'play' in base 'null instance' on a null instance.
```

Met `$Naam` wijs je in code een node uit je Scene Tree aan; dat leer je in [Animaties in code](site:godot/docs/animaties_code). Bijna altijd staat er een `$Naam` in je regel die niet klopt met de Scene Tree. Vergelijk letter voor letter: `$AnimatedSprite2D` vindt niets als je node `$Sprite` heet. Twijfel je over de schrijfwijze, sleep de node dan vanuit de Scene Tree je script in met `Ctrl` ingedrukt — Godot typt het pad dan zelf.

### `Invalid access`

De melding `Invalid access to property or key 'x' on a base object of type 'y'` betekent: de node bestaat, maar die eigenschap heeft hij niet.

```
Invalid access to property or key 'text' on a base object of type 'Node2D'.
```

Lees het achterste stuk eerst: `type 'Node2D'`. Dat is wat Godot denkt dat je te pakken hebt. Een `Node2D` heeft geen `text`. Een `Label` wel: dat is de node waarmee je in hoofdstuk 7 je score op het scherm zet. Meestal wijs je dus naar de verkeerde node, of ligt de eigenschap één laag dieper: niet op je `CanvasLayer` maar op het `Label` daaronder.

### Geen melding

Je klikt, je springt, je raakt een muntje, en er gebeurt niets. Godot zegt niets, want er is niets kapot. Er is alleen nooit iets aangeroepen.

Vanaf hoofdstuk 7 laat je nodes elkaar iets melden met een signal, en dan is dit bijna altijd de oorzaak: de functie staat in je script, maar het signal is niet verbonden. Controleer het zo:

1. Selecteer de node, open het **Node**-paneel rechtsboven en kies **Signals**.
2. Onder een verbonden signal staat de naam van de functie ingesprongen. Staat daar niets, dan is het nooit gekoppeld.
3. Zet ter controle `print("hier")` als eerste regel in de functie. Blijft Uitvoer leeg terwijl je het muntje raakt, dan weet je het zeker.

## Zoekmethodes

### Print op drie plekken \{#print-drie}

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

### Halveer je probleem \{#halveren}

Weet je niet welke regel de boosdoener is, zet dan de helft uit met een `#` ervoor en kijk of het probleem blijft.

```gdscript
    # if Input.is_action_just_pressed("ui_accept") and is_on_floor():
    #     velocity.y = JUMP_VELOCITY
```

- Blijft de fout? Dan zit hij in het deel dat je hebt laten staan.
- Is de fout weg? Dan zit hij in wat je zojuist hebt uitgezet.

Herhaal dit met de helft die overblijft. Na een paar keer heb je nog twee of drie regels over, en daar zit hij.

Dit werkt ook buiten je code: zet een node tijdelijk op onzichtbaar, of haal een tegel weg. De vraag is steeds dezelfde — verandert het probleem als ik dit wegneem?

### Vergelijken en vier vragen \{#vergelijken}

In Godot zit een fout vaak niet in je code maar in de editor: een signal dat niet verbonden is, een `Shape` die leeg is, een node die net anders heet.

Heb je twee dingen die op elkaar lijken en werkt er één? Zet ze dan naast elkaar en schrijf de verschillen op. Klik beide nodes aan en vergelijk de Inspector regel voor regel. Meestal vind je hem binnen een minuut, en meestal is het iets kleins dat je nooit had bedacht.

#### De vier vragen \{#vier-vragen}

Als je echt vastzit, beantwoord deze vier vragen op papier of hardop. Ze dwingen je van "het werkt niet" naar iets dat je kunt onderzoeken.

1. **Wat verwacht ik precies?** Niet "hij moet springen", maar "als ik spatie druk moet `velocity.y` op `-400` staan".
2. **Wat gebeurt er precies?** Niet "niets", maar "de print binnen de `if` verschijnt nooit".
3. **Waar lopen die twee voor het eerst uit elkaar?** Dat is de plek waar je moet zoeken.
4. **Wat is mijn eerstvolgende test?** Eén handeling waarvan je vooraf weet wat het betekent als hij lukt of mislukt.

Kom je er met een klasgenoot of docent niet uit, dan zijn dit ook precies de vier dingen die je moet kunnen vertellen.

## Opdracht 5.8.a: het spel start niet

Dit script hoort te werken, maar Godot weigert het. Wat is er mis?

{/* niet-compileren: dit script is opzettelijk kapot, dat is de opdracht */}

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

## Opdracht 5.8.b: het spel draait, maar er gebeurt niets

Geen foutmelding, en toch beweegt het karakter niet.

```gdscript
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void:
    var direction := Input.get_axis("ui_left", "ui_right")
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

## Opdracht 5.8.c: het spel doet iets anders dan bedoeld

Dit karakter zou één keer moeten springen bij een druk op de spatiebalk, maar zolang je de toets vasthoudt blijft hij stuiteren: landen, en meteen weer omhoog.

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

`is_action_pressed` is waar zolang je de toets vasthoudt. In de lucht houdt `and is_on_floor()` hem tegen, maar op het frame dat hij landt, is de toets nog steeds ingedrukt, en springt hij meteen weer. Gebruik `is_action_just_pressed`, dat alleen waar is op het frame dat je indrukt:

```gdscript
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VELOCITY
```

Het volledige verhaal staat in [Deel 7 — Springen](site:godot/docs/movement-afsluiter#just_pressed-of-pressed), bij `just_pressed` of `pressed`.

</details>

## Foutenindex: waar staan de veelgemaakte fouten? \{#foutenindex}

### Van installatie tot beweging

Elke les heeft een tabblad **Er gaat iets mis**, met de fouten van dat onderwerp. Zoek daar eerst; de links brengen je er meteen heen.

| Waar het misgaat | Kijk hier |
| :--- | :--- |
| Installatie en projectmap | [Installatie](site:godot/docs/installatie#er-gaat-iets-mis), [Nieuw project aanmaken](site:godot/docs/project#er-gaat-iets-mis), [Je projectmap terugvinden](site:godot/docs/exporteren#er-gaat-iets-mis) |
| Editor, scènes en bestanden | [De Godot-interface](site:godot/docs/interface#er-gaat-iets-mis), [Je eerste 2D-scène](site:godot/docs/scene#er-gaat-iets-mis), [Bestanden downloaden](site:godot/docs/bestanden-downloaden#er-gaat-iets-mis) |
| Level en tegels | [Achtergrond](site:godot/docs/background_image#er-gaat-iets-mis), [Level tekenen met een TileMap](site:godot/docs/tilemap_opzetten#er-gaat-iets-mis), [Collision op je tegels](site:godot/docs/tilemap_collision#er-gaat-iets-mis) |
| Karakter en eerste code | [Een speelbaar karakter](site:godot/docs/sprite#er-gaat-iets-mis), [Je eerste eigen script](site:godot/docs/sprite_movement#er-gaat-iets-mis), [Je eerste regels code](site:godot/docs/start_gdscript#er-gaat-iets-mis) |
| Beweging en springen | [Deel 1 — Een script dat draait](site:godot/docs/basis_movement_begrijpen#er-gaat-iets-mis), [Deel 2 — Vallen](site:godot/docs/movement-motor#er-gaat-iets-mis), [Deel 3 — Delta](site:godot/docs/movement-delta#er-gaat-iets-mis), [Deel 4 — Je eerste if](site:godot/docs/movement-grond#er-gaat-iets-mis), [Deel 5 — Lopen](site:godot/docs/movement-krachten#er-gaat-iets-mis), [Deel 6 — Stoppen](site:godot/docs/movement-remmen#er-gaat-iets-mis), [Deel 7 — Springen](site:godot/docs/movement-afsluiter#er-gaat-iets-mis) |

### Van camera tot GDScript

| Waar het misgaat | Kijk hier |
| :--- | :--- |
| Camera | [Een camera die de speler volgt](site:godot/docs/camera2d#er-gaat-iets-mis) |
| Animaties | [Animaties aanmaken](site:godot/docs/animaties#er-gaat-iets-mis), [Animaties in code](site:godot/docs/animaties_code#er-gaat-iets-mis), [Je eigen animaties maken](site:godot/docs/eigen_animaties#er-gaat-iets-mis) |
| Signals en score | [Signals & een muntje](site:godot/docs/signals_muntje#er-gaat-iets-mis), [Score in je karakter](site:godot/docs/score_in_karakter#er-gaat-iets-mis), [Global variables](site:godot/docs/global_variables#er-gaat-iets-mis), [Score op het scherm](site:godot/docs/score_op_scherm#er-gaat-iets-mis), [Groups](site:godot/docs/groups#er-gaat-iets-mis), [Een power-up](site:godot/docs/power_up#er-gaat-iets-mis) |
| Levels, menu en spawnen | [Een tweede level](site:godot/docs/tweede_level#er-gaat-iets-mis), [Een startmenu](site:godot/docs/start_menu#er-gaat-iets-mis), [Spawnen](site:godot/docs/spawnen#er-gaat-iets-mis), [Timer](site:godot/docs/spawn_timer#er-gaat-iets-mis) |
| Verder met GDScript | [Eigen functies](site:godot/docs/eigen_functies#er-gaat-iets-mis), [Lijsten](site:godot/docs/lijsten#er-gaat-iets-mis), [Dictionaries](site:godot/docs/dictionaries#er-gaat-iets-mis), [JSON](site:godot/docs/json_opslaan#er-gaat-iets-mis), [Tweens](site:godot/docs/tweens#er-gaat-iets-mis) |

Losse code-voorbeelden staan in de [GDScript-tips](site:godot/gdscript-tips), en alle node-instellingen in de [Nodes cheatsheet](site:godot/cheatsheet).
