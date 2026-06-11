---
sidebar_position: 4
hide_table_of_contents: true
---

# Library niet gevonden

```
fatal error: Adafruit_SSD1306.h: No such file or directory
```

**Oorzaak:** Je code gebruikt een library met `#include`, maar die staat (nog) niet in je project. In PlatformIO download je libraries via `lib_deps` in `platformio.ini`.

**Oplossing:** Voeg de library toe aan `lib_deps` en sla op. PlatformIO downloadt hem dan automatisch bij de volgende build.

```ini
# FOUT — de library ontbreekt
[env:uno]
platform = atmelavr
board = uno
framework = arduino

# GOED — library toegevoegd
[env:uno]
platform = atmelavr
board = uno
framework = arduino
lib_deps =
  adafruit/Adafruit SSD1306@^2.5.7
```

Klopt de naam niet precies? Zoek de library op in **PIO Home → Libraries** en kopieer de exacte regel.

Meer uitleg: [7.5 Libraries beheren](/docs/platformio/libraries-beheren).
