---
sidebar_position: 3
hide_table_of_contents: true
---

# 8.3 Code uploaden naar de STM32

Bij de Arduino was uploaden makkelijk: kabel erin, knop indrukken, klaar. Bij de Blue Pill zijn er meerdere manieren, want het bord heeft niet standaard een USB-programmer aan boord. Je kiest er één.

## Manier 1: ST-Link (aanbevolen)

Een **ST-Link** is een klein USB-stickje dat je tussen je computer en de Blue Pill zet. Het is de betrouwbaarste en meest gebruikte methode.

Je verbindt vier draadjes tussen de ST-Link en het bord:

| ST-Link | Blue Pill |
|:---:|:---:|
| `SWDIO` | `SWDIO` (DIO) |
| `SWCLK` | `SWCLK` (CLK) |
| `GND` | `GND` |
| `3.3V` | `3.3` |

In je `platformio.ini` zet je:

```ini
upload_protocol = stlink
```

Daarna werkt **Upload** in PlatformIO precies zoals bij de Arduino.

## Manier 2: USB-naar-serieel

Heb je geen ST-Link maar wel een **USB-naar-serieel-adapter** (een "FTDI"-tje)? Dan kun je via de ingebouwde bootloader uploaden. Hiervoor zet je **BOOT0 op 1**, drukt op reset, uploadt, en zet BOOT0 weer terug op 0.

```ini
upload_protocol = serial
```

Dit werkt, maar is omslachtiger omdat je telkens de jumper moet verzetten.

## Manier 3: USB (DFU)

Sommige Blue Pills kun je rechtstreeks via de USB-poort programmeren met **DFU**, maar dat vereist soms een aangepaste bootloader. Voor beginners is de ST-Link de minste moeite.

:::tip
Twijfel je? Koop een goedkope ST-Link erbij. Het scheelt veel frustratie, en je kunt er ook mee **debuggen** (stap voor stap door je code lopen) — iets wat de Arduino IDE niet kan.
:::

Lukt het uploaden niet, kijk dan bij [Upload mislukt](/docs/er-gaat-iets-mis/upload-mislukt). In de volgende les zet je je eerste echte programma op de Blue Pill.
