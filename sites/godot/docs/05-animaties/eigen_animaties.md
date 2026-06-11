---
sidebar_position: 3
hide_table_of_contents: true
slug: /eigen_animaties
---

# Je eigen animaties maken

Tot nu toe heb je gewerkt met kant-en-klare sprite-sheets uit het Pixel Adventure-pack. Tijd om dat los te laten en je eigen personage te animeren — uit een eigen tekening, een geknipte GIF of een afbeelding die je ergens vond. In deze les leer je hoe je losse frames maakt, ze transparant achtergrondje geeft en in Godot zet.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: wat heb je nodig om je eigen animatie te maken?

**Drie ingrediënten zijn nodig. Welke denk je?**

<details>
<summary>Antwoord</summary>

1. **Losse PNG-frames** — één afbeelding per pose (bijv. 6 frames voor een loop-cyclus).
2. **Transparante achtergrond** op elke PNG (anders zit er een witte rechthoek achter je karakter).
3. **Invoeren in Godot** — sleep ze in de SpriteFrames-editor uit [Animaties aanmaken](./animaties.md).

</details>

## Stap 1: Verzamel je frames

Drie aanpakken, kies wat past:

### Aanpak A — Screenshots uit een sprite-sheet

Heb je een sprite-sheet (één afbeelding met meerdere poses naast elkaar) maar Godot herkent de frames niet automatisch? Knip ze handmatig:

1. Open de afbeelding in je standaard fotoviewer of in een browser-tab.
2. Zoom voldoende in zodat één frame goed zichtbaar is.
3. Druk op `Win + Shift + S` → **Rechthoekige selectie** → trek een vierkant strak rond één frame.
4. Plak het screenshot in een nieuwe afbeelding (Paint, Photopea, Piskel…) en sla op als `frame_01.png`.
5. Herhaal voor elke frame met **dezelfde uitsnijding-grootte** (anders schalen je frames straks niet gelijk in Godot).

:::tip
Werk altijd met een **vast canvas-formaat** (bijv. 32×32 of 64×64 pixels). Plak elk screenshot in een nieuw frame van datzelfde canvas in Piskel of LibreSprite — zo blijven alle frames identiek.
:::

### Aanpak B — Eigen frames tekenen in een pixel-art tool

Wil je een volledig eigen karakter tekenen?

1. Open [Piskel](https://www.piskelapp.com/), LibreSprite of Pixilart.
2. Maak een nieuw canvas (bijv. 32×32 of 64×64 pixels — kies hetzelfde formaat als je andere sprites).
3. Teken je idle-pose. Klik op **Add new frame** en teken de volgende fase. Herhaal tot je 4-8 frames hebt.
4. Exporteer als losse PNG's **of** als sprite-sheet — beide werkt in Godot.

### Aanpak C — Frames knippen uit een GIF

Heb je een animatie als GIF (bijvoorbeeld uit een tutorial of YouTube)?

1. Ga naar [ezgif.com/split](https://ezgif.com/split).
2. Upload je GIF.
3. Klik op **Split to frames!** en daarna op **Download frames as ZIP**.
4. Je krijgt elke frame als losse PNG.

## Stap 2: Maak de achtergrond transparant

Zonder transparantie zit er straks een witte (of een andere) rechthoek achter je karakter in Godot. **Een PNG kan transparantie bevatten via het zogeheten alpha-kanaal** — pixels zijn dan letterlijk doorzichtig.

### Drie manieren

**Manier 1 — Piskel of LibreSprite** (aanbevolen voor pixel-art)

- Open je PNG → menu **File → Import**.
- Bij het importeren wordt de witte achtergrond standaard transparant gemaakt zodra je hem aanklikt.
- Exporteer terug als PNG via **Export → PNG**.

**Manier 2 — Photopea** (browser-based Photoshop-alternatief)

1. Ga naar [photopea.com](https://www.photopea.com/) → **File → Open** → kies je PNG.
2. Klik op de witte achtergrond met de **Magic Wand**-tool (toverstaf).
3. Druk op **Delete** — de witte achtergrond verdwijnt, je ziet een schaakbord (= transparant).
4. **File → Export As → PNG**.

**Manier 3 — GIMP** (open-source, lokaal)

1. Open je PNG → **Layer → Transparency → Add Alpha Channel**.
2. **Select → By Color** → klik op de witte achtergrond.
3. Druk **Delete**.
4. **File → Export As → `.png`**.

:::tip
Sommige downloads (vooral van itch.io of opengameart.org) hebben **al** een transparante achtergrond. Test eerst: sleep je PNG in Godot en kijk of er een rechthoek omheen zit. Geen rechthoek = al transparant, sla Stap 2 over.
:::

## Stap 3: Importeer in Godot

1. Sleep je losse PNG's naar de `assets/`-map in je FileSystem-paneel.
2. Open de SpriteFrames-editor (zie [Animaties aanmaken](./animaties.md) voor de stappen).
3. Klik op een animatie (bijv. `idle`) en sleep je frames één voor één in het frame-paneel, **in de juiste volgorde**.
4. Zet de **FPS** op 8 of 10, zet **Loop** aan voor doorlopende animaties (idle, run) of uit voor eenmalige (jump).
5. Speel af via je script (zie [Animaties in code](./animaties_code.md)).

## Handige open-source tools

| Tool | Wat doet het? | Waar? |
|---|---|---|
| [Piskel](https://www.piskelapp.com/) | Pixel-art en animaties tekenen, GIF-export | Browser (gratis, open-source) |
| [LibreSprite](https://libresprite.github.io/) | Open-source fork van Aseprite, desktop | Windows/Mac/Linux |
| [GIMP](https://www.gimp.org/) | Beeldbewerking, transparantie | Desktop (alle platforms) |
| [Photopea](https://www.photopea.com/) | Photoshop-alternatief in de browser | Browser (gratis) |
| [ezgif.com](https://ezgif.com/) | GIF naar losse PNG-frames omzetten | Browser |
| [Pixilart](https://www.pixilart.com/) | Pixel-art tekenen in de browser | Browser (gratis) |

## Er gaat iets mis

<details>
<summary>Mijn frames hebben verschillende formaten en springen tijdens de animatie</summary>

**Oorzaak:** Bij screenshots heb je per frame een iets andere uitsnijding gemaakt.

**Oplossing:** Werk met een **vast canvas** in Piskel of LibreSprite (bijv. 32×32 pixels). Plak elk screenshot in een nieuw frame van datzelfde canvas. Zo houden alle frames identiek formaat en springt de animatie niet.

</details>

<details>
<summary>Mijn karakter heeft nog een witte rechthoek omheen in Godot</summary>

**Oorzaak:** De PNG heeft geen alpha-kanaal (transparantie).

**Oplossing:** Doorloop Stap 2 met Photopea of GIMP. Test daarna opnieuw door de PNG in Godot te slepen — geen rechthoek meer = klaar.

</details>

<details>
<summary>De animatie speelt af, maar de richtingen kloppen niet</summary>

**Oorzaak:** Frames staan in de verkeerde volgorde in SpriteFrames.

**Oplossing:** Sleep de frames in de juiste volgorde in het frame-paneel. Bij twijfel: speel af op **2 FPS** om elke frame te kunnen zien, sleep daarna in de juiste volgorde, en zet FPS terug op 8-10.

</details>

<details>
<summary>Mijn karakter is wazig / pixel-art ziet er niet scherp uit</summary>

**Oorzaak:** Godot gebruikt standaard een blur-filter (lineaire filtering). Pixel-art wordt daardoor vloeiend uitgesmeerd in plaats van scherp.

**Oplossing:**

1. Ga naar **Project → Project Settings**.
2. Typ `default_texture_filter` in de zoekbalk bovenin.
3. Verander de waarde van `Linear` naar `Nearest`.

Vanaf nu worden alle afbeeldingen in je project scherp weergegeven.

</details>
