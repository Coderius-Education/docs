---
sidebar_position: 90
slug: /exporteren
---

# Je projectmap terugvinden

Je project is een gewone map op je computer. In Godot zie je hem als `res://`, maar op je schijf heeft hij een echte plek, met een pad als `C:\Users\sam\Documents\mijn-eerste-game`. Die plek moet je kunnen terugvinden: om je werk in te leveren, mee te nemen op een USB-stick, of thuis verder te werken.

<GodotVersie />

## Voorspel: waarom is de map die je ziet niet de map die je nodig hebt?

Je opent je projectmap vanuit Godot en ziet meteen `project.godot`, je scenes en je scripts. Toch is dát niet wat je meeneemt of inlevert. **Waarom niet?**

<details>
<summary>Antwoord</summary>

Omdat je **ín** de map staat, en niet ernaar kijkt. Je ziet de inhoud: twintig losse bestanden. Wat je nodig hebt is de map **zelf**, als één ding dat je kunt kopiëren of verslepen.

Vergelijk het met een la vol spullen. Je kunt de spullen er stuk voor stuk uithalen, of je pakt de hele la. Voor meenemen wil je de la.

Om die map als één pictogram te zien, ga je één niveau omhoog. Dat doe je in Stap 3.

</details>

## Stap 1: Open je projectmap vanuit Godot

De snelste route loopt via de editor, precies zoals in [Bestanden downloaden](./02-editor-leren-kennen/bestanden-downloaden.md):

1. Klik met rechts op `res://` in het **FileSystem**-paneel (linksonder).
2. Kies **Open in File Manager** (heet **Openen in Bestandsbeheer** als je editor Nederlands is).

De Verkenner opent in je projectmap. Je ziet `project.godot`, je `.tscn`-bestanden, je scripts en je `assets`-map.

## Stap 2: Lees het volledige pad af

Bovenin de Verkenner staat de **adresbalk**: een rij mapnamen met pijltjes ertussen. Dat is het pad naar waar je nu staat.

Klik één keer op de lege ruimte rechts in die balk. De mapnamen veranderen in één regel tekst, bijvoorbeeld:

```
C:\Users\sam\Documents\mijn-eerste-game
```

Van links naar rechts lees je dat zo: schijf `C:`, de map van gebruiker `sam`, daarbinnen `Documents`, en daarin je projectmap `mijn-eerste-game`.

Die regel kun je selecteren en kopiëren met `Ctrl + C`. Handig om ergens te bewaren, want dit is het antwoord op "waar staat mijn project?".

## Stap 3: Ga één niveau omhoog

Nu wil je de projectmap als één pictogram zien, in plaats van de inhoud ervan. Twee manieren:

- Klik linksboven in de werkbalk op de **pijl-omhoog (↑)**.
- Klik in de adresbalk op de mapnaam die vóór je projectmap staat (in het voorbeeld hierboven: `Documents`).

Je ziet nu je projectmap tussen de andere mappen staan. Dít is het pictogram dat je sleept, kopieert of inlevert.

:::tip
Op een Mac werkt het vergelijkbaar: rechtermuisknop op de mapnaam bovenin het Finder-venster toont de mappen erboven, en `Command + ↑` gaat één niveau omhoog.
:::

## Wat zit er in je projectmap?

| Bestand of map | Wat is het? |
| :--- | :--- |
| `project.godot` | Maakt de map tot een Godot-project. Zonder dit bestand herkent Godot je map niet. |
| `*.tscn` | Je scenes: level, speler, muntje, menu. |
| `*.gd` | Je scripts. |
| `assets/` | Je afbeeldingen en geluiden. |
| `.godot/` | Werkmap van Godot zelf. Die hoef je niet te begrijpen; Godot maakt hem opnieuw aan als hij ontbreekt. |

## Opdracht: vind je project terug zonder Godot

Doe deze drie dingen achter elkaar. Daarna kun je je project altijd terugvinden, ook op een computer waar je nog nooit hebt gewerkt.

1. Schrijf het volledige pad van je projectmap op (Stap 2).
2. Sluit Godot helemaal af.
3. Open je projectmap opnieuw, nu vanuit de Verkenner, alleen met het pad dat je hebt opgeschreven.

<details>
<summary>Klik hier voor een tip.</summary>

Je hoeft niet door alle mappen te klikken. Plak je pad in de adresbalk van de Verkenner en druk op Enter — je springt er direct naartoe.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Je bent goed als je in een map staat waar `project.godot` in zit.

Wil je vanaf hier weer verder werken: start Godot, en de Project Manager toont je project in de lijst. Staat het er niet bij (bijvoorbeeld op een andere computer), klik dan op **Import** en kies het `project.godot`-bestand uit je map.

</details>

## Er gaat iets mis

<details>
<summary>Ik weet niet meer waar mijn project staat</summary>

**Oorzaak:** Je bent vergeten welke map je koos toen je het project aanmaakte.

**Oplossing:** Start Godot zonder een project te openen. In de **Project Manager** staat onder de naam van elk project het volledige pad. Van daaruit kun je met rechts klikken en **Show in File Manager** kiezen.

</details>

<details>
<summary>Ik zie "Open in File Manager" niet in het rechtsklikmenu</summary>

**Oorzaak:** Je hebt met rechts op een bestand geklikt in plaats van op `res://`, of je editor staat in het Nederlands.

**Oplossing:** Klik met rechts op de bovenste regel van het FileSystem-paneel, waar `res://` staat. In een Nederlandse editor heet de optie **Openen in Bestandsbeheer**.

</details>

<details>
<summary>Ik zie de <code>.godot</code>-map niet in de Verkenner</summary>

**Oorzaak:** Mappen die met een punt beginnen zijn verborgen. Windows toont ze standaard niet.

**Oplossing:** Niets doen. Je hebt die map niet nodig, en Godot maakt hem opnieuw aan. Wil je hem tóch zien: zet in de Verkenner onder **Beeld** de optie **Verborgen items** aan.

</details>

## Optioneel: je game exporteren naar een `.exe`

Wil je je spel laten spelen door iemand die Godot niet heeft — een klasgenoot, je ouders, of tijdens een presentatie? Dan bouw je je project om tot één `.exe`-bestand dat op elke Windows-computer start.

Dit is niet nodig om je werk in te leveren of te bewaren; daarvoor volstaat je projectmap. Zie het als de laatste stap wanneer je game af is.

<details>
<summary>Klik hier voor de stappen.</summary>

**Stap 1: Check je Main Scene**

Ga naar **Project → Project Settings**, zoek `main scene` in de zoekbalk en controleer dat er een scène staat (vaak `menu.tscn` of `level1.tscn`). Staat er niets, dan opent je `.exe` straks een zwart scherm.

**Stap 2: Download de Export Templates (eenmalig)**

1. Klik op **Editor → Manage Export Templates**.
2. Klik op **Go Online** en daarna op **Download and Install**.
3. Wacht: het is ongeveer 500 MB.

De templates horen bij één Godot-versie. Update je later naar een nieuwere versie, dan download je ze opnieuw.

**Stap 3: Maak een Windows-preset**

1. Klik op **Project → Export...**
2. Klik linksboven op **Add...** en kies **Windows Desktop**.
3. Rechts verschijnen de instellingen. Die kun je vrijwel allemaal laten staan.

**Stap 4: Vink Embed PCK aan**

Klap **Binary Format** open en vink **Embed PCK** aan.

Zonder deze optie maakt Godot twee bestanden: een `.exe` én een `.pck`. Ze zijn allebei nodig, dus stuur je alleen de `.exe` door, dan start het spel bij de ander niet. Met Embed PCK zit alles in één bestand.

**Stap 5: Exporteren en testen**

1. Klik onderaan op **Export Project...**
2. Kies een lege map en geef het bestand een naam, bijvoorbeeld `mijn-game.exe`.
3. Vink **Export With Debug** uit.
4. Klik op **Save**, open daarna die map en dubbelklik op je `.exe`.

Je spel start buiten Godot om.

</details>

Loopt het exporteren vast? Dit zijn de drie meest voorkomende meldingen.

<details>
<summary>"No export template found" / een rode waarschuwing in het export-venster</summary>

**Oorzaak:** De Export Templates zijn niet geïnstalleerd, of ze horen bij een andere Godot-versie dan je nu gebruikt.

**Oplossing:** Ga naar **Editor → Manage Export Templates** en klik op **Download and Install**. Wacht tot de download klaar is en exporteer opnieuw.

</details>

<details>
<summary>De <code>.exe</code> start, maar het scherm blijft zwart</summary>

**Oorzaak:** Er is geen Main Scene ingesteld, dus je spel weet niet welke scène het moet openen.

**Oplossing:** **Project → Project Settings**, zoek `main scene`, kies je startscène en exporteer opnieuw.

</details>

<details>
<summary>Windows of mijn antivirus blokkeert de <code>.exe</code></summary>

**Oorzaak:** Windows blokkeert `.exe`-bestanden die het niet kent, met de melding "Windows protected your PC". Jouw bestand is niet ondertekend door een bekende maker.

**Oplossing:** Klik op **More info** en daarna op **Run anyway**. Dat geldt ook voor degene aan wie je je spel doorstuurt: die krijgt dezelfde melding en moet hetzelfde doen.

</details>
