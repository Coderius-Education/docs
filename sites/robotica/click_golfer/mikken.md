---
sidebar_position: 9
---
import Blokken from '@site/src/components/Blokken';
import mikken from './blokken/mikken.json';

# Mikken

Een echte golfer slaat niet meteen: hij zwaait eerst rustig heen en weer om te mikken. Dat leer je je Click Golfer nu ook, met een **variabele**.

## Een variabele

Een **variabele** is een doosje met een naam, waar een getal in zit. Dat getal kan je programma veranderen. Klik in Easybloqs op de groep **Variabelen** en daarna op **Variabele maken...**. Noem hem `hoek`.

Drie blokken heb je nodig:

- **stel hoek in op 0**: stop het getal 0 in het doosje;
- **wijzig hoek met 1**: tel 1 op bij wat erin zit;
- **hoek**: het getal dat er nu in zit. Dit blok zet je op de plek van een getal, bijvoorbeeld in **Servo 9 op …**.

## Het programma

De sensor zit nog op **A0** en de servo op **D9**, net als bij [Zie de bal, sla de bal](bal-slaan). Ligt er een bal, dan zet de robot de arm op 0°. Daarna gaat de arm langzaam naar 50° en weer terug: dat is het mikken. Dan pas slaat hij.

<Blokken programma={mikken} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan: Servo 9 op 0, duurt 500 ms, stel hoek in op 0. Herhaal 50 keer: Servo 9 op hoek, duurt 10 ms, wijzig hoek met 1. Herhaal 50 keer: Servo 9 op hoek, duurt 10 ms, wijzig hoek met -1. Daarna Servo 9 op 90, duurt 500 ms, en duurt 2000 ms." />

**herhaal 50 keer** uit **Denk stappen** doet de blokken erin vijftig keer achter elkaar. Elke keer gaat de arm naar de stand in `hoek`, wacht 10 ms, en komt er 1 bij.

<details>
<summary>Voorspel: welk getal zit er in hoek na het eerste herhaal-blok?</summary>

50. Het begint op 0 en er komt vijftig keer 1 bij. Het tweede herhaal-blok haalt er vijftig keer 1 af, en dan staat `hoek` weer op 0.

</details>

## Probeer het zelf

Laat je Golfer sneller mikken, en daarna verder.

<details>
<summary>Tip</summary>

Hoe snel de arm gaat, hangt af van de wachttijd in **duurt**. Hoe ver hij gaat, hangt af van hoe vaak er 1 bij komt.

</details>

<details>
<summary>Antwoord</summary>

Sneller: maak **duurt 10 ms** in beide herhaal-blokken kleiner, bijvoorbeeld 5 ms. Verder: maak in beide herhaal-blokken de 50 groter, bijvoorbeeld 70. Doe het in beide, anders komt de arm niet op 0 terug.

</details>

## Er gaat iets mis

Tijdens het mikken staat de arm stil. Pas bij het slaan beweegt hij.

**Oorzaak:** in **Servo 9 op …** staat een getal in plaats van het blok `hoek`, of **wijzig hoek** ontbreekt. De arm krijgt dan vijftig keer dezelfde stand.

**Oplossing:** sleep het blok `hoek` op de plek van het getal in **Servo 9 op …**, en kijk of **wijzig hoek met 1** in het herhaal-blok staat.

<details>
<summary>Controlevraag</summary>

Waarom gebruik je in **Servo 9 op …** het blok `hoek`, en niet een getal?

</details>

<details>
<summary>Antwoord</summary>

Een getal is altijd hetzelfde. `hoek` verandert elke keer dat het herhaal-blok rondgaat, en zo schuift de arm stukje voor stukje op.

</details>

Mikt je Golfer? Je programma is nu flink lang. Daarom geef je de blokken voor het mikken en het slaan nu [een naam](subprogrammas).
