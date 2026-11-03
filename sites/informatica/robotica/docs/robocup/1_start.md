---
sidebar_position: 1
description: RoboCup Junior Redden Basis in het kort, wat je robot moet kunnen, hoe je punten haalt, en een pagina per uitdaging.
---

# RoboCup Junior: Redden Basis

RoboCup Junior is een wedstrijd voor robots die leerlingen zelf bouwen en
programmeren. In de liga **Redden Basis** volgt je robot een zwarte lijn over
een baan van tegels, komt hij langs gaten, drempels en obstakels, en brengt hij
in de evacuatiezone zilveren ballen naar het evacuatiepunt.

Heb je de [Lego-auto](site:robotica/lego_auto/frame) gebouwd, dan ken je de
basis al: dezelfde microcontroller en dezelfde manier van werken. Een onderdeel
dat je nog niet kent, zoek je op bij [Onderdelen](site:robotica/docs/onderdelen).

## De spelregels in het kort \{#spelregels}

Alles hieronder komt uit de [spelregels van 2025](/docs/RoboCupJuniorReddenBasis2025_rev1.pdf).
Op de [website van de wedstrijd](https://www.robocupjunior.nl/redden-basis/)
zie je of er een nieuwere versie is.

- **De baan** bestaat uit tegels van 30 bij 30 cm, minstens zes. De vloer is
  wit, de lijn zwart en 1 tot 2,5 cm breed. Er zijn geen kruisingen.
- **Een ronde** duurt 5 minuten. Je robot rijdt helemaal zelf: niemand stuurt
  hem, en alleen de captain van je team mag hem aanraken.
- **Vastgelopen?** Als de scheidsrechter geen voortgang meer ziet, zet je de
  robot terug op het laatste checkpoint en probeer je het opnieuw. Aan je
  programma mag je dan niets veranderen.
- **Een team** heeft 2 tot 5 leerlingen en moet kunnen uitleggen hoe de robot
  werkt.

### Zo haal je punten

| Wat | Punten |
|---|:---:|
| Een tegel tot het volgende checkpoint, bij de eerste poging | 5 per tegel |
| Hetzelfde bij de tweede of derde poging | 3 of 1 per tegel |
| Over een gat in de lijn | 5 |
| Over een drempel | 5 |
| Om een obstakel heen | 10 |
| Een slachtoffer (bal) op het evacuatiepunt | 20 |

Staan twee teams gelijk, dan wint het team dat als eerste een bal redde.

## De uitdagingen

Elke uitdaging heeft een eigen pagina, in de volgorde waarin je robot ze op de
baan tegenkomt:

1. [Lijn volgen](site:robotica/docs/robocup/lijnvolgen)
2. [Gaten in de lijn](site:robotica/docs/robocup/gaten)
3. [Drempels en troep](site:robotica/docs/robocup/drempels)
4. [Obstakels ontwijken](site:robotica/docs/robocup/obstakels)
5. [De ingang van de evacuatiezone](site:robotica/docs/robocup/evacuatiezone_detectie)
6. [Rijden in de evacuatiezone](site:robotica/docs/robocup/rijden_evacuatiezone)
7. [Ballen vinden](site:robotica/docs/robocup/vinden_van_ballen)
8. [Ballen grijpen](site:robotica/docs/robocup/grijpen_van_een_bal)
9. [Het evacuatiepunt](site:robotica/docs/robocup/detectie_eindpunt)

Welke pin je waarvoor gebruikt, staat in het [pinoverzicht](site:robotica/docs/robocup/pinnen_nano_connect).
Vragen stel je op de [Discord van RoboCup Junior](https://discord.com/channels/900836668364455967/1028318828142276648).

## Wat je al moet kunnen

Elk onderdeel van de robot heb je het best eerst los aan de praat gekregen,
voordat het in je wedstrijdprogramma komt:

| Doel | Onderdeel |
|---|---|
| De lijn zien | [Analoge IR-sensor](site:robotica/docs/onderdelen/ir-analoog) of [digitale IR-sensor](site:robotica/docs/onderdelen/ir-digitaal) |
| Rijden en bijsturen | [DC-motor](site:robotica/docs/onderdelen/dc-motor) en [Lijnvolgen](site:robotica/docs/onderdelen/lijnvolgen) |
| Afstand meten | [Time of Flight (TOF)](site:robotica/docs/onderdelen/tof#met-mux) op de multiplexer |
| Grijpen | [Servo](site:robotica/docs/onderdelen/servo) |
| Laten zien wat je robot denkt | [OLED-scherm](site:robotica/docs/onderdelen/oled-scherm) |
| Zonder kabel rijden | [Batterijen](site:robotica/docs/onderdelen/batterijen) |

Door naar de [Materiaallijst](site:robotica/docs/robocup/the_material).
