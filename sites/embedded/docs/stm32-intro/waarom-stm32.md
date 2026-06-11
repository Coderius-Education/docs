---
sidebar_position: 1
hide_table_of_contents: true
---

# 8.1 Waarom STM32?

De Arduino Uno is een prima leerbord, maar voor serieuzere projecten is hij beperkt. De **STM32** is een populaire stap omhoog: krachtiger, sneller en met veel meer mogelijkheden, terwijl een bordje als de "Blue Pill" nauwelijks duurder is.

## 8-bit versus 32-bit

De chip op de Uno is een **8-bit** microcontroller (ATmega328P). De STM32 is **32-bit** (een ARM Cortex-M). Wat betekent dat in de praktijk?

| | Arduino Uno | STM32 Blue Pill |
|:---|:---:|:---:|
| Type | 8-bit AVR | 32-bit ARM |
| Snelheid | 16 MHz | 72 MHz |
| Werkgeheugen | 2 KB | 20 KB |
| Programmageheugen | 32 KB | 64 KB |
| Analoge resolutie | 10-bit (0–1023) | 12-bit (0–4095) |
| Prijs | laag | laag |

De STM32 rekent dus veel sneller, heeft meer geheugen en meet nauwkeuriger. Hij heeft ook meer **interfaces** (meerdere UART's, I2C's en SPI's) — precies wat je in hoofdstuk 10 gaat gebruiken.

## We laten het Arduino-laagje los

Op de Arduino schreef je `digitalWrite()` en `pinMode()`. Dat zijn handige functies die de echte chip voor je verbergen. Op de STM32 doe je het nu zoals professionals het doen: met de **HAL** (*Hardware Abstraction Layer*), de officiële bibliotheek van de chipfabrikant ST.

Waarom die stap? Omdat je dan precies ziet en bepaalt wat de chip doet: welke klok aan moet, hoe een pin is ingesteld, hoe een interface werkt. Je krijgt meer controle en je begrijpt veel beter wat er onder de motorkap gebeurt. In het laatste hoofdstuk ga je nóg een laag dieper en bestuur je de chip rechtstreeks via zijn **registers**.

Het is even wennen — HAL is wat uitgebreider dan `digitalWrite()` — maar elke stap is logisch, en je doet het stap voor stap.

## Wat verandert er?

Een paar dingen zijn anders dan bij de Arduino, en daar gaan de volgende hoofdstukken over:

- **HAL in plaats van `digitalWrite()`.** Je gebruikt functies als `HAL_GPIO_WritePin()`. Eerst zet je altijd de **klok** naar een onderdeel aan; dat is de stap die de Arduino voor je verborg.
- **Pin-namen.** De STM32 werkt met poorten en pinnen: `GPIOC` met `GPIO_PIN_13` in plaats van `13`.
- **Spanning.** De STM32 werkt op **3,3 volt**, niet 5 volt. Sluit er geen 5V-signalen zomaar op aan.
- **Uploaden.** Je hebt meestal een aparte programmer nodig (een ST-Link). Daarover gaat les 8.3.

In de volgende les bekijk je het bord zelf: de Blue Pill.
