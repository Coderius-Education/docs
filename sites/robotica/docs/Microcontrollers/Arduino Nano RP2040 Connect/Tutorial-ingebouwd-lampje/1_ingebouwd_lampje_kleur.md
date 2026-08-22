---
sidebar_position: 3
---

# 2.3 Een kleur kiezen

Naast het gewone lampje zit er ook een **RGB-lampje** op het bord. Daarmee kun je kiezen of het rood, groen of blauw oplicht via drie speciale pinnen: `LED_RED`, `LED_GREEN` en `LED_BLUE`.

## Code

Het script is je knipperscript uit [2.2](2_knipperen.md), met twee verschillen: een andere pinnaam, en `value()` in plaats van `on()` en `off()`. Kies zelf een van de drie kleurnamen:

```python
from machine import Pin
from time import sleep

kleur_pin = Pin('LED_RED', Pin.OUT)

while True:
    kleur_pin.value(0)
    sleep(1)
    kleur_pin.value(1)
    sleep(1)
```

## Let op: 0 is aan, 1 is uit

`value()` is een methode waar je een getal aan meegeeft. Bij de ingebouwde RGB-LED zit het omgedraaid:

- `.value(0)` zet het lampje **aan**
- `.value(1)` zet het lampje **uit**

<details>
<summary>Tip</summary>

Verander `'LED_RED'` in `'LED_BLUE'` of `'LED_GREEN'` om een andere kleur te krijgen.

</details>

<details>
<summary>Opdracht: meerdere kleuren tegelijk</summary>

Kun je rood en blauw allebei tegelijk aan zetten? Welke kleur krijg je dan?

</details>

<details>
<summary>Oplossing</summary>

```python
from machine import Pin

rood = Pin('LED_RED', Pin.OUT)
blauw = Pin('LED_BLUE', Pin.OUT)

rood.value(0)
blauw.value(0)
```

Rood en blauw samen geeft **paars/magenta**. Probeer ook rood + groen (geel) en groen + blauw (cyaan).

</details>
