---
sidebar_position: 2
hide_table_of_contents: true
slug: /scene
---

# Je eerste 2D-scène

Een scène in Godot is één "bouwsteen" van je game: een level, een speler, een muntje. Voor je begint moet je beslissen of je een **2D-game** of een **3D-game** maakt. Godot ondersteunt allebei, maar de aanpak is totaal anders.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: waarom 2D?

**Waarom denk je dat we in deze cursus 2D kiezen en geen 3D?** Probeer minstens twee redenen te bedenken voordat je verder leest.

<details>
<summary>Antwoord</summary>

1. **Minder concepten tegelijk.** 3D voegt een Z-as toe, plus camera-perspectief, belichting, materialen en 3D-modellen. Dat zijn allemaal onderwerpen *bovenop* de basis.
2. **Snel zichtbaar resultaat.** Met platte afbeeldingen (sprites) ben je in een paar minuten klaar; voor 3D moet je eerst modellen maken of vinden.

3D komt later vanzelf in beeld als je deze basis beheerst.

</details>

## 2D of 3D?

|              |               2D                |                  3D                  |
| :----------- | :-----------------------------: | :----------------------------------: |
| Voorbeelden  | Mario, Stardew Valley, Hollow Knight | Minecraft, Fortnite, Super Mario Odyssey |
| Wat zie je?  | Platte afbeeldingen (sprites)   | Modellen met diepte (meshes)         |
| Moeilijkheid | Toegankelijker voor beginners   | Veel meer concepten tegelijk         |
| Root-node    | `Node2D`                        | `Node3D`                             |
| Coördinaten  | X, Y                            | X, Y, Z                              |

Wij maken een **2D platformer**, dus we kiezen 2D. De hoofdnode van onze scène wordt daarom een `Node2D`.

## Stap 1: Een 2D-scène aanmaken

1. Klik bovenaan op **Scene** → **New Scene** (of op het `+`-tabblad boven de viewport).
2. Kies in het keuzemenu **2D Scene**.

Godot maakt automatisch een `Node2D` aan als root-node. Dit is de basis van je 2D-wereld en je ziet hem linksboven in de **Scene Tree** verschijnen.

## Stap 2: Opslaan als `world.tscn`

Druk op `Ctrl + S` en geef de scène de naam `world.tscn`.

De `.tscn`-extensie staat voor "text scene" — Godot slaat je scène op als een tekstbestand in je projectmap. Dat is handig als je later met Git werkt: je kunt zien wat er veranderd is.

:::tip
Krijg je bij het eerste keer starten de vraag welke scène als **Main Scene** moet dienen? Kies `world.tscn` — dat is de scène die start zodra je op ▶ klikt.
:::

## Er gaat iets mis

<details>
<summary>Ik zie een foutmelding over een lege scène als ik het spel start</summary>

**Oorzaak:** Godot weet niet welke scène als startscène moet worden geladen.

**Oplossing:**

1. Ga naar **Project** → **Project Settings**.
2. Typ `main scene` in de zoekbalk bovenin (sneller dan zelf zoeken). Of: ga naar het tabblad **General** en zoek onder Application → Run.
3. Klik op het mapje en selecteer `world.tscn`.

</details>

<details>
<summary>Ik kan mijn scène niet opslaan / de naam verandert niet</summary>

**Oorzaak:** Je hebt nog niet `Ctrl + S` gebruikt, of de scène heeft nog geen naam gekregen.

**Oplossing:**

- Druk op `Ctrl + S`.
- Typ `world` als bestandsnaam.
- Klik op **Save**.

</details>
