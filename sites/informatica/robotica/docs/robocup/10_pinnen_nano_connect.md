---
sidebar_position: 12
description: Welke pinnen van de Nano RP2040 Connect bezet zijn in een Redden Basis-robot, en welke je vrij kunt gebruiken.
---

# Pinoverzicht Nano RP2040 Connect

Zo zitten de pinnen in een complete robot voor Redden Basis: de Nano op het
Murphy Shield, met links de motormodule en rechts de multiplexer (de
SDA/SCL-module).

![Fritzing-schema van het Murphy Shield met de Nano, links de motormodule en rechts de SDA/SCL-module met kanalen 0 tot en met 7; de legenda zegt dat de motormodule D2, D3, D4 en D11 gebruikt en de multiplexer A4 en A5](@site/static/fritzing/redden_basis_bb.png)

Het Fritzing-bestand: [Fritzing Redden Basis](/docs/redden_basis.fzz).

## Bezet en vrij

- **D2, D3, D4 en D11**: bezet door het motor shield. Niet gebruiken.
- **A4 en A5**: bezet door I2C (SDA en SCL). Daar hangt de multiplexer aan,
  en daarop de TOF-sensoren en het OLED-scherm, elk op een eigen kanaal.
- **A0, A1, A2, A3, A6 en A7**: vrij voor analoge IR-sensoren.
- De andere D-pinnen: vrij voor een servo, een buzzer of de draadjes voor
  de aluminiumtape.

Een ultrasone afstandssensor heeft twee gewone D-pinnen nodig, bijvoorbeeld D7
en D8 (zie [Afstandssensor](site:robotica/docs/onderdelen/afstandssensor)). Een
[TOF](site:robotica/docs/onderdelen/tof#met-mux) op de multiplexer kost geen
pinnen, en daarom is dat op deze robot de standaard.

<details>
<summary>Controlevraag</summary>

Je robot heeft een TOF en een OLED-scherm op de multiplexer, en je wilt twee
analoge IR-sensoren toevoegen. Op welke pinnen sluit je de IR-sensoren aan?

</details>

<details>
<summary>Antwoord</summary>

Op twee van **A0, A1, A2, A3, A6 en A7**, bijvoorbeeld **A0** en **A1**. Niet op
A4 of A5, want daar hangt de multiplexer aan.

</details>

Terug naar het [begin van RoboCup Junior](site:robotica/docs/robocup/start).
