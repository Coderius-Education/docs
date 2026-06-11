---
sidebar_position: 3
hide_table_of_contents: true
---

# 6.3 Code

Met de leaphymicropython-bibliotheek heb je één klasse: **`RGBLed`**.

## Voorbeeld

```python
from time import sleep
from leaphymicropython.actuators.rgbled import RGBLed

led = RGBLed(9, 10, 11)

while True:
    led.set_color(255, 0, 0)  # rood
    sleep(1)
    led.set_color(0, 0, 0)    # uit
    sleep(1)
```

## Uitleg

```python
led = RGBLed(9, 10, 11)
```

De getallen zijn de pinnen voor **rood, groen, blauw**: hier `D9`, `D10` en `D11`.

```python
led.set_color(red, green, blue)
```

Elke kleurwaarde ligt tussen **0** (uit) en **255** (maximaal). Door te mengen krijg je alle kleuren:

- `(255, 0, 0)` = rood
- `(0, 255, 0)` = groen
- `(0, 0, 255)` = blauw
- `(255, 255, 0)` = geel
- `(255, 255, 255)` = wit
- `(0, 0, 0)` = uit

<details>
<summary>Opdracht: regenboog</summary>

Laat de LED achter elkaar rood, geel, groen, cyaan, blauw en paars laten zien, elk 1 seconde.

</details>

<details>
<summary>Oplossing</summary>

```python
from time import sleep
from leaphymicropython.actuators.rgbled import RGBLed

led = RGBLed(9, 10, 11)

kleuren = [
    (255, 0, 0),    # rood
    (255, 255, 0),  # geel
    (0, 255, 0),    # groen
    (0, 255, 255),  # cyaan
    (0, 0, 255),    # blauw
    (255, 0, 255),  # paars
]

while True:
    for r, g, b in kleuren:
        led.set_color(r, g, b)
        sleep(1)
```

</details>
