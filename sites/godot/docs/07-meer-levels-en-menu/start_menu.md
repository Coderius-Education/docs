---
sidebar_position: 2
hide_table_of_contents: true
slug: /start_menu
---

# Een startmenu

Wanneer je je spel start, val je nu meteen in het level. In deze les bouw je een echt menu met knoppen waarmee de speler het spel start of afsluit.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: welke nodes heb je nodig?

In Godot zit er een ingebouwde node-type voor knoppen. **Hoe denk je dat hij heet, en welk signal stuurt hij?**

<details>
<summary>Antwoord</summary>

- De node heet `Button` (UI-node uit de Control-familie).
- Het signal heet `pressed` en wordt verstuurd zodra de speler de knop indrukt en weer loslaat — vergelijkbaar met `body_entered` uit [Signals & een muntje oppakken](../06-signals-en-score/signals_muntje.md).

</details>

## Stap 1: Nieuwe scène voor het menu

1. Klik op **Scene** → **New Scene**.
2. Kies dit keer **User Interface** (geen 2D Scene) — Godot maakt automatisch een `Control`-node als root. `Control` is de basis voor alle UI; hij vult standaard het hele scherm.
3. Sla op via `Ctrl + S` als `menu.tscn`.

## Stap 2: Layout met een `VBoxContainer`

Een `VBoxContainer` stapelt zijn child-nodes netjes verticaal onder elkaar — perfect voor een lijstje knoppen.

1. Klik met rechts op de `Control`-root → **Add Child Node** → `VBoxContainer`.
2. Selecteer de `VBoxContainer` en zet in de Inspector onder **Layout** de **Anchors Preset** op **Center** (zoals je leerde in [Achtergrond](../03-level-bouwen/background_image.md)). De container zit nu mooi in het midden.

## Stap 3: Twee knoppen en een titel

1. Klik met rechts op de `VBoxContainer` → **Add Child Node** → `Label`. Stel **Text** in op `Mijn 2D Game` (of een eigen titel).
2. Klik nogmaals met rechts op de `VBoxContainer` → **Add Child Node** → `Button`. Stel **Text** in op `Start spel`.
3. Voeg op dezelfde manier een tweede `Button` toe met **Text** `Afsluiten`.

Je Scene Tree ziet er nu zo uit:

```
Menu (Control)
└── VBoxContainer
    ├── Label              (tekst: Mijn 2D Game)
    ├── Button (Start)     (tekst: Start spel)
    └── Button (Afsluiten) (tekst: Afsluiten)
```

## Stap 4: Script aan de root koppelen

1. Selecteer de `Control`-root (`Menu`).
2. Klik op het script-icoontje → **Attach Script** → **Create**. Sla op als `menu.gd`.

## Stap 5: Koppel de `pressed`-signalen

Per knop koppel je het `pressed`-signaal aan een functie in `menu.gd`. Dat doe je op dezelfde manier als `body_entered` in [6.1](../06-signals-en-score/signals_muntje.md).

1. Selecteer de eerste knop (`Start spel`).
2. Ga naar het **Node**-tabblad rechts naast de Inspector.
3. Dubbelklik op `pressed`.
4. Kies de `Menu`-root als ontvanger en klik op **Connect**. Godot maakt een functie `_on_button_pressed()` aan — hernoem die handmatig naar `_on_start_pressed()` voor de duidelijkheid.

Doe hetzelfde voor de `Afsluiten`-knop, met als functienaam `_on_afsluiten_pressed()`.

## Stap 6: Vul de callbacks

```gdscript
extends Control

func _on_start_pressed() -> void:
    Global.reset()  # score en levens terug op beginwaarde
    get_tree().change_scene_to_file("res://level1.tscn")

func _on_afsluiten_pressed() -> void:
    get_tree().quit()
```

| Code                                          | Wat doet het?                                                |
| :-------------------------------------------- | :----------------------------------------------------------- |
| `Global.reset()`                              | Zet `score` en `levens` terug op beginwaarde (zie [6.3](../06-signals-en-score/global_variables.md)) |
| `change_scene_to_file("res://level1.tscn")`   | Laadt level 1 (zoals je leerde in [7.1](./tweede_level.md))   |
| `get_tree().quit()`                           | Sluit het hele spel-venster                                  |

:::tip
Heb je `Global.reset()` niet gedefinieerd? Voeg in `global.gd` een functie toe die `score = 0` en `levens = 3` zet — zie [Global variables](../06-signals-en-score/global_variables.md).
:::

## Stap 7: Maak het menu de Main Scene

Zo zorg je dat het menu opent zodra je het spel start, in plaats van level 1.

1. Ga naar **Project** → **Project Settings**.
2. Typ `main scene` in de zoekbalk bovenin.
3. Klik op het mapje en kies `menu.tscn`.

Start het spel met `F5`. Je belandt nu eerst in het menu — pas zodra je op **Start spel** klikt, begint het echte spel.

## Opdracht 7.2.a: voeg een "Level 2" knop toe

Maak het menu uitgebreider: voeg een derde knop toe waarmee de speler rechtstreeks naar level 2 kan springen, handig om snel verder te testen.

<details>
<summary>Klik hier voor een tip!</summary>

- Voeg een derde `Button` toe in de `VBoxContainer`, tekst `Level 2`.
- Verbind het `pressed`-signaal en noem de functie `_on_level2_pressed()`.
- Vul de callback met `Global.reset()` en `change_scene_to_file("res://level2.tscn")`.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```gdscript
extends Control

func _on_start_pressed() -> void:
    Global.reset()
    get_tree().change_scene_to_file("res://level1.tscn")

func _on_level2_pressed() -> void:
    Global.reset()
    get_tree().change_scene_to_file("res://level2.tscn")

func _on_afsluiten_pressed() -> void:
    get_tree().quit()
```

Bonus: voeg een vierde knop **Credits** toe die naar een derde scène `credits.tscn` gaat met je naam erin.

</details>

## Er gaat iets mis

<details>
<summary>Mijn knoppen reageren niet als ik erop klik</summary>

**Oorzaak:** Het `pressed`-signaal is niet (correct) gekoppeld aan een functie.

**Oplossing:**

1. Selecteer de knop in de Scene Tree.
2. Open het **Node**-tabblad. Staat er een groen pijltje naast `pressed`?
3. Zo niet: dubbelklik op `pressed`, kies de juiste ontvanger en klik **Connect**.
4. Check ook of de functienaam in je script *exact* hetzelfde is als wat Godot heeft gekoppeld.

</details>

<details>
<summary>De score begint niet bij 0 als ik opnieuw start</summary>

**Oorzaak:** `Global.score` blijft de hele speelsessie bestaan — dat is precies de bedoeling van een Autoload. Maar bij een **nieuwe start** wil je dat hij weer op 0 begint.

**Oplossing:** Roep `Global.reset()` aan in `_on_start_pressed()` *vóór* je het level laadt (zoals in Stap 6 hierboven). Heb je nog geen `reset()`-functie? Voeg in `global.gd` toe:

```gdscript
func reset() -> void:
    score = 0
    levens = 3
```

</details>

<details>
<summary>Mijn menu opent niet als ik het spel start</summary>

**Oorzaak:** De Main Scene staat nog op `level1.tscn` (of `world.tscn`).

**Oplossing:** Volg Stap 7 opnieuw — Project → Project Settings → zoek `main scene` → kies `menu.tscn`.

</details>
