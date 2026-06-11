---
sidebar_position: 2
hide_table_of_contents: true
title: Stap 1 — Eén sensor uitlezen
---

# Stap 1 — Eén sensor uitlezen

Voordat je gaat sturen, wil je eerst zien **wat een sensor ziet**. We beginnen klein: met één IR-sensor die steeds opnieuw vertelt of hij **zwart** of **wit** ziet.

Straks rijdt je robot los van de laptop, dus je kunt de Shell niet meer zien. Daarom tonen we de waarde meteen op het **OLED-scherm** dat je in het vorige hoofdstuk hebt aangesloten.

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.oled_screen import OLEDSH1106
from time import sleep

links = AnalogIR("A0", 2500)                       # linker sensor op pin A0
oled = OLEDSH1106(width=128, height=64, channel=7)  # scherm op channel 7

while True:
    kleur = links.black_or_white()
    oled.fill('white')
    oled.text('Links: ' + kleur, 0, 0)
    oled.show()
    sleep(0.2)
```

- `AnalogIR("A0", 2500)` maakt de sensor aan op pin **A0**.
- `black_or_white()` geeft `'black'` of `'white'` terug. Dat bewaren we in de **variabele** `kleur`.
- Het scherm vul je elke ronde opnieuw: eerst leegmaken met `oled.fill('white')`, dan tekst klaarzetten met `oled.text(...)`, en tonen met `oled.show()`.

Beweeg de sensor boven een witte ondergrond en boven een zwarte lijn. Verandert de tekst op het scherm mee?

:::tip Python opfrissen
Snap je de bouwstenen van deze stap nog niet helemaal? Lees:
- [Variabelen](https://python.coderius.nl/docs/basis/jij-als-variabele)
- [While-loop](https://python.coderius.nl/docs/herhalen/while-loop)
:::

<details>
<summary>Controlevraag</summary>

Wat gebeurt er als je de regel `oled.show()` weglaat?

</details>

<details>
<summary>Antwoord</summary>

Dan blijft het scherm leeg. `oled.text(...)` zet de tekst alleen klaar; pas `oled.show()` stuurt alles echt naar het scherm.

</details>
