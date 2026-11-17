---
sidebar_position: 4
slug: /score_op_scherm
---

# Score op het scherm tonen

Je hebt nu `Global.score` die de hele speelsessie blijft bestaan. Tijd om hem zichtbaar te maken bovenaan het scherm — met een `Label`.

## Voorspel: hoe vaak update je de tekst?

Je wilt dat de tekst op het scherm verandert zodra `Global.score` verandert. **Hoe vaak zou je de tekst opnieuw moeten zetten?**

<details>
<summary>Antwoord</summary>

Het simpelst is om de tekst **elke frame** opnieuw te zetten. Dan staat hij altijd gelijk aan `Global.score`, ongeacht wanneer die wordt opgehoogd. Godot heeft daar een ingebouwde functie voor: `_process(delta)`.

</details>

## Stap 1: Label toevoegen \{#canvaslayer-label}

Een score hoort altijd op dezelfde plek op het scherm te blijven — ook als je camera de speler volgt. Daarom zet je de Label op een **`CanvasLayer`**: die tekent bovenop je spel en beweegt **niet** mee met de camera.

1. Open je level-scène (bijvoorbeeld `world.tscn`).
2. Klik met rechts op de root-node → **Add Child Node** → zoek `CanvasLayer` en voeg deze toe.
3. Klik met rechts op de `CanvasLayer` → **Add Child Node** → zoek `Label`.
4. Hernoem de Label naar `ScoreLabel`.
5. Sleep de Label in de viewport naar de plek waar je hem wilt (bijvoorbeeld linksboven).
6. Pas eventueel de tekstgrootte aan onder **Theme Overrides → Font Sizes** in de Inspector.

Je Scene Tree ziet er nu zo uit:

```
Node2D (de root van je level)
├── ...
└── CanvasLayer
    └── ScoreLabel (Label)
```

De `CanvasLayer` en `Label` staan met hun instellingen in de [Nodes cheatsheet](site:godot/cheatsheet#ui-menu).

## Stap 2: Tekst bijwerken

1. Selecteer `ScoreLabel`.
2. Klik op het script-icoontje of klik met rechts → **Attach Script** → **Create**.
3. Vervang de inhoud van het script door:

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

Start het spel met `F5` en pak een muntje op. De Label telt live mee.

## `_process`: het verschil met `_physics_process`

Je Label-script gebruikt `_process(delta)`. In je karakter-script gebruikte je eerder `_physics_process(delta)`. Wat is het verschil?

|         Functie          | Wanneer gebruiken?                                                  |
| :----------------------: | :------------------------------------------------------------------ |
| `_physics_process(delta)` | Voor beweging, zwaartekracht, botsingen — alles met physics        |
| `_process(delta)`         | Voor algemene updates — UI, timers, animatie-logica zonder physics |

Een Label die alleen tekst toont heeft geen physics nodig: daar gebruik je `_process`.

## Opdracht 7.4.a: een levens-Label

Je hebt nu een Score-Label. Doe hetzelfde voor `Global.levens`.

Voeg een tweede Label toe (`LevensLabel`) die `Global.levens` toont in **rood**. Geef hem een eigen plek, zodat hij niet over de score heen staat.

<details>
<summary>Klik hier voor een tip.</summary>

- Voeg een nieuwe `Label` toe onder dezelfde `CanvasLayer` en hernoem naar `LevensLabel`.
- Koppel een script met dezelfde structuur als `ScoreLabel`, maar verwijs naar `Global.levens`.
- Voor de kleur: selecteer de Label en zoek in de Inspector naar **Theme Overrides → Colors → Font Color** — zet die op rood.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

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
<summary>Mijn Label blijft op "Score: 0" staan</summary>

**Oorzaak:** Het script werkt wel, maar `Global.score` wordt nergens opgehoogd — bijvoorbeeld omdat je vergeten bent het muntje-script te updaten naar `Global.score += 1`.

**Oplossing:** Open je muntje-script en controleer dat er `Global.score += 1` staat (niet `body.score += 1` uit Score bijhouden in je karakter).

**Zelf vinden:** print `Global.score` op twee plekken: in het muntje-script vlak na het ophogen, en in je Label-script. Loopt de eerste wel op en de tweede niet, dan zit het verschil in je Label; loopt de eerste al niet op, dan is het muntje de boosdoener.

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
<summary>Foutmelding: <code>Function "Str()" not found in base self.</code></summary>

**Oorzaak:** GDScript is hoofdlettergevoelig. `Str` bestaat niet, alleen `str` met een kleine letter.

{/* verwacht-fout: Function "Str()" not found in base self. */}

```gdscript
# FOUT
extends Label

func _process(delta: float) -> void:
    text = "Score: " + Str(Global.score)
```

**Oplossing:** Vervang `Str(...)` door `str(...)`.

</details>

<details>
<summary>Mijn score telt twee keer op per muntje</summary>

**Oorzaak:** Er liggen twee muntjes op dezelfde plek: je ziet er één en pakt er twee. Dat gebeurt snel als je `muntje.tscn` twee keer naar bijna dezelfde plek sleept. Of de regel `Global.score += 1` staat twee keer in je muntje-script.

**Oplossing:** Klik in de Scene Tree je muntjes een voor een aan en kijk in de viewport waar ze liggen; sleep er één weg of verwijder hem. Kijk daarna in `_on_body_entered` of de score daar één keer wordt opgehoogd.

**Zelf vinden:** kijk in **Uitvoer** wat je muntje print. Twee regels `Score:` voor één muntje betekent twee muntjes. Eén regel waarin het getal met twee omhoog gaat, betekent een dubbele regel in je script.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
