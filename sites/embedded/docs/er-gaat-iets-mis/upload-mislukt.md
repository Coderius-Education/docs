---
sidebar_position: 2
hide_table_of_contents: true
---

# Upload mislukt

```
Error: libusb_open() failed / cannot connect to target / upload error
```

**Oorzaak:** Het uploaden bereikt het bord niet. Bij de **Arduino** komt dit meestal door de poort; bij de **STM32 Blue Pill** vrijwel altijd door de programmer of de BOOT-jumpers.

**Oplossing — Arduino:** Controleer dat het juiste bord en de juiste poort gekozen zijn. Zie [Poort niet gevonden](poort-niet-gevonden.md).

**Oplossing — STM32 met ST-Link:** Loop deze punten na:

1. Controleer de vier draadjes: `SWDIO`, `SWCLK`, `GND` en `3.3V` tussen ST-Link en bord.
2. Zorg dat in je `platformio.ini` staat: `upload_protocol = stlink`.
3. Werkt het niet, zet dan **BOOT0 op 1**, druk op reset, en upload opnieuw. Zet BOOT0 daarna terug op 0.

```ini
# FOUT — protocol ontbreekt of staat verkeerd
[env:bluepill]
platform = ststm32
board = bluepill_f103c8
framework = stm32cube

# GOED — protocol expliciet ingesteld
[env:bluepill]
platform = ststm32
board = bluepill_f103c8
framework = stm32cube
upload_protocol = stlink
```

Meer uitleg: [8.3 Code uploaden naar de STM32](/docs/stm32-intro/uploaden).
