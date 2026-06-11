---
sidebar_position: 3
hide_table_of_contents: true
title: Stap 2 — Twee sensoren tegelijk
---

# Stap 2 — Twee sensoren tegelijk

Eén sensor is niet genoeg om een lijn te volgen: je wilt weten of de robot **links** of **rechts** afdwaalt. Daarom lees je nu **twee** sensoren tegelijk uit en zet je beide op het scherm.

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.oled_screen import OLEDSH1106
from time import sleep

links = AnalogIR("A0", 2500)   # linker sensor op pin A0
rechts = AnalogIR("A1", 2500)  # rechter sensor op pin A1
oled = OLEDSH1106(width=128, height=64, channel=7)

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text('Links: ' + kleur_links, 0, 0)
    oled.text('Rechts: ' + kleur_rechts, 0, 10)
    oled.show()
    sleep(0.2)
```

- Je maakt een **tweede** sensor aan op pin **A1**.
- In de loop bewaar je beide metingen in een eigen variabele: `kleur_links` en `kleur_rechts`.
- Je zet ze op **twee regels** onder elkaar: `y=0` voor de bovenste, `y=10` voor de regel eronder.

Leg de robot zo neer dat de lijn **tussen** de twee sensoren door loopt. Zie je twee keer `white`? Schuif hem dan naar links en rechts en kijk welke sensor `black` gaat zien.

:::tip Python opfrissen
Twee metingen, twee variabelen. Twijfel je hoe variabelen werken?
- [Variabelen](https://python.coderius.nl/docs/basis/jij-als-variabele)
:::

<details>
<summary>Controlevraag</summary>

De lijn loopt netjes tussen de sensoren door. Wat zie je dan op het scherm?

</details>

<details>
<summary>Antwoord</summary>

`Links: white` en `Rechts: white` — beide sensoren zien de witte ondergrond, want de zwarte lijn zit er precies tussenin.

</details>
