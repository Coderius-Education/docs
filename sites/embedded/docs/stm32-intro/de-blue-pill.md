---
sidebar_position: 2
hide_table_of_contents: true
---

# 8.2 De Blue Pill

De **Blue Pill** is een klein, goedkoop STM32-bordje met een STM32F103C8-chip. Het is wereldwijd het bekendste oefenbord om STM32 te leren. Net als de Arduino heeft het pinnen langs de randen.

## De pinnen

De pinnen van de STM32 zijn gegroepeerd in **poorten**, met een letter en een nummer:

- **`PA0` t/m `PA15`** — poort A.
- **`PB0` t/m `PB15`** — poort B.
- **`PC13`, `PC14`, `PC15`** — poort C (maar een paar pinnen beschikbaar).

Zo betekent `PC13`: poort C, pin 13. Vrijwel elke pin kan digitale in- of uitgang zijn; veel pinnen kunnen ook analoog of een interface (zoals I2C of SPI).

## De ingebouwde LED

Net als de Arduino heeft de Blue Pill een ingebouwde LED, verbonden met **`PC13`**. Maar let op: die LED is **omgekeerd** bedraad. `LOW` zet hem aan, `HIGH` zet hem uit. Dat is even wennen.

## De voeding: 3,3 volt

Dit is het belangrijkste verschil met de Arduino. De Blue Pill werkt op **3,3 volt**. De meeste pinnen kunnen geen 5 volt verdragen.

:::caution
Sluit geen 5V-signaal rechtstreeks op een STM32-pin aan; je kunt de chip beschadigen. Sensoren en modules die op 3,3 V werken kun je direct aansluiten. Voor 5V-onderdelen heb je een **levelshifter** nodig.
:::

## De jumpers en BOOT0

Op het bord zitten twee kleine pinnetjes met gele jumpers: **BOOT0** en BOOT1. Die bepalen hoe het bord opstart. Voor normaal gebruik staat BOOT0 op `0`. Bij sommige uploadmethoden zet je BOOT0 tijdelijk op `1`. Daarover gaat de volgende les: uploaden.

## Het echte verhaal van de naam

De Blue Pill is een goedkoop kloonbord. Daardoor verschillen exemplaren soms (bijvoorbeeld in een verkeerd geplaatste weerstand). Werkt iets niet meteen, dan ligt het soms aan het bord, niet aan jou. Een officieel **Nucleo**-bord van ST is duurder maar betrouwbaarder en heeft een ingebouwde programmer.
