---
sidebar_position: 9
slug: /camera2d
---

# Een camera die de speler volgt

Tot nu toe stond je beeld stil terwijl je speler bewoog. Bij grotere levels betekent dat: zodra je karakter naar rechts loopt, verdwijnt hij gewoon uit beeld. Tijd voor een **camera die meebeweegt**.

## Voorspel: hoe laat je een camera meebewegen?

In Godot bestaat er een aparte `Camera2D`-node. **Waar zou je hem in de Scene Tree neerzetten zodat hij automatisch meeschuift met je speler?**

<details>
<summary>Antwoord</summary>

Maak hem **child van je `CharacterBody2D`**. In Godot beweegt een child altijd mee met zijn parent — verandert de positie van het karakter, dan verandert die van de camera automatisch mee. Geen code nodig.

Eén extra detail: je moet bij de camera ook **Enabled** aan laten staan — dan wordt hij automatisch de actieve "kijk-camera" zodra de scène start.

</details>

## Stap 1: Camera toevoegen \{#camera2d}

#### Voeg een `Camera2D`-node toe

1. Klik met rechts op je `CharacterBody2D` in de Scene Tree → **Add Child Node**.
2. Zoek naar `Camera2D` en voeg deze toe.

Je Scene Tree ziet er nu zo uit:

```
CharacterBody2D
├── Sprite2D (of AnimatedSprite2D)
├── CollisionShape2D
└── Camera2D
```

#### Check Enabled en test

Selecteer de `Camera2D` en zoek in de Inspector de eigenschap **Enabled**. Het vinkje hoort aan te staan: zonder is er geen actieve camera en blijft het beeld stilstaan.

Druk daarna op `F5` en loop met je speler naar rechts. Het beeld schuift nu mee en je karakter blijft in het midden.

## Stap 2: Camera instellen

#### Vloeiend volgen met Position Smoothing

Standaard kleeft de camera *exact* aan de speler. Dat oogt schokkerig, vooral bij springen. Met **Position Smoothing** loopt de camera met een lichte vertraging mee.

1. Selecteer de `Camera2D` en klap in de Inspector **Position Smoothing** open.
2. Vink **Enabled** aan. De **Speed** van 5.0 is meestal prima; hoger is sneller meeschuiven.

#### Inzoomen op je speler

Voor pixel-art is je karakter vaak klein. Zoek in de Inspector de eigenschap **Zoom** en zet beide waarden op `2`: alles verschijnt twee keer zo groot. Een hogere waarde is dus dichterbij, niet verder weg; met `0.5` zoom je juist uit.

#### Limit: niet voorbij de rand van je level

Eindigt je level bij een muur, dan wil je niet dat de camera in de leegte erachter kijkt.

1. Klap in de Inspector **Limit** open.
2. Vul de pixel-coördinaten van de grenzen van je level in, bijvoorbeeld `Left: 0`, `Right: 1920`, `Top: 0`, `Bottom: 1080`.

De camera stopt nu bij die grenzen, ook al loopt je speler er nog voorbij. Alle `Camera2D`-instellingen uit deze les staan ook in de [Nodes cheatsheet](site:godot/cheatsheet#hoofdpersoon).

## Opdracht 5.9.a: stel Limit in voor jouw level

Pas de **Limit**-waarden aan zodat de camera precies binnen jouw level blijft. Loop met je speler naar de level-rand om te checken dat de camera niet meer doorslaat.

<details>
<summary>Klik hier voor een tip.</summary>

- Je hoeft de grenzen niet uit te rekenen. Begin met de waarden uit Camera instellen, start het spel en loop naar de rechterrand van je level.
- Zie je leegte voorbij je laatste tegel? Maak de waarde voor rechts kleiner. Stopt de camera al voordat je de rand ziet? Maak hem groter.
- Doe hetzelfde voor de andere drie: **Limit Left/Right/Top/Bottom** van je `Camera2D`.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Voor een level van bijvoorbeeld 2048 × 720 pixels, met de oorsprong linksboven:

| Limit  | Waarde |
| :----- | -----: |
| Left   | 0      |
| Right  | 2048   |
| Top    | 0      |
| Bottom | 720    |

Je level zal per project anders zijn. De goede waarden zijn die waarbij je aan elke rand van je level net geen leegte meer ziet.

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

**Oplossing:** Zet **Position Smoothing → Enabled** aan (zie Camera instellen). Eventueel **Speed** verlagen voor nog vloeiendere beweging.

</details>

<details>
<summary>Ik zie zwarte randen aan de zijkant</summary>

**Oorzaak:** De **Limit** is ruimer ingesteld dan je level breed is, of je level is kleiner dan wat de camera in één keer laat zien.

**Oplossing:**

1. Controleer in de Inspector of de **Limit**-waarden kloppen met de echte level-grootte, en maak ze kleiner als de camera voorbij je laatste tegels kijkt.
2. Is je level kleiner dan het beeld? Maak je level groter, of verhoog de **Zoom**: een hogere waarde is dichterbij, dus dan laat de camera minder zien.

</details>

<details>
<summary>Ik raak mijn camera kwijt buiten beeld</summary>

**Oorzaak:** Per ongeluk de camera versleept of een hoge Position-offset ingesteld.

**Oplossing:** Selecteer de `Camera2D` in de Scene Tree en druk `F` in de viewport om er meteen op te zoomen. Reset zo nodig de `Position`-property in de Inspector terug naar `(0, 0)` — als child van de speler hoort hij op `(0, 0)` te staan.

</details>
