---
sidebar_position: 1
slug: /signals_muntje
---

# Signals & een muntje oppakken

Tijd om iets te kunnen verzamelen in je level. In deze les bouw je een muntje als losse scène en laat je het verdwijnen zodra je karakter het aanraakt. Daarvoor gebruik je **signals** — Godot's manier om nodes met elkaar te laten praten zonder dat ze elkaar hoeven op te zoeken.

## Voorspel: zonder signals?

Stel je hebt twee losse scripts: één voor je muntje, één voor je karakter. Het muntje moet verdwijnen als het karakter het raakt.

**Hoe zou jij dat aanpakken zónder signals?**

<details>
<summary>Antwoord</summary>

Zonder signals zou het karakter het muntje moeten opzoeken:

```gdscript
# In het karakter-script
var muntje = get_node("Muntje")
muntje.queue_free()
```

Maar dan moet het karakter weten dát het muntje bestaat, hoe het heet en waar het staat. Heb je meerdere muntjes, of is er al eentje weg, dan crasht je code. Signals lossen dat op: het muntje reageert *zelf* op de botsing, zonder dat het karakter er iets van hoeft te weten.

</details>

## Signals: een bericht tussen nodes

Een signal is een bericht dat een node verstuurt zodra er iets gebeurt. Andere nodes (of de node zelf) kunnen naar dat bericht **luisteren** en daarop reageren. Denk aan een deurbel:

- De **deurbel** stuurt een signaal als iemand erop drukt.
- **Jij** luistert naar dat signaal en doet de deur open.

In Godot is het precies zo: een node *stuurt* een signal, een andere node *vangt* het op en voert code uit. De `Area2D`-node die je zo gebruikt staat in de [Nodes cheatsheet](site:godot/cheatsheet#collectibles-vijanden); de signal-code vind je terug in de [GDScript-tips](site:godot/gdscript-tips#signals).

## Stap 1: Muntje \{#area2d}

1. Ga naar **Scene** → **New Scene**, kies **Other Node** en zoek naar `Area2D`. Een `Area2D` detecteert botsingen zonder zelf physics te krijgen (geen zwaartekracht, niet wegrollen).
2. Hernoem de `Area2D` naar `Muntje`.
3. Klik met rechts op `Muntje` → **Add Child Node** en voeg een `Sprite2D` toe. Sleep je muntje-afbeelding naar **Texture** in de Inspector.
4. Klik weer met rechts op `Muntje` (niet op de `Sprite2D`) → **Add Child Node** en voeg een `CollisionShape2D` toe. Zonder collision shape kan Godot geen botsing detecteren.
5. Kies in de Inspector bij **Shape** een vorm (bijvoorbeeld `CircleShape2D`) en pas de grootte aan zodat de cirkel netjes om het muntje past.

Je Scene Tree ziet er nu zo uit:

```
Muntje (Area2D)
├── Sprite2D
└── CollisionShape2D
```

Sla de scène op als `muntje.tscn` (`Ctrl + S`).

## Stap 2: `body_entered` koppelen \{#signal-koppelen}

1. Selecteer de `Muntje`-node.
2. Klik op het script-icoontje of klik met rechts → **Attach Script**. Zet **Template** op **`Object: Empty`** en klik op **Create**.
3. Ga naar het **Node**-tabblad (rechts naast de Inspector).
4. Dubbelklik op `body_entered`.
5. Kies de `Muntje`-node als ontvanger en klik op **Connect**.

`body_entered` is een ingebouwd signal van `Area2D`. Het wordt verstuurd zodra een fysiek lichaam (zoals je `CharacterBody2D`) het muntje raakt.

Je script bestond uit één regel, en Godot heeft er nu een functie bij gezet:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    pass # hier komt je code
```

Dit is een gewone functie, zoals je er zelf ook een schrijft. Het enige verschil: jij roept hem nooit aan — Godot doet dat, zodra het signal afgaat. `pass` betekent "hier gebeurt niets"; die regel vervang je zo door je eigen code.

De parameter `body` is de node die het muntje raakte. Die krijg je meegeleverd, net zoals `delta` bij `_physics_process`.

## Stap 3: Verdwijnen en testen \{#signal-functie}

### De functie invullen

Vervang de `pass` in `_on_body_entered` door je eigen code:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    print("Muntje opgepakt")
    queue_free()
```

| Code                          | Wat doet het?                                      |
| :---------------------------: | :------------------------------------------------- |
| `_on_body_entered(body)`      | Wordt aangeroepen bij een botsing                  |
| `body`                        | De node die het muntje raakt (jouw karakter)       |
| `queue_free()`                | Verwijdert deze node (het muntje) uit het spel     |

### In je level zetten

1. Open je level/world-scène.
2. Sleep `muntje.tscn` vanuit het FileSystem-paneel naar je level.
3. Plaats het waar je wilt, een stukje boven de grond. Raakt het muntje de tegels, dan is het bij de start al weg (zie Er gaat iets mis).
4. Sleep meerdere keren om meerdere muntjes neer te zetten.

Start het spel met `F5`, loop tegen een muntje aan en kijk in **Uitvoer**: het muntje verdwijnt en je ziet "Muntje opgepakt".

Een functie met een parameter, zoals `_on_body_entered(body)`, los oefenen kan bij GDQuest:

<GDQuestLes slug="signals_muntje" />

## Opdracht 7.1.a: voeg een vijand toe

Je weet nu hoe een muntje op een botsing reageert. Pas hetzelfde principe toe op een vijand.

Maak een **vijand**-scène. Als de speler de vijand raakt, drukt de vijand een bericht af in **Uitvoer** en verdwijnt daarna. Zet de vijand zo neer dat hij de tegels net niet raakt, om dezelfde reden als bij het muntje.

<details>
<summary>Klik hier voor een tip.</summary>

- Gebruik dezelfde structuur als het muntje: een `Area2D` met `Sprite2D` en `CollisionShape2D`.
- Koppel het `body_entered`-signal aan een functie in het vijand-script.
- Gebruik `print()` voor een bericht en `queue_free()` om de vijand te laten verdwijnen.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

**Scène-structuur (`vijand.tscn`):**

```
Vijand (Area2D)
├── Sprite2D
└── CollisionShape2D
```

**Script (`vijand.gd`):**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    print("Geraakt door vijand!")
    queue_free()
```

**Stappen:**

1. Maak een nieuwe scène met `Area2D` als root, hernoem naar `Vijand`.
2. Voeg `Sprite2D` en `CollisionShape2D` toe.
3. Voeg een script toe en koppel `body_entered`.
4. Schrijf de bovenstaande code.
5. Sla op als `vijand.tscn` en sleep hem in je level.

</details>

## Er gaat iets mis

<details>
<summary>Mijn karakter loopt door het muntje heen zonder dat het verdwijnt</summary>

**Oorzaak:** Het signal is niet (correct) gekoppeld, of het muntje heeft geen werkende `CollisionShape2D`.

**Oplossing — loop deze checklist langs:**

1. Selecteer het muntje en open het **Node**-tabblad. Staat er bij `body_entered` een groen pijltje (= verbonden)?
2. Is de root van je muntje een `Area2D`, en geen `Node2D`?
3. Heeft het muntje een `CollisionShape2D` als child?
4. Heeft die `CollisionShape2D` ook echt een **Shape** ingesteld (bijvoorbeeld `CircleShape2D`)?

**Zelf vinden:** zet als eerste regel in `_on_body_entered` een `print("geraakt")`. Verschijnt die niet, dan is het een probleem van de scène (signal of collision). Verschijnt hij wél, dan ligt het aan de code eronder.

</details>

<details>
<summary>Mijn muntje of vijand is al weg als het spel start</summary>

**Oorzaak:** Het raakt de grond. Voor een `Area2D` is je `TileMapLayer` met collision ook een body, dus `_on_body_entered` gaat meteen af, en `queue_free()` haalt het muntje of de vijand weg. In **Uitvoer** staat je bericht dan al voordat je iets hebt gedaan.

**Oplossing:** Zet het muntje of de vijand iets hoger, zodat zijn `CollisionShape2D` de tegels niet raakt. Bij een vijand die op de grond staat, kun je ook de shape iets kleiner maken dan het plaatje.

**Zelf vinden:** zet `print(body.name)` als eerste regel in `_on_body_entered`. Je ziet dan welke node het raakte, en of dat je karakter was.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
