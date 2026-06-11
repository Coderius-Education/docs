---
sidebar_position: 3
hide_table_of_contents: true
slug: /bestanden-downloaden
---

# Bestanden downloaden

Voor je spel heb je afbeeldingen nodig: een achtergrond, een karakter, vijanden, muntjes. Die afbeeldingen noemen we **assets**. Je hoeft ze niet zelf te tekenen — voor deze cursus gebruiken we een gratis asset-pack van internet.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Stap 1: Download het asset-pack

1. Open [pixelfrog-assets.itch.io/pixel-adventure-1](https://pixelfrog-assets.itch.io/pixel-adventure-1).
2. Klik op **Download Now**.
3. Je krijgt een scherm waar je een bedrag kunt invullen. Het pack is gratis — klik op **No thanks, just take me to the downloads**.
4. Klik op **Download** naast het bestand.

Een `.zip`-bestand wordt nu naar je `Downloads`-map gedownload.

## Stap 2: Uitpakken

1. Ga in de Verkenner naar je `Downloads`-map.
2. Dubbelklik op het `.zip`-bestand.
3. Klik bovenaan op **Alles uitpakken**.
4. Kies een locatie en klik op **Uitpakken**.

:::note
Op Windows 11 kun je bestanden direct uit een zip slepen zonder eerst uit te pakken. Dat werkt ook.
:::

Je hebt nu een map met alle afbeeldingen uit het pack.

## Stap 3: Kopieer naar je projectmap

Godot ziet alleen bestanden die **in je projectmap** staan. Vanuit de editor kun je die map snel openen.

1. Open je project in Godot.
2. Klik met de **rechtermuisknop** op `res://` in het **FileSystem**-paneel (linksonder).
3. Kies **Open in File Manager** — Verkenner opent nu je projectmap.
4. Open in een tweede Verkenner-venster de uitgepakte asset-map.
5. Sleep de mappen of bestanden die je nodig hebt naar je projectmap.

:::tip
Je hoeft niet alles te kopiëren. Voor de achtergrond heb je alleen de map `Background` nodig. Later kun je altijd meer toevoegen.
:::

Ga terug naar Godot — de bestanden verschijnen automatisch in het FileSystem-paneel.

:::note[Chromebook / online editor]
Gebruik je de [online editor](https://editor.godotengine.org/)? Dan kun je geen bestanden via de Verkenner kopiëren. Sleep de uitgepakte bestanden in plaats daarvan rechtstreeks naar het **FileSystem**-paneel in de editor.
:::

## Er gaat iets mis

<details>
<summary>Ik zie de bestanden niet in Godot</summary>

**Oorzaak:** De bestanden staan niet in je projectmap. Godot toont alleen bestanden die in dezelfde map staan als `project.godot`.

**Oplossing:**

1. Zoek in de Verkenner waar je `project.godot`-bestand staat — dat is je projectmap.
2. Kopieer de gedownloade bestanden naar die map.
3. Ga terug naar Godot — de bestanden verschijnen automatisch.

</details>

<details>
<summary>Ik heb een map-in-een-map (dubbele map)</summary>

**Oorzaak:** Bij het uitpakken wordt soms een extra map aangemaakt. Je krijgt dan bijvoorbeeld `Pixel Adventure 1/Pixel Adventure 1/...`.

**Oplossing:** Open de buitenste map en kopieer de **binnenste** map (of de bestanden daarin) naar je projectmap.

</details>
