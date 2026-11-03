---
sidebar_position: 6
description: Een obstakel op de lijn zie je met een TOF-sensor op de multiplexer, en dan rijd je eromheen terug naar de lijn.
---

# Obstakels ontwijken

Op de lijn kan een obstakel liggen: iets zwaars, zoals een baksteen of een
blikje. Rijd je eromheen en vind je de lijn terug, dan krijg je 10 punten. Je
robot mag het obstakel raken of verschuiven, maar dan blijft het liggen waar het
terechtkomt, en de punten krijg je alleen als je robot de volgende tegel haalt.

Je hebt dus twee dingen nodig: een sensor die het obstakel op tijd ziet, en een
plan om eromheen te rijden.

## Stap 1: een TOF op de multiplexer

Voor de wedstrijd gebruik je een **TOF-sensor** (Time of Flight). Die meet
afstand met licht, in millimeters, en zit op de multiplexer. Zo heb je de pinnen
A4 en A5 (I2C) toch al voor het OLED-scherm, en kost elke extra TOF geen pinnen.
Hoe je hem aansluit, staat bij [Time of Flight](site:robotica/docs/onderdelen/tof#met-mux).

:::caution[Geen ultrasone sensor op A4 en A5]

De code bij de [ultrasone afstandssensor](site:robotica/docs/onderdelen/afstandssensor)
gebruikt pin 18 en 19. Dat zijn A4 en A5, de pinnen van I2C. Op een robot met
een TOF of een OLED-scherm werkt die sensor daar dus niet.

:::

## Stap 2: lees de afstand uit

Zet de TOF voor op de robot, recht vooruit, en print de afstand:

```python
from time import sleep
from leaphymicropython.sensors.tof import TimeOfFlight

tof = TimeOfFlight(channel=0)

while True:
    print(tof.get_distance())
    sleep(0.1)
```

Zit je TOF op een ander kanaal van de multiplexer, pas dan `channel=0` aan. Een
getal boven de 8090 is geen echte afstand: dan staat er niets voor de sensor, of
iets dichter bij dan ongeveer 5 cm.

## Stap 3: het lampje als waarschuwing

Laat het [ingebouwde lampje](site:robotica/docs/onderdelen/ingebouwd-lampje)
branden zodra iets dichter dan 10 cm voor de sensor staat, en weer uitgaan als
het verder weg is.

<details>
<summary>Klik hier voor een tip</summary>

10 cm is 100 mm. Let op het getal boven de 8090: dat is geen afstand, en dat
moet het lampje niet aanzetten.

</details>

<details>
<summary>Klik hier voor de oplossing</summary>

```python
from time import sleep
from machine import Pin
from leaphymicropython.sensors.tof import TimeOfFlight

tof = TimeOfFlight(channel=0)
lampje = Pin('LED', Pin.OUT)

while True:
    afstand = tof.get_distance()
    if afstand < 100:
        lampje.value(1)
    else:
        lampje.value(0)
    sleep(0.1)
```

Een ongeldige meting (8191) is groter dan 100, dus dan blijft het lampje uit.

</details>

## Stap 4: hoe rijd je eromheen?

Twee manieren:

1. **Een vaste route.** Draai een kwartslag, rijd een stuk rechtdoor, draai
   terug en rijd door tot een IR-sensor de lijn weer ziet. Meet zelf hoe lang
   elk stuk duurt; het obstakel is niet bij elke wedstrijd even groot.
2. **Met een tweede TOF opzij.** Zet een TOF op de zijkant, op een ander kanaal
   van de multiplexer. Rijd langs het obstakel zolang die TOF het nog ziet, en
   stuur pas terug als hij het niet meer ziet.

Er is minstens 10 cm ruimte tussen de lijn en de rand van de baan. Kies je
bocht dus niet te ruim, en kies de kant waar het meest ruimte is.

<details>
<summary>Tip: obstakels en lijn volgen in dezelfde lus</summary>

Kijk in elke ronde van je `while`-lus eerst naar de TOF. Is er een obstakel,
rijd er dan omheen. Is er niets, volg dan de lijn.

</details>

Door naar [De ingang van de evacuatiezone](site:robotica/docs/robocup/evacuatiezone_detectie).
