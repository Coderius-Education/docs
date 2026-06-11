---
sidebar_position: 90
hide_table_of_contents: true
slug: /exporteren
---

# Je game exporteren naar een .exe

Tot nu toe heb je je game alleen kunnen spelen vanuit de Godot-editor zelf. Tijd om hem **buiten Godot om** te draaien en bij je docent in te leveren. Je levert in totaal **twee bestanden** in:

1. Een **`.exe`** waarmee je docent het spel direct kan spelen, zonder dat hij Godot hoeft te installeren. Dit maak je in Stap 0 tot en met 6.
2. Een **`.zip`** met je volledige projectmap (alle scenes en GDScript-bestanden). Daarmee kan je docent je broncode bekijken en beoordelen. Dit doe je in Stap 7.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: wat heb je nodig om een .exe te maken?

**Welke onderdelen denk je dat Godot nodig heeft om jouw project om te bouwen tot één enkel `.exe`-bestand?**

<details>
<summary>Antwoord</summary>

Twee dingen:

1. **Export Templates** — kant-en-klare Godot-uitvoerbare bestanden voor Windows, die Godot combineert met jouw project. Eenmalig downloaden, ~500 MB.
2. **Een Windows-export-preset** — instellingen die Godot vertelt *hoe* hij moet exporteren (welk platform, waar naartoe, met welke naam).

Daarnaast moet je **Main Scene** ingesteld zijn — anders weet de `.exe` niet welke scène hij moet openen als je hem dubbelklikt.

</details>

## Stap 0: Check dat je Main Scene is ingesteld

1. Klik bovenin op **Project → Project Settings**.
2. Zoek in het linkermenu naar **Run** (onder *General*).
3. Kijk bij **Main Scene**.

Wijst die naar je level- of menu-scène? Top, ga door naar Stap 1.

Staat er niets? Klik op het mapje-icoontje rechts en kies je startscène (vaak `world.tscn`, `level1.tscn` of `menu.tscn`).

:::tip
Heb je een [startmenu](/docs/start_menu) gemaakt? Zet `menu.tscn` als Main Scene — dan opent het spel netjes met het menu.
:::

## Stap 1: Download de Export Templates (eenmalig)

1. Klik bovenin op **Editor → Manage Export Templates**.
2. Het venster opent in offline-modus. Klik op **Go Online** om Godot toestemming te geven om de templates van internet te downloaden. (Dit hoef je maar één keer per project te doen.)
3. Klik op **Download and Install**.
4. Wacht — het downloadt ongeveer 500 MB en kan een paar minuten duren.

:::tip
Templates passen bij **één specifieke Godot-versie**. Update je later naar Godot 4.6? Dan moet je opnieuw de bijbehorende templates downloaden.
:::

## Stap 2: Open het Export-dialoog

1. Klik bovenin op **Project → Export...**
2. Een nieuw venster opent. De lijst links is leeg — dat is normaal, we voegen zo een preset toe.

## Stap 3: Voeg een 'Windows Desktop'-preset toe

1. Klik linksboven op de knop **Add...**
2. Kies **Windows Desktop** uit het dropdown-menu.
3. Rechts verschijnt nu een paneel met instellingen voor deze preset.

Je kunt veel laten staan op de standaardwaarde. Voor de naam van de preset zie je iets als "Windows Desktop" — dat is prima.

## Stap 4: (Aanbevolen) Embed PCK aanvinken

Standaard maakt Godot **twee bestanden**: een `.exe` en een `.pck`. Beiden zijn nodig om het spel te starten. Handiger is om ze samen te voegen tot één enkel `.exe`.

1. Klap in het preset-paneel **Binary Format** open.
2. Vink **Embed PCK** aan.

Nu krijg je straks één bestand dat je kunt versturen.

## Stap 5: Exporteren

1. Klik onderaan het export-venster op **Export Project...**
2. Kies een **lege map** om naartoe te exporteren (maak er bijvoorbeeld eentje aan met de naam `mijn-game-exe`).
3. Geef het bestand een naam, bijvoorbeeld `mijn-game.exe`.
4. **Belangrijk:** vink **Export With Debug** UIT — die optie is voor jezelf tijdens ontwikkeling, niet voor de echte versie.
5. Klik op **Save**.

Godot verwerkt nu je project. Bij grote spellen kan dat een halve minuut duren.

## Stap 6: Test je .exe

1. Open de map waar je naartoe geëxporteerd hebt.
2. Dubbelklik op `mijn-game.exe`.

Je spel opent — buiten Godot om, op zichzelf. Het eerste inlever-bestand is klaar.

## Stap 7: Je project als .zip inpakken

De `.exe` laat het spel draaien, maar je docent kan er niet *in* kijken. Voor de broncode (je scenes en scripts) lever je daarnaast een `.zip` van je hele projectmap in.

1. Open in Godot het **FileSystem**-paneel (linksonder).
2. Rechtermuisknop op `res://` (de bovenste regel — dat is je projectmap).
3. Kies **Open in File Manager**.
4. De Windows-bestandsverkenner (Explorer) opent. Je ziet nu een lijst met alle losse bestanden uit je project: `project.godot`, `world.tscn`, je scripts, je `assets`-map, een verborgen `.godot`-map enzovoort. Je staat dus **ín** de projectmap, niet erbóven.

   Dat is een probleem als je nu zou zippen: Windows pakt dan al die losse bestanden in een zip zonder de projectmap als "envelop". Pakt je docent zo'n zip uit, dan vallen alle bestanden los in de map waarin hij uitpakt — geen herkenbaar projectmapje meer.

   **Daarom: ga één niveau omhoog.** Drie manieren die allemaal werken:

   - Klik linksboven in Explorer op de **pijl-omhoog (↑)** in de werkbalk, naast vooruit/achteruit.
   - Druk op **Backspace** op je toetsenbord.
   - Klik bovenin in de **adresbalk** op de mapnaam die vóór je projectmap staat (bijvoorbeeld `Documents`).

   Je ziet nu je projectmap als één pictogram tussen eventuele andere mappen.

5. Rechtermuisknop **op de projectmap zelf** (niet op de witte ruimte ernaast!) → **Verzenden naar → Gecomprimeerde (zipped) map**.
6. Naast je projectmap verschijnt `mijn-project.zip` (Windows neemt de naam van je projectmap over).

:::tip
Wil je controleren of je zip klopt? Pak hem ergens anders uit (bijvoorbeeld op je bureaublad) en open de uitgepakte `project.godot` opnieuw in Godot. Werkt dat, dan zit alles erin en kun je de zip met een gerust hart inleveren.
:::

## Opdracht: lever je game in

Lever bij je docent **beide** bestanden in:

- `mijn-game.exe` (uit Stap 5) — om mee te spelen.
- `mijn-project.zip` (uit Stap 7) — om de broncode te bekijken.

<details>
<summary>Klik hier voor een tip!</summary>

- Zet beide bestanden in dezelfde map en lever die map in via het systeem dat jouw docent gebruikt (Magister, Teams, Google Classroom, een gedeelde map…).
- Naamgeving helpt: gebruik je eigen naam in beide bestandsnamen, bijvoorbeeld `marten-game.exe` en `marten-project.zip`.
- Tip voor de docent: als de `.exe` op zijn pc niet wil starten, kan hij altijd de `.zip` uitpakken en het project in Godot openen.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

Heb je beide bestanden ingeleverd en kan je docent zowel het spel starten als je broncode bekijken? Dan is je inlevering compleet.

Eén waarschuwing die je docent kan zien bij het openen van de `.exe`: "Windows protected your PC". Dat is omdat je `.exe` niet officieel ondertekend is — niet erg voor een schoolproject. Klik op **More info** → **Run anyway**.

</details>

## Er gaat iets mis

<details>
<summary>"No export template found" / rode waarschuwing in het export-venster</summary>

**Oorzaak:** De Export Templates zijn nog niet geïnstalleerd of passen niet bij je Godot-versie.

**Oplossing:**

1. Ga naar **Editor → Manage Export Templates**.
2. Klik op **Download and Install**.
3. Wacht tot de download klaar is en probeer opnieuw.

</details>

<details>
<summary>De .exe start, maar het scherm blijft zwart</summary>

**Oorzaak:** Er is geen **Main Scene** ingesteld, dus Godot weet niet welke scène hij moet openen.

**Oplossing:** **Project → Project Settings → Run → Main Scene**. Kies je startscène (vaak `world.tscn` of `menu.tscn`) en exporteer opnieuw.

</details>

<details>
<summary>Windows / antivirus blokkeert mijn .exe</summary>

**Oorzaak:** Windows en sommige virusscanners blokkeren standaard onbekende `.exe`-bestanden ("Windows protected your PC").

**Oplossing:** Klik op **More info** → **Run anyway**. Voor Microsoft Defender kun je je map als veilig toevoegen. Voor echte distributie naar het grote publiek heb je een code-signing-certificaat nodig — dat valt buiten deze cursus.

</details>

<details>
<summary>Mijn .exe werkt op mijn pc maar niet bij een vriend</summary>

**Oorzaak:** Vaakste oorzaak: **Embed PCK** stond uit en je vergat het `.pck`-bestand mee te sturen. Alternatief: je hebt absolute paden in je code (`C:\Users\jouwnaam\...`) die op een andere pc niet bestaan.

**Oplossing:**

1. Open opnieuw **Project → Export...** en vink **Binary Format → Embed PCK** aan. Exporteer opnieuw.
2. Controleer in je scripts dat alle paden met `res://` beginnen — nooit met een schijfletter zoals `C:\`.

</details>
