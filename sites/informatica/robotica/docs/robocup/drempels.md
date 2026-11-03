---
sidebar_position: 5
description: Over drempels en troep op de baan rijd je heen; zo houd je je robot op de lijn als hij hobbelt.
---

# Drempels en troep

Op de baan liggen dingen waar je robot overheen moet rijden. Een drempel
levert 5 punten op als je robot de volgende tegel haalt.

## Wat de spelregels zeggen

- **Drempels** zijn wit en hoogstens **1 cm** hoog. Waar een drempel over de
  lijn ligt, is hij zwart, zodat de lijn doorloopt.
- **Troep** is licht spul van hoogstens **3 cm** hoog, zoals tandenstokers,
  rietjes en ijsstokjes. Het ligt los op de baan.
- Tussen twee tegels kan een spleet of een randje van minder dan 3 mm zitten.

## Waar je robot op vastloopt

- **Te weinig vaart.** Rond een snelheid van 180 tot 200 begint een motor pas te
  draaien (zie [DC-motor](site:robotica/docs/onderdelen/dc-motor)). Bij een
  drempel heb je meer nodig. Rijdt je robot langzaam om de lijn goed te volgen,
  dan blijft hij voor de drempel staan.
- **Een te lage onderkant.** Zitten je IR-sensoren of je batterijhouder lager
  dan 1 cm, dan haken ze achter de drempel.
- **Sensoren die even in de lucht hangen.** Op de drempel kantelt de robot, en
  dan zien de IR-sensoren geen vloer meer. Dat lijkt op wit, of op iets
  vreemds.

## Testen

1. Leg een drempel van 1 cm over de lijn, met een zwart stukje waar de lijn
   loopt.
2. Laat je robot er met zijn gewone snelheid op af rijden. Komt hij erover?
3. Volgt hij daarna de lijn nog, of is hij van de lijn af?
4. Doe hetzelfde met een paar ijsstokjes los op de baan.

<details>
<summary>Tip: meet wat je sensor ziet op de drempel</summary>

Zet de waarde van een analoge IR-sensor op het scherm en duw de robot met de
hand over de drempel. Zie je een rare waarde als hij kantelt? Dan weet je dat
je code die waarde even moet negeren.

</details>

Door naar [Obstakels ontwijken](site:robotica/docs/robocup/obstakels).
