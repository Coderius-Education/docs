---
sidebar_position: 2
slug: /start_menu
---

# Een startmenu

Wanneer je je spel start, val je nu meteen in het level. In deze les bouw je een echt menu met knoppen waarmee de speler het spel start of afsluit.

## Voorspel: welke nodes heb je nodig?

In Godot zit er een ingebouwde node-type voor knoppen. **Hoe denk je dat hij heet, en welk signal stuurt hij?**

<details>
<summary>Antwoord</summary>

- De node heet `Button` (UI-node uit de Control-familie).
- Het signal heet `pressed` en wordt verstuurd zodra de speler de knop indrukt en weer loslaat — vergelijkbaar met `body_entered` uit [Signals & een muntje oppakken](site:godot/docs/signals_muntje).

</details>

## Stap 1: Menu-scène \{#control-button}

#### Maak een scène voor het menu

1. Klik op **Scene** → **New Scene**.
2. Kies dit keer **User Interface** (geen 2D Scene) — Godot maakt automatisch een `Control`-node als root. `Control` is de basis voor alle UI; hij vult standaard het hele scherm.
3. Hernoem de `Control`-node naar `Menu` (selecteer hem en druk op `F2`).
4. Sla op via `Ctrl + S` als `menu.tscn`.

#### Voeg een `VBoxContainer` toe

Een `VBoxContainer` stapelt zijn child-nodes verticaal onder elkaar: handig voor een lijstje knoppen.

1. Klik met rechts op `Menu` → **Add Child Node** → `VBoxContainer`.
2. Selecteer de `VBoxContainer`. Onder **Layout** in de Inspector vind je **Anchors Preset**: daarmee plak je een UI-node aan een vast punt van het scherm, zodat hij op elke schermgrootte op die plek blijft. Kies **Center** — de container zit nu mooi in het midden.

## Stap 2: Knoppen

Het menu krijgt een titel en twee knoppen, alle drie als child van de `VBoxContainer`.

1. Klik met rechts op de `VBoxContainer` → **Add Child Node** → `Label`. Stel **Text** in op `Mijn 2D Game` (of een eigen titel).
2. Klik nogmaals met rechts op de `VBoxContainer` → **Add Child Node** → `Button`. Stel **Text** in op `Start spel`.
3. Voeg op dezelfde manier een tweede `Button` toe met **Text** `Afsluiten`.

Je Scene Tree ziet er nu zo uit:

```
Menu (Control)
└── VBoxContainer
    ├── Label              (tekst: Mijn 2D Game)
    ├── Button             (tekst: Start spel)
    └── Button2            (tekst: Afsluiten)
```

Alle UI-nodes uit deze les staan met hun instellingen in de [Nodes cheatsheet](site:godot/cheatsheet#ui-menu).

## Stap 3: `pressed` koppelen

1. Selecteer de root, `Menu`.
2. Klik op het script-icoontje → **Attach Script** → **Create**. Sla op als `menu.gd`.

Per knop koppel je het `pressed`-signaal aan een functie in `menu.gd`. Dat doe je op dezelfde manier als `body_entered` in [Signals & een muntje oppakken](site:godot/docs/signals_muntje).

1. Selecteer de eerste knop (`Start spel`).
2. Ga naar het **Node**-tabblad rechts naast de Inspector.
3. Dubbelklik op `pressed`.
4. Kies de `Menu`-root als ontvanger. Onderin, bij **Receiver Method**, staat de naam die Godot voorstelt: `_on_button_pressed`. Verander die hier, in het venster, in `_on_start_pressed` en klik op **Connect**. Godot zet de functie met die naam in `menu.gd`.

Koppel `pressed` van de `Afsluiten`-knop op dezelfde manier, met `_on_afsluiten_pressed` bij **Receiver Method**.

**Let op:** verander de naam in het dialoogvenster, niet achteraf in je script. De verbinding onthoudt de naam van toen: hernoem je de functie later, dan zoekt de knop nog de oude naam en gebeurt er bij een klik niets, zonder foutmelding.

## Stap 4: `menu.gd` en Main Scene

Vul in `menu.gd` de twee functies die Godot voor je klaarzette:

```gdscript
extends Control

func _on_start_pressed() -> void:
    Global.reset()  # score en levens terug op beginwaarde
    get_tree().change_scene_to_file("res://level1.tscn")

func _on_afsluiten_pressed() -> void:
    get_tree().quit()
```

- `Global.reset()` zet `score` en `levens` terug op hun beginwaarde.
- `change_scene_to_file("res://level1.tscn")` laadt level 1, zoals de vlag dat met level 2 doet.
- `get_tree().quit()` sluit het hele spel-venster.

Staat `reset()` nog niet in je `global.gd`? Zet hem er dan eerst in: hij staat in [Global variables (Autoload)](site:godot/docs/global_variables), op het tabblad Functies in Global.

#### Maak het menu de Main Scene \{#main-scene}

1. Ga naar **Project** → **Project Settings** en typ `main scene` in de zoekbalk bovenin.
2. Klik op het mapje en kies `menu.tscn`.

Start het spel met `F5`: je komt nu eerst in het menu, en pas na een klik op **Start spel** in level 1.

## Opdracht 8.2.a: voeg een "Level 2" knop toe

Maak het menu uitgebreider: voeg een derde knop toe waarmee de speler rechtstreeks naar level 2 kan springen, handig om snel verder te testen. Wil je meer, voeg dan ook een knop Credits toe die naar een eigen scène `credits.tscn` gaat, met je naam erin.

<details>
<summary>Klik hier voor een tip.</summary>

- Voeg een derde `Button` toe in de `VBoxContainer`, tekst `Level 2`.
- Verbind het `pressed`-signaal en zet bij **Receiver Method** `_on_level2_pressed`.
- Vul de callback met `Global.reset()` en `change_scene_to_file("res://level2.tscn")`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

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

</details>

## Er gaat iets mis

<details>
<summary>Mijn knoppen reageren niet als ik erop klik</summary>

**Oorzaak:** Het `pressed`-signaal is niet (correct) gekoppeld aan een functie.

**Oplossing:**

1. Selecteer de knop in de Scene Tree.
2. Open het **Node**-tabblad. Staat er een groen pijltje naast `pressed`?
3. Zo niet: dubbelklik op `pressed`, kies de juiste ontvanger en klik **Connect**.
4. Check ook of de functienaam in je script *exact* hetzelfde is als wat Godot heeft gekoppeld. Is hij anders, dan staat onderin de scripteditor een waarschuwing `Missing connected method`.

**Zelf vinden:** zet een `print("geklikt")` in de callback. Verschijnt die niet, dan is het signal niet verbonden; verschijnt hij wél maar gebeurt er niets, dan ligt het aan de regel die de scène wisselt.

</details>

<details>
<summary>De score begint niet bij 0 als ik opnieuw start</summary>

**Oorzaak:** `Global.score` blijft de hele speelsessie bestaan — dat is precies de bedoeling van een Autoload. Maar bij een **nieuwe start** wil je dat hij weer op 0 begint.

**Oplossing:** Roep `Global.reset()` aan in `_on_start_pressed()` *vóór* je het level laadt, zoals bij `menu.gd` en Main Scene. Heb je nog geen `reset()`-functie? Voeg in `global.gd` toe:

```gdscript
func reset() -> void:
    score = 0
    levens = 3
```

</details>

<details>
<summary>Mijn menu opent niet als ik het spel start</summary>

**Oorzaak:** De Main Scene staat nog op `level1.tscn` (of `world.tscn`).

**Oplossing:** Stel de Main Scene opnieuw in, zoals bij `menu.gd` en Main Scene: Project → Project Settings → zoek `main scene` → kies `menu.tscn`.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
