---
sidebar_position: 3
description: Welke IR-sensoren je kiest om de zwarte lijn van Redden Basis te volgen, en hoe je ze test op de tegels.
---

# Lijn volgen

Lijn volgen is het eerste wat je robot op de baan moet kunnen, en het levert de
meeste punten op: 5 per tegel als het in één keer lukt. De lijn is zwart en 1
tot 2,5 cm breed, op een witte vloer.

## Sensoren kiezen

Je ziet de lijn met IR-sensoren onder de robot. Hoe je er één aansluit en
uitleest, staat bij de [digitale IR-sensor](site:robotica/docs/onderdelen/ir-digitaal)
en de [analoge IR-sensor](site:robotica/docs/onderdelen/ir-analoog). Voor de
wedstrijd maak je een paar keuzes:

- **Digitaal of analoog?** Een digitale sensor zegt zwart of wit. Een analoge
  geeft een getal, en dan kies je zelf de grens. Dat helpt als het licht in de
  wedstrijdzaal anders is dan in je klas.
- **Hoeveel sensoren?** Met twee volg je de lijn. Met vier zie je ook een
  scherpe bocht of een gat aankomen; hoe je er twee bij zet, staat in
  [Deel 9 van de Lego-auto](site:robotica/lego_auto/lijnvolgen/vier-sensoren).
- **Hoe ver uit elkaar?** Zet twee sensoren zo dat ze allebei wit zien als de
  robot recht op een lijn van 1 cm staat, en dat er één zwart ziet zodra hij
  afwijkt. Te ver uit elkaar en een smalle lijn glipt ertussendoor.

Laat zien wat je robot "denkt": zet de waarde van de sensoren op het
[OLED-scherm](site:robotica/docs/onderdelen/oled-scherm) of laat het
[ingebouwde lampje](site:robotica/docs/onderdelen/ingebouwd-lampje) branden als
een sensor zwart ziet. Zo zie je meteen of het aan de sensor of aan je code ligt.

## Rijden en bijsturen

Hoe je met twee sensoren en twee motoren bijstuurt, staat bij
[Lijnvolgen](site:robotica/docs/onderdelen/lijnvolgen): ziet de rechtersensor
zwart, dan laat je de rechtermotor langzamer draaien. Begin daarmee, en maak het
pas ingewikkelder als de robot een hele baan rondrijdt.

## Testen op de tegels

- Leg verschillende tegels neer: recht, een bocht, een scherpe bocht.
- Lukt het om zwart van wit te onderscheiden op elke tegel, ook bij het licht
  van een raam?
- Hoe snel kan je robot rijden zonder de lijn kwijt te raken in de scherpste
  bocht?

<details>
<summary>Tip: begin met twee sensoren</summary>

Twee sensoren en twee snelheden per motor zijn genoeg voor een robot die een
hele baan rondrijdt. Een derde of vierde sensor is pas nodig als je robot in
een scherpe bocht de lijn kwijtraakt.

</details>

Door naar [Gaten in de lijn](site:robotica/docs/robocup/gaten).
