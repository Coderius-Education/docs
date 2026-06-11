---
sidebar_position: 1
---

# Praktisch

Deze cursus is zo opgezet dat je leerlingen volledig in de browser kunnen werken (via de Wokwi-simulator) of met echte hardware. Hieronder staat wat je nodig hebt en wat het ongeveer kost.

## Volledig zonder hardware

Elke Arduino-les heeft een **Start Simulator**-knop. Leerlingen kunnen daarmee alle Arduino-opdrachten maken zonder bordje, breadboard of kabel. Voor een eerste kennismaking of bij een grote klas is dit de eenvoudigste route: alleen een browser nodig.

De STM32-hoofdstukken zijn deels simuleerbaar (Blue Pill in Wokwi), maar de interfaces en het HAL-hoofdstuk komen het best tot hun recht op echte hardware.

## Met hardware

Voor een klassikale set per leerling of per tweetal:

| Onderdeel | Aantal | Indicatie |
|:---|:---:|:---|
| Arduino Uno (of kloon) | 1 | laag |
| USB-kabel type B | 1 | laag |
| Breadboard + draadjes | 1 set | laag |
| LED's, weerstanden (220 Ω), knoppen | handvol | zeer laag |
| Potentiometer | 1–2 | zeer laag |
| STM32 Blue Pill | 1 | laag |
| ST-Link programmer | 1 (mag gedeeld) | laag |

De ST-Link kan gedeeld worden tussen groepjes: hij is alleen nodig op het moment van uploaden.

## Software

- **Arduino IDE** (gratis) voor het eerste deel.
- **VS Code + PlatformIO** (gratis) vanaf hoofdstuk 7.

Beide draaien op Windows, macOS en Linux. Op schoollaptops met beperkte rechten kan installatie lastig zijn; overweeg dan het simulator-spoor of een vooraf ingerichte image.

## Veelvoorkomende struikelblokken

- **Goedkope klonen** kunnen een CH340-driver nodig hebben (zie [Poort niet gevonden](/docs/er-gaat-iets-mis/poort-niet-gevonden)).
- **3,3 V versus 5 V**: laat leerlingen bij de STM32 nooit 5V-onderdelen rechtstreeks aansluiten.
- **De omgekeerde Blue Pill-LED** (`LOW` = aan) verwart leerlingen voorspelbaar; benoem het vooraf.
