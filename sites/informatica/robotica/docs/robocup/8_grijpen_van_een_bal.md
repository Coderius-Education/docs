---
sidebar_position: 10
description: Een bal van 4 à 5 cm pak je op met een grijper op een servo; zo bouw en test je de beweging.
---

# Ballen grijpen

Nu je een bal kunt vinden, moet je hem ook **oppakken** en meenemen naar het
evacuatiepunt. Daar komt bijna altijd een [servo](site:robotica/docs/onderdelen/servo)
aan te pas.

## Vragen om mee te beginnen

- Hoe ziet je grijper eruit? Een schepje, een tang of een arm? De bal is 4 à 5
  cm groot, dus de bek moet minstens 5 cm wijd open kunnen.
- Hoe laat je de **servo** en de **TOF** samenwerken? Komt de bal dichtbij, dan
  dicht.
- Welke soort servo heb je nodig?
  - Een gewone servo draait tussen 0 en 180 graden: goed voor een tang of een
    schep.
  - Een servo die rond blijft draaien, is goed voor een rol of een band die de
    bal naar binnen trekt.

## Inspiratie

- Een servo met een lepel die de bal opschept.
- Twee servo's die als kaken naar elkaar toe sluiten.
- Een rol met rubberen randen die de bal naar binnen rolt.

Bouw je grijper zo dat de bal tegen twee draadjes komt als hij erin zit. Dan
ziet je robot zelf of het grijpen gelukt is (zie
[Ballen vinden](site:robotica/docs/robocup/vinden_van_ballen)).

<details>
<summary>Tip: bouw eerst de beweging</summary>

Test de grijpbeweging eerst met de hand, met `set_servo_angle("D6", 0)` en
`set_servo_angle("D6", 180)`, voordat je hem aan de TOF koppelt.

</details>

Door naar [Het evacuatiepunt](site:robotica/docs/robocup/detectie_eindpunt).
