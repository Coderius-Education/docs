---
sidebar_position: 5
slug: /groups
---

# Groups: veel nodes tegelijk aansturen

Je hebt nu meerdere muntjes en misschien een paar vijanden in je level. Maar hoe spreek je ze *allemaal tegelijk* aan — bijvoorbeeld om te tellen hoeveel muntjes er nog over zijn, of om alle vijanden in één keer te laten stoppen? Daarvoor gebruik je **groups**.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/data/10a-lijsten-basis', label: 'Lijsten'},
  ]}
/>

## Voorspel: alle muntjes tellen

Stel je wilt weten hoeveel muntjes er nog in je level staan. **Hoe zou je dat aanpakken met wat je tot nu toe kent?**

<details>
<summary>Antwoord</summary>

Je zou elk muntje met de hand kunnen opzoeken via `get_node(...)` en ze tellen. Maar dan moet je elke naam kennen, en het klopt niet meer zodra je een muntje toevoegt of weghaalt. Een **group** lost dit op: je geeft elk muntje hetzelfde label en vraagt Godot daarna gewoon "geef me alles met dat label".

</details>

## Wat is een group?

Een group is een **label** dat je op een node plakt. Meerdere nodes mogen hetzelfde label dragen. Daarna kun je in één regel:

- alle nodes met dat label **ophalen** (en bijvoorbeeld tellen);
- op alle nodes met dat label tegelijk een **functie aanroepen**.

Het mooie: de nodes hoeven niets van elkaar te weten — net als bij signals is het lekker ontkoppeld.

## Stap 1: Zet je muntjes in een group

Dit kan op twee manieren. Kies er één.

**In de editor:**

1. Selecteer je `Muntje`-node.
2. Ga naar het **Node**-tabblad (rechts, naast de Inspector) en klik op **Groups**.
3. Typ `muntjes` en klik op **Add**.

**Of in code** — zet dit in het script van het muntje, zodat elk muntje zichzelf bij het opstarten in de group zet:

```gdscript
extends Area2D

func _ready() -> void:
    add_to_group("muntjes")
```

Doe hetzelfde voor je vijanden met het label `vijanden`.

## Stap 2: Alle muntjes ophalen en tellen

Met `get_tree().get_nodes_in_group("muntjes")` krijg je een lijst van alle nodes in de group. De lengte daarvan is het aantal muntjes:

```gdscript
var aantal = get_tree().get_nodes_in_group("muntjes").size()
print("Er zijn nog ", aantal, " muntjes.")
```

| Code                                          | Wat doet het?                                  |
| :-------------------------------------------- | :--------------------------------------------- |
| `get_tree()`                                  | Geeft toegang tot de hele scène-boom           |
| `get_nodes_in_group("muntjes")`               | De lijst met alle nodes in de group `muntjes`  |
| `.size()`                                     | Hoeveel het er zijn                            |

## Stap 3: Een functie op de hele group aanroepen

Met `call_group` roep je dezelfde functie aan op **elke** node in de group. Stel je vijand-script heeft een functie `stop()`:

```gdscript
get_tree().call_group("vijanden", "stop")
```

Elke node in de group `vijanden` voert nu zijn eigen `stop()`-functie uit — handig om bijvoorbeeld alle vijanden te bevriezen als de speler wint.

## Opdracht 6.5.a: win als alle muntjes weg zijn

Laat in **Uitvoer** "Je hebt gewonnen!" verschijnen zodra de speler het laatste muntje oppakt.

:::caution
`queue_free()` verwijdert een node pas aan het **einde** van het frame. Het zojuist opgepakte muntje zit dus nog even in de group. Tel daarom op `<= 1` in plaats van `== 0`.
:::

<details>
<summary>Klik hier voor een tip.</summary>

Breid het muntje-script uit `_on_body_entered` uit. Vraag ná `queue_free()` hoeveel muntjes er nog in de group `muntjes` zitten, en print je winst-bericht als dat er nog maar één is (het muntje dat net wordt opgeruimd).

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends Area2D

func _ready() -> void:
    add_to_group("muntjes")

func _on_body_entered(body: Node2D) -> void:
    queue_free()
    if get_tree().get_nodes_in_group("muntjes").size() <= 1:
        print("Je hebt gewonnen!")
```

Het laatste muntje wordt wel `queue_free()`'d, maar telt in dit frame nog mee — daarom `<= 1`.

</details>

## Opdracht 6.5.b: laat alle vijanden stoppen

Geef je vijanden het label `vijanden` en een functie `stop()` die de vijand op zijn plek laat staan (bijvoorbeeld door een `print` of door beweging uit te zetten). Roep `stop()` op alle vijanden tegelijk aan zodra de speler wint.

<details>
<summary>Klik hier voor een tip.</summary>

Zet de vijand in de group met `add_to_group("vijanden")` in `_ready()`. Gebruik op het moment van winnen `get_tree().call_group("vijanden", "stop")`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

**In het vijand-script:**

```gdscript
extends Area2D

func _ready() -> void:
    add_to_group("vijanden")

func stop() -> void:
    print("Vijand gestopt!")
```

**Op het moment dat de speler wint (bijvoorbeeld in het muntje-script):**

```gdscript
get_tree().call_group("vijanden", "stop")
```

</details>

## Er gaat iets mis

<details>
<summary>Mijn group is altijd leeg / <code>get_nodes_in_group</code> geeft 0 terug</summary>

**Oorzaak:** De naam van de group klopt niet exact (groups zijn hoofdlettergevoelig), of de nodes zijn nog niet aan de group toegevoegd.

**Oplossing:**

- Controleer dat je overal exact dezelfde naam gebruikt, bijvoorbeeld `muntjes` (niet `Muntjes` of `muntje`).
- Staat `add_to_group(...)` in `_ready()` (en niet in `_init()`)? In `_init()` bestaat de scène-boom nog niet.

</details>

<details>
<summary>Ik krijg een fout op <code>call_group</code>: de functie bestaat niet</summary>

**Oorzaak:** Niet elke node in de group heeft de aangeroepen functie.

**Oplossing:** Zorg dat élke node in de group dezelfde functienaam heeft (bijvoorbeeld `stop()`), of gebruik `get_nodes_in_group` en controleer per node met `has_method("stop")` voordat je 'm aanroept.

</details>
