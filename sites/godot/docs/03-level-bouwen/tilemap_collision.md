---
sidebar_position: 3
hide_table_of_contents: true
slug: /tilemap_collision
---

# Collision op je tegels

In de [vorige les](./tilemap_opzetten.md) heb je tegels getekend. Voor Godot zijn die nu nog gewoon plaatjes — een karakter zou er straks dwars doorheen vallen. In deze les vertel je Godot welke tegels **massief** zijn, zodat ze later een echte vloer vormen voor het karakter dat je in [Een speelbaar karakter](../04-personage-en-beweging/sprite.md) toevoegt.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: hoe weet Godot welke tegels massief zijn?

Je hebt een hele tileset met grastegels, struiken, wolkjes — sommige moeten massief worden (gras), andere niet (wolkjes). **Hoe denk je dat je Godot dat onderscheid vertelt?**

<details>
<summary>Antwoord</summary>

Je *verft* per tegel of die massief is. Dat doe je in twee stappen:

1. Eerst een **Physics Layer** aanmaken op de TileSet (een "kanaal" waarop botsingen worden geregistreerd).
2. Daarna met de **Paint-tool** elke massieve tegel inkleuren — een lichtblauw vakje als bewijs.

In deze les doe je beide.

</details>

## Stap 1: Physics Layer aanmaken

Voordat je collision kunt verven, moet er een **Physics Layer** bestaan op je TileSet. Zie het als een "kanaal" waarop botsingen worden geregistreerd.

1. Selecteer je `TileMapLayer` in de Scene Tree.
2. Klik in de **Inspector** op je TileSet zodat de instellingen openklappen.
3. Zoek het kopje **Physics Layers** en klap het open.
4. Klik op **Add Element**.

Er staat nu een `Layer 0`. De standaard-instellingen zijn prima — die hoef je niet aan te passen.

## Stap 2: Collision verven met de Paint-tool

Nu vertel je per tegel of die massief is of niet.

1. Zorg dat je onderin in het tabblad **TileSet** zit (NIET TileMap — daar tekende je je level mee; hier definieer je tegels).
2. Klik bovenaan in dat paneel op de knop **Paint** (het verfroller- of kwastje-icoontje).
3. Naast die knop verschijnt een dropdown-menu. Klik hierop en kies **Physics Layer 0**.
4. Klik en sleep nu over alle tegels in je afbeelding die massief moeten zijn (gras, zand, stenen muren).
5. De geverfde tegels krijgen een **lichtblauw vierkantje**. Alles wat lichtblauw is, is vanaf nu massief.

:::tip
Je hoeft niet elke tile collision te geven. Decoratie zoals wolkjes of struiken laat je leeg — een karakter zou daar straks gewoon doorheen kunnen lopen.
:::

De lichtblauwe vakjes zijn jouw bewijs dat collision actief is op die tegels. Echt **testen** kun je dit pas zodra je in de volgende les een karakter toevoegt — dan blijft dat karakter bij `F5` netjes op de gekleurde tegels staan in plaats van erdoorheen te zakken.

## Er gaat iets mis

<details>
<summary>Ik zie de Paint-knop niet in het TileSet-paneel</summary>

**Oorzaak:** Je staat in het verkeerde tabblad, of er is nog geen Physics Layer aangemaakt.

**Oplossing:**

1. Check of je echt in het **TileSet**-tabblad bent (onderin, naast TileMap).
2. Klap in de Inspector je TileSet open en controleer of er onder **Physics Layers** een `Layer 0` staat — anders eerst Stap 1 doen.

</details>
