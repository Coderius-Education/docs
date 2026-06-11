---
sidebar_position: 4
hide_table_of_contents: true
---

# 7.4 platformio.ini uitgelegd

Het bestand `platformio.ini` is het hart van elk PlatformIO-project. Het beschrijft welk bord je gebruikt, welk framework, en met welke instellingen. Eén bestand, en je hele project is precies vastgelegd.

## Het bestand voor de Uno

Voor je blink-project ziet het er zo uit:

```ini
[env:uno]
platform = atmelavr
board = uno
framework = arduino
monitor_speed = 9600
```

Regel voor regel:

- **`[env:uno]`** — de naam van deze omgeving (*environment*). Je mag hem zelf kiezen.
- **`platform`** — de chipfamilie van het bord. De Uno gebruikt `atmelavr`.
- **`board`** — het exacte bord. Hiermee weet PlatformIO de pinnen, snelheid en het geheugen.
- **`framework`** — de "taal-laag" waarin je schrijft. `arduino` betekent: dezelfde functies als de Arduino IDE.
- **`monitor_speed`** — de snelheid van de seriële monitor. Zet dit gelijk aan je `Serial.begin()`.

## Waarom dit zo handig is

Stel je deelt je project met een klasgenoot. Die opent het, en PlatformIO leest `platformio.ini`: het juiste bord, het juiste framework, dezelfde instellingen. Geen "bij mij werkt het wel".

En belangrijker voor deze cursus: om naar een **STM32** te wisselen verander je straks alleen deze paar regels. Je code blijft hetzelfde.

## Meerdere borden in één project

Je kunt zelfs meerdere omgevingen in één bestand zetten:

```ini
[env:uno]
platform = atmelavr
board = uno
framework = arduino

[env:bluepill]
platform = ststm32
board = bluepill_f103c8
framework = stm32cube
```

PlatformIO laat je dan kiezen voor welk bord je bouwt. Merk op dat de Blue Pill een ander `framework` gebruikt (`stm32cube`, de HAL-laag van ST) — precies dit gebruik je in [8. Overstap naar STM32](/docs/category/8-overstap-naar-stm32).
