---
sidebar_position: 3
slug: /eigen_animaties
---

# Je eigen animaties maken

Tot nu toe heb je gewerkt met kant-en-klare sprite-sheets uit het Pixel Adventure-pack. Tijd om dat los te laten en je eigen personage te animeren — uit een eigen tekening, een geknipte GIF of een afbeelding die je ergens vond. In deze les maak je de plaatjes zelf en zet je ze in Godot.

## Voorspel: een plaatje met een witte achtergrond

Je tekent een karakter op een wit vel, slaat het op als PNG en zet het in je level. **Wat zie je in je spel rond je karakter, en waarom zie je dat niet bij de sprites uit het Pixel Adventure-pack?**

<details>
<summary>Antwoord</summary>

Een witte rechthoek. Een afbeelding is altijd een rechthoek, en wit is ook een kleur. Bij de sprites uit het pack zijn de pixels rond het karakter doorzichtig. Voor een eigen animatie heb je dus drie dingen nodig:

1. **Losse PNG-frames** — één afbeelding per pose (bijv. 6 frames voor een loop-cyclus).
2. **Transparante achtergrond** op elke PNG (anders zit er een witte rechthoek achter je karakter).
3. **Invoeren in Godot** — sleep ze in de SpriteFrames-editor uit [Animaties aanmaken](site:godot/docs/animaties).

</details>

## Stap 1: Frames verzamelen

### Screenshots uit een sprite-sheet

Er zijn drie manieren om aan frames te komen, en je hebt er één nodig: screenshots uit een sprite-sheet (deze stap), zelf tekenen, of frames knippen uit een GIF (allebei in de stap Tekenen of een GIF knippen). Kies er een en ga daarna naar het tabblad Transparant maken.

Heb je een sprite-sheet (één afbeelding met meerdere poses naast elkaar) maar Godot herkent de frames niet automatisch? Knip ze handmatig:

1. Open de afbeelding in je standaard fotoviewer of in een browser-tab.
2. Zoom voldoende in zodat één frame goed zichtbaar is.
3. Maak een schermafbeelding van een deel van je scherm. Op Windows: `Win + Shift + S` → **Rechthoekige selectie**; op een Mac: `Cmd + Shift + 4`. Trek een vierkant strak rond één frame.
4. Plak het screenshot in een nieuwe afbeelding (Paint, Photopea, Piskel…) en sla op als `frame_01.png`.
5. Herhaal voor elke frame, op een canvas van steeds hetzelfde formaat (bijvoorbeeld 32×32 of 64×64 pixels). Met frames van verschillende grootte springt je animatie.

### Tekenen of een GIF knippen

#### Zelf tekenen in een pixel-art tool

Wil je een volledig eigen karakter tekenen?

1. Open [Piskel](https://www.piskelapp.com/), LibreSprite of Pixilart.
2. Maak een nieuw canvas (bijv. 32×32 of 64×64 pixels — kies hetzelfde formaat als je andere sprites).
3. Teken je idle-pose. Klik op **Add Frame** en teken de volgende fase. Herhaal tot je 4-8 frames hebt.
4. Exporteer als losse PNG's **of** als sprite-sheet — beide werkt in Godot.

#### Frames knippen uit een GIF

Heb je een animatie als GIF (bijvoorbeeld uit een tutorial of YouTube)?

1. Ga naar [ezgif.com/split](https://ezgif.com/split).
2. Upload je GIF.
3. Klik op **Split to frames.** en daarna op **Download frames as ZIP**.
4. Je krijgt elke frame als losse PNG.

## Stap 2: Transparant maken

### Eerst testen, dan Piskel

Zonder transparantie zit er straks een witte (of een andere) rechthoek achter je karakter in Godot. **Een PNG kan transparantie bevatten via het zogeheten alpha-kanaal** — pixels zijn dan letterlijk doorzichtig.

Sommige downloads (vooral van itch.io of opengameart.org) hebben **al** een transparante achtergrond. Test eerst: sleep je PNG in Godot en kijk of er een rechthoek omheen zit. Geen rechthoek? Dan is hij al transparant: sla de rest van dit tabblad over en ga naar het tabblad Importeren en tools.

Zit er wel een rechthoek omheen? Dan zijn er drie manieren om hem weg te halen: met Piskel of LibreSprite (op dit scherm), of met Photopea of GIMP (in de stap Met Photopea of GIMP). Kies er één.

#### Met Piskel of LibreSprite

Aanbevolen voor pixel-art.

- Open je PNG → menu **File → Import**.
- Bij het importeren wordt de witte achtergrond standaard transparant gemaakt zodra je hem aanklikt.
- Exporteer terug als PNG via **Export → PNG**.

### Met Photopea of GIMP

#### Met Photopea

Photopea werkt in je browser en lijkt op Photoshop.

1. Ga naar [photopea.com](https://www.photopea.com/) → **File → Open** → kies je PNG.
2. Klik op de witte achtergrond met de **Magic Wand**-tool (toverstaf).
3. Druk op **Delete** — de witte achtergrond verdwijnt, je ziet een schaakbord (= transparant).
4. **File → Export As → PNG**.

#### Met GIMP

GIMP installeer je op je eigen computer.

1. Open je PNG → **Layer → Transparency → Add Alpha Channel**.
2. **Select → By Color** → klik op de witte achtergrond.
3. Druk **Delete**.
4. **File → Export As → `.png`**.

## Stap 3: Importeren en tools

1. Sleep je losse PNG's naar de `assets/`-map in je FileSystem-paneel.
2. Open de SpriteFrames-editor (zie [Animaties aanmaken](site:godot/docs/animaties) voor de stappen).
3. Klik op een animatie (bijv. `idle`) en sleep je frames één voor één in het frame-paneel, **in de juiste volgorde**.
4. Zet de **FPS** op 8 of 10, zet **Loop** aan voor doorlopende animaties (idle, run) of uit voor eenmalige (jump).
5. Speel af via je script (zie [Animaties in code](site:godot/docs/animaties_code)).

#### Gratis tools

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

**Oplossing:** Doorloop in het tabblad Transparant maken de stap Met Photopea of GIMP. Test daarna opnieuw door de PNG in Godot te slepen — geen rechthoek meer = klaar.

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

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
