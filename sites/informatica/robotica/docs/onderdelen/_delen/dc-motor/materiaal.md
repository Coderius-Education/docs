DC-motoren zijn de wielmotoren van je robot. Ze hebben veel stroom nodig, dus we sturen ze niet rechtstreeks vanaf de microcontroller aan, maar via een **motor shield**.

<Onderdelenlijst>
  <Onderdeel naam="Nano op het shield" foto="ir-analoog/leaphy_murphy_shield.jpeg" alt="Het Leaphy Murphy Shield, de groene printplaat waar de Nano in past">Arduino Nano RP2040 Connect op het Leaphy Murphy Shield</Onderdeel>
  <Onderdeel naam="Motor Module" foto="dc-motor/motor_module_voor_leaphy_murphy_shield.jpeg" alt="Motor module voor het Leaphy Murphy shield">Voor het Leaphy Murphy Shield</Onderdeel>
  <Onderdeel naam="DC-motor" aantal={2} foto="dc-motor/tt_motor.jpg" alt="Gele TT-motor met twee draden">Een TT-motor</Onderdeel>
</Onderdelenlijst>

Meer over de Nano staat bij [Arduino](https://docs.arduino.cc/hardware/nano-rp2040-connect/).

**Controlevraag:** Welke drie onderdelen leg je klaar voordat je de motoren aansluit?

<details>
<summary>Antwoord</summary>

De Nano op het shield, de motormodule en twee DC-motoren. De motormodule zit ertussen, omdat de motoren meer stroom vragen dan een pin van de Nano kan leveren.

</details>
