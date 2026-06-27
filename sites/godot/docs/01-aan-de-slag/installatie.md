---
sidebar_position: 1
slug: /installatie
---

# Installatie

Voordat je je eerste game kunt bouwen, heb je de Godot-editor nodig. Dat is het programma waarin je je scènes tekent en je code schrijft. Op deze pagina installeer je Godot 4 op je eigen computer.

<GodotVersie />

:::note[Chromebook]
Op een Chromebook kun je geen programma's installeren. Gebruik in dat geval de **online editor** in je browser: [editor.godotengine.org](https://editor.godotengine.org/). Je kunt daar direct beginnen. Sla je project op door het te exporteren als zip. De rest van de handleiding werkt hetzelfde.
:::

## Stap 1: De editor downloaden

Ga naar [godotengine.org/download/archive](https://godotengine.org/download/archive/) en zoek de nieuwste versie die begint met `4.7.` (bijvoorbeeld `4.7-stable` of nieuwer binnen de 4.7-lijn).

Klik op **Download**, zoek het kopje **Windows** en klik op **Standard**.

## Stap 2: Uitpakken

In je `Downloads`-map vind je nu een zip-bestand:

Dubbelklik erop en kies bovenaan voor **Alles uitpakken**. Verplaats de uitgepakte bestanden naar een vaste map op je computer waar je ze later snel terugvindt (bijvoorbeeld `Documenten\Godot\`).

## Stap 3: De editor openen

Dubbelklik op het Godot-bestand (de bestandsnaam ziet er ongeveer zo uit: `Godot_v4.7.x-stable_win64.exe`). Godot opent en je belandt in het **Project Manager**-venster:

![Godot Project Manager bij eerste opstart](godot.png)

Ziet jouw editor er grijzer uit dan op de screenshots? Dat klopt: sinds Godot 4.6 is het standaard thema grijswaarden. De stappen blijven hetzelfde.

## Stap 4: Check je versie

Open in Godot het menu **Help → About Godot**. Er verschijnt een venster met de exacte versie. Controleer dat het versienummer begint met `4.7.` — bijvoorbeeld `4.7-stable` of een latere 4.7-patch. Als je een andere versie ziet, ga terug naar Stap 1 en download de juiste.

In de volgende les maak je je eerste project aan.

## Er gaat iets mis

<details>
<summary>Bij het openen van Godot krijg ik een DLL-fout / "kan niet starten"</summary>

**Oorzaak:** Op oudere Windows-installaties ontbreekt de Visual C++ runtime die Godot nodig heeft.

**Oplossing:**

1. Download "Visual C++ Redistributable for Visual Studio" via [aka.ms/vs/17/release/vc_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe).
2. Installeer dat bestand.
3. Probeer Godot opnieuw te openen.

</details>

<details>
<summary>Mijn antivirus blokkeert het bestand</summary>

**Oorzaak:** Windows Defender of een ander antivirusprogramma kent het uitvoerbare bestand niet en blokkeert het uit voorzorg.

**Oplossing:**

- Controleer dat je het bestand echt via [godotengine.org](https://godotengine.org/download/) hebt gedownload (niet een willekeurige andere site).
- In Windows: klik in de melding op **Meer informatie** → **Toch uitvoeren**, of voeg `Godot_v4.7.x-stable_win64.exe` toe als uitzondering in Windows Defender.

</details>

<details>
<summary>Ik kan het uitgepakte bestand niet vinden</summary>

**Oorzaak:** Het bestand staat nog in `Downloads`, of is uitgepakt in een dubbele submap (`Godot_v4.7.../Godot_v4.7.../...`).

**Oplossing:**

1. Open Verkenner en zoek op `Godot_v4.7`.
2. Verplaats het `.exe`-bestand naar een vaste map, bijvoorbeeld `Documenten\Godot\`.
3. Maak eventueel een snelkoppeling op je bureaublad: rechts-klikken → **Verzenden naar** → **Bureaublad**.

</details>
