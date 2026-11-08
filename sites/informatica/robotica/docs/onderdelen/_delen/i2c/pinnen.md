Het OLED-scherm, de TOF en de multiplexer praten met de Nano over **I2C**: twee draden die alle apparaten samen gebruiken.

- **SDA** (*serial data*) draagt de gegevens, bit voor bit, heen en terug: de Nano stuurt een vraag, de TOF stuurt zijn afstand terug.
- **SCL** (*serial clock*) geeft de maat aan. Bij elke tik op SCL leest de ontvanger de volgende bit van SDA.

Op het shield zitten ze op A4 en A5; daar staat A4/D18/SDA en A5/D19/SCL. In je code geef je ze mee als keyword-argumenten: `sda_gpio_pin="SDA"` en `scl_gpio_pin="SCL"`. Schrijf daar `"SDA"` en `"SCL"`, en niet `"A4"` en `"A5"`. Het is hetzelfde gaatje op het shield, maar in MicroPython leest de naam `"A4"` de pin via de wifi-chip, en I2C moet via de chip van de Nano zelf. Met `"A4"` krijg je `ValueError: expecting a regular GPIO Pin`, en die staat dan pas bij de eerste `fill()` of `get_distance()` ([Er gaat iets mis](site:robotica/docs/onderdelen/er-gaat-iets-mis#oled-scherm)). Laat je de twee weg, dan kiest de bibliotheek dezelfde pinnen.

De Nano spreekt een apparaat aan met zijn adres, en de multiplexer kiest met `channel` welk stel pinnen meedoet. Zo kunnen het scherm op channel 7 en een TOF op channel 0 tegelijk aan A4 en A5 hangen. Een IR-sensor kan er niet meer bij: die zou de draden van I2C verstoren.

<Voorspel soort="Controlevraag" vraag="Op de multiplexer zit een scherm of een TOF, en je wilt er een IR-sensor bij. Waarom mag die niet op A4?">
  <Keuze goed uitleg="Op A4 loopt SDA, de datadraad die de multiplexer en alles erop samen gebruiken.">Daar loopt de data van I2C.</Keuze>
  <Keuze uitleg="A4 is wel een analoge pin. Kijk wat er op het shield nog meer bij A4 staat.">A4 kan geen analoge waarde lezen.</Keuze>
  <Keuze uitleg="Een channel is een stel pinnen op de multiplexer, niet op de Nano. Lees waar de multiplexer zelf aan hangt.">Het channel van het scherm of de TOF gebruikt die pin al.</Keuze>
  <Uitleg>A4 en A5 zijn SDA en SCL. Alles op de multiplexer hangt daaraan, dus een IR-sensor gaat op A0, A1, A2, A3, A6 of A7.</Uitleg>
</Voorspel>
