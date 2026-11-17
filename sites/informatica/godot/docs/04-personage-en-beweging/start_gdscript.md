---
sidebar_position: 3
slug: /start_gdscript
---

# Je eerste regels code

Je karakter staat op het scherm en er hangt een script aan met één regel erin. Voordat je aan het bewegingsscript begint, gebruik je dat script één keer om te zien dat je code echt draait.

<Voorkennis
  items={[
    {site: 'python', to: '/docs/basis/jij-als-variabele', label: 'Variabelen'},
    {site: 'python', to: '/docs/basis/jouw-naam-op-het-scherm', label: 'Print'},
    {site: 'python', to: '/docs/functies/functies', label: 'Functies'},
  ]}
/>

## Stap 1: De functie `_ready` \{#var}

Open in Godot het script van je `CharacterBody2D`. Er staat één regel in: `extends CharacterBody2D`. Typ daaronder, met een lege regel ertussen:

```gdscript
func _ready() -> void:
    var levens = 3
    print("Het spel is gestart.")
    print("Ik heb ", levens, " levens.")
```

**`_ready()`** is een functie die Godot zelf aanroept, één keer, zodra je scène start. Je hoeft hem dus nergens aan te roepen — anders dan in Python, waar jij `groet()` schrijft om `groet()` te laten gebeuren.

De rest ken je uit Python: `var levens = 3` maakt een variabele, en `print()` zet iets op het scherm. In GDScript schrijf je `var` ervoor; verder werkt het hetzelfde.

## Stap 2: Uitvoer bekijken

1. Druk op `F5` om je spel te starten.
2. Kijk onderin je Godot-scherm op het tabblad **Uitvoer** (Engels: **Output**).

Daar staan nu twee regels:

```
Het spel is gestart.
Ik heb 3 levens.
```

Uitvoer wordt je belangrijkste gereedschap. Telkens als je niet zeker weet of een stuk code draait, zet je er een `print()` in en kijk je in Uitvoer. In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je daar systematisch mee werkt.

#### Check je begrip: `_ready()` of `_process()`? \{#func-ready}

**Wat denk je dat er gebeurt als je `_ready()` vervangt door `_process(delta)`?**

<details>
<summary>Antwoord</summary>

`_ready()` draait één keer bij start. `_process(delta)` draait **elke frame** (~60 keer per seconde). Je Uitvoer-tabblad raakt dan in een paar seconden vol met dezelfde regels. Handig om bewegende waardes te volgen, niet handig voor een eenmalige startmelding.

</details>

## Opdracht 4.3.a: laat Godot rekenen

Breid je `_ready()` uit zodat Uitvoer drie regels toont:

1. Een begroeting met je eigen naam erin.
2. Het aantal levens, uit een variabele.
3. Een regel die je punten per level laat zien, uitgerekend door Godot zelf — dus niet het antwoord ingetypt, maar een som in je code.

<details>
<summary>Klik hier voor een tip.</summary>

Rekenen doe je in GDScript net als in Python: `10 * 3` mag zo tussen de haakjes van `print()`. Combineer tekst en een getal met komma's: `print("Punten: ", 10 * 3)`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends CharacterBody2D

func _ready() -> void:
    var naam = "Sam"
    var levens = 3
    print("Hallo ", naam)
    print("Ik heb ", levens, " levens.")
    print("Punten per level: ", 10 * 3)
```

In Uitvoer staat `Punten per level: 30`. Dat getal staat nergens in je script: Godot rekent het uit terwijl je spel draait.

</details>

Klaar met de opdracht? Haal de functie dan weer weg, ook als je er `_process` van hebt gemaakt, zodat alleen `extends CharacterBody2D` overblijft. In [Het bewegingsscript bouwen](site:godot/docs/basis_movement_begrijpen) begin je met een schone lei: in zeven korte lessen schrijf je daar het script waarmee je karakter valt, loopt en springt.

## Er gaat iets mis

<details>
<summary>Godot meldt een Parse Error bij `_ready()`</summary>

Onderin het scriptvenster staat dan een rode regel. De twee die je hier het vaakst ziet:

- `Unexpected "Indent" in class body.` De `:` aan het einde van de functie-regel ontbreekt. Zonder dubbele punt begint er geen functie, en hoort de ingesprongen regel eronder nergens bij.
- `Expected indented block after function declaration.` De regels die bij de functie horen, springen niet in.

**Oplossing:**

1. Zorg dat `func _ready() -> void:` op een dubbele punt eindigt.
2. Alle regels die *bij* de functie horen, springen in met een tab of vier spaties. Kies één van de twee en houd die vast: tabs en spaties door elkaar geeft ook een melding.

</details>

<details>
<summary>Ik zie geen output in het Uitvoer-tabblad</summary>

**Oorzaak:** Het spel is niet gestart, of het Uitvoer-tabblad staat dicht.

**Oplossing:**

1. Druk op `F5` om het spel te starten.
2. Klik onderin op het tabblad **Uitvoer** (Engels: **Output**) — soms staat het verstopt naast **Debugger** of **Audio**.
3. Start er niets en vraagt Godot om een Main Scene? Stel die eerst in via **Project → Project Settings → Run → Main Scene** (zie [Er gaat iets mis in Je eerste 2D-scène](site:godot/docs/scene#er-gaat-iets-mis)).

**Zelf vinden:** zet `print("hier")` als allereerste regel in de functie. Blijft Uitvoer ook dan leeg, dan draait je script niet en ligt het aan de scène, niet aan je code.

</details>
