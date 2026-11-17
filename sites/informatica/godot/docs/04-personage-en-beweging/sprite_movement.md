---
sidebar_position: 2
slug: /sprite_movement
---

# Je eerste eigen script

Je karakter staat op het scherm, maar doet niets. Vanaf hier laat je hem zelf bewegen, in een script dat je regel voor regel opbouwt. Godot kan zo'n script voor je invullen, maar dan lees je iets wat je niet zelf hebt bedacht, en bij de eerste foutmelding weet je niet waar je moet kijken. Je begint daarom leeg: elke regel die erbij komt, komt erbij omdat jij hem nodig hebt. In deze les maak je het script aan, met één regel erin.

## Stap 1: Leeg script koppelen

1. Selecteer je `CharacterBody2D` in de Scene Tree.
2. Klik op het script-icoontje bovenaan de Inspector (of klik met rechts → **Attach Script**).
3. Zoek in het venster de keuze **Template**. Bij een `CharacterBody2D` staat die op `CharacterBody2D: Basic Movement`: het complete bewegingsscript. Zet hem op **`Object: Empty`**.
4. Klik op **Create**.

Godot opent nu je script. Er staat één regel in:

```gdscript
extends CharacterBody2D
```

Meer niet. Dat is precies de bedoeling.

## Stap 2: extends en testen

In je script staat één regel: `extends CharacterBody2D`. **Wat denk je dat er gebeurt als je die regel weghaalt?**

<details>
<summary>Antwoord</summary>

Godot geeft een foutmelding en je script doet niets meer. `extends CharacterBody2D` betekent: "dit script *is* een `CharacterBody2D`, met daarbovenop mijn eigen code". Zonder die regel weet Godot niet welk soort node je aanstuurt, en kan je script niets van wat een `CharacterBody2D` kan, zoals bewegen en botsen.

Vergelijk het met een basisrecept. Met `extends` zeg je: ik bak hetzelfde recept, plus mijn eigen toevoegingen.

</details>

#### Test dat er niets kapot is

Start het spel met `F5`. Je karakter staat stil en er verschijnt geen foutmelding.

Dat is winst: je hebt een script dat draait. In de volgende les zorg je dat het ook iets doet.

:::tip
Zie je een foutmelding over een ontbrekende Main Scene? Stel die eerst in via **Project → Project Settings**, zoek `main scene` en kies `world.tscn`.
:::

## Opdracht 4.2.a: zoek je script terug

Je script is een bestand, net als je scène. Zoek het op in het FileSystem-paneel en kijk hoe het heet.

<details>
<summary>Klik hier voor een tip.</summary>

Een scène herken je aan `.tscn` achter de naam. Een script heeft een eigen extensie. Kijk welk bestand er sinds deze les bij is gekomen.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Onder `res://` staat een bestand dat op `.gd` eindigt: dat is je script. Het staat in je projectmap, net als `world.tscn`, en gaat dus mee als je die map kopieert of inlevert.

</details>

## Er gaat iets mis

<details>
<summary>Mijn script staat vol code die ik niet heb getypt</summary>

**Oorzaak:** Bij **Attach Script** stond **Template** nog op `CharacterBody2D: Basic Movement`. Dat is de keuze die Godot zelf voorstelt voor dit node-type, en die vult een compleet bewegingsscript in — precies het script dat je in de volgende lessen zelf gaat schrijven.

**Oplossing:** Selecteer alles in het script (`Ctrl + A`) en verwijder het, op de regel `extends CharacterBody2D` na. Je kunt ook het script losmaken (rechtermuisknop op de node → **Detach Script**) en het opnieuw koppelen zoals bij Leeg script koppelen, met de juiste template.

</details>

<details>
<summary>Ik zie geen script-icoontje bij mijn node</summary>

**Oorzaak:** Het script is niet gekoppeld, of je hebt de verkeerde node geselecteerd.

**Oplossing:** Klik in de Scene Tree op je `CharacterBody2D` (niet op de `Sprite2D` of `CollisionShape2D` eronder) en herhaal de handelingen uit Leeg script koppelen. Een gekoppeld script laat een klein icoontje rechts van de nodenaam zien.

</details>

<details>
<summary>Foutmelding: <code>Script inherits from native type 'CharacterBody2D', so it can't be assigned to an object of type 'Sprite2D'.</code></summary>

**Oorzaak:** Het script hangt aan de verkeerde node. In de eerste regel staat `extends CharacterBody2D`, maar je hebt het script aan de `Sprite2D` gekoppeld (of aan een andere node: die naam staat achteraan de melding).

**Oplossing:** Klik met rechts op die node → **Detach Script**. Selecteer daarna je `CharacterBody2D` en koppel het script opnieuw, zoals bij Leeg script koppelen.

</details>
