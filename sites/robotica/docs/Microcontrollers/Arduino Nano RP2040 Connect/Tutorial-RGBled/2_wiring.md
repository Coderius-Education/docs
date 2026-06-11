---
sidebar_position: 2
hide_table_of_contents: true
---

# 6.2 Aansluiten

## Pinnen van de RGB-LED

- **Min (-)**: GND
- **R**: rood kanaal
- **G**: groen kanaal
- **B**: blauw kanaal

## Aansluiten op de Nano RP2040 Connect

- **Min** van de LED aan een **GND**-pin
- **R** aan een digitale pin met PWM, bijvoorbeeld **D9**
- **G** aan een digitale pin met PWM, bijvoorbeeld **D10**
- **B** aan een digitale pin met PWM, bijvoorbeeld **D11**

<details>
<summary>Let op</summary>

Pinnen **D2**, **D3**, **D4** en **D11** zijn bezet zodra je het **motor shield** gebruikt. Gebruik dan andere PWM-pinnen voor je RGB-LED.

</details>

<details>
<summary>Controlevraag</summary>

Wat gebeurt er als je een kleur-pin van de RGB-LED aan een pin **zonder PWM** sluit?

</details>

<details>
<summary>Antwoord</summary>

Dan kun je dat kanaal alleen **aan** of **uit** zetten, niet half. Je krijgt dus geen mooie tussenkleuren of dimmend gedrag.

</details>
