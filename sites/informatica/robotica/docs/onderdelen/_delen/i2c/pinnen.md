Het OLED-scherm, de TOF en de multiplexer praten met de Nano over **I2C**: twee draden die alle apparaten samen gebruiken.

- **SDA** (*serial data*) draagt de gegevens, bit voor bit.
- **SCL** (*serial clock*) geeft de maat aan. Bij elke tik op SCL leest het apparaat de volgende bit van SDA.

Op het shield zitten ze op A4 en A5; daar staat A4/D18/SDA en A5/D19/SCL. In je code geef je ze mee als keyword-argumenten: `sda_gpio_pin="SDA"` en `scl_gpio_pin="SCL"`. Schrijf daar `"SDA"` en `"SCL"`, en niet `"A4"` en `"A5"`. Het is hetzelfde gaatje op het shield, maar in MicroPython leest de naam `"A4"` de pin via de wifi-chip, en I2C moet via de chip van de Nano zelf. Laat je de twee weg, dan kiest de bibliotheek dezelfde pinnen.

De Nano spreekt een apparaat aan met zijn adres, en de multiplexer kiest met `channel` welk stel pinnen meedoet. Zo kunnen het scherm op channel 7 en een TOF op channel 0 tegelijk aan A4 en A5 hangen. Een IR-sensor kan er niet meer bij: die zou de draden van I2C verstoren.

<Voorspel soort="Controlevraag" vraag="Het scherm zit op channel 7 en je wilt er een IR-sensor bij. Waarom mag die niet op A4?">
  <Keuze goed uitleg="Op A4 loopt SDA, de datadraad die het scherm en de multiplexer samen gebruiken.">Daar loopt de data van I2C.</Keuze>
  <Keuze uitleg="A4 is wel een analoge pin. Kijk wat er op het shield nog meer bij A4 staat.">A4 kan geen analoge waarde lezen.</Keuze>
  <Keuze uitleg="Channel 7 is een stel pinnen op de multiplexer, niet op de Nano. Lees waar de multiplexer zelf aan hangt.">Channel 7 gebruikt die pin al.</Keuze>
  <Uitleg>A4 en A5 zijn SDA en SCL. Alles op de multiplexer hangt daaraan, dus een IR-sensor gaat op A0, A1, A2, A3, A6 of A7.</Uitleg>
</Voorspel>
