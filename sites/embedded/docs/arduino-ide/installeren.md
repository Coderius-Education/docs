---
sidebar_position: 1
hide_table_of_contents: true
---

# 2.1 De Arduino IDE installeren

Om een Arduino te programmeren heb je een programma nodig dat jouw code omzet naar iets wat de microcontroller begrijpt, en het daarna op het bord zet. Het standaardprogramma daarvoor is de **Arduino IDE** (IDE staat voor *Integrated Development Environment*: een werkplek waarin je schrijft, controleert en uploadt).

:::tip
Wil je alleen in de simulator werken? Dan kun je dit hoofdstuk overslaan en direct door naar [2.2 Je eerste blink](je-eerste-blink.mdx). Je hebt de Arduino IDE alleen nodig voor een echt bord.
:::

## Stap 1: Downloaden

Ga naar [arduino.cc/en/software](https://www.arduino.cc/en/software) en download de **Arduino IDE** voor jouw besturingssysteem (Windows, macOS of Linux). Installeer het zoals elk ander programma.

## Stap 2: Je bord aansluiten

Sluit de Arduino Uno met de USB-kabel aan op je computer. Op het bord gaat een groen lampje (`ON`) branden.

## Stap 3: Het juiste bord kiezen

In de Arduino IDE kies je bovenaan welk bord je gebruikt en op welke poort het is aangesloten:

1. Klik op het keuzemenu bovenin.
2. Kies **Arduino Uno**.
3. Kies de **poort** waarop je bord staat (op Windows iets als `COM3`, op macOS iets als `/dev/cu.usbmodem…`).

Zie je geen poort? Dan herkent je computer het bord nog niet. Lees [Poort niet gevonden](/docs/er-gaat-iets-mis/poort-niet-gevonden).

## Stap 4: Een sketch

Een Arduino-programma heet een **sketch**. Een nieuwe sketch is al bijna leeg en bevat twee blokken: `setup()` en `loop()`. Wat die doen, ontdek je in de volgende les — waar je meteen je eerste LED laat knipperen.
