---
sidebar_position: 7
---
import Blokken from '@site/src/components/Blokken';
import servoOp90 from './blokken/servo-op-90.json';
import heenEnWeer from './blokken/servo-heen-en-weer.json';

# Bouwen

Je sensor ziet de bal en je servo slaat. Nu bouw je er de Click Golfer van Lego omheen. Hieronder zie je eerst welke stukjes je nodig hebt. Daarna bouw je hem stap voor stap in elkaar: eerst de toren met de servo en het tandwiel. Dat test je, en pas als het werkt, bouw je de arm.

:::tip
Twijfel je hoe een onderdeel eruitziet of waar het komt? Bekijk het [3D-model op de intropagina](intro). Je kunt het draaien en zoomen.
:::

## Onderdelenlijst

Dit heb je nodig: **46 Lego Technic-stukjes** plus de **Leaphy-servo**.

| Aantal | Onderdeel | Kleur | BrickLink-nr |
|:---:|---|---|---|
| 12 | Technic-pin met lange wrijvingsribbels | Zwart | 4459 |
| 4 | Liftarm gebogen 1 × 9 (6–4) | Zwart | 6629 |
| 4 | Pin zonder wrijvingsribbels | Geel | 3673 |
| 4 | Liftarm dik 1 × 15 (met 'LO'/'HI'-sticker) | Donkergrijs | 32278pb038 |
| 3 | As 1L met pin (met wrijvingsribbels) | Blauw | 43093 |
| 2 | Liftarm gebogen L-vorm 2 × 4 | Zwart | 32140 |
| 2 | Pin 3L zonder wrijvingsribbels | Blauw | 32556 |
| 2 | As 1L met pin (zonder wrijvingsribbels) | Beige (tan) | 3749 |
| 2 | Haakse as-pin-verbinder | Zwart | 6536 |
| 1 | Bus 1/2 (glad) | Lichtgrijs | 4265c |
| 1 | Liftarm dik 1 × 5 | Zwart | 32316 |
| 1 | Liftarm dun 1 × 4 (met asgaten) | Wit | 32449 |
| 1 | Liftarm dik 1 × 3 | Zwart | 32523 |
| 1 | Liftarm dik 1 × 7 | Zwart | 32524 |
| 1 | As 4L | Lichtgrijs | 3705 |
| 1 | As 6L | Rood | 3706 |
| 1 | Haakse as-pin-verbinder 3L (2 pingaten) | Zwart | 42003 |
| 1 | Frame-liftarm dik 5 × 7 (open midden) | Lichtgrijs | 64179 |
| 1 | Pin 3L met wrijvingsribbels | Blauw | 6558 |
| 1 | Tandwiel 16 tanden (met asgat) | Lichtgrijs | 94925 |
| 1 | Servo (Leaphy) | Donker nougat | – |

Wil je alle stukjes in één keer bestellen? <a href="/click_golfer/onderdelenlijst.csv" download>Download de onderdelenlijst (CSV)</a> en importeer die in [BrickLink](https://www.bricklink.com).

## De toren

In stap 4 komt de servo in de toren. Zet je robot eerst uit met de knop **ON/OFF**. De draden van de servo mogen aan het shield blijven zitten. Haal je ze toch los, sluit ze dan **vóór stap 11** weer aan zoals bij [de servo](servo): oranje op het signaal van **D9**. Bij stap 11 zet je de servo met een programma op 90°, en dat lukt alleen als hij aangesloten is.

![Uitsnede van het schema: de servo met de bruine draad op GND, de rode op 5V en de oranje op het signaal van D9.](@site/static/fritzing/click_golfer_servo.png)

Bij elke stap zie je linksboven welke stukjes je erbij pakt. Wat nieuw is, heeft een rode rand.

**Let op bij stap 4:** zet de servo zo in de toren dat het snoertje van de motor **omhoog** wijst, zoals het werkboek zegt.

<figure>
  <img src="/click_golfer/bouwen/stap-01.jpg" width="600" alt="Bouwstap 1: Het lichtgrijze frame van 5 bij 7 gaten met een open midden. Dit is de voet." />
  <figcaption>Stap 1</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-02.jpg" width="600" alt="Bouwstap 2: Vier zwarte pinnen in de gaten aan de binnenkant van het frame." />
  <figcaption>Stap 2</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-03.jpg" width="600" alt="Bouwstap 3: Twee lange zwarte balken van 15 gaten staan rechtop op het frame." />
  <figcaption>Stap 3</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-04.jpg" width="600" alt="Bouwstap 4: De oranje servo zit met vier blauwe pinnen tussen de twee balken. Een briefje zegt: het snoertje van de motor moet omhoog." />
  <figcaption>Stap 4</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-05.jpg" width="600" alt="Bouwstap 5: Twee zwarte pinnen bovenin de twee balken." />
  <figcaption>Stap 5</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-06.jpg" width="600" alt="Bouwstap 6: Een zwarte balk van 5 gaten ligt bovenop de twee balken en verbindt ze." />
  <figcaption>Stap 6</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-07.jpg" width="600" alt="Bouwstap 7: Nog twee lange zwarte balken van 15 gaten aan de voorkant, over de servo heen." />
  <figcaption>Stap 7</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-08.jpg" width="600" alt="Bouwstap 8: Een lichtgrijs busje en twee zwarte pinnen bovenaan de toren." />
  <figcaption>Stap 8</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-09.jpg" width="600" alt="Bouwstap 9: Twee gebogen zwarte balken aan de zijkanten van de toren." />
  <figcaption>Stap 9</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-10.jpg" width="600" alt="Bouwstap 10: Een grijze as van 6 gaten gaat door het midden, bij de servo." />
  <figcaption>Stap 10</figcaption>
</figure>

:::caution[Eerst de servo op 90°]
In stap 11 zet je het tandwiel op de as van de servo. Staat de servo dan in een willekeurige stand, dan klopt 0° of 90° later niet meer met de stand van de arm: de arm slaat te ver door, of haalt de bal niet.

Kijk daarom eerst of de servo op het signaal van **D9** zit, en upload dan dit programma. De servo draait naar 90°, precies het midden, en blijft daar staan. Zet je robot daarna uit en zet pas dan het tandwiel erop.

<Blokken programma={servoOp90} beschrijving="Het Leaphy-blok met daarin Servo 9 op 90." />
:::

<figure>
  <img src="/click_golfer/bouwen/stap-11.jpg" width="600" alt="Bouwstap 11: Het grijze tandwiel komt op de as van de servo." />
  <figcaption>Stap 11</figcaption>
</figure>

## Eerst testen: alleen het tandwiel

De servo zit nu in de toren, met het tandwiel erop. De arm is er nog niet, en dat is precies goed om te testen. Draait er straks iets niet goed met de hele arm eraan, dan weet je niet of het aan de servo ligt, aan het tandwiel of aan de arm. Met alleen een tandwiel zie je het meteen.

Zet je robot aan en upload het programma uit [de servo](servo) dat heen en weer draait:

<Blokken programma={heenEnWeer} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 0, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms." />

Kijk naar het tandwiel en loop deze vragen langs:

1. Draait het tandwiel steeds een kwart rondje heen en weer?
2. Draait het soepel, zonder te zoemen, te trillen of te haperen?
3. Zit het tandwiel vast op de as, of slipt het?

Is het antwoord drie keer ja, dan werkt je servo in de toren. Upload dan weer het programma **Servo 9 op 90** van hierboven, zodat de servo in het midden staat, en zet je robot uit. Pas dan bouw je verder.

Gaat er iets mis? Haal dan eerst het tandwiel eraf en kijk of het asje van de servo los wel draait. Bij [de servo](servo) staat onder **Er gaat iets mis** wat je dan doet. Zoemt hij alleen met het tandwiel erop, dan zit het tandwiel ergens tegenaan: kijk of het vrij kan draaien.

## De arm

Nu bouw je de arm aan het tandwiel. Draai het tandwiel tijdens het bouwen niet met de hand: dan staat de servo niet meer op 90°.

<figure>
  <img src="/click_golfer/bouwen/stap-12.jpg" width="600" alt="Bouwstap 12: Een lichtgrijs busje en een zwarte verbinder aan de voorkant, bij het tandwiel." />
  <figcaption>Stap 12</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-13.jpg" width="600" alt="Bouwstap 13: Twee zwarte pinnen in de verbinder." />
  <figcaption>Stap 13</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-14.jpg" width="600" alt="Bouwstap 14: Een gebogen zwarte balk aan de voorkant, schuin naar beneden." />
  <figcaption>Stap 14</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-15.jpg" width="600" alt="Bouwstap 15: Twee zwarte pinnen aan het uiteinde van de gebogen balk." />
  <figcaption>Stap 15</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-16.jpg" width="600" alt="Bouwstap 16: Een zwarte balk van 7 gaten, schuin naar beneden aan de voorkant." />
  <figcaption>Stap 16</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-17.jpg" width="600" alt="Bouwstap 17: Twee zwarte pinnen onderaan die balk." />
  <figcaption>Stap 17</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-18.jpg" width="600" alt="Bouwstap 18: Een gebogen zwarte balk onderaan, bijna bij de grond." />
  <figcaption>Stap 18</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-19.jpg" width="600" alt="Bouwstap 19: Twee zwarte pinnen in de onderkant van de gebogen balk." />
  <figcaption>Stap 19</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-20.jpg" width="600" alt="Bouwstap 20: Een zwarte verbinder aan de schuine arm vooraan." />
  <figcaption>Stap 20</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-21.jpg" width="600" alt="Bouwstap 21: Twee grijze assen met een pin aan de twee zijarmen." />
  <figcaption>Stap 21</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-22.jpg" width="600" alt="Bouwstap 22: Twee zwarte L-vormige balken aan de uiteinden van de zijarmen." />
  <figcaption>Stap 22</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-23.jpg" width="600" alt="Bouwstap 23: Twee zwarte pinnen in de L-vormige balken." />
  <figcaption>Stap 23</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-24.jpg" width="600" alt="Bouwstap 24: Twee zwarte haakse verbinders op die pinnen." />
  <figcaption>Stap 24</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-25.jpg" width="600" alt="Bouwstap 25: Een zwarte pin en een lichtgrijze balk van 4 gaten bovenop de toren." />
  <figcaption>Stap 25</figcaption>
</figure>

<figure>
  <img src="/click_golfer/bouwen/stap-26.jpg" width="600" alt="Bouwstap 26: Een grijze as van 4 gaten gaat door de verbinders. De Click Golfer is klaar." />
  <figcaption>Stap 26</figcaption>
</figure>

*Bouwstappen: ClickGolfer-werkboek, ©Stichting Leaphy.*

Staat je Golfer? Dan maak je nu [de houten baan](hout).
