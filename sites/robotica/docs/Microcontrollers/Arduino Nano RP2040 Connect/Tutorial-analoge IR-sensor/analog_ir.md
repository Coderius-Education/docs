---
sidebar_position: 2
hide_table_of_contents: true
---

# 11.2 Eén analoge IR-sensor uitlezen

## Aansluiten

![1 analog ir met shield](@site/static/fritzing/analog_ir_shield_bb.png)

Sluit de IR-sensor aan op pin **A0** van het Leaphy Murphy Shield.

## Code

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

a0 = AnalogIR("A0", 2500)

while True:
    a0_ir = a0.get_analog_value()
    a0_color = a0.black_or_white()

    print(a0_ir, a0_color)
    sleep(0.01)
```

## Uitleg

```python
a0 = AnalogIR("A0", 2500)
```

- `"A0"` is de pin waar de sensor op zit.
- `2500` is de **drempelwaarde**. Alles **boven** 2500 noemt de sensor `"black"`, daaronder `"white"`.

```python
a0.get_analog_value()
```

Geeft het ruwe getal terug (tussen 0 en 65535).

```python
a0.black_or_white()
```

Geeft `"black"` of `"white"` op basis van de drempelwaarde.

<details>
<summary>Opdracht: drempel kalibreren</summary>

Houd de sensor boven wit papier en boven zwart papier. Kies een drempelwaarde die precies tussen die twee in ligt en pas `2500` aan.

</details>

<details>
<summary>Tip</summary>

Schrijf de twee getallen op en neem het midden. Bijvoorbeeld: wit = 800, zwart = 5000 → drempel = 2900.

</details>
