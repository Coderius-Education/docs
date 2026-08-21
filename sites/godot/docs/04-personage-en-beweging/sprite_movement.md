---
sidebar_position: 2
slug: /sprite_movement
---

# Je eerste eigen script

Je karakter staat op het scherm, maar doet niets. Vanaf hier ga je hem zelf laten bewegen — regel voor regel, in een script dat je van nul opbouwt. In deze les maak je het script aan en schrijf je de eerste regel.

<GodotVersie />

<GDQuestLes slug="sprite_movement" />

## Waarom je zelf begint met een leeg bestand

Godot kan een startscript voor je invullen. Handig, maar dan lees je iets wat je niet zelf hebt bedacht, en bij de eerste foutmelding weet je niet waar je moet kijken.

In deze cursus begin je daarom leeg. Elke regel die erbij komt, komt erbij omdat jij hem nodig hebt. Na elke les draait je spel weer, en doet het net iets meer dan daarvoor.

Daarnaast loop je de interactieve cursus [Learn GDScript From Zero](https://gdquest.github.io/learn-gdscript/) van GDQuest door. Daar oefen je elk concept los, zonder Godot erbij. In elke les hieronder staat welke GDQuest-les bij de regel hoort die je net hebt geschreven.

## Stap 1: Koppel een leeg script

1. Selecteer je `CharacterBody2D` in de Scene Tree.
2. Klik op het script-icoontje bovenaan de Inspector (of klik met rechts → **Attach Script**).
3. Zoek in het venster de keuze **Template**. Die staat standaard op `Node: Default`. Zet hem op **`Object: Empty`**.
4. Klik op **Create**.

Godot opent nu je script. Er staat één regel in:

```gdscript
extends CharacterBody2D
```

Meer niet. Dat is precies de bedoeling.

## Stap 2: Wat die ene regel doet

**Wat denk je dat er gebeurt als je die regel weghaalt?**

<details>
<summary>Antwoord</summary>

Godot geeft een foutmelding en je script doet niets meer. `extends CharacterBody2D` betekent: "dit script *is* een `CharacterBody2D`, met daarbovenop mijn eigen code". Zonder die regel weet Godot niet welk soort node je aanstuurt, en bestaan functies als `is_on_floor()` en `move_and_slide()` niet voor jou.

Vergelijk het met een basisrecept. Met `extends` zeg je: ik bak hetzelfde recept, plus mijn eigen toevoegingen.

</details>

## Stap 3: Test dat er niets kapot is

Start het spel met `F5`. Je karakter staat stil en er verschijnt geen foutmelding.

Dat is winst: je hebt een script dat draait. In de volgende les zorg je dat het ook iets doet.

:::tip
Zie je een foutmelding over een ontbrekende Main Scene? Stel die eerst in via **Project → Project Settings**, zoek `main scene` en kies je level-scène.
:::

## Waar je naartoe werkt

Over vier lessen loopt, springt en valt je karakter. Zo ziet dat eruit:

<iframe width="100%" height="500px" src="https://www.youtube.com/embed/5V9f3MT86M8?start=570&end=712" title="Start Your Game Creation Journey Today. (Godot beginner tutorial)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Er gaat iets mis

<details>
<summary>Mijn script staat vol code die ik niet heb getypt</summary>

**Oorzaak:** Bij **Attach Script** stond **Template** nog op `Node: Default`. Godot heeft dan een compleet bewegingsscript ingevuld.

**Oplossing:** Selecteer alles in het script (`Ctrl + A`) en verwijder het, op de regel `extends CharacterBody2D` na. Je kunt ook het script losmaken (rechtermuisknop op de node → **Detach Script**) en Stap 1 opnieuw doen met de juiste template.

</details>

<details>
<summary>Ik zie geen script-icoontje bij mijn node</summary>

**Oorzaak:** Het script is niet gekoppeld, of je hebt de verkeerde node geselecteerd.

**Oplossing:** Klik in de Scene Tree op je `CharacterBody2D` (niet op de `Sprite2D` of `CollisionShape2D` eronder) en herhaal Stap 1. Een gekoppeld script laat een klein icoontje rechts van de nodenaam zien.

</details>

<details>
<summary>Foutmelding: <code>Script inherits from native type 'Node2D', so it can't be assigned to an object of type: 'CharacterBody2D'</code></summary>

**Oorzaak:** In de eerste regel staat een ander node-type dan de node waar het script op zit.

**Oplossing:** Zorg dat er `extends CharacterBody2D` staat, precies zoals het node-type in je Scene Tree heet.

</details>
