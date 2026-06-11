---
sidebar_position: 4
hide_table_of_contents: true
---

# 13.4 De motoren aansturen

## Motor A testen

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motor_a = motoren.motor_a
motor_a.test()
```

Motor A draait kort vooruit en daarna kort achteruit. Zo weet je meteen welke motor `motor_a` is.

## Motor B testen

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motor_b = motoren.motor_b
motor_b.test()
```

## Uitleg

- `DCMotors()` maakt een nieuw motor-object voor het shield.
- `motoren.motor_a` en `motoren.motor_b` zijn de twee uitgangen op het shield (de letters A en B staan op het shield zelf gedrukt).
- `.test()` doet kort vooruit + achteruit, handig om te kijken welke draait.

## Vooruit en achteruit

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motor_b = motoren.motor_b
motor_b.forward(255)
```

`forward()` en `backward()` krijgen een snelheid mee tussen **0** en **255**.

:::caution Onder de 200 beweegt vaak niets

Vanwege het gewicht van je robot beginnen de motoren pas rond **180–200** te draaien. Daaronder probeert de motor het wel (het LED'je op het shield knippert), maar de wielen blijven staan.

:::

<details>
<summary>Voorbeeld: maximaal achteruit met motor B</summary>

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motor_b = motoren.motor_b
motor_b.backward(255)
```

</details>

<details>
<summary>Opdracht: rij 2 seconden vooruit</summary>

Laat beide motoren 2 seconden vooruit rijden en daarna stoppen.

</details>

<details>
<summary>Oplossing</summary>

```python
from leaphymicropython.actuators.dcmotor import DCMotors
from time import sleep

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

motor_a.forward(255)
motor_b.forward(255)
sleep(2)
motor_a.forward(0)
motor_b.forward(0)
```

</details>
