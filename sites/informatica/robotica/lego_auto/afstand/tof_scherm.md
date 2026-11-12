---
sidebar_position: 5
slug: /afstand/op-het-scherm
title: De afstand op het scherm
---

# De afstand op het scherm

De afstand staat nu in de Shell, maar je robot rijdt los van de laptop. Je weet inmiddels precies hoe je dat oplost — dus dit is een opdracht, geen uitleg.

## Opdracht 11.5.a: toon de afstand op het OLED-scherm

Combineer wat je hebt: de TOF-uitlezing uit de [vorige stap](site:robotica/lego_auto/afstand/uitlezen) en het scherm uit je robotscript ([Deel 5](site:robotica/lego_auto/scherm/waardes-op-scherm)). Laat de afstand elke ronde op het scherm verschijnen.

<details>
<summary>Klik hier voor een tip.</summary>

Zelfde drieslag als altijd: `fill`, `text`, `show`. De afstand is een getal, dus zet hem in een [f-string](site:python/docs/tekst/04a-f-strings) voordat hij het scherm op kan. De TOF zit op channel **0**, je scherm op channel **7** — twee objecten, elk met hun eigen channel.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
from time import sleep
from leaphymicropython.sensors.tof import TimeOfFlight
from leaphymicropython.actuators.oled_screen import OLEDSH1106

tof = TimeOfFlight(
    channel=0,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)
oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)

while True:
    afstand = tof.get_distance()

    oled.fill('white')
    oled.text(f'Afstand: {afstand}', 0, 0)
    oled.show()
    sleep(0.1)
```

</details>

## Verder bouwen

In het volgende deel laat je je **lijnvolger stoppen** zodra de TOF een obstakel dichterbij dan 10 cm ziet: [Deel 10](site:robotica/lego_auto/afstand/stoppen).

Wil je de afstand van verder weg kunnen lezen? Zet hem dan groot op het scherm met `scale`, zie [grotere tekst](site:robotica/docs/onderdelen/oled-scherm#grotere-tekst).

Wil je daarna nog meer? **Meer TOF-sensoren** aansluiten kan via de andere channels van de multiplexer; hoe dat werkt staat bij Onderdelen, onder [twee TOF-sensoren met multiplexer](site:robotica/docs/onderdelen/tof#twee-met-mux).

---

← [De afstand uitlezen](site:robotica/lego_auto/afstand/uitlezen) · **Volgende:** [Deel 10 — Stoppen voor een obstakel](site:robotica/lego_auto/afstand/stoppen) →
