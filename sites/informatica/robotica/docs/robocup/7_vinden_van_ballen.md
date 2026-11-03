---
sidebar_position: 9
description: De slachtoffers zijn zilveren ballen van 4 à 5 cm die stroom geleiden; zo zie je ze met een TOF die laag genoeg zit.
---

# Ballen vinden

In de evacuatiezone liggen de **slachtoffers**: zilveren ballen van 4 à 5 cm
die stroom geleiden. Ze kunnen overal in de zone liggen, behalve op het
evacuatiepunt. Elke bal die je robot op het evacuatiepunt brengt, levert 20
punten op.

## Waar zet je de sensor?

Een bal is maar 4 à 5 cm hoog. Een TOF die hoger zit, kijkt eroverheen en ziet
alleen de muur. Zet de sensor dus laag, met het midden onder de 4 cm, en
vooruit kijkend.

Een TOF meet pas betrouwbaar vanaf ongeveer 5 cm (zie
[Time of Flight](site:robotica/docs/onderdelen/tof#zonder-mux)). Een bal die
vlak voor je robot ligt, geeft dus een ongeldige meting. Zet de sensor een
stukje naar achteren, zodat een bal vlak voor de grijper nog op 5 cm of meer
van de sensor ligt.

## Bal of muur?

Je TOF ziet de muur ook. Twee manieren om ze uit elkaar te houden:

- **Twee TOF's boven elkaar.** De onderste ziet de bal en de muur, de bovenste
  alleen de muur. Ziet alleen de onderste iets, dan is het een bal.
- **Rondkijken.** Een bal is smal: draai je robot een klein stukje, dan is hij
  weg uit beeld. Een muur blijft.

## Een bal in je grijper

De ballen geleiden stroom, net als de aluminiumtape bij de
[ingang van de evacuatiezone](site:robotica/docs/robocup/evacuatiezone_detectie).
Met hetzelfde trucje zie je of je een bal te pakken hebt: twee draadjes in je
grijper, en een pin met `Pin.PULL_UP` die naar 0 valt als de bal ze allebei
raakt.

<details>
<summary>Tip: test in losse stappen</summary>

Leg eerst een bal stil voor de robot en kijk welke afstand je TOF geeft. Pas als
dat klopt, laat je de robot er zelf naar zoeken.

</details>

Door naar [Ballen grijpen](site:robotica/docs/robocup/grijpen_van_een_bal).
