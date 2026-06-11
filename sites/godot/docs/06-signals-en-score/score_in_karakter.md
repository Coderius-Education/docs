---
sidebar_position: 2
hide_table_of_contents: true
slug: /score_in_karakter
---

# Score bijhouden in je karakter

Je raapt nu muntjes op, maar je weet niet hoeveel. In deze les voeg je een **score** toe die elke keer met 1 omhoog gaat als je een muntje raakt.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: waar leeft de score?

**In welk script zou jij de variabele `score` aanmaken?**

- In het muntje-script?
- In het karakter-script?
- Ergens anders?

<details>
<summary>Antwoord</summary>

Het **muntje** is geen goede plek: zodra het muntje wordt opgepakt, verdwijnt het via `queue_free()` — en daarmee ook zijn `score`-variabele.

Het **karakter** is een logische plek: de speler "draagt" zijn eigen score. Zolang het karakter bestaat, bestaat de score.

(In de volgende lessen ontdek je dat een nóg betere plek bestaat: een globale variabele die ook tussen scènes overleeft.)

</details>

## Stap 1: Voeg `score` toe aan je karakter

Open het script van je `CharacterBody2D` en voeg bovenaan een variabele toe:

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -800.0

var score = 0

# ... rest van je script
```

## Stap 2: Hoog de score op vanuit het muntje

Open het script van je muntje. In `_on_body_entered` heb je al een parameter `body` — dat is de node die het muntje aanraakt (jouw karakter). Vanuit het muntje kun je dus rechtstreeks bij `body.score`.

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    body.score += 1
    print("Score: ", body.score)
    queue_free()
```

|        Code         | Wat doet het?                                |
| :-----------------: | :------------------------------------------- |
| `body`              | De node die het muntje raakt (jouw karakter) |
| `body.score`        | De `score`-variabele van die node            |
| `body.score += 1`   | Verhoog de score met 1                       |

## Stap 3: Test het

Start het spel met `F5` en pak een paar muntjes op. Kijk in **Uitvoer** onderaan:

```
Score: 1
Score: 2
Score: 3
```

## Voorspel: hoe krijg ik dit op het scherm?

Het werkt in **Uitvoer**, maar je wilt het op het scherm zien. **Hoe zou je dat aanpakken?**

<details>
<summary>Bekijk een (broze) poging</summary>

Je zou een `Label` kunnen toevoegen en in een Label-script proberen het karakter op te zoeken:

```gdscript
extends Label

func _process(delta: float) -> void:
    text = "Score: " + str(get_node("../CharacterBody2D").score)
```

> Maak je geen zorgen als `_process` en `str` nieuw zijn — die komen in [Score op het scherm tonen](./score_op_scherm.md) aan bod. Dit voorbeeld is alleen om de **pijn** te laten zien.

Dit werkt — *zolang* je karakter precies `CharacterBody2D` heet en op de juiste plek in de Scene Tree staat. Verschuif of hernoem je iets, of laad je een nieuw level? Crash. In de volgende les ([Global variables](./global_variables.md)) zie je een schonere oplossing.

</details>

## Opdracht 6.2.a: levens met Game Over

Je hebt nu een score in je karakter. Voeg er een **levens-systeem** aan toe en laat het spel reageren als ze op zijn.

1. Voeg `var levens = 3` toe aan je karakter.
2. Laat de vijand (uit [Signals & muntje](./signals_muntje.md)) bij contact `body.levens -= 1` doen en de waarde printen.
3. **Nieuw:** als `body.levens` op 0 (of lager) komt, print `"GAME OVER"` in **Uitvoer** en sluit het spel met `get_tree().quit()`.

<details>
<summary>Klik hier voor een tip!</summary>

- Voeg `var levens = 3` toe onder `var score = 0` in je karakter-script.
- Open je vijand-script.
- Pas `_on_body_entered` aan zodat hij eerst `body.levens -= 1` doet en print.
- Voeg een `if`-blok toe: `if body.levens <= 0:` met daarbinnen de print en `get_tree().quit()`.
- Let op de indentatie: alles binnen het `if`-blok moet één tab inspringen.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

**In je karakter-script:**

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -800.0

var score = 0
var levens = 3

# ... rest van je script
```

**In je vijand-script:**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    body.levens -= 1
    print("Levens: ", body.levens)

    if body.levens <= 0:
        print("GAME OVER")
        get_tree().quit()

    queue_free()
```

`get_tree().quit()` sluit het hele spel-venster. In een echte game zou je hier een Game Over-scherm laten zien — dat leer je later. Voor nu zie je in elk geval dat de check werkt.

</details>

## Er gaat iets mis

<details>
<summary>Ik krijg <code>Invalid get index 'score' (on base: 'Node2D')</code></summary>

**Oorzaak:** Het signal vangt ook andere bodies op die geen `score`-veld hebben — bijvoorbeeld een vijand. `body` is dan geen karakter.

**Oplossing:** Ga er voor nu vanuit dat alleen de speler je muntjes oppakt. Als je later vijanden toevoegt, controleer je eerst of `body` een speler is (bijvoorbeeld met een naam-check of een group).

</details>

<details>
<summary>Mijn score begint elke keer weer bij 0 als ik het spel herstart</summary>

**Oorzaak:** Bij opnieuw starten wordt het karakter opnieuw aangemaakt, en dus ook `var score = 0`. De score leeft maar zolang het karakter bestaat.

**Oplossing:** Dit lossen we op in [Global variables](./global_variables.md) — variabelen die buiten één node leven.

</details>
