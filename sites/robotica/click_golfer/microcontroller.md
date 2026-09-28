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

Je programmeert de Arduino met blokken in **Easybloqs**. Gebruik de browser **Chrome** of **Edge**: alleen die kunnen via de usb-kabel met je robot praten.

1. Ga naar **leaphyeasybloqs.com**.
2. Kies de robot **Arduino Nano**.
3. Sluit je robot met de usb-kabel aan op je laptop.
4. Zet de taal op **Nederlands**: kies in het menu **Meer…** en daarna **Taal**. Dan zien je blokken er hetzelfde uit als op deze site.

## Je eerste programma

Maak dit programma na. Het **Leaphy**-blok staat al klaar; het blok **Toon op scherm** zet je erin.

<Blokken programma={hallo} beschrijving="Het Leaphy-blok met daarin Toon op scherm 'Hallo, ik ben de Click Golfer'." />

Alles wat in het Leaphy-blok staat, doet je robot **één keer**, van boven naar beneden. Nu zet je het programma op je robot en kijk je of de zin verschijnt.

### Stap 1: upload naar je robot

1. Klik rechtsboven op de gekleurde knop **Upload naar robot**.
2. De eerste keer vraagt je browser met welk apparaat hij moet praten. Er verschijnt een lijstje. Klik op je robot en daarna op de knop om verbinding te maken. Staat er meer dan één regel, trek dan de usb-kabel eruit en kijk welke regel verdwijnt: dat is je robot.
3. Er opent een venster. Daarin zie je eerst **Code compileren**: Easybloqs maakt van je blokken een programma. Daarna **Code uploaden**: het programma gaat naar je robot. Als het klaar is, staat er **Upload voltooid**.
4. Klik op **Ga terug naar code scherm**. Je ziet je blokken weer.

### Stap 2: open het scherm

Rechts naast je blokken staat een rij ronde knoppen. Ga met je muis over de knop met het plaatje van een blaadje met streepjes. Er verschijnt de tekst **Toon output op scherm**. Klik erop.

Er opent een venster met bovenaan **Toon output op scherm**. Dit is het scherm: alles wat je robot met **Toon op scherm** laat zien, komt hier regel voor regel onder elkaar.

### Stap 3: laat de robot opnieuw beginnen

Je robot voerde het programma al uit toen de upload klaar was, en toen stond het scherm nog niet open. Daarom zie je de zin misschien nog niet.

Druk op het kleine knopje op de Arduino zelf, met **RST** ernaast. Je robot begint dan opnieuw met het programma. In het scherm verschijnt:

```
Hallo, ik ben de Click Golfer
```

## Er gaat iets mis

**Geen robot geselecteerd**

**Oorzaak:** je hebt in het lijstje van de browser geen robot gekozen, of het lijstje was leeg.

**Oplossing:** kijk of de usb-kabel goed vastzit, en klik opnieuw op **Upload naar robot**. Blijft het lijstje leeg, dan kent je laptop de Arduino nog niet. Kies in het menu **Meer…** en daarna **Windows drivers**, en installeer die. Probeer het daarna opnieuw.

**Web serial wordt niet ondersteund**

**Oorzaak:** je browser kan niet via de usb-kabel met je robot praten.

**Oplossing:** open Easybloqs in **Chrome** of **Edge**.

**Het scherm blijft leeg**

**Oorzaak:** het programma liep al voordat het scherm open was.

**Oplossing:** laat het scherm open staan en druk op het knopje **RST** op de Arduino.

<details>
<summary>Controlevraag</summary>

Je zet een tweede **Toon op scherm** onder het eerste, met de tekst "Ik ben er klaar voor". Hoe vaak zie je elke zin op het scherm?

</details>

<details>
<summary>Antwoord</summary>

Elke zin één keer: eerst "Hallo, ik ben de Click Golfer", daarna "Ik ben er klaar voor". Het Leaphy-blok loopt één keer van boven naar beneden.

</details>

Werkt je eerste programma? Dan sluit je nu [de sensor aan](ir-sensor).
