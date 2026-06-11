---
sidebar_position: 4
hide_table_of_contents: true
title: Stap 3 — Rechtdoor rijden
---

# Stap 3 — Rechtdoor rijden

Nu laat je de motoren **reageren** op wat de sensoren zien. We beginnen met het makkelijkste geval: **beide sensoren zien wit**, dus de lijn zit netjes tussen de sensoren in. Dan moet de robot gewoon **rechtdoor**. Het scherm laat je intussen zien wat de sensoren meten.

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106
from time import sleep

motoren = DCMotors()
motor_a = motoren.motor_a  # linker motor
motor_b = motoren.motor_b  # rechter motor

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(width=128, height=64, channel=7)

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text('Links: ' + kleur_links, 0, 0)
    oled.text('Rechts: ' + kleur_rechts, 0, 10)
    oled.show()

    if kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(255)
        motor_b.forward(255)

    sleep(0.01)
```

- Je voegt de **motoren** toe met `DCMotors()`.
- Met `if` stel je een **voorwaarde**: alleen *als* beide sensoren wit zien, rijden beide motoren vol vooruit.
- `==` betekent "is gelijk aan" en `and` betekent "allebei moeten waar zijn".

Zet de robot op de baan met de lijn tussen de sensoren. Rijdt hij rechtdoor?

:::tip Python opfrissen
Deze stap draait om beslissen. Lees na wat je nodig hebt:
- [Booleans & vergelijken (`==`)](https://python.coderius.nl/docs/beslissen/05a-booleans-en-vergelijken)
- [if / else](https://python.coderius.nl/docs/beslissen/05b-if-else)
- [`and` / `or` / `elif`](https://python.coderius.nl/docs/beslissen/05c-and-or-elif)
:::

<details>
<summary>Controlevraag</summary>

Wat doet de robot in deze code zodra één van de sensoren **zwart** ziet?

</details>

<details>
<summary>Antwoord</summary>

Niets nieuws: er is nog maar één `if`-tak (beide wit). Bij zwart klopt de voorwaarde niet, dus de motoren houden hun laatste snelheid. Het **bijsturen** ga je in de volgende stap zelf maken.

</details>
