---
sidebar_position: 3
hide_table_of_contents: true
---

# 5.3 Code

Met de **leaphymicropython**-bibliotheek kun je in één regel een toon afspelen.

## Voorbeeld

```python
from leaphymicropython.actuators.buzzer import set_buzzer
from time import sleep

set_buzzer(6, 128, 440)  # pin D6, halve volume, 440 Hz (een A)
sleep(1)
set_buzzer(6, 0, 440)    # stil
```

## Uitleg van `set_buzzer`

```python
set_buzzer(pin_number, pwm_value, frequency)
```

- **pin_number**: het pinnummer waar de buzzer op zit (bijvoorbeeld `6` voor `D6`).
- **pwm_value**: het volume, een getal tussen `0` en `255`. `0` is stil, `255` is keihard.
- **frequency**: de toonhoogte in Hertz. Lager = lagere toon. Hoger = hogere toon.

<details>
<summary>Opdracht: piepje van 1 seconde</summary>

Laat de buzzer op pin **D6** precies **1 seconde** een toon van 1000 Hz spelen en daarna stil zijn.

</details>

<details>
<summary>Tip</summary>

Gebruik `sleep(1)` tussen het aan- en uitzetten van de buzzer. Uitzetten doe je met `set_buzzer(6, 0, 1000)`.

</details>

<details>
<summary>Oplossing</summary>

```python
from leaphymicropython.actuators.buzzer import set_buzzer
from time import sleep

set_buzzer(6, 128, 1000)
sleep(1)
set_buzzer(6, 0, 1000)
```

</details>
