---
sidebar_position: 5
hide_table_of_contents: true
---

# 1.5 leaphymicropython installeren

Voor de sensoren en motoren gebruiken we een kant-en-klare bibliotheek: **leaphymicropython**. Die moet één keer op je microcontroller staan.

:::tip Sneller met de online editor

Gebruik je de [online editor](/editor)? Verbind met je board en klik op **Installeer Leaphy-library**. De editor zet alle bestanden automatisch in `/lib/leaphymicropython/` op de microcontroller. Hieronder staat de Thonny-werkwijze als fallback.

:::

## Stap 1: download het pakket

Download het zip-bestand: [leaphy-micropython main.zip](https://github.com/leaphy-robotics/leaphy-micropython/archive/refs/heads/main.zip).

## Stap 2: pak het uit

Pak het zip-bestand uit op je computer. Je hebt nu een map met onder andere de submap **`leaphymicropython`**.

## Stap 3: kopieer naar de microcontroller

1. Druk op de **reset-knop** op je microcontroller.
2. Maak in Thonny op de microcontroller een map aan met de naam **`lib`**.
3. Sleep de map **`leaphymicropython`** (vanaf je computer) naar de map **`lib`** op de microcontroller.

<details>
<summary>Controlevraag</summary>

Waar moet de map `leaphymicropython` precies komen te staan?

</details>

<details>
<summary>Antwoord</summary>

In de map **`lib`** op de **microcontroller** (niet op je laptop). Het pad wordt dus `lib/leaphymicropython/...`.

</details>
