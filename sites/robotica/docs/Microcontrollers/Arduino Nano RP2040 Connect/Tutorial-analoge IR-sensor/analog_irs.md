---
sidebar_position: 3
hide_table_of_contents: true
---

# 11.3 Twee analoge IR-sensoren uitlezen

Met twee IR-sensoren kun je een **lijn volgen**: één links en één rechts van de lijn.

## Aansluiten

![2 analog ir met shield](@site/static/fritzing/analog_irs_shield_bb.png)

- Sensor 1 op **A0**
- Sensor 2 op **A1**

## Code

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

a0 = AnalogIR("A0", 2500)
a1 = AnalogIR("A1", 2500)

while True:
    a0_ir = a0.get_analog_value()
    a0_color = a0.black_or_white()

    a1_ir = a1.get_analog_value()
    a1_color = a1.black_or_white()

    print(a0_ir, a0_color, "|", a1_ir, a1_color)
    sleep(0.01)
```

## Uitleg

Voor elke sensor maak je een eigen `AnalogIR`-object met de juiste pin. De methodes (`get_analog_value()` en `black_or_white()`) werken precies hetzelfde.

<details>
<summary>Opdracht: welke sensor is links?</summary>

Houd alleen de linkersensor boven een zwarte lijn. Welke waarde wordt zwart? `a0` of `a1`? Noteer dit, dan weet je later welke sensor links zit.

</details>

<details>
<summary>Tip</summary>

Print eerst de waardes en beweeg dan rustig één sensor over een zwarte streep. De sensor waarvan de waarde stijgt is de sensor die je beweegt.

</details>
