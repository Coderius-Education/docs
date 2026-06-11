---
sidebar_position: 4
hide_table_of_contents: true
slug: /score_op_scherm
---

# Score op het scherm tonen

Je hebt nu `Global.score` die de hele speelsessie blijft bestaan. Tijd om hem zichtbaar te maken bovenaan het scherm — met een `Label`.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: hoe vaak update je de tekst?

Je wilt dat de tekst op het scherm verandert zodra `Global.score` verandert. **Hoe vaak zou je de tekst opnieuw moeten zetten?**

<details>
<summary>Antwoord</summary>

Het simpelst is om de tekst **elke frame** opnieuw te zetten. Dan staat hij altijd gelijk aan `Global.score`, ongeacht wanneer die wordt opgehoogd. Godot heeft daar een ingebouwde functie voor: `_process(delta)`.

</details>

## Stap 1: Voeg een `Label` toe

1. Open je level-scène (bijvoorbeeld `world.tscn`).
2. Klik met rechts op de root-node → **Add Child Node** → zoek `Label`.
3. Hernoem de Label naar `ScoreLabel`.
4. Sleep de Label in de viewport naar de plek waar je hem wilt (bijvoorbeeld linksboven).
5. Pas eventueel de tekstgrootte aan onder **Theme Overrides → Font Sizes** in de Inspector.

## Stap 2: Voeg een script toe aan de Label

1. Selecteer `ScoreLabel`.
2. Klik op het script-icoontje of klik met rechts → **Attach Script** → **Create**.

## Stap 3: `_process(delta)` — elke frame bijwerken

Vervang de inhoud van het script door:

```gdscript
extends Label

func _process(delta: float) -> void:
    text = "Score: " + str(Global.score)
```

|         Code         | Wat doet het?                                                     |
| :------------------: | :---------------------------------------------------------------- |
| `_process(delta)`    | Wordt **elke frame** uitgevoerd, ideaal om iets continu bij te werken |
| `text`               | De tekst die de Label op het scherm toont                         |
| `str(Global.score)`  | Zet het getal om naar tekst zodat je het kunt plakken aan `"Score: "` |

### `_process` vs `_physics_process`

Je hebt eerder `_physics_process(delta)` gebruikt in je karakter-script. Wat is het verschil?

|         Functie          | Wanneer gebruiken?                                                  |
| :----------------------: | :------------------------------------------------------------------ |
| `_physics_process(delta)` | Voor beweging, zwaartekracht, botsingen — alles met physics        |
| `_process(delta)`         | Voor algemene updates — UI, timers, animatie-logica zonder physics |

Voor een Label die alleen tekst toont is `_process` perfect.

## Stap 4: Test het

Start het spel met `F5` en pak een muntje op. De Label telt live mee.

## Opdracht 6.4.a: een levens-Label

Je hebt nu een Score-Label. Doe hetzelfde voor `Global.levens`.

Voeg een tweede Label toe (`LevensLabel`) die `Global.levens` toont in **rood**.

<details>
<summary>Klik hier voor een tip!</summary>

- Voeg een nieuwe `Label` toe aan je level-scène en hernoem naar `LevensLabel`.
- Koppel een script met dezelfde structuur als `ScoreLabel`, maar verwijs naar `Global.levens`.
- Voor de kleur: selecteer de Label en zoek in de Inspector naar **Theme Overrides → Colors → Font Color** — zet die op rood.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

**Script op `LevensLabel`:**

```gdscript
extends Label

func _process(delta: float) -> void:
    text = "Levens: " + str(Global.levens)
```

**Voor de rode kleur:** Inspector → **Theme Overrides → Colors** → vink **Font Color** aan → kies rood.

</details>

## Er gaat iets mis

<details>
<summary>Mijn Label blijft op "0" staan</summary>

**Oorzaak:** Het script werkt wel, maar `Global.score` wordt nergens opgehoogd — bijvoorbeeld omdat je vergeten bent het muntje-script te updaten naar `Global.score += 1`.

**Oplossing:** Open je muntje-script en controleer dat er `Global.score += 1` staat (niet `body.score += 1` uit de vorige les).

</details>

<details>
<summary>Mijn Label toont niks, of de oude waarde uit de Inspector</summary>

**Oorzaak:** Het script is niet aan de juiste Label gekoppeld, of de Label staat buiten het zichtbare scherm.

**Oplossing:**

1. Selecteer `ScoreLabel` — bovenaan in de Inspector moet een script-icoontje staan.
2. Controleer in de viewport dat de Label binnen het blauwe kader (schermgrens) staat.
3. Zet bij **Theme Overrides → Font Sizes** een grotere waarde als de tekst te klein is.

</details>

<details>
<summary>Ik krijg <code>Invalid call. Nonexistent function 'Str' in base 'int'</code></summary>

**Oorzaak:** GDScript is hoofdlettergevoelig. `Str` bestaat niet — alleen `str` (kleine letter).

**Oplossing:** Vervang `Str(...)` door `str(...)`.

</details>

<details>
<summary>Mijn score telt twee keer op per muntje</summary>

**Oorzaak:** Het `body_entered`-signal is per ongeluk twee keer gekoppeld aan dezelfde functie.

**Oplossing:** Zie [Signals & een muntje oppakken](./signals_muntje.md) → "Er gaat iets mis" → "signal already connected".

</details>
