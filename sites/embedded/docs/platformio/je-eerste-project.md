---
sidebar_position: 3
hide_table_of_contents: true
---

# 7.3 Je eerste PlatformIO-project

Je gaat dezelfde blink maken als in hoofdstuk 2, maar nu in PlatformIO. Zo zie je het verschil tussen de twee omgevingen, met code die je al kent.

## Stap 1: Een nieuw project

1. Open **PIO Home** en klik op **New Project**.
2. Geef het een naam, bijvoorbeeld `blink-uno`.
3. Kies bij **Board**: *Arduino Uno*.
4. Kies bij **Framework**: *Arduino*.
5. Klik op **Finish**.

PlatformIO maakt nu een mapstructuur aan.

## De mapstructuur

Een PlatformIO-project is meer dan één bestand:

```
blink-uno/
├── platformio.ini     ← instellingen van het project
├── src/
│   └── main.cpp        ← hier schrijf je je code
├── lib/                ← eigen libraries
└── include/            ← eigen headerbestanden
```

Je code komt in **`src/main.cpp`**. Anders dan in de Arduino IDE moet je hier zelf bovenaan `#include <Arduino.h>` zetten — dat regelde de Arduino IDE stiekem voor je.

## Stap 2: De code

Open `src/main.cpp` en zet er dit in:

```cpp
#include <Arduino.h>

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
```

`LED_BUILTIN` is een nettere naam voor "de ingebouwde LED" — op de Uno is dat pin 13. Het voordeel: op een ander bord wijst dezelfde naam vanzelf naar de juiste pin.

## Stap 3: Bouwen en uploaden

Onderin VS Code staat een werkbalk met PlatformIO-knoppen:

- **✓ (Build)** controleert en bouwt je code.
- **→ (Upload)** bouwt én zet het op je aangesloten bord.

Klik op **Upload**. Na het compileren knippert de LED op je bord.

:::info
Geen bord bij de hand? PlatformIO is bedoeld voor echte hardware en heeft geen ingebouwde simulator. Wil je toch simuleren, gebruik dan de Wokwi-blokken uit de eerdere hoofdstukken, of de Wokwi-uitbreiding voor VS Code.
:::

In de volgende les pluizen we het `platformio.ini`-bestand uit: dat is de sleutel tot werken met andere borden zoals de STM32.
