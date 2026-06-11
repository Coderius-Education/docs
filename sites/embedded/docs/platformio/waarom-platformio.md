---
sidebar_position: 1
hide_table_of_contents: true
---

# 7.1 Waarom PlatformIO?

De Arduino IDE is perfect om te beginnen. Maar zodra je projecten groter worden, of je met een ander bord dan de Arduino wilt werken (zoals straks de STM32), loop je tegen de grenzen aan. Dan stap je over op **PlatformIO**.

## Waar de Arduino IDE tekortschiet

- **Eén bord per keer.** De Arduino IDE is gebouwd rond Arduino-borden. Een STM32 erbij krijgen is omslachtig.
- **Beperkte editor.** Geen slimme autoaanvulling, geen "spring naar functie", weinig overzicht in grote projecten.
- **Libraries handmatig.** Je beheert bibliotheken met de hand, en wisselt iemand anders van computer, dan moet die ze opnieuw zoeken.

## Wat PlatformIO toevoegt

PlatformIO is een uitbreiding voor **VS Code**, een professionele code-editor. Het geeft je:

- **Veel borden** uit één omgeving: Arduino, STM32, ESP32 en honderden andere.
- **Eén instellingenbestand** (`platformio.ini`) dat precies vastlegt welk bord, welk framework en welke libraries je gebruikt. Iedereen met dat bestand bouwt exact hetzelfde project.
- **Een echte editor** met autoaanvulling, foutmarkering en snel zoeken.
- **Automatisch libraries downloaden** op basis van je `platformio.ini`.

## Hetzelfde, maar netter

Belangrijk: je hoeft niets nieuws te leren over de taal. Je schrijft nog steeds `setup()` en `loop()` met dezelfde functies. PlatformIO verandert alleen je **werkomgeving**, niet je code. In de volgende les installeer je het.
