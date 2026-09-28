---
sidebar_position: 10
---
import Blokken from '@site/src/components/Blokken';
import subprogrammas from './blokken/subprogrammas.json';
import metAchter from './blokken/subprogrammas-achter.json';

# Een naam voor je blokken

Je programma uit [Mikken](mikken) werkt, maar het is lang geworden. Als je er snel naar kijkt, zie je niet meteen wat de robot doet. Daarom geef je een groepje blokken een naam: een **subprogramma**. Daarna zet je in je programma alleen nog die naam.

## Een subprogramma maken

Je maakt twee subprogramma's: `mikken` en `slaan`. Sleep je een blok, dan gaan **alle blokken eronder mee**. Daarom werk je van onder naar boven.

1. Klik op de groep **Eigen blokken** en sleep twee keer het blok **Subprogramma** naar een lege plek. Noem het ene `mikken` en het andere `slaan`.
2. Sleep **duurt 2000 ms**, het onderste blok in **als … dan**, even opzij naar een lege plek.
3. Sleep **Servo 9 op 90** in het subprogramma `slaan`. **duurt 500 ms** eronder gaat vanzelf mee.
4. Sleep **stel hoek in op 0** in het subprogramma `mikken`. De twee **herhaal 50 keer**-blokken gaan vanzelf mee.
5. Klik met de rechtermuisknop op het subprogramma `mikken` en kies **Maak "mikken"**. Je krijgt een blok **mikken**. Doe hetzelfde voor `slaan`.
6. Zet in **als … dan**, onder **duurt 500 ms**: eerst het blok **mikken**, dan **slaan**, en dan **duurt 2000 ms** terug.

## Het programma

De sensor zit nog op **A0** en de servo op **D9**.

<Blokken programma={subprogrammas} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, mikken, slaan en duurt 2000 ms. Onder het Leaphy-blok staan twee subprogramma's. mikken: stel hoek in op 0, herhaal 50 keer Servo 9 op hoek, duurt 10 ms, wijzig hoek met 1, en herhaal 50 keer hetzelfde met wijzig hoek met -1. slaan: Servo 9 op 90, duurt 500 ms." />

Lees nu alleen het Leaphy-blok: *als er een bal ligt, dan de servo op 0, mikken, slaan, en wachten.* Zo lees je in één keer wat de robot doet. Wil je weten hoe hij mikt, dan kijk je in het subprogramma `mikken`.

<details>
<summary>Voorspel: doet je robot nu iets anders dan bij Mikken?</summary>

Nee. De robot voert precies dezelfde blokken uit, in dezelfde volgorde. Komt hij het blok **mikken** tegen, dan doet hij alles wat in het subprogramma `mikken` staat, en gaat daarna verder met **slaan**.

</details>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

## Probeer het zelf

Maak ook een subprogramma `achter`, voor de blokken die de arm naar 0° zetten.

<details>
<summary>Tip</summary>

Het gaat om de twee blokken bovenaan in **als … dan**: **Servo 9 op 0** en **duurt 500 ms**. Sleep je **Servo 9 op 0**, dan gaat alles eronder mee. Sleep daarom eerst het blok **mikken**, met alles eronder, even opzij.

</details>

<details>
<summary>Antwoord</summary>

1. Sleep het blok **mikken** in **als … dan** opzij. **slaan** en **duurt 2000 ms** gaan mee.
2. Maak een subprogramma `achter` en sleep **Servo 9 op 0** erin. **duurt 500 ms** gaat mee.
3. Kies met de rechtermuisknop **Maak "achter"**, zet het blok **achter** in **als … dan**, en zet het opzij gezette stapeltje eronder.

<Blokken programma={metAchter} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan achter, mikken, slaan en duurt 2000 ms. Daaronder de subprogramma's achter (Servo 9 op 0, duurt 500 ms), mikken en slaan (Servo 9 op 90, duurt 500 ms)." />

Het Leaphy-blok leest nu als een zin: *achter, mikken, slaan*.

</details>

## Er gaat iets mis

**Je hebt het subprogramma `slaan` gemaakt, maar de arm slaat niet meer.**

**Oorzaak:** een subprogramma doet pas iets als het blok met zijn naam in je programma staat. Je sleepte de servo-blokken naar het subprogramma, maar zette het blok **slaan** niet terug.

**Oplossing:** klik met de rechtermuisknop op het subprogramma `slaan`, kies **Maak "slaan"**, en zet het blok onder **mikken**.

**In het subprogramma `mikken` staan ook de blokken van het slaan.**

**Oorzaak:** je sleepte **stel hoek in op 0** naar `mikken` terwijl de blokken van het slaan er nog onder zaten. Alles wat onder een blok vastzit, gaat mee.

**Oplossing:** sleep **Servo 9 op 90** uit `mikken` naar `slaan`. De blokken eronder gaan weer mee. Sleep **duurt 2000 ms** daarna terug onder **slaan** in **als … dan**.

<details>
<summary>Controlevraag</summary>

Je wilt de slag harder maken. Waar verander je de 90, en hoe vaak?

</details>

<details>
<summary>Antwoord</summary>

Eén keer, in het subprogramma `slaan`. Je hoeft niet in het lange programma te zoeken welk **Servo**-blok de slag is: het staat onder de naam `slaan`. Gebruik je **slaan** later op meer plekken, dan geldt de nieuwe stand overal.

</details>

Klaar? Kijk dan bij de [Extra's](extras) wat je er nog bij kunt maken.
