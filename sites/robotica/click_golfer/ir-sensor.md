---
sidebar_position: 3
---
import Blokken from '@site/src/components/Blokken';
import uitlezen from './blokken/sensor-uitlezen.json';
import balKlaar from './blokken/bal-klaar.json';

# De IR-sensor

Je Click Golfer moet zien of er een bal ligt. Dat doet de **IR-sensor**. Hij stuurt onzichtbaar licht naar voren en meet hoeveel daarvan terugkomt. Ligt er een bal voor, dan komt er meer licht terug.

## Aansluiten

Zet je robot uit met de knop **ON/OFF**. Sluit de sensor dan aan op de rij van **A0** op het [shield](microcontroller):

| Draad van de sensor | Komt op |
|---|---|
| rood (VCC) | 5V |
| zwart (GND) | GND |
| oranje (A0) | het signaal van **A0** |

De sensor heeft ook een pin **D0**. Die laat je leeg. D0 geeft alleen "wel bal" of "geen bal". Op **A0** krijg je een getal, en dan kies je zelf vanaf welk getal er een bal ligt.

## Stap 1: het getal uitlezen

Met het blok **Lees anapin A0** lees je het getal van de sensor. **Toon op scherm** laat het zien.

<Blokken programma={uitlezen} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Toon op scherm Lees anapin A0, en daarna duurt 500 ms." />

Het blok **herhaal voor altijd** doet alles wat erin staat steeds opnieuw. Zonder dat blok las je robot de sensor één keer, en daarna nooit meer. **duurt 500 ms** laat de robot een halve seconde wachten, zodat je het getal kunt lezen.

Open het scherm in Easybloqs. Leg een bal voor de sensor en haal hem weer weg. Hoe verandert het getal? Schrijf de twee getallen op: zonder bal en met bal.

<details>
<summary>Controlevraag</summary>

Waarom staat **Lees anapin A0** in een **herhaal voor altijd**?

</details>

<details>
<summary>Antwoord</summary>

Zonder herhaal leest de robot de sensor één keer, bij het aanzetten. Je wilt steeds opnieuw weten of er een bal ligt.

</details>

## Stap 2: reageren op de bal

Nu laat je de robot zelf beslissen. Met het blok **als … dan** kijk je of het getal groter is dan een grens. In het voorbeeld is die grens **300**.

<Blokken programma={balKlaar} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 groter is dan 300, dan Toon op scherm 'klaar om te golfen!'. Daarna duurt 500 ms." />

Is het getal groter dan 300, dan ligt er een bal en verschijnt "klaar om te golfen!" op het scherm.

:::tip
300 is maar een voorbeeld. Gebruik de getallen die jij in stap 1 hebt opgeschreven, en kies een grens die er netjes tussenin ligt.
:::

## Er gaat iets mis

Het getal op het scherm verandert niet als je een bal voor de sensor legt.

**Oorzaak:** de oranje draad zit niet op het signaal van A0, of de sensor krijgt geen stroom.

**Oplossing:** zet je robot uit en vergelijk je draden met de tabel bij Aansluiten: oranje op het signaal van A0, rood op 5V en zwart op GND.

<details>
<summary>Controlevraag</summary>

Op welke pin sluit je de sensor aan, en waarom niet op D0?

</details>

<details>
<summary>Antwoord</summary>

Op **A0**. Die pin geeft een getal, en met een getal kies je zelf een grens. D0 geeft alleen ja of nee, en dan ligt die grens al vast.

</details>

Ziet je robot de bal? Dan leer je nu [de servo](servo) bewegen.
