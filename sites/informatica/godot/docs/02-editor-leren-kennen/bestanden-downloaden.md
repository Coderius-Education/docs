---
sidebar_position: 3
slug: /bestanden-downloaden
---

# Bestanden downloaden

Voor je spel heb je afbeeldingen nodig: een achtergrond, een karakter, vijanden, muntjes. Die afbeeldingen noemen we **assets**. Je hoeft ze niet zelf te tekenen — voor deze cursus gebruiken we een gratis asset-pack van internet.

## Voorspel: wat betekent `res://`?

Open je project in Godot en kijk naar het FileSystem-paneel (linksonder). Bovenaan staat `res://`. **Wat denk je dat dat is?** Denk terug aan [Opdracht 1.2.a](site:godot/docs/project#opdracht-12a-vind-je-projectmap-terug), waar je je projectmap opzocht in de Verkenner.

<details>
<summary>Antwoord</summary>

`res://` is je **projectmap**, gezien vanuit Godot. `res` staat voor *resources*: alle bestanden van je project. Straks betekent een pad als `res://assets/Background/Green.png` dus: het bestand `Green.png`, in de map `assets/Background`, binnen je projectmap. Zo kan een project verwijzen naar zijn eigen bestanden, op welke computer het ook staat.

</details>

## Stap 1: Asset-pack downloaden

#### Download het pack

1. Open [pixelfrog-assets.itch.io/pixel-adventure-1](https://pixelfrog-assets.itch.io/pixel-adventure-1).
2. Klik op **Download Now**.
3. Je krijgt een scherm waar je een bedrag kunt invullen. Het pack is gratis — klik op **No thanks, just take me to the downloads**.
4. Klik op **Download** naast het bestand.

Een `.zip`-bestand wordt nu naar je `Downloads`-map gedownload.

#### Pak het zip-bestand uit

1. Ga in de Verkenner naar je `Downloads`-map.
2. Dubbelklik op het `.zip`-bestand.
3. Klik bovenaan op **Alles uitpakken**.
4. Kies een locatie en klik op **Uitpakken**.

Je hebt nu een map met alle afbeeldingen uit het pack. Op Windows 11 kun je de bestanden ook direct uit de zip slepen, zonder eerst uit te pakken.

## Stap 2: Naar je projectmap \{#projectmap}

### De projectmap openen

Godot ziet alleen bestanden die **in je projectmap** staan. Vanuit de editor kun je die map snel openen.

![Rechtsklikmenu op res:// met Openen in Bestandsbeheer](../images/res.png)

1. Open je project in Godot.
2. Klik met de **rechtermuisknop** op `res://` in het **FileSystem**-paneel (linksonder).
3. Kies **Open in File Manager** (heet **Openen in Bestandsbeheer** als je editor Nederlands is) — Verkenner opent nu je projectmap.

### De assets kopiëren

1. Open in een tweede Verkenner-venster de uitgepakte asset-map.
2. Maak in je projectmap een nieuwe map `assets` en sleep alle mappen uit het pack daarin. De lessen verwijzen naar deze `assets`-map.

:::tip
Kopieer alles in één keer. In hoofdstuk 3 en 4 gebruik je de achtergronden (`Background`), de afbeelding met de tegels en de figuren (`Main Characters`); de rest komt in latere hoofdstukken.
:::

Ga terug naar Godot — de bestanden verschijnen automatisch in het FileSystem-paneel.

:::note[Chromebook / online editor]
Gebruik je de [online editor](https://editor.godotengine.org/)? Dan kun je geen bestanden via de Verkenner kopiëren. Sleep de uitgepakte bestanden in plaats daarvan rechtstreeks naar het **FileSystem**-paneel in de editor.
:::

## Opdracht 2.3.a: verken het asset-pack

Je gaat de komende hoofdstukken steeds bestanden uit dit pack gebruiken. Kijk nu alvast wat erin zit. Zoek in het FileSystem-paneel (of in de Verkenner) op:

1. Welke kleuren achtergrond de map `Background` bevat.
2. Waar de speelbare figuren staan, en hoe hun loop-animatie als bestand is opgeslagen.

<details>
<summary>Klik hier voor een tip.</summary>

Klap de mappen in het FileSystem-paneel open met het pijltje ervoor. Klik op een afbeelding om rechtsonder een voorbeeld te zien.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

1. `Background` bevat effen kleurtegels, waaronder `Green.png` — die gebruik je in [Achtergrond](site:godot/docs/background_image).
2. De figuren staan in `Main Characters`, elk in een eigen map. Een animatie is één breed bestand zoals `Run (32x32).png`: alle stapjes van de beweging naast elkaar in een **sprite-sheet**. In hoofdstuk 6 knip je die frames in Godot los.

</details>

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
