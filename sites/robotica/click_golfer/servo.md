---
sidebar_position: 5
---
import Blokken from '@site/src/components/Blokken';
import ServoSchijf from '@site/src/components/ServoSchijf';
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

Het signaal van **D9** is het pinnetje het dichtst bij de naam D9. Zit alles vast? Zet je robot dan weer aan met **ON/OFF**.

## Graden

Een servo draait een halve cirkel. Die halve cirkel is verdeeld in 180 stukjes: **graden**. Je schrijft dat met een klein rondje, zoals 90°.

| Stand | Waar staat het asje? |
|:---:|---|
| 0° | helemaal naar één kant |
| 90° | recht in het midden |
| 180° | helemaal naar de andere kant |

Alles daartussen kan ook, zoals 45° of 135°.

Probeer het hier. Sleep de schuif of typ een getal bij **Servo 9 op**, en kijk waar het asje heen draait. Op je eigen servo kan 0° ook rechts liggen: dat hangt ervan af hoe hij op tafel ligt.

<ServoSchijf />

## Heen en weer

Je maakt nu een nieuw programma. Wil je het programma van de sensor bewaren? Kies dan in het menu **Mijn projecten** de knop **Opslaan als ...**, typ een naam en klik op **Opslaan**. Je laptop bewaart het als bestand. Haal daarna de oude blokken weg: sleep **herhaal voor altijd** uit het Leaphy-blok naar de groepen links. Alles wat erin zit, gaat mee. Het Leaphy-blok blijft staan.

Het blok **Servo 9 op 90** uit de groep **Actuatoren** zet de servo op pin 9 in de stand van 90 graden. In Easybloqs staat er eerst **Servo 2 op 90**. Klik op de 2 en kies **9**: daar zit je servo. Bekijk dit programma, maar upload het nog niet:

<Blokken programma={heenEnWeer} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 0, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms." />

<Voorspel vraag="Wat doet het asje?">
  <Keuze goed uitleg="Elk duurt-blok is 1000 ms: een seconde stilstaan voor de volgende stand.">Naar 0°, een seconde wachten, naar 90°, een seconde wachten, en steeds opnieuw</Keuze>
  <Keuze uitleg="Kijk in welk blok de servo-blokken staan. Na één keer stoppen doet alleen het Leaphy-blok.">Het draait één keer naar 0° en terug, en stopt dan</Keuze>
  <Keuze uitleg="Kijk naar het eerste servo-blok in herhaal voor altijd: daar staat geen 90.">Het blijft op 90° staan</Keuze>
  <Keuze uitleg="Een servo draait maar een halve cirkel, van 0° tot 180°. Hij gaat naar een stand en blijft daar.">Het draait steeds rondjes</Keuze>
  <Uitleg>

Het asje draait naar 0°, wacht een seconde, draait naar 90°, wacht weer een seconde, en begint opnieuw. Dat blijft hij doen, want alles staat in **herhaal voor altijd**.

  </Uitleg>
</Voorspel>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

## Probeer het zelf

Laat het asje langs drie standen gaan: 45°, 90° en 135°, met steeds een seconde ertussen.

<details>
<summary>Tip</summary>

Begin met het programma van Heen en weer. Wat moet erbij, en welke getallen veranderen?

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={drieHoeken} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 45, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms, Servo 9 op 135, duurt 1000 ms." />

</details>

## Er gaat iets mis

<Probleem titel="Het asje beweegt bijna niet, of schokt een beetje heen en weer.">

**Oorzaak:** er staat geen **duurt** tussen de servo-blokken. De robot geeft dan meteen de volgende stand, nog voordat het asje bij de vorige is.

**Oplossing:** zet na elk **Servo**-blok een **duurt**, bijvoorbeeld 1000 ms.

</Probleem>

<Probleem titel="De servo zoemt of wordt warm, maar draait niet.">

**Oorzaak:** er zit iets in de weg, zodat het asje niet verder kan. Of de servo moet naar een stand waar hij niet komt: veel servo's zitten bij 0° en 180° al tegen hun eind aan, en blijven dan zoemen.

**Oplossing:** kijk of de Lego-as ergens tegenaan zit. Zoemt hij alleen bij 0° of 180°, probeer dan 10° en 170°. Gebruik dat getal dan ook in de volgende lessen, overal waar 0 of 180 staat. Wordt de servo warm, zet je robot dan meteen uit en zoek wat het asje tegenhoudt. Draai het asje ook nooit met de hand terwijl de robot aan staat: daar kunnen de tandwieltjes in de servo kapot van gaan.

**Zelf vinden:** haal alles van de as af. Draait de servo dan wel? Dan zat er iets in de weg.

</Probleem>

<Probleem titel="De servo doet helemaal niets.">

**Oorzaak:** de servo krijgt geen signaal of geen stroom.

**Oplossing:** loop deze punten na:

- zit de oranje draad op het signaal van **D9**, en de bruine op GND? Een omgekeerde stekker werkt niet;
- staat er in het blok **Servo 9**, en niet een ander getal? Een nieuw servo-blok begint op **Servo 2**.

</Probleem>

<Probleem titel="Het asje beweegt één keer, en daarna niet meer.">

**Oorzaak:** de servo-blokken staan direct in het Leaphy-blok, en dat voert zijn blokken maar één keer uit.

**Oplossing:** zet de servo-blokken in **herhaal voor altijd**.

</Probleem>

<Probleem titel="De servo trekt te weinig kracht, of de robot doet vreemd als de servo beweegt.">

**Oorzaak:** misschien krijgt de servo via alleen de usb-kabel te weinig stroom. Een servo die kracht moet zetten, heeft veel stroom nodig.

**Oplossing:** vraag je docent of er een adapter of batterij bij je robot hoort. Steek die in de aansluiting voor de stroom op het shield, zet **ON/OFF** aan en kijk of het beter gaat.

</Probleem>

<Voorspel soort="Controlevraag" vraag="Het programma Heen en weer zet het asje op 0° en daarna op 90°. Welk deel van een hele cirkel draait het asje dan elke keer?">
  <Keuze uitleg="Een halve cirkel is het hele stuk van 0° tot 180°. Het asje stopt al eerder.">Een halve cirkel</Keuze>
  <Keuze goed uitleg="Een halve cirkel is 180°, en 90° is daar de helft van.">Een kwart cirkel</Keuze>
  <Keuze uitleg="Heen en terug gaat twee keer over hetzelfde stukje. Het asje draait nooit helemaal rond.">Een hele cirkel, want het asje gaat heen en terug</Keuze>
  <Uitleg>

Een kwart cirkel. Van 0° tot 180° is een halve cirkel. Van 0° tot 90° is de helft daarvan, en de helft van een halve cirkel is een kwart.

  </Uitleg>
</Voorspel>

Draait het asje? Dan laat je de servo nu [slaan als hij een bal ziet](bal-slaan).
