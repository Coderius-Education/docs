Wat heb je nodig?

1. Arduino Nano RP2040 Connect
2. Analoge IR-sensor
3. Leaphy Murphy Shield

### Analoge IR-sensor

![Een blauwe IR-sensor met vier pinnen en een blauw potmetertje](../../img/ir-analoog/doc_irsensor.png)

### Leaphy Murphy Shield

![Het Leaphy Murphy Shield, de groene printplaat waar de Nano in past](../../img/ir-analoog/leaphy_murphy_shield.jpeg)

<details>
<summary>Controlevraag</summary>

Op welke pinnen sluit je een analoge IR-sensor aan?

</details>

<details>
<summary>Antwoord</summary>

Op een **analoge pin**: `A0`, `A1`, `A2`, `A3`, `A6` of `A7`. Niet op `A4` en `A5` — die zijn nodig voor I2C (SDA en SCL).

</details>
