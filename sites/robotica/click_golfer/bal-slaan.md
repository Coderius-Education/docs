---
sidebar_position: 5
---
import Blokken from '@site/src/components/Blokken';
import balSlaan from './blokken/bal-slaan.json';

# Zie de bal, sla de bal

Je robot ziet de bal met [de IR-sensor](ir-sensor), en beweegt de arm met [de servo](servo). Nu zet je die twee samen: ligt er een bal, dan slaat de arm.

## Subprogramma's

Slaan is twee dingen: de arm naar voren, en weer terug naar achter. Die blokken geef je een naam, in een **subprogramma**. Daarna hoef je alleen nog de naam te gebruiken.

1. Pak in Easybloqs het blok **Subprogramma** en noem het `slaan`.
2. Zet daarin **Servo 9 op 90** en **duurt 500 ms**.
3. Klik met de rechtermuisknop op het subprogramma en kies **Maak "slaan"**. Je krijgt een blok **slaan** dat je in je programma kunt zetten.
4. Maak op dezelfde manier een subprogramma `achter`, met **Servo 9 op 0**.

## Het programma

<Blokken programma={balSlaan} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 groter is dan 300, dan slaan, achter en duurt 2000 ms. Onder het Leaphy-blok staan twee subprogramma's: achter (Servo 9 op 0, duurt 500 ms) en slaan (Servo 9 op 90, duurt 500 ms)." />

<details>
<summary>Voorspel: wat doet je robot als er géén bal ligt?</summary>

Niets. Het getal van de sensor is dan kleiner dan 300, dus de blokken in **als … dan** slaat de robot over. Hij kijkt wel steeds opnieuw, want alles staat in **herhaal voor altijd**.

</details>

Gebruik als grens het getal dat jij bij de IR-sensor hebt gekozen. Leg een bal voor de sensor: de arm slaat en gaat terug.

## Waarom wachten?

Na het slaan wacht de robot twee seconden: **duurt 2000 ms**. Op de baan rolt de bal na een slag soms terug. Zonder wachttijd ziet de sensor die bal meteen weer, en slaat de arm nog een keer terwijl de bal nog rolt.

## Er gaat iets mis

De arm blijft slaan, ook als er geen bal ligt.

**Oorzaak:** je grens is te laag. Het getal zonder bal is al groter dan de grens.

**Oplossing:** kijk nog eens naar de twee getallen die je bij de IR-sensor opschreef, en kies een grens die daar netjes tussenin ligt.

<details>
<summary>Controlevraag</summary>

Wat is het voordeel van een subprogramma `slaan`, in plaats van de servo-blokken zelf in **als … dan** te zetten?

</details>

<details>
<summary>Antwoord</summary>

Je programma blijft kort en je leest meteen wat het doet: "als er een bal ligt, dan slaan en achter". Wil je de slag veranderen, dan pas je alleen het subprogramma aan.

</details>

Werkt het op tafel? Dan [bouw je de Golfer van Lego](bouwen).
