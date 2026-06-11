---
sidebar_position: 1
hide_table_of_contents: true
---

# 8.1 Materiaal

Een **ultrasone afstandssensor** meet hoe ver iets weg is door geluidsgolven te sturen en te kijken hoe lang ze erover doen om terug te komen. Wij gebruiken de **RCWL-1601**.

Wat heb je nodig?

1. Arduino Nano RP2040 Connect
2. Afstandssensor type **RCWL-1601**

![afstandssensor](RCWL-1601.jpg)

De sensor heeft vier pinnen: **VCC**, **Trig**, **Echo** en **GND**.

<details>
<summary>Controlevraag</summary>

Wat doet de **Trig**-pin?

</details>

<details>
<summary>Antwoord</summary>

Via **Trig** stuurt de microcontroller een kort signaaltje. Daardoor zendt de sensor een geluidspuls uit. Via **Echo** komt het antwoord terug.

</details>
