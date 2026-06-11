---
sidebar_position: 5
hide_table_of_contents: true
slug: /camera2d
---

# Een camera die de speler volgt

Tot nu toe stond je beeld stil terwijl je speler bewoog. Bij grotere levels betekent dat: zodra je karakter naar rechts loopt, verdwijnt hij gewoon uit beeld. Tijd voor een **camera die meebeweegt**.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: hoe laat je een camera meebewegen?

In Godot bestaat er een aparte `Camera2D`-node. **Waar zou je hem in de Scene Tree neerzetten zodat hij automatisch meeschuift met je speler?**

<details>
<summary>Antwoord</summary>

Maak hem **child van je `CharacterBody2D`**. In Godot beweegt een child altijd mee met zijn parent — verandert de positie van het karakter, dan verandert die van de camera automatisch mee. Geen code nodig.

Eén extra detail: je moet bij de camera ook **Enabled** aan laten staan — dan wordt hij automatisch de actieve "kijk-camera" zodra de scène start.

</details>

## Stap 1: Voeg een `Camera2D`-node toe

1. Klik met rechts op je `CharacterBody2D` in de Scene Tree → **Add Child Node**.
2. Zoek naar `Camera2D` en voeg deze toe.

Je Scene Tree ziet er nu zo uit:

```
CharacterBody2D
├── Sprite2D (of AnimatedSprite2D)
├── CollisionShape2D
└── Camera2D
```

## Stap 2: Check dat Enabled aan staat

Selecteer de `Camera2D` en zoek in de Inspector de eigenschap **Enabled**. Die staat standaard al aan — controleer dat het vinkje aan staat.

Zonder deze property aan is er geen actieve camera en blijft het beeld stilstaan.

:::tip
Heb je per ongeluk meerdere `Camera2D`'s in je scène (bijvoorbeeld nog eentje in een level)? Maar **één** mag tegelijk `Enabled` aan hebben — anders weet Godot niet welke hij moet gebruiken.
:::

## Stap 3: Test

Druk op `F5` en loop met je speler naar rechts. Het beeld schuift nu mee — je karakter blijft in het midden.

## Stap 4: Vloeiend volgen met Position Smoothing

Standaard kleeft de camera *exact* aan de speler. Dat oogt soms wat schokkerig, vooral bij springen. Met **Position Smoothing** loopt de camera met een lichte vertraging mee, wat veel natuurlijker voelt.

1. Selecteer de `Camera2D`.
2. Klap in de Inspector **Position Smoothing** open.
3. Vink **Enabled** aan.
4. Speel eventueel met **Speed** (standaard 5.0 is meestal prima — hoger = sneller meeschuiven).

## Stap 5: Inzoomen op je speler

Voor pixel-art is je karakter vaak heel klein. Met **Zoom** kun je dichterbij kijken.

1. Zoek in de Inspector de eigenschap **Zoom**. Het is een `Vector2`.
2. Zet beide waarden op `2` (dus `Vector2(2, 2)`) — alles verschijnt 2× zo groot.

:::tip
Hogere Zoom-waarde = **dichterbij** (groter), niet verder weg. Dat is contra-intuïtief. Zet je Zoom op `(0.5, 0.5)` om juist verder uit te zoomen.
:::

## Stap 6: Limit zodat de camera niet voorbij de level-rand kijkt

Als je level eindigt bij een muur, wil je niet dat de camera in de zwarte leegte erachter blijft kijken. Met **Limit** stel je grenzen in.

1. Klap in de Inspector **Limit** open.
2. Vul de pixel-coördinaten in van de level-grenzen — bijvoorbeeld `Left: 0`, `Right: 1920`, `Top: 0`, `Bottom: 1080`.

De camera stopt nu netjes bij die grenzen, ook al loopt je speler er nog voorbij.

## Opdracht 4.5.a: stel Limit in voor jouw level

Pas de **Limit**-waarden aan zodat de camera precies binnen jouw level blijft. Loop met je speler naar de level-rand om te checken dat de camera niet meer doorslaat.

<details>
<summary>Klik hier voor een tip!</summary>

- Selecteer je `TileMapLayer` in de Scene Tree.
- Kijk in de Inspector naar **Position** en de grootte van je level (bijv. 64 tiles × 32 pixels = 2048 pixels breed).
- Vul die getallen in bij **Limit Left/Right/Top/Bottom** van je `Camera2D`.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

Voor een level van bijvoorbeeld 2048 × 720 pixels, met de oorsprong linksboven:

| Limit  | Waarde |
| :----- | -----: |
| Left   | 0      |
| Right  | 2048   |
| Top    | 0      |
| Bottom | 720    |

Je level zal per project anders zijn — meet of bereken de exacte grenzen van jouw tegels.

</details>

## Er gaat iets mis

<details>
<summary>Mijn camera doet niets / beeld schuift niet mee</summary>

**Oorzaak:** **Enabled** staat uit, of er is een andere `Camera2D` in je scène die ook Enabled is.

**Oplossing:**

1. Selecteer je `Camera2D` (child van je speler) en controleer dat **Enabled** is aangevinkt.
2. Zoek in je Scene Tree of er nog andere `Camera2D`-nodes zijn. Zet **Enabled** uit bij alle behalve één.

</details>

<details>
<summary>De camera staat schokkerig of trilt bij springen</summary>

**Oorzaak:** Position Smoothing staat uit, dus de camera kleeft exact aan de pixel-positie van de speler.

**Oplossing:** Zet **Position Smoothing → Enabled** aan (Stap 4). Eventueel **Speed** verlagen voor nog vloeiendere beweging.

</details>

<details>
<summary>Ik zie zwarte randen aan de zijkant</summary>

**Oorzaak:** De **Limit** is krapper ingesteld dan je level breed is, of je level zelf is kleiner dan je viewport.

**Oplossing:**

1. Controleer in de Inspector of de **Limit**-waarden kloppen met de echte level-grootte.
2. Is je level kleiner dan het scherm? Maak hem groter, of verlaag de **Zoom** zodat hij past.

</details>

<details>
<summary>Ik raak mijn camera kwijt buiten beeld</summary>

**Oorzaak:** Per ongeluk de camera versleept of een hoge Position-offset ingesteld.

**Oplossing:** Selecteer de `Camera2D` in de Scene Tree en druk `F` in de viewport om er meteen op te zoomen. Reset zo nodig de `Position`-property in de Inspector terug naar `(0, 0)` — als child van de speler hoort hij op `(0, 0)` te staan.

</details>
