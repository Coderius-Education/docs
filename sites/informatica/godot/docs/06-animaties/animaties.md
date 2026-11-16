---
sidebar_position: 1
slug: /animaties
---

# Animaties aanmaken

Je karakter beweegt, maar staat er nog stijf bij. In deze les vervang je de statische `Sprite2D` door een `AnimatedSprite2D` zodat je karakter kan rennen, springen en stilstaan met echte animaties.

## Voorspel: hoe krijg je een lopend mannetje?

**Wat denk je dat een animatie technisch is in een 2D-game?**

<details>
<summary>Antwoord</summary>

Een animatie is een serie afbeeldingen (frames) die snel achter elkaar worden getoond — net als bij een tekenfilm. Voor lopen heb je bijvoorbeeld 6 plaatjes waarin de benen elke stap iets verder staan. Speel je die af met 10 frames per seconde, dan zie je een rennend mannetje.

</details>

## Stap 1: Vervang `Sprite2D` door `AnimatedSprite2D` \{#animatedsprite2d}

1. Klik met rechts op je bestaande `Sprite2D` → **Delete Node**.
2. Klik met rechts op `CharacterBody2D` → **Add Child Node**.
3. Voeg `AnimatedSprite2D` toe.

`AnimatedSprite2D` lijkt op `Sprite2D`, maar kan meerdere animaties bevatten die je vanuit code afspeelt.

De `AnimatedSprite2D`-instellingen staan ook in de [Nodes cheatsheet](site:godot/cheatsheet#hoofdpersoon).

## Stap 2: Maak een `SpriteFrames`-resource

1. Selecteer de `AnimatedSprite2D`.
2. Klik in de Inspector op **SpriteFrames** → **New SpriteFrames**.
3. Klik op de net aangemaakte SpriteFrames-resource om hem te openen.
4. Onderin het scherm verschijnt het **SpriteFrames**-paneel.

## Stap 3: Maak drie animaties: `idle`, `run`, `jump`

### De `idle`-animatie

In het SpriteFrames-paneel zie je linksboven een lijst met animaties. Standaard staat er één animatie genaamd `default`.

1. Hernoem `default` naar `idle`.
2. Klik in het SpriteFrames-paneel op het icoontje **Add Frames from Sprite Sheet** (een rooster-icoontje, naast de andere knoppen bovenin het paneel). Kies in het FileSystem het sprite-sheet voor je idle-animatie — bijvoorbeeld `Idle (32x32).png` uit het Pixel Adventure-pack. Dit is **één** afbeelding waarin meerdere frames naast elkaar staan.
3. Er opent een dialoog. Stel bovenin **Horizontal** en **Vertical** in zodat de blauwe lijnen netjes elke afzonderlijke frame omkaderen — voor een sprite-sheet van 11 frames op één rij is dat `Horizontal: 11`, `Vertical: 1`.
4. Selecteer alle frames (sleep een rechthoek over de rij, of klik elke frame aan) en klik op de knop rechtsonder. Die telt mee hoeveel je er hebt gekozen: bij elf frames staat er `Add 11 Frame(s)`.

Kom je er niet uit? Op het tabblad Video van deze les zie je de stappen in beeld.

### De `run`- en `jump`-animatie

1. Klik linksboven in het SpriteFrames-paneel op het `+`-icoontje om een nieuwe animatie toe te voegen en noem deze `run`.
2. Voeg de frames toe zoals bij `idle`, met het sprite-sheet voor rennen (bijv. `Run (32x32).png`).
3. Doe hetzelfde voor `jump`.

Je drie animaties staan klaar, maar in je spel zie je ze nog niet: een animatie speelt pas als je script hem start. Dat schrijf je in [Animaties in code](site:godot/docs/animaties_code).

:::tip
Werk je liever met losse PNG-bestanden (één per frame)? Zie [Je eigen animaties maken](site:godot/docs/eigen_animaties) voor hoe je die zelf produceert — anders kun je ze direct vanuit het FileSystem in het frame-paneel slepen.
:::

:::tip
Zet de **FPS** (frames per seconde) van elke animatie op een waarde die er soepel uitziet. Probeer 8 of 10 als startpunt.
:::

## Video

Het SpriteFrames-paneel is even wennen. In deze video zie je hoe het gaat: het sprite-sheet erin slepen, de frames uitsnijden en de animatie afspelen.

<iframe width="100%" height="420px" src="https://www.youtube-nocookie.com/embed/5V9f3MT86M8?start=712&end=868" title="Start Your Game Creation Journey Today. (Godot beginner tutorial)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Er gaat iets mis

<details>
<summary>Mijn animatie speelt niet af als ik het spel start</summary>

**Oorzaak:** Na deze les hoort dat zo. Je script roept nog nergens `play()` aan, en zonder die aanroep start geen enkele animatie.

**Oplossing:** Ga door met [Animaties in code](site:godot/docs/animaties_code): daar laat je je script de animatie kiezen. Speelt hij daarna nog niet, kijk dan bij Er gaat iets mis van die les.

</details>

<details>
<summary>Ik zie mijn animatie niet in de lijst, of er staat nog <code>default</code></summary>

**Oorzaak:** De animatie heeft nog de naam `default`, of je hebt de frames aan een andere animatie toegevoegd dan je dacht.

**Oplossing:**

- Klik in het SpriteFrames-paneel de animaties in de lijst een voor een aan en kijk welke frames erbij staan.
- Controleer de namen: `idle`, `run` en `jump`, in kleine letters. Je script zoekt ze straks op precies die naam.

</details>

<details>
<summary>De animatie bevriest op één frame</summary>

**Oorzaak:** De animatie is niet ingesteld op loopen, of er zit maar één frame in.

**Oplossing:**

- Selecteer de animatie in SpriteFrames en zet **Loop** aan (het herhaal-icoontje).
- Controleer of er meer dan één frame is toegevoegd.

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
