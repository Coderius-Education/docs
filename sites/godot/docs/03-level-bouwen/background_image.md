---
sidebar_position: 1
hide_table_of_contents: true
slug: /background_image
---

# Achtergrond

Tijd om je lege scène iets minder grijs te maken. In deze les zet je een achtergrondafbeelding op je scherm die zich aanpast aan elk schermformaat.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

:::note
Heb je de assets nog niet gedownload? Volg eerst de stappen op [Bestanden downloaden](../02-editor-leren-kennen/bestanden-downloaden.md).
:::

## Voorspel: `Sprite2D` of `TextureRect`?

Godot heeft twee nodes om een afbeelding te tonen: `Sprite2D` en `TextureRect`. **Welke denk je dat handiger is voor een achtergrond?**

<details>
<summary>Antwoord</summary>

`TextureRect`. Het verschil:

- `Sprite2D` is een gewone 2D-afbeelding met een vaste grootte. Je moet hem handmatig schalen — en als je later het schermformaat verandert, schaalt hij niet mee.
- `TextureRect` is een **UI-node** (Control). Hij heeft ingebouwde *anchors* en *stretch modes*: in één klik zeg je "vul het hele scherm" en het past zich automatisch aan als het venster groter of kleiner wordt.

Voor een statische achtergrond is `TextureRect` de logische keuze.

</details>

## Stap 1: Voeg een `TextureRect` toe

1. Klik met rechts op de root-node van je scène → **Add Child Node**.
2. Zoek naar `TextureRect` en voeg deze toe.
3. Sleep hem in de Scene Tree **bovenaan**, boven al je andere nodes. Godot tekent van boven naar beneden, dus wat bovenaan staat in de tree komt onderaan in beeld — precies wat je wilt voor een achtergrond.

## Wat zie je nu in de viewport?

Selecteer de `TextureRect` in de Scene Tree en kijk goed naar de viewport. Een paar lijnen en symbolen zijn belangrijk om te herkennen:

- **Roze stippelrand** — dat is de rand van je **canvas**, het zichtbare game-scherm. Wat erbuiten valt, zie je straks niet als je het spel start.
- **Blauwe selectierechthoek met hoek-handgrepen** — dat is je geselecteerde `TextureRect` met sleeppunten om de grootte te wijzigen.
- **Vier kleine driehoekjes** in de hoeken van de selectie — dat zijn de **anchor-punten**. Die bepalen aan welke rand van het scherm de TextureRect blijft "vastzitten" als het scherm van grootte verandert. Daarover meer in Stap 3.

## Bewegen in de viewport

Voordat je verder gaat: leer rondkijken in de editor-viewport.

- **Inzoomen / uitzoomen** — draai aan het scrollwiel, of gebruik `Ctrl + scroll` voor fijnere stappen.
- **Verschuiven (pannen)** — houd de **middelmuisknop** ingedrukt en sleep. Geen middelmuisknop? Houd `Spatie` ingedrukt en sleep met de linkermuisknop.
- **Terug naar het canvas** — druk `F` (Frame Selected) met een node geselecteerd, of klik op het home-icoontje boven de viewport.

:::tip
Raak je je `TextureRect` kwijt buiten beeld? Selecteer hem in de Scene Tree en druk `F` — Godot springt terug naar de juiste plek.
:::

## Stap 2: Stel de afbeelding in

1. Selecteer de `TextureRect`.
2. Sleep `Green.png` (of een andere achtergrond uit je `Background`-map) naar de eigenschap **Texture** in de Inspector.

De afbeelding verschijnt in de hoek, meestal piepklein. Dat lossen we in de volgende stap op.

## Stap 3: Laat de afbeelding het scherm vullen

In de Inspector onder **Layout** (of via het ankerpunten-knopje boven de viewport):

1. Klik op **Anchors Preset** → kies **Full Rect** (het icoontje met de vier hoeken).
2. De `TextureRect` vult nu de hele scène.

Wil je dat de afbeelding netjes schaalt zonder vervorming?

1. Zet **Expand Mode** op `Ignore Size`.
2. Zet **Stretch Mode** op `Keep Aspect Covered` — de afbeelding vult het scherm en behoudt de verhoudingen, eventueel met een klein stukje aan de rand dat wegvalt.

| Stretch Mode          | Wat doet het?                                                   |
| :-------------------: | :-------------------------------------------------------------- |
| `Stretch`             | Trekt de afbeelding uit; mogelijk vervormd                      |
| `Keep Aspect`         | Behoudt verhoudingen; laat zwarte randen toe                    |
| `Keep Aspect Covered` | Behoudt verhoudingen; vult het scherm, snijdt randen weg        |
| `Tile`                | Herhaalt de afbeelding als tegels                               |

Voor een pixel-art achtergrond werkt **Keep Aspect Covered** meestal het beste.

## Er gaat iets mis

<details>
<summary>Mijn afbeelding ziet er wazig uit / pixel art is niet scherp</summary>

**Oorzaak:** Godot gebruikt standaard een blur-filter (lineaire filtering). Pixel art wordt daardoor vloeiend uitgesmeerd in plaats van scherp.

**Oplossing:**

1. Ga naar **Project** → **Project Settings**.
2. Typ `default_texture_filter` in de zoekbalk bovenin het venster (sneller dan zelf zoeken in de boom).
3. Verander de waarde van `Linear` naar `Nearest`.

Vanaf nu worden alle afbeeldingen in je project scherp weergegeven.

</details>
