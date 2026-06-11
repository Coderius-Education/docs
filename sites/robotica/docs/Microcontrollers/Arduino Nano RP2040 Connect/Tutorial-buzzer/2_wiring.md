---
sidebar_position: 2
hide_table_of_contents: true
---

# 5.2 Aansluiten

![buzzer_pinnen](doc_buzzer_uitleg.png)

## Pinnen van de buzzer

- **GND** (lange pin): de min
- **Digital (+)** (korte pin): hier komt het stuursignaal binnen

## Aansluiten op de Nano RP2040 Connect

- **GND** van de buzzer aan een **GND**-pin van het bord
- **Digital (+)** van de buzzer aan een digitale pin naar keuze, bijvoorbeeld **D6**

<details>
<summary>Controlevraag</summary>

Mag je de `+`-pin van de buzzer rechtstreeks aan `3.3V` aansluiten?

</details>

<details>
<summary>Antwoord</summary>

Nee. De buzzer moet aan een **digitale pin** zitten, zodat je hem vanuit je code aan en uit kunt zetten. Aan `3.3V` zou hij continu aan staan.

</details>
