---
sidebar_position: 5
slug: /afstand/op-het-scherm
title: De afstand op het scherm
---

# De afstand op het scherm

De afstand staat nu in de Shell, maar je robot rijdt los van de laptop. Je weet inmiddels precies hoe je dat oplost — dus dit is een opdracht, geen uitleg.

## Opdracht 11.5.a: toon de afstand op het OLED-scherm

Combineer wat je hebt: de TOF-uitlezing uit de [vorige stap](./uitlezen.md) en het scherm uit je robotscript ([Deel 5](../debuggen_met_scherm/deel5_scherm.md)). Laat de afstand elke ronde op het scherm verschijnen.

<details>
<summary>Klik hier voor een tip.</summary>

Zelfde drieslag als altijd: `fill`, `text`, `show`. De afstand is een getal, dus zet hem in een f-string voordat hij het scherm op kan. De TOF zit op channel **0**, je scherm op channel **7** — twee objecten, elk met hun eigen channel.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
from time import sleep
from leaphymicropython.sensors.tof import TimeOfFlight
from leaphymicropython.actuators.oled_screen import OLEDSH1106

tof = TimeOfFlight(channel=0)
oled = OLEDSH1106(width=128, height=64, channel=7)

while True:
    afstand = tof.get_distance()

    oled.fill('white')
    oled.text(f'Afstand: {afstand}', 0, 0)
    oled.show()
    sleep(0.1)
```

</details>

## Verder bouwen

Wil je meer? Twee richtingen, zonder stappenplan:

- Laat je **lijnvolger stoppen** zodra de TOF een obstakel dichterbij dan 10 cm ziet — een extra `if` in je robotscript.
- **Meer TOF-sensoren** aansluiten kan via de andere channels van de multiplexer; hoe dat werkt staat in de bibliotheek bij [twee TOF-sensoren met multiplexer](/docs/Microcontrollers/Arduino%20Nano%20RP2040%20Connect/Tutorial-TOF/wiring_code_2_met_mux).
