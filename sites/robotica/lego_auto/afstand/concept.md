---
sidebar_position: 1
hide_table_of_contents: true
title: Hoe werkt een TOF-sensor?
---

# Hoe werkt een TOF-sensor?

Een **Time of Flight-sensor** (afgekort **TOF**) meet afstand met een onzichtbare lichtstraal. *Time of flight* betekent "vluchttijd": de tijd die het licht onderweg is.

De sensor stuurt een korte lichtpuls naar voren. Het licht kaatst terug op een voorwerp en komt weer bij de sensor binnen. De sensor meet hoe **lang** dat duurt. Licht gaat altijd even snel, dus uit die tijd rekent de sensor de **afstand** uit. Hoe langer de lichtstraal onderweg is, hoe verder het voorwerp weg staat.

Een TOF is **preciezer** dan een ultrasone (geluids)sensor en heeft geen last van omgevingsgeluid. Hij praat met de microcontroller via **I2C**, dus via de pinnen **SDA** en **SCL**. De afstand komt terug in **millimeters**, en hij meet betrouwbaar tussen ongeveer **5 cm en 200 cm**.

<details>
<summary>Controlevraag</summary>

Wat meet de sensor eigenlijk om de afstand te bepalen?

</details>

<details>
<summary>Antwoord</summary>

De **tijd** die het licht nodig heeft om naar het voorwerp en weer terug te reizen. Omdat licht altijd even snel gaat, hoort bij die tijd precies één afstand.

</details>
