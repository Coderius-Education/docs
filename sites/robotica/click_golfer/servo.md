---
sidebar_position: 5
---
import Blokken from '@site/src/components/Blokken';
import heenEnWeer from './blokken/servo-heen-en-weer.json';
import drieHoeken from './blokken/servo-drie-hoeken.json';

# De servo

De arm van je Click Golfer beweegt met een **servo**: een motortje dat naar een stand draait die jij kiest, en daar blijft staan.

## Aansluiten

Zet je robot uit met de knop **ON/OFF**. Sluit de servo aan op de rij van **D9** op het [shield](microcontroller):

| Draad van de servo | Komt op |
|---|---|
| bruin | GND |
| rood | 5V |
| oranje | het signaal van **D9** |

## Graden

Een servo draait een halve cirkel. Die halve cirkel is verdeeld in 180 stukjes: **graden**. Je schrijft dat met een klein rondje, zoals 90°.

| Stand | Waar staat de arm? |
|:---:|---|
| 0° | helemaal naar één kant |
| 90° | recht in het midden |
| 180° | helemaal naar de andere kant |

Alles daartussen kan ook, zoals 45° of 135°.

## Heen en weer

Het blok **Servo 9 op 90** zet de servo op pin 9 in de stand van 90 graden. Dit programma laat de arm heen en weer gaan:

<Blokken programma={heenEnWeer} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 0, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms." />

<details>
<summary>Voorspel: wat doet de arm?</summary>

De arm gaat naar 0°, wacht een seconde, gaat naar 90°, wacht weer een seconde, en begint opnieuw. Dat blijft hij doen, want alles staat in **herhaal voor altijd**.

</details>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

## Probeer het zelf

Laat de arm langs drie standen gaan: 45°, 90° en 135°, met steeds een seconde ertussen.

<details>
<summary>Klik hier voor een tip!</summary>

Je hebt drie keer het blok **Servo 9 op …** nodig, en na elk blok een **duurt 1000 ms**.

</details>

<details>
<summary>Klik hier voor het antwoord!</summary>

<Blokken programma={drieHoeken} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 45, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms, Servo 9 op 135, duurt 1000 ms." />

</details>

## Er gaat iets mis

**De arm trilt, of beweegt bijna niet.**

**Oorzaak:** er staat geen **duurt** tussen de servo-blokken. De robot geeft dan meteen de volgende stand, nog voordat de arm bij de vorige is.

**Oplossing:** zet na elk **Servo**-blok een **duurt**, bijvoorbeeld 1000 ms.

**De servo zoemt of trilt, maar draait niet.**

**Oorzaak:** er zit iets in de weg, zodat de arm niet verder kan. Of de servo moet naar een stand waar hij niet komt: veel servo's zitten bij 0° en 180° al tegen hun eind aan, en blijven dan zoemen.

**Oplossing:** kijk of de arm ergens tegenaan zit. Zoemt hij alleen bij 0° of 180°, probeer dan 10° en 170°.

**Zelf vinden:** haal alles van de as af. Draait de servo dan wel? Dan zat er iets in de weg.

**De servo doet helemaal niets.**

**Oorzaak:** de servo krijgt geen signaal of geen stroom.

**Oplossing:** loop deze punten na:

- zit de oranje draad op het signaal van **D9**, en de bruine op GND? Een omgekeerde stekker werkt niet;
- staat er in het blok **Servo 9**, en niet een ander getal?
- beweegt hij één keer en daarna niet meer? Dan ontbreekt **herhaal voor altijd**.

**De servo trekt te weinig kracht, of de robot doet vreemd als de servo beweegt.**

**Oorzaak:** misschien krijgt de servo via alleen de usb-kabel te weinig stroom. Een servo die kracht moet zetten, vraagt veel.

**Oplossing:** probeer of het beter gaat als je robot stroom krijgt via de aansluiting op het shield, met de knop **ON/OFF** aan. Vraag je docent welke adapter of batterij erbij hoort.

**De servo wordt warm.**

**Oorzaak:** hij duwt tegen iets aan en komt niet waar hij heen moet.

**Oplossing:** zet je robot meteen uit, en zoek wat de arm tegenhoudt. Draai de arm ook nooit met de hand terwijl de robot aan staat: daar kunnen de tandwieltjes in de servo kapot van gaan.

<details>
<summary>Controlevraag</summary>

Je verandert **Servo 9 op 90** in **Servo 9 op 200**. Wat gebeurt er?

</details>

<details>
<summary>Antwoord</summary>

De servo kan niet verder dan 180°. Hij gaat daarom naar 180°, de grootste stand die hij kan.

</details>

Beweegt de arm? Dan laat je hem nu [slaan als hij een bal ziet](bal-slaan).
