---
sidebar_position: 2
hide_table_of_contents: true
---

# 12.2 Lijnvolgen in MicroPython

Hieronder staat een werkende basis. De `if`-takken voor links en rechts bijsturen zijn nog leeg — die ga je zelf invullen.

## Voorbeeld

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from time import sleep

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

a0 = AnalogIR("A0", 2500)  # linker sensor
a1 = AnalogIR("A1", 2500)  # rechter sensor

while True:
    left = a0.black_or_white()
    right = a1.black_or_white()

    if left == 'white' and right == 'white':
        motor_a.forward(255)
        motor_b.forward(255)
    if left == 'white' and right == 'black':
        # links bijsturen
        motor_a.forward(255)
        motor_b.forward(255)
    if left == 'black' and right == 'white':
        # rechts bijsturen
        motor_a.forward(255)
        motor_b.forward(255)
    sleep(0.01)
```

## Uitleg

- Eerst lees je beide sensoren uit (`left` en `right`).
- Daarna kijk je met `if`-statements naar de vier mogelijke combinaties.
- Bij **beide wit** rijden beide motoren vol vooruit.
- Bij de overige gevallen moet je zelf bedenken welke motor je **lager** zet om bij te sturen.

<details>
<summary>Opdracht: vul de bijsturing in</summary>

Verander de snelheden bij `links bijsturen` en `rechts bijsturen` zodat de robot daadwerkelijk de lijn volgt.

</details>

<details>
<summary>Tip</summary>

Als de linkersensor wit ziet en de rechter zwart, is de robot naar rechts afgedwaald. Stuur naar links: motor_a (links) lager, motor_b (rechts) op 255. Maar pas op: welke motor links en welke rechts zit, hangt af van hoe je de motoren hebt aangesloten. Test eerst met `motor_a.test()`.

</details>

<details>
<summary>Oplossing (één mogelijkheid)</summary>

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from time import sleep

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

a0 = AnalogIR("A0", 2500)
a1 = AnalogIR("A1", 2500)

while True:
    left = a0.black_or_white()
    right = a1.black_or_white()

    if left == 'white' and right == 'white':
        motor_a.forward(255)
        motor_b.forward(255)
    if left == 'white' and right == 'black':
        motor_a.forward(255)
        motor_b.forward(150)  # rechter motor zachter
    if left == 'black' and right == 'white':
        motor_a.forward(150)  # linker motor zachter
        motor_b.forward(255)
    sleep(0.01)
```

Welke motor je zachter zet hangt af van jouw bedrading. Test en pas aan tot het werkt.

</details>
