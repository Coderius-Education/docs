---
sidebar_position: 2
hide_table_of_contents: true
slug: /tilemap_opzetten
---

# Level tekenen met een TileMap

Een tile-gebaseerd level is een rooster van kleine afbeeldingen (**tiles**) die je naast en op elkaar zet. Veel platformers werken zo: één tegeltje gras dat je honderden keren gebruikt. In deze les leg je de basis: tegels importeren en je level tekenen. De **botsingen** komen in de volgende les.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.

`TileMapLayer` is geïntroduceerd in **Godot 4.3**. In oudere versies heet de node `TileMap` en werkt de workflow iets anders.
:::

## Stap 1: Een `TileMapLayer` toevoegen

1. Open je level-scène.
2. Klik met rechts op de hoofd-node (bijvoorbeeld `Node2D`) → **Add Child Node**.
3. Zoek naar `TileMapLayer` en voeg deze toe.

`TileMapLayer` is de node die de tegels op het scherm tekent.

## Stap 2: De TileSet instellen

Een `TileSet` is de verzameling afbeeldingen die je als tegels gebruikt — je palet, als het ware.

1. Selecteer je `TileMapLayer` in de Scene Tree.
2. Kijk rechts in de **Inspector**. Helemaal bovenaan zie je de eigenschap `Tile Set` met de waarde `<empty>`.
3. Klik op `<empty>` — Godot maakt direct een nieuwe TileSet aan.
4. Klik vervolgens *op* de nieuw aangemaakte TileSet om de instellingen open te klappen.
5. Kijk helemaal onderin het Godot-scherm en klik op het tabblad **TileSet** (naast **Uitvoer**).
6. Sleep vanuit je FileSystem (bijvoorbeeld uit je `assets`-map) je tegel-afbeelding rechtstreeks in het grote lege vak onderin het scherm.
7. Godot vraagt of hij automatisch tiles moet aanmaken ("Automatically create tiles?"). Klik op **Yes**.

## Stap 3: Je level tekenen

1. Klik onderin op het tabblad **TileMap** (naast TileSet).
2. Rechts in dit paneel zie je je tegels.
3. Klik bovenaan op de **teken-tool** (het potlood-icoontje).
4. Selecteer een tegel (of sleep om meerdere tegels te selecteren).
5. Klik in de viewport om je level te tekenen.

:::tip
Met de **rechtermuisknop** gum je een tegel weer weg.
:::

## Voorspel: wat gebeurt er straks als je een karakter toevoegt?

Je hebt een mooi level getekend met een grasvloer. Straks (in [Een speelbaar karakter](../04-personage-en-beweging/sprite.md)) voeg je een karakter toe. **Wat denk je dat er dan gebeurt als jouw karakter op deze grastegels probeert te lopen?**

<details>
<summary>Antwoord</summary>

Hij valt **dwars door de vloer heen**. De tegels die je hebt getekend zijn voor Godot nog gewoon plaatjes — geen massieve objecten. Voordat het karakter ergens op kan staan, moet je in [Collision op je tegels](./tilemap_collision.md) eerst **collision** aan de tegels toevoegen.

</details>

## Er gaat iets mis

<details>
<summary>De afbeelding wordt niet herkend / ik kan hem niet slepen</summary>

**Oorzaak:** Je sleept de afbeelding naar het verkeerde veld.

**Oplossing:** Zorg dat je in Stap 2 echt onderin op het tabblad **TileSet** hebt geklikt voordat je sleept.

</details>

<details>
<summary>Ik zie geen tegels in het rechterpaneel om mee te tekenen</summary>

**Oorzaak:** Je staat in het **TileSet**-tabblad (waar je tegels definieert) in plaats van het **TileMap**-tabblad (waar je tekent).

**Oplossing:** Klik onderin op het tabblad **TileMap** (naast TileSet). Dan verschijnen je tegels rechts in het paneel.

</details>
