---
sidebar_position: 3
hide_table_of_contents: true
---

# 2.2 Lijn volgen

Lijnvolgen is meestal het eerste onderdeel waar je je robot op laat oefenen. De vraag is: **welke sensoren** ga je gebruiken om de zwarte lijn te zien?

## Sensoren kiezen

### De gebaande weg: IR-sensoren

Je hebt de tutorials van de digitale en analoge IR-sensor gevolgd (hoofdstukken 10 en 11). Nu is het tijd om een paar keuzes te maken:

- Ga je voor de **digitale** of de **analoge** variant?
- Hoeveel IR-sensoren wil je gebruiken (2, 4, 6)?
- Hoe laat je zien wat de microcontroller "denkt"? Je kunt bijvoorbeeld het ingebouwde **RGB-lampje** gebruiken (zie hoofdstuk 2) om de huidige sensorstand te tonen.

Probeer verschillende competitietegels uit:

- Lukt het je om zwart van wit te onderscheiden?
- Lukt het je om allebei de motoren aan te zetten als beide sensoren wit zien, en bij te sturen als één zwart ziet?

### Op avontuur: RGB- of ambient-light-sensor

Een alternatief:

- **RGB-sensoren** voor kleurherkenning.
- **Ambient-light-sensor** met een eigen lichtbron.

Vraag aan je docent of deze beschikbaar zijn.

<details>
<summary>Tip: begin simpel</summary>

Twee digitale IR-sensoren en een werkende `forward()`/`backward()` zijn vaak genoeg om de basis-lijnvolger werkend te krijgen. Maak het pas complexer als de basis stabiel is.

</details>
