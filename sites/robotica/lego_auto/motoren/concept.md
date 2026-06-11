---
sidebar_position: 1
hide_table_of_contents: true
title: Hoe werkt een DC-motor?
---

# Hoe werkt een DC-motor?

Een **DC-motor** zet stroom om in **draaiing**. Stuur je er stroom doorheen, dan draait de as rond. Op die as zit straks een wiel, zo rijdt je robot.

Met de **richting** van de stroom bepaal je welke kant de motor op draait: de ene kant vooruit, de andere kant achteruit. En met de **hoeveelheid** stroom bepaal je de snelheid. In je code regel je dat met een getal van **0** (stil) tot **255** (vol gas).

DC-motoren hebben veel **stroom** nodig — meer dan de pinnen van de microcontroller kunnen leveren. Daarom sluit je ze niet rechtstreeks op de Nano aan, maar via een **motor shield**. Dat shield haalt de stroom uit de batterij en stuurt hem gecontroleerd naar de motoren, terwijl de microcontroller alleen het "commando" geeft.

<details>
<summary>Controlevraag</summary>

Waarom sluit je de motoren via een motor shield aan en niet rechtstreeks op de microcontroller?

</details>

<details>
<summary>Antwoord</summary>

Motoren trekken te veel **stroom** voor de pinnen van de microcontroller. Het motor shield levert die stroom uit de batterij; de microcontroller geeft alleen het signaal hoe snel en welke kant op.

</details>
