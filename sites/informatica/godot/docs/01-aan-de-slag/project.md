---
sidebar_position: 2
slug: /project
---

# Nieuw project aanmaken

Nu Godot geïnstalleerd is, maak je een nieuw, leeg project aan. Een project is gewoon een map op je computer waarin Godot al je scènes, scripts en afbeeldingen bewaart.

## Stap 1: Maak een nieuw project

Open Godot. Je ziet het **Project Manager**-venster: de lijst van projecten die je tot nu toe hebt gemaakt. Bij een verse installatie is die lijst nog leeg.

1. Klik op de knop met het plusje om een project te maken. Zolang je lijst leeg is, staat er een midden in het venster; er staat er ook een linksboven de lijst. Op de [schermafbeelding in Installatie](site:godot/docs/installatie#de-project-manager) heten ze Creëer Nieuw Project en Aanmaken; bij jou staat er de Engelse naam.
2. Geef je project een naam, bijvoorbeeld `mijn-eerste-game`.
3. Klik op **Browse** en kies een map op je computer (bijvoorbeeld in `Documenten`).
4. Klik op **Create**.

De editor opent nu met je lege project. In hoofdstuk 2 leer je hoe je de editor gebruikt.

## Opdracht 1.2.a: vind je projectmap terug

Een project is een map op je computer — dat kun je zelf controleren. Zoek in de Verkenner de map op die je bij Stap 1 hebt gekozen en bekijk welke bestanden Godot daar heeft neergezet.

<details>
<summary>Klik hier voor een tip.</summary>

Weet je niet meer welke map je koos? In de Project Manager staat het volledige pad onder de naam van je project.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

In je projectmap staat onder andere `project.godot`. Dat bestand maakt de map tot een Godot-project: de Project Manager zoekt er naar, en alles wat je straks maakt (scènes, scripts, afbeeldingen) komt in deze map te staan.

Onthoud waar deze map staat. In [Bestanden downloaden](site:godot/docs/bestanden-downloaden) kopieer je hier je afbeeldingen naartoe.

</details>

## Er gaat iets mis

<details>
<summary>Ik zie geen knop om een project te maken</summary>

**Oorzaak:** Je kijkt mogelijk naar het andere tabblad van de Project Manager, dat met de onderdelen van andere makers.

**Oplossing:**

- Klik bovenaan het Project Manager-venster op het eerste tabblad, dat van je projectenlijst. De knop met het plusje staat linksboven die lijst.
- Zie je een leeg scherm zonder knoppen? Sluit Godot en open het opnieuw via het `.exe`-bestand.

</details>

<details>
<summary>De map die ik kies geeft een foutmelding</summary>

**Oorzaak:** Godot kan geen project aanmaken in een map die al bestanden bevat, of je hebt geen schrijfrechten voor die map.

**Oplossing:**

- Klik op **Create Folder** om een nieuwe, lege map aan te maken.
- Vermijd mappen zoals `Downloads` of je bureaublad — gebruik `Documenten`.

</details>
