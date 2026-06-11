---
sidebar_position: 1
hide_table_of_contents: true
slug: /signals_muntje
---

# Signals & een muntje oppakken

Tijd om iets te kunnen verzamelen in je level. In deze les bouw je een muntje als losse scène en laat je het verdwijnen zodra je karakter het aanraakt. Daarvoor gebruik je **signals** — Godot's manier om nodes met elkaar te laten praten zonder dat ze elkaar hoeven op te zoeken.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

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

## Wat zijn signals?

Een signal is een bericht dat een node verstuurt zodra er iets gebeurt. Andere nodes (of de node zelf) kunnen naar dat bericht **luisteren** en daarop reageren. Denk aan een deurbel:

- De **deurbel** stuurt een signaal als iemand erop drukt.
- **Jij** luistert naar dat signaal en doet de deur open.

In Godot is het precies zo: een node *stuurt* een signal, een andere node *vangt* het op en voert code uit.

## Stap 1: Maak een muntje-scène

1. Ga naar **Scene** → **New Scene**.
2. Kies **Other Node** en zoek naar `Area2D`. `Area2D` is een node die botsingen kan detecteren zonder zelf physics te krijgen (geen zwaartekracht, niet wegrollen).
3. Hernoem de `Area2D` naar `Muntje`.

## Stap 2: Voeg een sprite toe

1. Klik met rechts op `Muntje` → **Add Child Node**.
2. Voeg een `Sprite2D` toe.
3. Sleep je muntje-afbeelding naar **Texture** in de Inspector.

## Stap 3: Voeg een collision shape toe

Zonder collision shape kan Godot geen botsing detecteren.

1. Klik met rechts op `Muntje` → **Add Child Node**.
2. Voeg een `CollisionShape2D` toe.
3. Kies in de Inspector bij **Shape** een vorm (bijvoorbeeld `CircleShape2D`).
4. Pas de grootte aan zodat de cirkel netjes om het muntje past.

Je Scene Tree ziet er nu zo uit:

```
Muntje (Area2D)
├── Sprite2D
└── CollisionShape2D
```

Sla de scène op als `muntje.tscn` (`Ctrl + S`).

## Stap 4: Koppel een script en het signal

1. Selecteer de `Muntje`-node.
2. Klik op het script-icoontje of klik met rechts → **Attach Script** → **Create**.
3. Ga naar het **Node**-tabblad (rechts naast de Inspector).
4. Dubbelklik op `body_entered`.
5. Kies de `Muntje`-node als ontvanger en klik op **Connect**.

`body_entered` is een ingebouwd signal van `Area2D`. Het wordt verstuurd zodra een fysiek lichaam (zoals je `CharacterBody2D`) het muntje raakt.

Godot maakt automatisch een functie aan in je script:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    pass # hier komt je code
```

## Stap 5: Laat het muntje verdwijnen

Vervang de `pass` door:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    print("Muntje opgepakt!")
    queue_free()
```

| Code                          | Wat doet het?                                      |
| :---------------------------: | :------------------------------------------------- |
| `_on_body_entered(body)`      | Wordt aangeroepen bij een botsing                  |
| `body`                        | De node die het muntje raakt (jouw karakter)       |
| `queue_free()`                | Verwijdert deze node (het muntje) uit het spel     |

## Stap 6: Plaats het muntje in je level

1. Open je level/world-scène.
2. Sleep `muntje.tscn` vanuit het FileSystem-paneel naar je level.
3. Plaats het waar je wilt.
4. Sleep meerdere keren om meerdere muntjes neer te zetten.

Start het spel met `F5`, loop tegen een muntje aan en kijk in **Uitvoer**: het muntje verdwijnt en je ziet "Muntje opgepakt!".

## Opdracht 6.1.a: voeg een vijand toe

Je weet nu hoe een muntje op een botsing reageert. Pas hetzelfde principe toe op een vijand.

Maak een **vijand**-scène. Als de speler de vijand raakt, drukt de vijand een bericht af in **Uitvoer** en verdwijnt daarna.

<details>
<summary>Klik hier voor een tip!</summary>

- Gebruik dezelfde structuur als het muntje: een `Area2D` met `Sprite2D` en `CollisionShape2D`.
- Koppel het `body_entered`-signal aan een functie in het vijand-script.
- Gebruik `print()` voor een bericht en `queue_free()` om de vijand te laten verdwijnen.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

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

:::tip
In de volgende les bouw je een **score-teller** in je karakter, zodat opgepakte muntjes ook echt geteld worden.
:::

## Er gaat iets mis

<details>
<summary>Mijn karakter loopt door het muntje heen zonder dat het verdwijnt</summary>

**Oorzaak:** Het signal is niet (correct) gekoppeld, of het muntje heeft geen werkende `CollisionShape2D`.

**Oplossing — loop deze checklist langs:**

1. Selecteer het muntje en open het **Node**-tabblad. Staat er bij `body_entered` een groen pijltje (= verbonden)?
2. Heeft het muntje een `CollisionShape2D` als child?
3. Heeft die `CollisionShape2D` ook echt een **Shape** ingesteld (bijvoorbeeld `CircleShape2D`)?

</details>

<details>
<summary>Ik krijg een fout: <code>signal already connected</code></summary>

**Oorzaak:** Je hebt het `body_entered`-signal twee keer gekoppeld aan dezelfde functie.

**Oplossing:**

1. Selecteer de `Muntje`-node.
2. Open het **Node**-tabblad.
3. Klik met rechts op de dubbele verbinding onder `body_entered` → **Disconnect**.

</details>

<details>
<summary><code>_on_body_entered</code> wordt nooit aangeroepen</summary>

**Oorzaak:** Het muntje is geen `Area2D`, of de `CollisionShape2D` heeft geen Shape.

**Oplossing:**

- Controleer in de Scene Tree dat de root van je muntje een **`Area2D`** is (niet `Node2D`).
- Selecteer de `CollisionShape2D` en stel in de Inspector een **Shape** in als die nog leeg is.

</details>
