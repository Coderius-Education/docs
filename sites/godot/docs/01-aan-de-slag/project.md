---
sidebar_position: 2
slug: /project
---

# Nieuw project aanmaken

Nu Godot geïnstalleerd is, maak je een nieuw, leeg project aan. Een project is gewoon een map op je computer waarin Godot al je scènes, scripts en afbeeldingen bewaart.

<GodotVersie />

## Stap 1: Open de Project Manager

Open Godot. Je ziet meteen het **Project Manager**-venster: een lijst van projecten die je tot nu toe hebt gemaakt. Bij een verse installatie is die lijst nog leeg.

## Stap 2: Maak een nieuw project

1. Klik rechtsboven op **New Project**.
2. Geef je project een naam, bijvoorbeeld `mijn-eerste-game`.
3. Klik op **Browse** en kies een map op je computer (bijvoorbeeld in `Documenten`).
4. Klik op **Create & Edit**.

De editor opent nu met je lege project. In hoofdstuk 2 leer je hoe je de editor gebruikt.

## Opdracht 1.2.a: vind je projectmap terug

Een project is een map op je computer — dat kun je zelf controleren. Zoek in de Verkenner de map op die je bij Stap 2 hebt gekozen en bekijk welke bestanden Godot daar heeft neergezet.

<details>
<summary>Klik hier voor een tip.</summary>

Weet je niet meer welke map je koos? In de Project Manager staat het volledige pad onder de naam van je project.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

In je projectmap staat onder andere `project.godot`. Dat bestand maakt de map tot een Godot-project: de Project Manager zoekt er naar, en alles wat je straks maakt (scènes, scripts, afbeeldingen) komt in deze map te staan.

Onthoud waar deze map staat. In [Bestanden downloaden](../02-editor-leren-kennen/bestanden-downloaden.md) kopieer je hier je afbeeldingen naartoe.

</details>

## Er gaat iets mis

<details>
<summary>Ik zie de knop "New Project" niet</summary>

**Oorzaak:** Je kijkt mogelijk naar een ander tabblad in de Project Manager.

**Oplossing:**

- De knop **New Project** staat rechtsboven in het Project Manager-venster.
- Zie je een leeg scherm zonder knoppen? Sluit Godot en open het opnieuw via het `.exe`-bestand.

</details>

<details>
<summary>De map die ik kies geeft een foutmelding</summary>

**Oorzaak:** Godot kan geen project aanmaken in een map die al bestanden bevat, of je hebt geen schrijfrechten voor die map.

**Oplossing:**

- Klik op **Create Folder** om een nieuwe, lege map aan te maken.
- Vermijd mappen zoals `Downloads` of je bureaublad — gebruik `Documenten`.

</details>
