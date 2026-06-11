---
sidebar_position: 4
hide_table_of_contents: true
hide_title: true
title: TOF met OLED
---

# TOF-waardes op het OLED-scherm

Tot nu toe print je de afstand in de **Shell**. Maar zodra je auto los van de laptop rijdt, kun je dat niet meer zien. Tijd om het op je OLED-scherm te tonen.

## Uitdaging

Combineer de code uit:

- [9.4 Twee of meer TOFs met multiplexer](/docs/Microcontrollers/Arduino%20Nano%20RP2040%20Connect/Tutorial-TOF/wiring_code_2_met_mux)
- [15.2 OLED-scherm aansluiten en code](/docs/Microcontrollers/Arduino%20Nano%20RP2040%20Connect/Tutorial-oled-scherm/code_met_mux)

Laat de afstand van elke TOF op een eigen regel op het OLED-scherm verschijnen.

<details>
<summary>Tip</summary>

Je hebt al iets vergelijkbaars gedaan voor de IR-sensoren in `lego_auto/debuggen_met_scherm/debuggen_met_schermpje.md`. Kijk daar voor inspiratie. Vergeet niet `oled.fill("white")` aan het begin van elke loop en `oled.show()` aan het einde.

</details>

<details>
<summary>Oplossing</summary>

```python
from time import sleep
from leaphymicropython.sensors.tof import TimeOfFlight
from leaphymicropython.actuators.oled_screen import OLEDSH1106

tof_0 = TimeOfFlight(channel=0)
tof_7 = TimeOfFlight(channel=7)
oled = OLEDSH1106(width=128, height=64, channel=6)  # pas channel aan

while True:
    afstand_0 = tof_0.get_distance()
    afstand_7 = tof_7.get_distance()

    oled.fill("white")
    oled.text('TOF 0: ' + str(afstand_0), x=0, y=0)
    oled.text('TOF 7: ' + str(afstand_7), x=0, y=10)
    oled.show()
    sleep(0.1)
```

</details>
