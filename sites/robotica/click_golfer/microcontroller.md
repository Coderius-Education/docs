---
sidebar_position: 2
---
import Blokken from '@site/src/components/Blokken';
import hallo from './blokken/hallo.json';

# De microcontroller

Het brein van je Click Golfer is een **microcontroller**: een heel klein computertje op één plaatje. Hij doet precies wat jouw programma zegt. Jouw microcontroller heet **Arduino Nano**.

## Pinnen

Langs de randen van de Arduino zitten pootjes. Dat zijn de **pinnen**. Op een pin sluit je een onderdeel aan, zoals een sensor of een motor. Elke pin heeft een naam:

- **A0** tot en met **A7**: hier lees je een getal uit. Daar komt straks de sensor op.
- **D2** tot en met **D13**: hier stuur je iets aan. Daar komt straks de motor op.

## Het shield

De Arduino zit vast op een groene plaat: het **shield**. Daarmee sluit je makkelijk iets aan, zonder solderen.

![Het groene shield met in het midden de blauwe Arduino Nano. Links zit een sensor vast op de rij van A0, rechts een servomotor op de rij van D9. Onderaan zitten de aan-uitknop en de aansluiting voor de stroom.](@site/static/fritzing/click_golfer_bb.png)

Naast elke pin van de Arduino zitten op het shield **drie pinnetjes op een rij**:

| Pinnetje | Waarvoor |
|---|---|
| Signaal | het getal of het bericht van de pin, bijvoorbeeld **A0** |
| 5V | stroom voor het onderdeel |
| GND | de min, de weg terug voor de stroom |

Een onderdeel heeft daarom meestal drie draadjes: een voor het signaal, een voor 5V en een voor GND. Onderaan het shield zit een knop **ON/OFF**. Daarmee zet je je robot aan en uit.

<details>
<summary>Controlevraag</summary>

Waarom heeft elke pin op het shield drie pinnetjes, en niet één?

</details>

<details>
<summary>Antwoord</summary>

Een onderdeel heeft behalve het signaal ook stroom nodig. Twee pinnetjes, 5V en GND, geven die stroom. Over het derde gaat het signaal.

</details>

## Easybloqs openen

Je programmeert de Arduino met blokken in **Easybloqs**.

1. Ga naar **leaphyeasybloqs.com**.
2. Kies de robot **Arduino Nano**.
3. Sluit je robot met de usb-kabel aan op je laptop.
4. Zet de taal op **Nederlands**: kies in het menu **Meer…** en daarna **Taal**. Dan zien je blokken er hetzelfde uit als op deze site.

## Je eerste programma

Maak dit programma na. Het **Leaphy**-blok staat al klaar; het blok **Toon op scherm** zet je erin.

<Blokken programma={hallo} beschrijving="Het Leaphy-blok met daarin Toon op scherm 'Hallo, ik ben de Click Golfer'." />

Zet het programma op je robot en open in Easybloqs het scherm. Daar verschijnt de zin. Alles wat in het Leaphy-blok staat, doet je robot **één keer**, van boven naar beneden.

## Er gaat iets mis

Easybloqs vindt je robot niet.

**Oorzaak:** je laptop kent de Arduino nog niet. Daar is een stukje software voor nodig: een driver.

**Oplossing:** kies in het menu van Easybloqs **Meer…** en daarna **Windows Drivers**, en installeer die. Probeer het daarna opnieuw.

<details>
<summary>Controlevraag</summary>

Je zet een tweede **Toon op scherm** onder het eerste, met de tekst "Ik ben er klaar voor". Hoe vaak zie je elke zin op het scherm?

</details>

<details>
<summary>Antwoord</summary>

Elke zin één keer: eerst "Hallo, ik ben de Click Golfer", daarna "Ik ben er klaar voor". Het Leaphy-blok loopt één keer van boven naar beneden.

</details>

Werkt je eerste programma? Dan sluit je nu [de sensor aan](ir-sensor).
