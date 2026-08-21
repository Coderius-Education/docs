---
sidebar_position: 1
slug: /background_image
---

# Achtergrond

Tijd om je lege scène iets minder grijs te maken. In deze les zet je een achtergrondafbeelding op je scherm.

<GodotVersie />

:::note
Heb je de assets nog niet gedownload? Volg eerst de stappen op [Bestanden downloaden](../02-editor-leren-kennen/bestanden-downloaden.md).
:::

## Stap 1: Voeg een `TextureRect` toe

Een `TextureRect` is een node die een afbeelding toont. Voor een achtergrond is dat precies wat je nodig hebt.

1. Klik met rechts op de root-node van je scène → **Add Child Node**.
2. Zoek naar `TextureRect` en voeg deze toe.
3. Sleep hem in de Scene Tree **bovenaan**, boven al je andere nodes. Godot tekent van boven naar beneden, dus wat bovenaan staat in de tree komt onderaan in beeld — precies wat je wilt voor een achtergrond.

De `TextureRect`-instellingen staan ook in de [Nodes cheatsheet](/cheatsheet#level-wereld).

## Stap 2: Zet de afbeelding erin

1. Selecteer de `TextureRect`.
2. Sleep `Green.png` (of een andere achtergrond uit je `Background`-map) naar de eigenschap **Texture** in de Inspector.

De afbeelding verschijnt in de viewport, meestal klein in een hoek. In de volgende stappen plaats je hem zelf goed.

## Bewegen in de viewport

Voordat je de afbeelding gaat plaatsen: leer rondkijken in de editor-viewport.

- **Inzoomen / uitzoomen** — draai aan het scrollwiel, of gebruik `Ctrl + scroll` voor fijnere stappen.
- **Verschuiven (pannen)** — houd de **middelmuisknop** ingedrukt en sleep. Geen middelmuisknop? Houd `Spatie` ingedrukt en sleep met de linkermuisknop.
- **Terug naar het canvas** — druk `F` (Frame Selected) met een node geselecteerd, of klik op het home-icoontje boven de viewport.

:::tip
Raak je je `TextureRect` kwijt buiten beeld? Selecteer hem in de Scene Tree en druk `F` — Godot springt terug naar de juiste plek.
:::

## Stap 3: Plaats de afbeelding handmatig in de viewport

Selecteer de `TextureRect` in de viewport. Je ziet een blauwe rechthoek met **handgrepen** op de hoeken en zijkanten.

De **roze stippelrand** is de rand van je canvas — je zichtbare game-scherm. Wat daarbuiten valt, zie je straks niet.

1. Sleep aan de hoek-handgrepen om de `TextureRect` groter te maken.
2. Sleep aan het midden om hem te verschuiven.
3. Maak hem zo groot dat hij de hele roze stippelrand bedekt.

## Stap 4: Zet Stretch Mode op `Tile`

Je afbeelding is nu waarschijnlijk uitgerekt of bedekt maar een deel van het vlak. Met **Tile** herhaalt Godot de afbeelding als tegels, zodat het hele vlak gevuld wordt zonder vervorming.

1. Selecteer de `TextureRect`.
2. Zoek in de Inspector de eigenschap **Stretch Mode**.
3. Zet die op `Tile`.

De afbeelding wordt nu herhaald binnen de `TextureRect`. Pas zo nodig de grootte uit Stap 3 nog wat aan tot het er goed uitziet.

## Opdracht 3.1.a: wissel van achtergrond

De map `Background` bevat meer kleuren dan alleen `Green.png`. Voorspel eerst, wissel dan:

1. **Voorspel:** de achtergrond-afbeeldingen zijn kleine vierkantjes, veel kleiner dan je scherm. Wat verwacht je te zien als je zo'n klein plaatje in jouw grote `TextureRect` zet, met Stretch Mode op `Tile`? En wat zou je zien als het plaatje juist gróter was dan de `TextureRect`?
2. Sleep een andere kleur uit `Background` naar de eigenschap **Texture** en controleer je voorspelling.

<details>
<summary>Klik hier voor een tip.</summary>

Je hoeft niets opnieuw op te bouwen. De `TextureRect`, zijn grootte en de Stretch Mode blijven staan — alleen de eigenschap **Texture** krijgt een andere afbeelding.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Selecteer de `TextureRect` en sleep bijvoorbeeld `Blue.png` naar **Texture** in de Inspector. De nieuwe kleur vult direct het hele vlak.

Over de voorspelling: `Tile` herhaalt het plaatje net zo vaak als nodig is om de `TextureRect` te vullen — een klein plaatje wordt dus heel vaak herhaald. Is het plaatje groter dan de `TextureRect`, dan zie je maar één stukje ervan: `Tile` maakt een afbeelding nooit kleiner, hij knipt af wat niet past.

</details>

## Er gaat iets mis

<details>
<summary>Mijn afbeelding ziet er wazig uit / pixel art is niet scherp</summary>

**Oorzaak:** Godot gebruikt standaard een blur-filter (lineaire filtering). Pixel art wordt daardoor vloeiend uitgesmeerd in plaats van scherp.

**Oplossing:**

1. Ga naar **Project** → **Project Settings**.
2. Typ `default_texture_filter` in de zoekbalk bovenin het venster (sneller dan zelf zoeken in de boom).
3. Verander de waarde van `Linear` naar `Nearest`.

Vanaf nu worden alle afbeeldingen in je project scherp weergegeven.

</details>
