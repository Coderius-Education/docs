---
sidebar_position: 1
hide_table_of_contents: true
slug: /sprite
---

# Een speelbaar karakter

Tijd voor een speler. In deze les bouw je je karakter op uit drie nodes die samen één geheel vormen: een lichaam dat kan bewegen en botsen, een sprite die je ziet, en een collision-vorm zodat de physics weet waar het karakter ophoudt.

:::info[Godot 4.5]
Geschreven voor **Godot 4.5.x** — zie [Godot-versies](/docs/godot-versies) voor compatibiliteit.
:::

## Voorspel: waarom drie nodes?

Waarom denk je dat we het karakter niet in één node stoppen, maar opbouwen uit drie?

<details>
<summary>Antwoord</summary>

Elke node doet één ding goed. `CharacterBody2D` regelt beweging en physics; `Sprite2D` regelt hoe het karakter eruitziet; `CollisionShape2D` regelt waar het karakter botst. Wil je later de afbeelding wisselen of een groter hitbox-blokje? Dan pas je alleen die node aan — de rest blijft staan.

</details>

## Stap 1: Voeg een `CharacterBody2D` toe

`CharacterBody2D` is de basis van een speelbaar 2D-karakter. Hij ondersteunt beweging, zwaartekracht en botsingen met andere physics-objecten (zoals je tegels).

1. Klik met rechts in de Scene Tree → **Add Child Node**.
2. Zoek naar `CharacterBody2D` en voeg hem toe.

## Stap 2: Voeg een `Sprite2D` toe als child

Een `Sprite2D` is een platte 2D-afbeelding. We hangen hem onder de `CharacterBody2D` zodat hij mee beweegt.

1. Klik met rechts op de `CharacterBody2D` → **Add Child Node**.
2. Voeg een `Sprite2D` toe.
3. Selecteer de `Sprite2D` en sleep je karakter-afbeelding naar het **Texture**-veld in de Inspector.

## Stap 3: Voeg een `CollisionShape2D` toe als child

Zonder collision-vorm weet Godot niet waar je karakter eindigt en zakt hij door alles heen.

1. Klik met rechts op de `CharacterBody2D` → **Add Child Node**.
2. Voeg een `CollisionShape2D` toe.
3. Selecteer hem en kies bij **Shape** in de Inspector een `RectangleShape2D`.
4. Pas de grootte aan zodat de rechthoek netjes om je karakter-afbeelding past.

Je Scene Tree ziet er nu zo uit:

```
CharacterBody2D
├── Sprite2D
└── CollisionShape2D
```

In de volgende les voegen we beweging toe.

## Er gaat iets mis

<details>
<summary>Mijn karakter valt door de vloer</summary>

**Oorzaak:** De `CollisionShape2D` ontbreekt of is niet goed ingesteld, of je tiles hebben nog geen collision.

**Oplossing:**

1. Controleer of je `CharacterBody2D` een `CollisionShape2D` als child heeft.
2. Controleer of die `CollisionShape2D` een **Shape** heeft ingesteld (bijvoorbeeld `RectangleShape2D`).
3. Controleer of je `TileMapLayer` een **Physics Layer** heeft — zie [Collision op je tegels](../03-level-bouwen/tilemap_collision.md).

</details>

<details>
<summary>Ik zie mijn karakter niet in het scherm</summary>

**Oorzaak:** De `Sprite2D` heeft geen texture, of het karakter staat buiten het zichtbare gebied.

**Oplossing:**

- Selecteer de `Sprite2D` en sleep een afbeelding naar het **Texture**-veld in de Inspector.
- Klik op je `CharacterBody2D` en sleep hem in de viewport naar het midden.

</details>

<details>
<summary>Ik krijg een waarschuwing bij CollisionShape2D</summary>

**Oorzaak:** De `CollisionShape2D` heeft nog geen shape.

**Oplossing:**

- Selecteer de `CollisionShape2D`.
- Klik in de Inspector op het **Shape**-veld.
- Kies `New RectangleShape2D`.

</details>
