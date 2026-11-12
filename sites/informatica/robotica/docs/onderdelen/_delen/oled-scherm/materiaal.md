<Onderdelenlijst>
  <Onderdeel naam="Nano op het shield" foto="ir-analoog/leaphy_murphy_shield.jpeg" alt="Het Leaphy Murphy Shield, de groene printplaat waar de Nano in past">Arduino Nano RP2040 Connect op het Leaphy Murphy Shield</Onderdeel>
  <Onderdeel naam="OLED-scherm" foto="oled-scherm/oled.png" alt="OLED-scherm van 128 bij 64 pixels met vier pinnen">128 × 64 pixels</Onderdeel>
  <Onderdeel naam="SDA/SCL-module" foto="oled-scherm/sda_scl_module.jpeg" alt="SDA/SCL-module voor het Leaphy Murphy shield">Een multiplexer, aanbevolen</Onderdeel>
  <Onderdeel naam="4-pins jumperkabel female/female" />
</Onderdelenlijst>

Het uiterlijk van het scherm verschilt per merk, maar de aansluitingen zijn hetzelfde. De multiplexer heb je nodig als je ook TOF-sensoren gebruikt: dan werkt alles tegelijk.

**Controlevraag:** Hoeveel pinnen heeft het OLED-scherm minimaal nodig op de microcontroller?

<details>
<summary>Antwoord</summary>

Vier: **VCC** (3,3V), **GND**, **SDA** (A4) en **SCL** (A5).

</details>
