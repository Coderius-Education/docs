---
sidebar_position: 3
slug: /global_variables
---

# Global variables (Autoload)

In de vorige les heb je `var score = 0` in je karakter gezet en vanuit het muntje `body.score += 1` aangeroepen. Dat werkt — totdat je de score op het scherm wilt tonen en je vanuit een Label-script via `get_node("../CharacterBody2D").score` moet gaan zoeken. Eén verschuiving in de Scene Tree en het breekt. In deze les leer je een schonere oplossing: **global variables** die overal in je project beschikbaar zijn.

## Voorspel: je score in een tweede level

Stel dat je spel twee levels heeft: elk een eigen scène, met een eigen karakter erin. Je pakt in level 1 vijf muntjes en gaat naar level 2. **Welke score heeft het karakter in level 2, en waarom?**

<details>
<summary>Antwoord</summary>

Nul. Level 2 heeft een nieuw karakter, en dat begint met `var score = 0`. Het karakter uit level 1 is met zijn level verdwenen, en zijn score ook. De score hoort dus op een plek die bij geen enkel level hoort.

Je maakt een apart script (bijvoorbeeld `global.gd`) dat *niet* aan een node hangt. Daarna vertel je Godot via **Autoload**: "laad dit script automatisch bij het opstarten en houd het de hele speelsessie in de lucht". Vanaf dat moment kun je vanuit elk ander script `Global.score` schrijven of lezen — geen `get_node(...)` meer, geen kapotte links als je iets verplaatst.

</details>

## Stap 1: Global-script

Variabelen die je in een node-script zet, leven alleen zolang die node bestaat. `Global` lost dat op door buiten de Scene Tree te leven.

1. Ga naar **FileSystem** (linksonder).
2. Klik met rechts → **New Script**.
3. Noem het `global.gd`.
4. Zorg dat er **geen node** aan gekoppeld is — het is een los script.

Zet in dat script de score, en de levens uit opdracht 7.2.a:

```gdscript
extends Node

var score = 0
var levens = 3
```

Dat is alles. Dit script bevat variabelen die je overal wilt gebruiken.

## Stap 2: Autoload \{#autoload-instellen}

Registreer je het script als **Autoload**, dan laadt Godot het bij het opstarten en is het overal beschikbaar.

1. Ga naar **Project** → **Project Settings**.
2. Klik bovenin op het tabblad **Globals**, en daarbinnen op Autoload. Het tabblad Globals staat naast **General**; is het venster smal, scroll dan even door de rij.
3. Klik op het mapje naast **Path** en kies `global.gd`.
4. Bij **Node Name** vul je `Global` in (met hoofdletter).
5. Klik op **Add**.

`Global` is nu overal beschikbaar in je project. De instelling staat ook in de [Nodes cheatsheet](site:godot/cheatsheet#autoload).

#### Zonder Autoload

**Wat gebeurt er als je dit overslaat en meteen `Global.score += 1` in je muntje-script zet?**

<details>
<summary>Antwoord</summary>

Je krijgt de melding `Identifier "Global" not declared in the current scope`, en niet pas als je een munt raakt. Godot controleert de namen in een script al bij het inlezen. De script-editor kleurt de regel meteen rood, en druk je toch op Play, dan stopt Godot bij het laden van het muntje-script, nog voordat het spel draait. Het script `global.gd` bestaat wel op schijf, maar Godot kent de **naam** `Global` pas nadat je hem in Autoload hebt geregistreerd. Een script zonder Autoload is als een boek in een gesloten kast: het bestaat, maar niemand kan erbij.

</details>

## Stap 3: Score in Global \{#global-score}

In [Score bijhouden in je karakter](site:godot/docs/score_in_karakter) hoogde je de score op via `body.score += 1`. Met `Global` hoeft het muntje het karakter daar niet meer voor te kennen.

**In je muntje-script:**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.score += 1
    print("Score: ", Global.score)
    queue_free()
```

**In je karakter-script:** verwijder de regel `var score = 0`. Die hebben we niet meer nodig — de score leeft voortaan in `Global`.

Overal dezelfde syntax: `Global.variabelnaam`. Geen `get_node(...)`, geen kapotte links bij hernoemen. Start met `F5`: de score in **Uitvoer** loopt op zoals eerst.

Global variables gebruik je voor wat je in meer scènes nodig hebt: score, levens, instellingen. Wat bij één node hoort, blijft een gewone `var` in het script van die node.

## Functies: ook in je global script

### Twee functies toevoegen

Een global script mag ook **functies** hebben. Zet deze twee onder je variabelen:

```gdscript
extends Node

var score = 0
var levens = 3

func reset():
    score = 0
    levens = 3

func verlies_leven():
    levens -= 1
    if levens <= 0:
        print("Game Over!")
```

### Aanroepen

Een functie uit je global script roep je aan zoals je een variabele leest, met `Global.` ervoor:

```gdscript
Global.verlies_leven()
Global.reset()
```

`reset()` roep je aan in [Een startmenu](site:godot/docs/start_menu), als een nieuw potje begint. `verlies_leven()` laat zien dat zo'n functie ook een `if` mag hebben. In deze cursus trekt je vijand het leven er zelf af.

## Return: een functie die antwoord geeft \{#return}

### Een waarde teruggeven

De functies `reset()` en `verlies_leven()` uit het tabblad Functies **doen** iets: ze zetten waarden goed of printen iets. Daarom staat er `-> void` achter zodra je het type opschrijft. Dat pijltje betekent: deze functie geeft niets terug.

Vaak wil je een functie juist iets laten **teruggeven**, zodat je het antwoord kunt gebruiken. Zet daarnaast in je global script:

```gdscript
func is_game_over() -> bool:
    return levens <= 0
```

`-> bool` zegt: deze functie geeft een `true` of een `false` terug. Met `return` stuur je die waarde naar de plek waar de functie werd aangeroepen.

### Het antwoord gebruiken

`Global.is_game_over()` gebruik je alsof je de vergelijking `levens <= 0` ter plekke had opgeschreven:

```gdscript
if Global.is_game_over():
    print("Je hebt geen levens meer")
```

**Waarom zou je `is_game_over()` maken in plaats van overal `if Global.levens <= 0:` te schrijven?**

<details>
<summary>Antwoord</summary>

Omdat je dan één plek hebt waar staat wat "game over" betekent. Wil je later dat het spel al eindigt bij één leven over, of dat je ook game over bent als de tijd op is, dan pas je die ene functie aan in plaats van vijf verspreide `if`-regels.

De naam helpt bovendien mee: `if Global.is_game_over():` lees je als een zin, `if Global.levens <= 0:` moet je ontcijferen.

</details>

### Vergelijken met Python

<Voorkennis
  items={[
    {site: 'python', to: '/docs/functies/09b-return', label: 'Return'},
  ]}
/>

In Python levert een functie zonder `return` de waarde `None` op. GDScript noemt dat `void`. Het is precies hetzelfde idee, met een andere naam:

| Wat je schrijft | Wat de functie teruggeeft | In Python |
| :--- | :--- | :--- |
| `func reset() -> void:` | niets | een functie zonder `return` |
| `func is_game_over() -> bool:` | `true` of `false` | `return levens <= 0` |
| `func aantal_levens() -> int:` | een heel getal | `return levens` |

## Opdracht 7.3.a: laat je vijand `Global.levens` gebruiken

In opdracht 7.2.a hield je karakter de levens bij, en trok je vijand er met `body.levens -= 1` één af. Je `global.gd` heeft sinds het tabblad Global-script ook `levens`. Laat je vijand die gebruiken:

1. Vervang in je vijand-script elke `body.levens` door `Global.levens`: bij het aftrekken, in de `print` en in de `if` die `"GAME OVER"` print.
2. Gebruik in die `if` de functie `Global.is_game_over()`, in plaats van zelf te vergelijken.
3. Haal `var levens = 3` weg uit je karakter-script, zoals je dat bij Score in Global met `score` deed.

<details>
<summary>Klik hier voor een tip.</summary>

- `body.levens` staat op drie plekken in je vijand-script. Blijft er één staan, dan loopt je spel vast zodra je de vijand raakt: je karakter heeft geen `levens` meer.
- `if Global.is_game_over():` doet hetzelfde als `if Global.levens <= 0:`. De vergelijking staat nu op één plek, in `global.gd`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

**In je vijand-script:**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.levens -= 1
    print("Levens: ", Global.levens)

    if Global.is_game_over():
        print("GAME OVER")
        get_tree().quit()

    queue_free()
```

In `global.gd` verandert niets: `var levens = 3` stond er al. In je karakter-script is `var levens = 3` weg.

</details>

## Er gaat iets mis

<details>
<summary>Global werkt niet / <code>Global.score</code> geeft een fout</summary>

**Oorzaak:** `Global` is geen ingebouwd Godot-concept. Het is een script dat je zelf als Autoload moet registreren. Zonder die instelling kent Godot de naam `Global` niet.

**Oplossing:**

1. Ga naar **Project → Project Settings → Globals → Autoload**.
2. Klik op het mapje naast **Path** en kies `global.gd`.
3. Vul bij **Node Name** precies `Global` in (met hoofdletter G).
4. Klik op **Add**.

</details>

<details>
<summary>Mijn score-variabele reset bij elke nieuwe scène</summary>

**Oorzaak:** Je gebruikt een gewone `var score = 0` in een node-script. Als die node verdwijnt (bij het laden van een nieuwe scène), verdwijnt ook de variabele.

**Oplossing:** Zet de variabele in `global.gd` in plaats van in het node-script. Dat script blijft de hele speelsessie bestaan.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
