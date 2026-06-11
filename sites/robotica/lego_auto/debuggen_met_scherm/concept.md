---
sidebar_position: 2
hide_table_of_contents: true
title: Hoe werkt een OLED-scherm?
---

# Hoe werkt een OLED-scherm?

Een **OLED-scherm** is een klein schermpje dat tekst en getallen laat zien. Het bestaat uit heel veel kleine lichtpuntjes (**pixels**) — meestal **128 breed** en **64 hoog**. Door de juiste puntjes aan te zetten, vormt het scherm letters en cijfers.

Het scherm is handig als je robot **los van de laptop** rijdt: dan kun je de Shell niet meer zien, maar de sensorwaardes wél op het schermpje volgen.

Het scherm praat met de microcontroller via **I2C**, dus via de pinnen **SDA** en **SCL**. In je code werkt het in twee stappen: eerst zet je de tekst klaar, en daarna roep je **`show()`** aan om alles echt op het scherm te tonen. Vergeet je `show()`, dan blijft het scherm leeg.

<details>
<summary>Controlevraag</summary>

Waarom is een OLED-scherm handig zodra je robot zonder laptop rijdt?

</details>

<details>
<summary>Antwoord</summary>

Zonder laptop zie je de **Shell** niet meer. Op het schermpje kun je dan toch zien welke waardes je sensoren meten, zodat je weet wat je robot "denkt".

</details>
