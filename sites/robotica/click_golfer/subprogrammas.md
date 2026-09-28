---
sidebar_position: 10
---
import Blokken from '@site/src/components/Blokken';
import subprogrammas from './blokken/subprogrammas.json';
import metAchter from './blokken/subprogrammas-achter.json';

# Een naam voor je blokken

Je programma uit [Mikken](mikken) werkt, maar het is lang geworden. Als je er snel naar kijkt, zie je niet meteen wat de robot doet. Daarom geef je een groepje blokken een naam: een **subprogramma**. Daarna zet je in je programma alleen nog die naam.

## Een subprogramma maken

Je maakt twee subprogramma's: `mikken` en `slaan`.

1. Pak in Easybloqs het blok **Subprogramma** en noem het `mikken`.
2. Sleep de blokken voor het mikken uit je programma erin: **stel hoek in op 0** en de twee **herhaal 50 keer**-blokken.
3. Klik met de rechtermuisknop op het subprogramma en kies **Maak "mikken"**. Je krijgt een blok **mikken**. Zet dat in je programma, op de plek waar de blokken eerst stonden.
4. Doe hetzelfde voor `slaan`, met **Servo 9 op 90** en **duurt 500 ms**.

## Het programma

De sensor zit nog op **A0** en de servo op **D9**.

<Blokken programma={subprogrammas} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, mikken, slaan en duurt 2000 ms. Onder het Leaphy-blok staan twee subprogramma's. mikken: stel hoek in op 0, herhaal 50 keer Servo 9 op hoek, duurt 10 ms, wijzig hoek met 1, en herhaal 50 keer hetzelfde met wijzig hoek met -1. slaan: Servo 9 op 90, duurt 500 ms." />

Lees nu alleen het Leaphy-blok: *als er een bal ligt, dan arm naar achter, mikken, slaan, en wachten.* Zo lees je in één keer wat de robot doet. Wil je weten hoe hij mikt, dan kijk je in het subprogramma `mikken`.

<details>
<summary>Voorspel: doet je robot nu iets anders dan bij Mikken?</summary>

Nee. De robot voert precies dezelfde blokken uit, in dezelfde volgorde. Komt hij het blok **mikken** tegen, dan doet hij alles wat in het subprogramma `mikken` staat, en gaat daarna verder met **slaan**.

</details>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

## Probeer het zelf

Maak ook een subprogramma `achter`, voor de blokken die de arm naar 0° zetten.

<details>
<summary>Klik hier voor een tip!</summary>

Het gaat om de twee blokken bovenaan in **als … dan**: **Servo 9 op 0** en **duurt 500 ms**.

</details>

<details>
<summary>Klik hier voor het antwoord!</summary>

<Blokken programma={metAchter} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan achter, mikken, slaan en duurt 2000 ms. Daaronder de subprogramma's achter (Servo 9 op 0, duurt 500 ms), mikken en slaan (Servo 9 op 90, duurt 500 ms)." />

Het Leaphy-blok leest nu als een zin: *achter, mikken, slaan*.

</details>

## Er gaat iets mis

Je hebt het subprogramma `slaan` gemaakt, maar de arm slaat niet meer.

**Oorzaak:** een subprogramma doet pas iets als het blok met zijn naam in je programma staat. Je sleepte de servo-blokken naar het subprogramma, maar zette het blok **slaan** niet terug.

**Oplossing:** klik met de rechtermuisknop op het subprogramma `slaan`, kies **Maak "slaan"**, en zet het blok onder **mikken**.

<details>
<summary>Controlevraag</summary>

Je wilt de slag harder maken. Waar verander je de 90, en hoe vaak?

</details>

<details>
<summary>Antwoord</summary>

Eén keer, in het subprogramma `slaan`. Overal waar het blok **slaan** staat, gebruikt de robot die nieuwe stand.

</details>

Klaar? Kijk dan bij de [Extra's](extras) wat je er nog bij kunt maken.
