---
sidebar_position: 3
slug: /start_gdscript
---

# Je eerste regels code

Je karakter staat op het scherm en er hangt een script aan met één regel erin. Voordat je aan het bewegingsscript begint, gebruik je dat script één keer om te zien dat je code echt draait.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/basis/jij-als-variabele', label: 'Variabelen'},
    {site: 'python', to: '/docs/basis/jouw-naam-op-het-scherm', label: 'Print'},
    {site: 'python', to: '/docs/functies/functies', label: 'Functies'},
  ]}
/>

## Stap 1: Een functie die bij de start draait

Open in Godot het script van je `CharacterBody2D`. Er staat één regel in: `extends CharacterBody2D`. Typ daaronder, met een lege regel ertussen:

```gdscript
func _ready() -> void:
    var levens = 3
    print("Het spel is gestart.")
    print("Ik heb ", levens, " levens.")
```

**`_ready()`** is een functie die Godot zelf aanroept, één keer, zodra je scène start. Je hoeft hem dus nergens aan te roepen — anders dan in Python, waar jij `groet()` schrijft om `groet()` te laten gebeuren.

De rest ken je uit Python: `var levens = 3` maakt een variabele, en `print()` zet iets op het scherm. In GDScript schrijf je `var` ervoor; verder werkt het hetzelfde.

## Stap 2: Kijk waar je output landt

1. Druk op `F5` om je spel te starten.
2. Kijk onderin je Godot-scherm op het tabblad **Uitvoer** (Engels: **Output**).

Daar staan nu twee regels:

```
Het spel is gestart.
Ik heb 3 levens.
```

Dit tabblad wordt je belangrijkste gereedschap. Telkens als je niet zeker weet of een stuk code draait, zet je er een `print()` in en kijk je hier. In [Fouten zoeken](../05-bewegingsscript/fouten-zoeken.md) staat hoe je daar systematisch mee werkt.

Haal deze `_ready()`-functie daarna weer weg. In het volgende hoofdstuk begin je met een schone lei aan het bewegingsscript.

## Check je begrip: `_ready()` versus `_process()` \{#func-ready}

**Wat denk je dat er gebeurt als je `_ready()` vervangt door `_process(delta)`?**

<details>
<summary>Antwoord</summary>

`_ready()` draait één keer bij start. `_process(delta)` draait **elke frame** (~60 keer per seconde). Je Uitvoer-tabblad raakt dan in een paar seconden vol met dezelfde twee regels. Handig om bewegende waardes te volgen, niet handig voor een eenmalige startmelding.

</details>

## Er gaat iets mis

<details>
<summary>Ik krijg een SyntaxError bij `_ready()`</summary>

**Oorzaak:** Verkeerde indentatie of de `:` aan het einde van de functie-regel is vergeten.

**Oplossing:**

1. Zorg dat `func _ready() -> void:` op een dubbele punt eindigt.
2. Alle regels die *bij* de functie horen, moeten ingesprongen zijn met een tab of vier spaties — niet mengen.
3. Lege regels in de functie zijn prima; mengen van tabs en spaties is dat niet.

</details>

<details>
<summary>Ik zie geen output in het Uitvoer-tabblad</summary>

**Oorzaak:** Het spel is niet gestart, of het Uitvoer-tabblad staat dicht.

**Oplossing:**

1. Druk op `F5` om het spel te starten.
2. Klik onderin op het tabblad **Uitvoer** (Engels: **Output**) — soms staat het verstopt naast **Debugger** of **Audio**.
3. Geen `F5`-knop? Stel eerst een Main Scene in via **Project → Project Settings → Run → Main Scene** ([zie Je eerste 2D-scène](../02-editor-leren-kennen/scene.md)).

**Zelf vinden:** zet `print("hier")` als allereerste regel in de functie. Blijft Uitvoer ook dan leeg, dan draait je script niet en ligt het aan de scène, niet aan je code.

</details>

## Wat daarna?

In [Het bewegingsscript bouwen](../05-bewegingsscript/skelet.md) schrijf je in zeven korte lessen het script waarmee je karakter valt, loopt en springt.
