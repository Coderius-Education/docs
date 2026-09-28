---
sidebar_position: 4
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

Zet het programma op je robot en kijk of je voorspelling klopt.

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

De arm trilt, of beweegt bijna niet.

**Oorzaak:** er staat geen **duurt** tussen de servo-blokken. De robot geeft dan meteen de volgende stand, nog voordat de arm bij de vorige is.

**Oplossing:** zet na elk **Servo**-blok een **duurt**, bijvoorbeeld 1000 ms.

Beweegt de arm helemaal niet, kijk dan of de oranje draad op het signaal van **D9** zit.

<details>
<summary>Controlevraag</summary>

Je verandert **Servo 9 op 90** in **Servo 9 op 200**. Wat gebeurt er?

</details>

<details>
<summary>Antwoord</summary>

De servo kan niet verder dan 180°. Hij gaat daarom naar 180°, de grootste stand die hij kan.

</details>

Beweegt de arm? Dan laat je hem nu [slaan als hij een bal ziet](bal-slaan).
