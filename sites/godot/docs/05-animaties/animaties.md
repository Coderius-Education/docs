---
sidebar_position: 1
hide_table_of_contents: true
slug: /animaties
---

# Animaties aanmaken

Je karakter beweegt, maar staat er nog stijf bij. In deze les vervang je de statische `Sprite2D` door een `AnimatedSprite2D` zodat je karakter kan rennen, springen en stilstaan met echte animaties.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: hoe krijg je een lopend mannetje?

**Wat denk je dat een animatie technisch is in een 2D-game?**

<details>
<summary>Antwoord</summary>

Een animatie is een serie afbeeldingen (frames) die snel achter elkaar worden getoond — net als bij een tekenfilm. Voor lopen heb je bijvoorbeeld 6 plaatjes waarin de benen elke stap iets verder staan. Speel je die af met 10 frames per seconde, dan zie je een rennend mannetje.

</details>

## Stap 1: Vervang `Sprite2D` door `AnimatedSprite2D`

1. Klik met rechts op je bestaande `Sprite2D` → **Delete Node**.
2. Klik met rechts op `CharacterBody2D` → **Add Child Node**.
3. Voeg `AnimatedSprite2D` toe.

`AnimatedSprite2D` lijkt op `Sprite2D`, maar kan meerdere animaties bevatten die je vanuit code afspeelt.

## Stap 2: Maak een `SpriteFrames`-resource

1. Selecteer de `AnimatedSprite2D`.
2. Klik in de Inspector op **SpriteFrames** → **New SpriteFrames**.
3. Klik op de net aangemaakte SpriteFrames-resource om hem te openen.
4. Onderin het scherm verschijnt het **SpriteFrames**-paneel.

## Stap 3: Maak drie animaties: `idle`, `run`, `jump`

In het SpriteFrames-paneel zie je linksboven een lijst met animaties. Standaard staat er één animatie genaamd `default`.

1. Hernoem `default` naar `idle`.
2. Klik in het SpriteFrames-paneel op het icoontje **Add frames from a Sprite Sheet** (een rooster-icoontje, naast de andere knoppen bovenin het paneel). Kies in het FileSystem het sprite-sheet voor je idle-animatie — bijvoorbeeld `Idle (32x32).png` uit het Pixel Adventure-pack. Dit is **één** afbeelding waarin meerdere frames naast elkaar staan.
3. Er opent een dialoog. Stel bovenin **Horizontal** en **Vertical** in zodat de blauwe lijnen netjes elke afzonderlijke frame omkaderen — voor een sprite-sheet van 11 frames op één rij is dat `Horizontal: 11`, `Vertical: 1`.
4. Selecteer alle frames (sleep een rechthoek over de rij, of klik elke frame aan) en klik op **Add X Frames**.
5. Voor `run`: klik linksboven op het `+`-icoontje om een nieuwe animatie toe te voegen, noem deze `run`, en herhaal stap 2–4 met het sprite-sheet voor rennen (bijv. `Run (32x32).png`).
6. Doe hetzelfde voor `jump`.

:::tip
Werk je liever met losse PNG-bestanden (één per frame)? Zie [Je eigen animaties maken](./eigen_animaties.md) voor hoe je die zelf produceert — anders kun je ze direct vanuit het FileSystem in het frame-paneel slepen.
:::

:::tip
Zet de **FPS** (frames per seconde) van elke animatie op een waarde die er soepel uitziet. Probeer 8 of 10 als startpunt.
:::

<iframe width="100%" height="500px" src="https://www.youtube.com/embed/5V9f3MT86M8?start=712&end=868" title="Start Your Game Creation Journey Today! (Godot beginner tutorial)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

In de volgende les laat je via code de juiste animatie afspelen op het juiste moment.

## Er gaat iets mis

<details>
<summary>Mijn animatie speelt niet af</summary>

**Oorzaak:** Er is nog geen `play()`-aanroep in het script, of de animatienaam klopt niet.

**Oplossing:**

1. Controleer of je in het script `$AnimatedSprite2D.play("idle")` (of een andere animatienaam) aanroept.
2. Controleer of de naam in het script **exact** overeenkomt met de naam in SpriteFrames (hoofdlettergevoelig).
3. Controleer dat de node `AnimatedSprite2D` heet in de Scene Tree — anders past `$AnimatedSprite2D` niet.

</details>

<details>
<summary>Mijn script geeft een fout: "Node not found: Sprite2D"</summary>

**Oorzaak:** Het script verwijst nog naar `$Sprite2D`, maar die node is vervangen door `$AnimatedSprite2D`.

**Oplossing:** Vervang alle verwijzingen naar `$Sprite2D` in je script door `$AnimatedSprite2D`.

</details>

<details>
<summary>Ik krijg een fout: "Attempt to call function on a null instance"</summary>

**Oorzaak:** Godot kan de node `$AnimatedSprite2D` niet vinden. De naam in je script komt niet overeen met de naam in de Scene Tree.

**Oplossing:**

- Klik op `AnimatedSprite2D` in de Scene Tree en controleer de exacte naam (hoofdlettergevoelig).
- Zorg dat je script `$AnimatedSprite2D` gebruikt met exact dezelfde naam.
- Controleer dat `AnimatedSprite2D` een **child** is van `CharacterBody2D`, niet los in de scène.

</details>

<details>
<summary>De animatie bevriest op één frame</summary>

**Oorzaak:** De animatie is niet ingesteld op loopen, of er zit maar één frame in.

**Oplossing:**

- Selecteer de animatie in SpriteFrames en zet **Loop** aan (het herhaal-icoontje).
- Controleer of er meer dan één frame is toegevoegd.

</details>
