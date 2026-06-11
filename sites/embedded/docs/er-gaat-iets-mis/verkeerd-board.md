---
sidebar_position: 6
hide_table_of_contents: true
---

# Verkeerd board in platformio.ini

```
De code bouwt en uploadt, maar het bord doet niets of gedraagt zich vreemd.
```

**Oorzaak:** Het `board` in je `platformio.ini` komt niet overeen met je echte bord. PlatformIO bouwt dan voor de verkeerde chip: pinnen kloppen niet, snelheden kloppen niet, en soms gebeurt er helemaal niets.

**Oplossing:** Controleer dat `platform`, `board` en `framework` bij je echte bord horen.

```ini
# FOUT — Uno-instellingen, maar er hangt een Blue Pill aan
[env:bord]
platform = atmelavr
board = uno
framework = arduino

# GOED — instellingen voor de Blue Pill (HAL)
[env:bluepill]
platform = ststm32
board = bluepill_f103c8
framework = stm32cube
upload_protocol = stlink
```

**Let op:** ook het `framework` verschilt. De Uno gebruikt `arduino`; voor de STM32 in deze cursus gebruik je `stm32cube` (HAL). Zet je daar per ongeluk `arduino`, dan zijn de HAL-functies niet beschikbaar en compileert je code niet.

Meer uitleg: [7.4 platformio.ini uitgelegd](/docs/platformio/platformio-ini-uitgelegd).
