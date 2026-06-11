# Godot nodes — overzicht

Snelle naslag van alle node-types die in deze tutorial worden gebruikt.

---

## Coördinatensysteem

<details>
<summary>Hoe werkt het coördinatensysteem?</summary>

| Richting | As | Waarde |
|---|---|---|
| Rechts | X | Wordt groter (+) |
| Links | X | Wordt kleiner (-) |
| Omlaag | Y | Wordt groter (+) |
| Omhoog | Y | Wordt kleiner (-) |

Het punt `(0, 0)` zit in de **linkerbovenhoek** van het scherm. Daarom is de jump velocity **negatief** — omhoog springen betekent Y kleiner maken.

</details>

---

## Level & wereld

<details>
<summary>Node2D — basis van je level-scene</summary>

De basisnode voor alles in een 2D-wereld. Heeft een positie, rotatie en schaal.

**Wanneer gebruik je het?**
Als root van je level/wereld-scene — de node waar alle andere nodes als child onder hangen.

**Instellen in de Inspector:**
- `Position` — waar de node staat in de wereld
- `Rotation` — hoek in graden
- `Scale` — grootte

</details>

<details>
<summary>TileMapLayer — level bouwen met tegels</summary>

Een node waarmee je de wereld opbouwt uit herhalende tegels (tiles), zoals platforms en de grond.

**Wanneer gebruik je het?**
Voor het bouwen van je level — sneller dan losse sprites voor elk platform.

**Instellen:**
1. Maak een `TileSet` aan via de Inspector → klik op `Tile Set` (`<empty>`) — Godot maakt direct een nieuwe TileSet aan
2. Sleep een tileset-afbeelding erin
3. Voeg een **Physics Layer** toe zodat de tiles botsen
4. Teken je level met de TileMap-editor onderin

</details>

<details>
<summary>TextureRect — schermvullende afbeelding voor de achtergrond</summary>

Een UI-node die een afbeelding kan tonen die meeschaalt met het schermformaat — via *anchors* en *stretch modes*. Geschikt voor achtergronden; voor losse sprites gebruik je `Sprite2D`.

**Wanneer gebruik je het?**
Als achtergrond — sleep hem **bovenaan** in de Scene Tree zodat hij achter alle andere nodes wordt getekend.

**Instellen in de Inspector:**
- `Texture` — sleep een afbeelding vanuit het FileSystem.
- `Layout` → `Anchors Preset` → **Full Rect** — laat hem het hele scherm vullen.
- `Stretch Mode` → **Keep Aspect Covered** — vult zonder vervorming.

</details>

---

## Hoofdpersoon

<details>
<summary>CharacterBody2D — je speler</summary>

Een node voor een speelbaar karakter dat beweegt en botst met de wereld. Heeft ingebouwde ondersteuning voor `move_and_slide()`.

**Vaste children:**
```
CharacterBody2D
├── AnimatedSprite2D   ← zichtbaar uiterlijk
└── CollisionShape2D   ← botsingsgebied
```

**Heeft een script nodig** om te bewegen (via `_physics_process`).

</details>

<details>
<summary>AnimatedSprite2D — animaties voor je karakter</summary>

Toont een afbeelding die kan wisselen tussen animaties, opgebouwd uit losse frames.

**Wanneer gebruik je het?**
Als child van `CharacterBody2D` voor animaties zoals idle, run en jump.

**Instellen in de Inspector:**
- `Sprite Frames` → **New SpriteFrames** → open de SpriteFrames-editor
- Maak animaties aan (`idle`, `run`, `jump`) en sleep frames erin
- Stel FPS in per animatie (aanbevolen: 8–12 FPS)

</details>

<details>
<summary>CollisionShape2D — hitbox / botsingsgebied</summary>

Definieert het botsingsgebied (hitbox) van een node. Godot gebruikt dit om te detecteren wanneer twee objecten elkaar raken.

**Wanneer gebruik je het?**
Als child van `CharacterBody2D` of `Area2D` — zonder dit kan Godot geen botsingen detecteren.

**Instellen in de Inspector:**
- `Shape` — kies een vorm:
  - `RectangleShape2D` — voor een karakter of rechthoekig object
  - `CircleShape2D` — voor ronde objecten (bijv. muntje)

</details>

<details>
<summary>Camera2D — camera die de speler volgt</summary>

Een camera-node die meebeweegt met zijn parent. Zonder camera staat het beeld stil terwijl de speler beweegt.

**Wanneer gebruik je het?**
Als child van `CharacterBody2D` voor een mee-bewegende camera bij grotere levels.

**Instellen in de Inspector:**
- `Enabled` aan laten staan (standaard) — anders blijft het beeld stil.
- `Position Smoothing → Enabled` — vloeiend volgen.
- `Zoom` (`Vector2(2, 2)`) — dichterbij inzoomen voor pixel-art.
- `Limit Left/Right/Top/Bottom` — grenzen zodat de camera niet voorbij de level-rand kijkt.

</details>

---

## Collectibles & vijanden

<details>
<summary>Area2D — muntjes en vijanden detecteren</summary>

Een node die detecteert wanneer andere objecten er doorheen bewegen — zonder zelf te botsen of te vallen.

**Wanneer gebruik je het?**
Voor muntjes, vijanden of checkpoints die een reactie moeten geven wanneer de speler ze aanraakt.

**Vaste children:**
```
Area2D
├── Sprite2D of AnimatedSprite2D
└── CollisionShape2D
```

**Signal:** Koppel `body_entered` om te reageren wanneer een `CharacterBody2D` de area binnengaat.

</details>

<details>
<summary>Sprite2D — stilstaande afbeelding</summary>

Toont één stilstaande afbeelding in de scene.

**Wanneer gebruik je het?**
Voor objecten zonder animatie, zoals een muntje of een stilstaande vijand.

**Instellen in de Inspector:**
- `Texture` — sleep hier een afbeelding naartoe vanuit het FileSystem

</details>

---

## UI & menu

<details>
<summary>CanvasLayer — UI die altijd op het scherm blijft</summary>

Een speciale node die zijn children **los van de camera** rendert — de inhoud blijft altijd op dezelfde plek op het scherm, ongeacht hoe de camera beweegt.

**Wanneer gebruik je het?**
Als container voor je score-display, levensbalken of andere UI-elementen.

**Structuur:**
```
CanvasLayer
└── Label   ← score, levens, etc.
```

</details>

<details>
<summary>Label — score of levens weergeven</summary>

Toont tekst op het scherm.

**Wanneer gebruik je het?**
Voor het weergeven van de score, het aantal levens, of andere informatie aan de speler.

**Instellen in de Inspector:**
- `Text` — de tekst die getoond wordt
- `Font Size` — lettertypegrootte

</details>

<details>
<summary>Control — basis-node voor UI-schermen</summary>

De basisnode voor alle UI in Godot. Vult standaard het hele scherm en is de root voor menu-scènes.

**Wanneer gebruik je het?**
Als root van een menu-scène (start menu, game over scherm, settings).

**Instellen:**
- Maak een nieuwe scène met **Scene → New Scene → User Interface** — Godot zet automatisch een `Control` als root.

</details>

<details>
<summary>VBoxContainer — verticale layout voor menu-items</summary>

Een UI-container die zijn child-nodes netjes verticaal onder elkaar stapelt. Ideaal voor een rijtje knoppen in een menu.

**Wanneer gebruik je het?**
Als child van `Control` om labels en knoppen onder elkaar te zetten.

**Instellen in de Inspector:**
- `Layout` → `Anchors Preset` → **Center** — zet de container in het midden van het scherm.

</details>

<details>
<summary>Button — klikbare knop</summary>

Een UI-knop waarop de speler kan klikken. Stuurt het signaal `pressed` zodra hij wordt aangeklikt.

**Wanneer gebruik je het?**
In menu's (start spel, afsluiten, level 2) en dialoogvensters.

**Instellen in de Inspector:**
- `Text` — wat er op de knop staat (bv. "Start spel").

**Signal:** Koppel `pressed` via het **Node**-tabblad aan een functie in je menu-script.

</details>

---

## Autoload

<details>
<summary>Node — Autoload-root voor global.gd</summary>

De meest basale node in Godot. Heeft zelf geen positie of grafiek — alleen een naam en children. Gebruikt als root voor scripts die geen positie nodig hebben, zoals een globaal script.

**Wanneer gebruik je het?**
Als root van `global.gd` (Autoload). Zet het script in **Project Settings → Autoload** en geef het de naam `Global`. Vanaf dan kun je vanuit elk script `Global.score`, `Global.levens` etc. lezen en schrijven.

**Code voorbeeld:**
```gdscript
extends Node

var score  = 0
var levens = 3

func reset() -> void:
    score  = 0
    levens = 3
```

</details>

---

## Handige links

- [Godot documentatie](https://docs.godotengine.org/en/stable/)
- [Pixel Adventure assets](https://pixelfrog-assets.itch.io/pixel-adventure-1)
- [GDScript leren (interactief)](https://gdquest.github.io/learn-gdscript/)
