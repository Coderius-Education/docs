---
sidebar_position: 6
---
import Blokken from '@site/src/components/Blokken';
import balSlaan from './blokken/bal-slaan.json';

# Zie de bal, sla de bal

Je robot ziet de bal met [de IR-sensor](ir-sensor), en beweegt de arm met [de servo](servo). Nu zet je die twee samen: ligt er een bal, dan slaat de arm.

## Het programma

Je kent alle blokken al. Nieuw is alleen dat de servo-blokken nu in **als … dan** staan.

<Blokken programma={balSlaan} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 groter is dan 300, dan Servo 9 op 90, duurt 500 ms, Servo 9 op 0, duurt 2000 ms." />

<details>
<summary>Voorspel: wat doet je robot als er géén bal ligt?</summary>

Niets. Het getal van de sensor is dan kleiner dan 300, dus de blokken in **als … dan** slaat de robot over. Hij kijkt wel steeds opnieuw, want alles staat in **herhaal voor altijd**.

</details>

Gebruik als grens het getal dat jij bij de IR-sensor hebt gekozen. Klik op **Upload naar robot** en leg een bal voor de sensor: de arm slaat naar 90° en gaat terug naar 0°.

## Waarom wachten?

Na het terugzetten wacht de robot twee seconden: **duurt 2000 ms**. Op de baan rolt de bal na een slag soms terug. Zonder wachttijd ziet de sensor die bal meteen weer, en slaat de arm nog een keer terwijl de bal nog rolt.

## Er gaat iets mis

De arm blijft slaan, ook als er geen bal ligt.

**Oorzaak:** je grens is te laag. Het getal zonder bal is al groter dan de grens.

**Oplossing:** kijk nog eens naar de twee getallen die je bij de IR-sensor opschreef, en kies een grens die daar netjes tussenin ligt.

<details>
<summary>Controlevraag</summary>

Je haalt **herhaal voor altijd** weg, zodat **als … dan** direct in het Leaphy-blok staat. Je legt een bal voor de sensor. Wat gebeurt er?

</details>

<details>
<summary>Antwoord</summary>

Niets. Het Leaphy-blok loopt maar één keer, direct na het uploaden. Toen lag er nog geen bal, en daarna kijkt de robot niet meer.

</details>

Werkt het op tafel? Dan [bouw je de Golfer van Lego](bouwen).
