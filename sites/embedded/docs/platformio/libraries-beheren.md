---
sidebar_position: 5
hide_table_of_contents: true
---

# 7.5 Libraries beheren

Bijna nooit schrijf je alles zelf. Voor een schermpje, een sensor of een motoraansturing bestaat vaak al een **library**: kant-en-klare code die je gebruikt. In PlatformIO voeg je die toe via `platformio.ini`.

## lib_deps

Je zet libraries onder de regel **`lib_deps`** in je `platformio.ini`:

```ini
[env:uno]
platform = atmelavr
board = uno
framework = arduino
lib_deps =
  adafruit/Adafruit SSD1306@^2.5.7
```

Zodra je opslaat en bouwt, downloadt PlatformIO de library automatisch. Je hoeft niets met de hand te kopiëren.

## De juiste naam vinden

1. Open **PIO Home → Libraries**.
2. Zoek de library, bijvoorbeeld `SSD1306`.
3. Op de pagina van de library staat de exacte regel die je in `lib_deps` plakt.

## Het versienummer

In `adafruit/Adafruit SSD1306@^2.5.7` is `^2.5.7` de **versie**. Het `^` betekent: "deze versie of een nieuwere die ermee samenwerkt". Door een versie vast te leggen, blijft je project werken — ook als de library later verandert.

:::tip
Gebruik je in je code `#include <Adafruit_SSD1306.h>` maar krijg je een foutmelding dat het bestand niet bestaat? Dan staat de library nog niet in `lib_deps`, of is de naam verkeerd. Zie [Library niet gevonden](/docs/er-gaat-iets-mis/library-niet-gevonden).
:::

## Meerdere libraries

Meer libraries zet je gewoon onder elkaar:

```ini
lib_deps =
  adafruit/Adafruit SSD1306@^2.5.7
  adafruit/Adafruit GFX Library@^1.11.9
```

Nu je PlatformIO beheerst, ben je klaar voor een krachtiger bord. In het volgende hoofdstuk maak je kennis met de STM32.
