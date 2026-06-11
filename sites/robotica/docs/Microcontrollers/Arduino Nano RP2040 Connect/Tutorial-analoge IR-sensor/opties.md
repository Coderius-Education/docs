---
sidebar_position: 4
hide_table_of_contents: true
---

# 11.4 Hoeveel sensoren kan ik aansluiten?

In totaal zijn er **zes** analoge pinnen bruikbaar voor IR-sensoren. Twee is gangbaar voor lijnvolgen, vier is gevorderd.

![1 analog ir met shield](2_analog_ir_with_shield.png)

## Wel gebruiken

**A0, A1, A2, A3, A6, A7**

## Niet gebruiken

**A4 en A5**

:::danger A4 en A5 zijn bezet

Pinnen **A4** en **A5** worden gebruikt voor **I2C communicatie** (SDA en SCL). Als je een multiplexer, TOF-sensor of OLED-scherm gebruikt, zijn deze pinnen al bezet. Sluit hier **geen** IR-sensoren op aan, anders werken je I2C-apparaten niet meer.

:::

<details>
<summary>Controlevraag</summary>

Je gebruikt een OLED-scherm en wilt drie IR-sensoren toevoegen. Welke pinnen kies je?

</details>

<details>
<summary>Antwoord</summary>

Kies drie uit **A0, A1, A2, A3, A6, A7**. Bijvoorbeeld **A0**, **A1** en **A2**. **Niet** A4 of A5, want die heeft het OLED-scherm nodig.

</details>
