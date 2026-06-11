---
sidebar_position: 5
hide_table_of_contents: true
title: Nu jij!
---

# Nu jij!

Je robot rijdt rechtdoor zolang beide sensoren wit zien. Maar zodra hij afdwaalt, komt de lijn onder één van de sensoren — en dan gebeurt er nog niets. **Aan jou de taak** om het bijsturen toe te voegen, zodat de robot de lijn echt blijft volgen.

## De opdracht

Breid de code van stap 3 uit met **twee extra gevallen**:

1. **Linkersensor ziet zwart, rechter wit** → de lijn ligt links. Stuur bij.
2. **Linkersensor ziet wit, rechter zwart** → de lijn ligt rechts. Stuur bij.

Gebruik hiervoor `elif`. De vuistregel: zet de motor aan de kant van de **sensor die de lijn ziet** wat **zachter**, dan draait de robot precies die kant op — terug naar de lijn.

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106
from time import sleep

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

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
    elif kleur_links == "black" and kleur_rechts == "white":
        # TODO: welke motor zet je zachter?
        pass
    elif kleur_links == "white" and kleur_rechts == "black":
        # TODO: en hier de andere kant op
        pass

    sleep(0.01)
```

Vervang elke `# TODO` en de `pass` door de juiste `motor_a.forward(...)` en `motor_b.forward(...)`. Het scherm laat ondertussen zien wat de sensoren meten — handig om te controleren of je robot het goede geval kiest.

:::tip Python opfrissen
Je hebt hier vooral `elif` en vergelijkingen nodig:
- [`and` / `or` / `elif`](https://python.coderius.nl/docs/beslissen/05c-and-or-elif)
- [if / else](https://python.coderius.nl/docs/beslissen/05b-if-else)

Meer oefenen met `while` en `if` op sensoren? Bekijk [Code beter begrijpen](../analoog_ir/while_loop.md).
:::

<details>
<summary>Tip — ik kom er niet uit</summary>

- Ziet de **linkersensor** de lijn (`black`)? Zet dan `motor_a` (links) bijvoorbeeld op `150` en `motor_b` (rechts) op `255`.
- Ziet de **rechtersensor** de lijn? Dan precies andersom.
- Draait je robot de verkeerde kant op? Dan zit je bedrading gespiegeld — wissel `motor_a` en `motor_b` om, of test eerst met `motor_a.test()`.

</details>

<details>
<summary>Afstellen</summary>

Werkt het, maar niet soepel?

- **Slingert** hij hard heen en weer? Maak het verschil kleiner (bijvoorbeeld `200` in plaats van `150`).
- **Reageert** hij te traag in de bocht? Maak het verschil juist groter.

</details>

## Extra uitdaging

Wat doet je robot als **beide** sensoren tegelijk zwart zien? Dat is meestal een **kruising**. Voeg zelf een extra `elif` toe en bedenk wat er dan moet gebeuren: stoppen, rechtdoor, of een kant op draaien.
