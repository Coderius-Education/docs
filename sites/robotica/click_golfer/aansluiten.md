---
sidebar_position: 4
---

# Aansluiten

Je robot is gebouwd. Nu sluit je de **servomotor** (die de arm laat slaan) en de **sensor** (die de bal voelt) aan op het bord.

Sluit de draden precies zo aan als op de foto. Let goed op de kleuren en op de rij waarin elke draad komt.

| Onderdeel | Draad | Komt op |
|---|---|---|
| Sensor | rood (VCC) | 5V |
| Sensor | zwart (GND) | GND |
| Sensor | oranje (A0) | **A0** |
| Servo | bruin | GND |
| Servo | rood | 5V |
| Servo | oranje | **D9** |

De sensor heeft ook een pin **D0**. Die laat je leeg. D0 geeft alleen "wel of geen bal", en dat wil je hier niet: je leest op **A0** een getal uit, zodat je zelf kunt kiezen vanaf welke waarde er een bal ligt. Hoe dat werkt zie je bij [Een bal detecteren](bal-detecteren).

![Fritzing-bedradingsschema van de Click Golfer: linksboven de infraroodsensor en rechts de servomotor, allebei aangesloten op het Arduino Nano-shield.](@site/static/fritzing/click_golfer_bb.png)

:::tip
Zit een draad los of in de verkeerde rij? Dan werkt de motor of de sensor niet. Vergelijk je bord dan nog een keer rustig met de foto.
:::

<details>
<summary>Controlevraag</summary>

Op welke pin sluit je de sensor aan, en waarom niet op D0?

</details>

<details>
<summary>Antwoord</summary>

Op **A0**. Die pin geeft een getal, en met een getal kun je zelf een grens kiezen. D0 geeft alleen ja of nee, en dan ligt die grens al vast.

</details>
