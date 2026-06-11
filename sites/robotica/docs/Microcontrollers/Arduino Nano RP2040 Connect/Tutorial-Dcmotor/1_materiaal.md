---
sidebar_position: 1
hide_table_of_contents: true
---

# 13.1 Materiaal

DC-motoren zijn de wielmotoren van je robot. Ze hebben veel stroom nodig, dus we sturen ze niet rechtstreeks vanaf de microcontroller aan, maar via een **motor shield**.

Wat heb je nodig?

1. [Arduino Nano RP2040 Connect](https://docs.arduino.cc/hardware/nano-rp2040-connect/)
2. Leaphy Murphy Shield
3. Motor Module voor het Leaphy Murphy Shield
4. **2x** DC-motor (TT-motor)

## Leaphy Murphy Shield

![Leaphy Murphy shield](leaphy_murphy_shield.jpeg)

## Motor Module voor Leaphy Murphy Shield

![Motor module](motor_module_voor_leaphy_murphy_shield.jpeg)

## TT-motor

![DCmotor](tt_motor.jpg)

<details>
<summary>Controlevraag</summary>

Waarom heb je een motor shield nodig en kun je de motoren niet rechtstreeks op de Nano aansluiten?

</details>

<details>
<summary>Antwoord</summary>

DC-motoren trekken veel meer **stroom** dan de pinnen van de microcontroller kunnen leveren. Het shield haalt die stroom uit de batterij en stuurt hem onder controle naar de motoren.

</details>
