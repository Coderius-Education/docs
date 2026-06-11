---
sidebar_position: 2
hide_table_of_contents: true
---

# 1.2 De Arduino Uno

De Arduino Uno is een klein blauw bordje met een microcontroller erop (de zwarte chip in het midden, een ATmega328P). Eromheen zitten allemaal aansluitingen — **pinnen** — waarmee je de buitenwereld aansluit.

## De belangrijkste pinnen

Je hoeft niet alle pinnen uit je hoofd te kennen. Dit zijn de groepen die je het vaakst gebruikt:

- **Digitale pinnen (0–13):** aan of uit. Hier sluit je LED's, knoppen en veel sensoren op aan. De pinnen met een `~` (3, 5, 6, 9, 10, 11) kunnen ook **PWM** — daarover later meer.
- **Analoge pinnen (A0–A5):** lezen een spanning in als getal, bijvoorbeeld van een draaiknop of lichtsensor.
- **Voeding:** `5V` en `3.3V` leveren stroom, `GND` is de min (de "aarde"). Vrijwel elk onderdeel sluit je aan tussen een voedingspin en een `GND`-pin.
- **USB:** hiermee laad je je programma op het bord én geef je het stroom.

## De ingebouwde LED

Er zit al een LED op het bord, vast verbonden met **pin 13**. Handig: daarmee kun je je allereerste programma testen zonder ook maar één draadje aan te sluiten. Dat doe je in het volgende hoofdstuk.

:::note
Een LED gaat snel kapot bij te veel stroom. De ingebouwde LED op pin 13 is al beschermd. Sluit je later zelf een LED aan, dan heb je een **weerstand** nodig — dat leer je in [3.1 Een externe LED](/docs/digitale-io/externe-led).
:::

## Echt bord of simulator?

Heb je een Arduino Uno? Mooi. Heb je er geen? Ook prima: in deze cursus kun je elk Arduino-voorbeeld in de browser simuleren. Wat je daarvoor nodig hebt, lees je in [1.3 Wat heb je nodig?](wat-heb-je-nodig.md).
