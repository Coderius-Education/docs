---
sidebar_position: 2
slug: /scene
---

# Je eerste 2D-scène

Een scène in Godot is één "bouwsteen" van je game: een level, een speler, een muntje. Voor je begint moet je beslissen of je een **2D-game** of een **3D-game** maakt. Godot ondersteunt allebei, maar de aanpak is totaal anders.

<GodotVersie />

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

## Stap 1: Een 2D-scène aanmaken \{#node2d}

1. Klik bovenaan op **Scene** → **New Scene** (of op het `+`-tabblad boven de viewport).
2. Kies in het keuzemenu **2D Scene**.

Godot maakt automatisch een `Node2D` aan als root-node. Dit is de basis van je 2D-wereld en je ziet hem linksboven in de **Scene Tree** verschijnen.

Wat een `Node2D` allemaal kan staat in de [Nodes cheatsheet](/cheatsheet#level-wereld).

## Stap 2: Opslaan als `world.tscn` \{#opslaan}

Druk op `Ctrl + S` en geef de scène de naam `world.tscn`.

De `.tscn`-extensie staat voor "text scene" — Godot slaat je scène op als een tekstbestand in je projectmap. Dat is handig als je later met <SiteLink site="editor" to="/git/">Git</SiteLink> werkt: je kunt dan per versie zien wat er veranderd is.

:::tip
Krijg je bij het eerste keer starten de vraag welke scène als **Main Scene** moet dienen? Kies `world.tscn` — dat is de scène die start zodra je op ▶ klikt.
:::

## Opdracht 2.2.a: voeg een child-node toe en hernoem hem \{#node-toevoegen}

In de komende hoofdstukken voeg je tientallen nodes toe aan je Scene Tree. Oefen die handeling nu een keer los:

1. Voeg een child-node van het type `Node2D` toe aan je root-node.
2. Hernoem hem naar `Oefening`.
3. Verwijder hem daarna weer, zodat je scène leeg blijft voor de volgende les.

<details>
<summary>Klik hier voor een tip.</summary>

Alle drie de acties zitten in het rechtermuisknop-menu op een node in de Scene Tree. Hernoemen kan ook met `F2` of door te dubbelklikken op de naam.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

1. Rechtermuisknop op `Node2D` (je root) → **Add Child Node** → zoek `Node2D` → **Create**. De nieuwe node verschijnt ingesprongen onder je root: het is een **child**.
2. Dubbelklik op de naam (of druk `F2`) en typ `Oefening`.
3. Rechtermuisknop op `Oefening` → **Delete Node(s)**, of selecteer hem en druk op `Delete`.

De naam van een node mag je zelf kiezen, maar hij bepaalt straks wél hoe je hem vanuit code aanspreekt. Daar kom je in hoofdstuk 6 achter.

</details>

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
