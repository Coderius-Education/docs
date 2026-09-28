---
sidebar_position: 5
---
import Blokken from '@site/src/components/Blokken';
import heenEnWeer from './blokken/servo-heen-en-weer.json';
import drieHoeken from './blokken/servo-drie-hoeken.json';

# De servo

De arm van je Click Golfer beweegt straks met een **servo**: een motortje dat naar een stand draait die jij kiest, en daar blijft staan. Die arm bouw je pas later van Lego. Nu test je de servo los, op tafel.

:::tip
Steek een losse Lego-as in het gat van de servo. Dan zie je goed hoe ver het asje draait.
:::

## Aansluiten

Zet je robot uit met de knop **ON/OFF**. Sluit de servo aan op de rij van **D9** op het [shield](microcontroller):

| Draad van de servo | Komt op |
|---|---|
| bruin | GND |
| rood | 5V |
| oranje | het signaal van **D9** |

![Uitsnede van het schema: de servo rechtsonder, met de bruine draad naar GND, de rode naar 5V en de oranje naar het signaal van D9 op het shield.](@site/static/fritzing/click_golfer_servo.png)

## Graden

Een servo draait een halve cirkel. Die halve cirkel is verdeeld in 180 stukjes: **graden**. Je schrijft dat met een klein rondje, zoals 90°.

| Stand | Waar staat het asje? |
|:---:|---|
| 0° | helemaal naar één kant |
| 90° | recht in het midden |
| 180° | helemaal naar de andere kant |

Alles daartussen kan ook, zoals 45° of 135°.

## Heen en weer

Het blok **Servo 9 op 90** uit de groep **Actuatoren** zet de servo op pin 9 in de stand van 90 graden. Dit programma laat het asje heen en weer draaien:

<Blokken programma={heenEnWeer} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 0, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms." />

<details>
<summary>Voorspel: wat doet het asje?</summary>

Het asje draait naar 0°, wacht een seconde, draait naar 90°, wacht weer een seconde, en begint opnieuw. Dat blijft hij doen, want alles staat in **herhaal voor altijd**.

</details>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

## Probeer het zelf

Laat het asje langs drie standen gaan: 45°, 90° en 135°, met steeds een seconde ertussen.

<details>
<summary>Tip</summary>

Je hebt drie keer het blok **Servo 9 op …** nodig, en na elk blok een **duurt 1000 ms**.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={drieHoeken} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 45, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms, Servo 9 op 135, duurt 1000 ms." />

</details>

## Er gaat iets mis

**Het asje trilt, of beweegt bijna niet.**

**Oorzaak:** er staat geen **duurt** tussen de servo-blokken. De robot geeft dan meteen de volgende stand, nog voordat het asje bij de vorige is.

**Oplossing:** zet na elk **Servo**-blok een **duurt**, bijvoorbeeld 1000 ms.

**De servo zoemt of trilt, maar draait niet.**

**Oorzaak:** er zit iets in de weg, zodat het asje niet verder kan. Of de servo moet naar een stand waar hij niet komt: veel servo's zitten bij 0° en 180° al tegen hun eind aan, en blijven dan zoemen.

**Oplossing:** kijk of de Lego-as ergens tegenaan zit. Zoemt hij alleen bij 0° of 180°, probeer dan 10° en 170°.

**Zelf vinden:** haal alles van de as af. Draait de servo dan wel? Dan zat er iets in de weg.

**De servo doet helemaal niets.**

**Oorzaak:** de servo krijgt geen signaal of geen stroom.

**Oplossing:** loop deze punten na:

- zit de oranje draad op het signaal van **D9**, en de bruine op GND? Een omgekeerde stekker werkt niet;
- staat er in het blok **Servo 9**, en niet een ander getal?

**Het asje beweegt één keer, en daarna niet meer.**

**Oorzaak:** de servo-blokken staan direct in het Leaphy-blok, en dat voert zijn blokken maar één keer uit.

**Oplossing:** zet de servo-blokken in **herhaal voor altijd**.

**De servo trekt te weinig kracht, of de robot doet vreemd als de servo beweegt.**

**Oorzaak:** misschien krijgt de servo via alleen de usb-kabel te weinig stroom. Een servo die kracht moet zetten, vraagt veel.

**Oplossing:** probeer of het beter gaat als je robot stroom krijgt via de aansluiting op het shield, met de knop **ON/OFF** aan. Vraag je docent welke adapter of batterij erbij hoort.

**De servo wordt warm.**

**Oorzaak:** hij duwt tegen iets aan en komt niet waar hij heen moet.

**Oplossing:** zet je robot meteen uit, en zoek wat het asje tegenhoudt. Draai het asje ook nooit met de hand terwijl de robot aan staat: daar kunnen de tandwieltjes in de servo kapot van gaan.

<details>
<summary>Controlevraag</summary>

Het programma Heen en weer zet het asje op 0° en daarna op 90°. Welk deel van een hele cirkel draait het asje dan elke keer?

</details>

<details>
<summary>Antwoord</summary>

Een kwart cirkel. Een halve cirkel is 180°, en 90° is daar de helft van.

</details>

Draait het asje? Dan laat je de servo nu [slaan als hij een bal ziet](bal-slaan).
