---
sidebar_position: 1
slug: /interface
---

# De Godot-interface

Open je project. Je belandt in de editor: een venster vol panelen, knoppen en tabbladen. Op deze pagina leer je hoe de panelen heten en waar ze staan. Wat ze precies doen, ervaar je vanzelf in de volgende lessen.

<GodotVersie />

## Voorspel: waar staan de nodes?

Kijk goed naar het scherm voordat je verder leest. **Waar denk je dat je de lijst met alle nodes (de Scene Tree) vindt — links, rechts, midden of onderin?**

<details>
<summary>Antwoord</summary>

De **Scene Tree** staat **linksboven**. Dat past bij hoe je leest: van links naar rechts, van boven naar beneden. Eerst kies je een node (links), daarna pas je hem aan in de Inspector (rechts).

</details>

## De layout

```
┌─────────────────────────────────────────────────────┐
│                   Toolbar (▶ Stop ⚙)                │
├──────────────┬──────────────────────┬────────────────┤
│              │                      │                │
│    Scene     │      Viewport        │   Inspector    │
│   (links)    │     (midden)         │   (rechts)     │
│              │                      │                │
├──────────────┴──────────────────────┴────────────────┤
│              FileSystem (linksonder)                 │
│              Uitvoer (onderin)                       │
└─────────────────────────────────────────────────────┘
```

- **Viewport** (midden) — je gamewereld; hier zie je wat je bouwt.
- **Scene Tree** (linksboven) — alle nodes in je huidige scène.
- **Inspector** (rechtsboven) — eigenschappen van de geselecteerde node.
- **FileSystem** (linksonder) — alle bestanden in je project.
- **Uitvoer** (onderin) — foutmeldingen en `print()`-output. Vanaf [Start GDScript](../04-personage-en-beweging/start_gdscript.md) ga je hier vaak naartoe.

## Het spel starten en stoppen \{#spel-starten}

|     Actie     |       Knop       | Sneltoets         |
| :-----------: | :--------------: | :---------------- |
| Spel starten  | ▶ (rechtsboven) | `F5`              |
| Spel stoppen  | ■ (rechtsboven) | `F8` of `Escape`  |

## Opdracht 2.1.a: sloop de layout en herstel hem

Panelen kun je verslepen, en vroeg of laat doe je dat per ongeluk. Doe het nu een keer expres, dan weet je hoe je het terugdraait.

1. Pak het tabblad van de **Inspector** (rechtsboven) en sleep het naar een andere plek, bijvoorbeeld naast het FileSystem-paneel.
2. Zet de layout daarna weer terug zoals hij was.

<details>
<summary>Klik hier voor een tip.</summary>

Terugslepen hoeft niet — er is een menu-optie die de hele indeling in één keer herstelt. Kijk in het **Editor**-menu bovenaan.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Ga naar **Editor** → **Editor Layout** → **Default**. Alle panelen springen terug naar de standaardindeling.

Deze route komt nog vaak van pas: ziet je editor er ooit "kapot" uit, dan is dit vrijwel altijd de oplossing.

</details>

## Er gaat iets mis

<details>
<summary>Ik zie een grijs scherm / de editor laadt niet volledig</summary>

**Oorzaak:** Het project is nog niet correct geïmporteerd, of Godot heeft nog niet alle bestanden verwerkt.

**Oplossing:**

- Wacht even — Godot importeert bestanden op de achtergrond bij de eerste keer openen.
- Duurt het lang? Sluit Godot, open het opnieuw en wacht tot de statusbalk onderin klaar is.

</details>

<details>
<summary>Ik zie de Scene Tree of Inspector niet</summary>

**Oorzaak:** Een paneel is per ongeluk gesloten of verschoven.

**Oplossing:** Ga naar **Editor** → **Editor Layout** → **Default**. Dit herstelt de standaardindeling.

</details>
