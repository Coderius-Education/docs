---
sidebar_position: 9
---
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import Blokken from '@site/src/components/Blokken';
import Keuzekaarten from '@site/src/components/Keuzekaarten';
import servoOp90 from './blokken/servo-op-90.json';
import heenEnWeer from './blokken/servo-heen-en-weer.json';

# De arm

Je toren staat op de baan, en de sensor ziet de bal. Nu krijgt je Golfbot een arm. Je kiest zelf hoe je die maakt:

<Keuzekaarten keuzes={[
  { titel: 'De arm namaken', tekst: 'Je volgt de bouwstappen van Leaphy, plaatje voor plaatje. Dan weet je zeker dat alles past.', naar: '#namaken', knop: 'Naar de bouwstappen' },
  { titel: 'De arm zelf maken', tekst: 'Je bedenkt zelf een arm van Lego. Jij bepaalt hoe hij eruitziet, zolang hij aan een paar eisen voldoet.', naar: '#zelf-maken', knop: 'Naar de eisen' },
]} />

Het begin is voor iedereen hetzelfde: eerst zet je de servo in de goede stand en het tandwiel op de as. Daarna ga je verder bij jouw keuze.

## Onderdelenlijst

Maak je de arm na, dan heb je **26 Lego Technic-stukjes** nodig, het tandwiel meegeteld. Maak je hem zelf, dan pak je het tandwiel en verder de stukjes die jij wilt.

<details>
<summary>Welke stukjes heb je nodig om de arm na te maken?</summary>

| Aantal | Onderdeel | Kleur | BrickLink-nr |
|:---:|---|---|---|
| 7 | Technic-pin met lange wrijvingsribbels | Zwart | 4459 |
| 4 | Pin zonder wrijvingsribbels | Zwart | 3673 |
| 2 | Liftarm gebogen 1 × 9 (6–4) | Zwart | 6629 |
| 2 | Liftarm gebogen L-vorm 2 × 4 | Zwart | 32140 |
| 2 | As 1L met pin (zonder wrijvingsribbels) | Lichtgrijs | 3749 |
| 2 | Haakse as-pin-verbinder | Zwart | 6536 |
| 1 | Bus 1/2 (glad) | Lichtgrijs | 4265c |
| 1 | Liftarm dun 1 × 4 (met asgaten) | Lichtgrijs | 32449 |
| 1 | Liftarm dik 1 × 3 | Zwart | 32523 |
| 1 | Liftarm dik 1 × 7 | Zwart | 32524 |
| 1 | As 4L | Lichtgrijs | 3705 |
| 1 | Haakse as-pin-verbinder 3L (2 pingaten) | Zwart | 42003 |
| 1 | Tandwiel 16 tanden (met asgat) | Lichtgrijs | 94925 |

</details>

{/* Een kale <a id> telt Docusaurus niet als anker; een Link met id wel. De marge houdt de titel onder de navigatiebalk vandaan. */}
<Link id="servo-op-90" style={{scrollMarginTop: 'calc(var(--ifm-navbar-height) + 0.5rem)'}} />

:::caution[Eerst de servo op 90°]
Straks komt de arm op de as, en het grijze tandwiel op diezelfde as grijpt in het tandwiel van de servo. Staat de servo dan in een willekeurige stand, dan klopt 0° of 90° later niet meer met de stand van de arm: de arm slaat te ver door, of haalt de bal niet.

Kijk daarom eerst of de servo op het signaal van **D9** zit. Zet je robot weer aan met **ON/OFF** en upload dan dit programma. De servo draait naar 90°, precies het midden, en blijft daar staan. Zet je robot daarna uit. Tot de arm op de as zit, moet de servo zo blijven staan: draai de as en het tandwiel niet met de hand.

<Blokken programma={servoOp90} beschrijving="Het Leaphy-blok met daarin Servo 9 op 90." />
:::

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-11.jpg')} width="600" alt="Bouwstap 11: Het grijze tandwiel komt op het uiteinde van de lange as, naast het oranje tandwiel van de servo. De tanden van de twee tandwielen grijpen in elkaar." />
  <figcaption>Stap 11</figcaption>
</figure>

Duw het grijze tandwiel zo ver op de lange as dat het naast het oranje tandwiel van de servo zit, en zijn tanden tussen de tanden van het oranje tandwiel vallen.

## Hoe de servo de arm laat draaien

Kijk nog eens goed naar stap 11. De servo heeft zelf een oranje tandwiel. Het grijze tandwiel zit niet op de servo, maar op de lange as van [stap 10](site:robotica/golfbot/bouwen), en het grijpt met zijn tanden in het oranje tandwiel. Straks komt de arm op diezelfde lange as.

Zo gaat de beweging van de servo naar de arm:

1. De servo draait zijn oranje tandwiel.
2. De tanden van het oranje tandwiel duwen het grijze tandwiel rond.
3. Het grijze tandwiel draait de lange as.
4. De lange as draait de arm.

Zo'n rij die een beweging doorgeeft, heet een **overbrenging**. Werkt er straks iets niet, dan loop je deze vier stappen langs: bij welke stap houdt de beweging op?

<Voorspel vraag="Het oranje tandwiel draait een kwart rondje met de klok mee. Wat doet het grijze tandwiel?">
  <Keuze uitleg="Kijk naar de plek waar de tanden elkaar raken. Gaat de tand van het oranje tandwiel daar omhoog, welke kant op duwt hij dan de tand van het grijze?">Een kwart rondje met de klok mee, net als het oranje</Keuze>
  <Keuze goed uitleg="Waar de tanden elkaar raken, duwt het oranje tandwiel het grijze de andere kant op. En omdat ze allebei 16 tanden hebben, draait het grijze precies even ver.">Een kwart rondje tegen de klok in</Keuze>
  <Keuze uitleg="Dat zou kloppen als het grijze tandwiel half zoveel tanden had als het oranje. Tel ze maar: ze hebben er allebei 16.">Een half rondje tegen de klok in</Keuze>
  <Uitleg>Twee tandwielen die in elkaar grijpen, draaien altijd tegen elkaar in. Hebben ze evenveel tanden, dan draaien ze ook even ver. Daarom draait de arm net zo ver als de servo, maar de andere kant op.</Uitleg>
</Voorspel>

<figure>
  <img src={useBaseUrl('/golfbot/overbrenging.svg')} width="420" alt="Twee tandwielen naast elkaar die in elkaar grijpen: links het oranje tandwiel van de servo, rechts het grijze op de lange as. Een pijl laat zien dat het oranje met de klok mee draait en het grijze tegen de klok in. Aan het midden van het grijze tandwiel hangt de arm recht naar beneden, met de bal ernaast." />
  <figcaption>De overbrenging: de arm draait mee met het grijze tandwiel.</figcaption>
</figure>

Elke tand is een zestiende van een rondje: 22,5°, een kwart van een kwart rondje. Grijpt het grijze tandwiel één tand verder in het oranje, dan staat je arm 22,5° scheef. Dat zie je goed, en zo weet je meteen waar je moet zoeken.

## Eerst testen: alleen het tandwiel

De servo zit nu in de toren, met het tandwiel erop. De arm zit er nog niet aan, dus dit is het moment om te testen. Draait er straks iets niet goed met de hele arm eraan, dan weet je niet of het aan de servo ligt, aan het tandwiel of aan de arm. Met alleen een tandwiel zie je het meteen.

Plak eerst, met je robot nog uit, een klein stukje plakband op een tand van het oranje tandwiel, en een op de tand van het grijze tandwiel die daar precies naast zit. Zo zie je straks of de tanden goed in elkaar blijven grijpen.

Zet je robot weer aan met **ON/OFF** en upload het programma uit [de servo](site:robotica/golfbot/servo) dat heen en weer draait:

<Blokken programma={heenEnWeer} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 0, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms." />

Kijk naar de tandwielen en loop deze vragen langs:

1. Draait het grijze tandwiel steeds een kwart rondje heen en weer, de andere kant op dan het oranje?
2. Draait het soepel, zonder te zoemen, te trillen of te haperen?
3. Zit het grijze tandwiel recht op de as, zonder te wiebelen?

Upload daarna weer het programma **Servo 9 op 90** van hierboven, zodat de servo in het midden staat. Nu de laatste vraag:

4. Zitten de twee stukjes plakband weer precies naast elkaar?

Is het antwoord vier keer ja, dan werkt je overbrenging. Zet je robot uit en laat de plakband zitten: zo kun je het straks met de arm eraan nog eens nakijken. Pas dan maak je de arm.

Gaat er iets mis? Kijk dan bij welke stap van de overbrenging de beweging ophoudt. Draait het oranje tandwiel zelf niet, dan ligt het aan de servo: bij [de servo](site:robotica/golfbot/servo) staat onder **Er gaat iets mis** wat je dan doet. Draait het oranje wel en het grijze niet, of zitten de stukjes plakband niet meer naast elkaar, kijk dan hieronder bij **Er gaat iets mis**. Zoemt de servo alleen met het grijze tandwiel erop, dan zit het tandwiel ergens tegenaan: kijk of het vrij kan draaien.

## Kies je arm

Nu maak je de arm. Ga verder bij jouw keuze: [de arm namaken](#namaken) of [de arm zelf maken](#zelf-maken).

Bij allebei geldt: de servo staat op 90°, en zo moet het blijven tot de arm op de as zit. Draai de as en het tandwiel tijdens het bouwen niet met de hand.

## Keuze 1: de arm namaken \{#namaken}

Staat je servo op 90° en zit het tandwiel erop? Zo niet, begin dan bij [Eerst de servo op 90°](#servo-op-90).

In stap 12 komt de zwarte verbinder op de as, aan de voorkant. Daar komt de arm aan.

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-12.jpg')} width="600" alt="Bouwstap 12: Een lichtgrijs busje en een zwarte verbinder komen aan de voorkant op de as. Aan die verbinder komt de arm." />
  <figcaption>Stap 12</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-13.jpg')} width="600" alt="Bouwstap 13: Twee zwarte pinnen in de verbinder." />
  <figcaption>Stap 13</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-14.jpg')} width="600" alt="Bouwstap 14: Een gebogen zwarte balk aan de voorkant, schuin naar beneden." />
  <figcaption>Stap 14</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-15.jpg')} width="600" alt="Bouwstap 15: Twee zwarte pinnen aan het uiteinde van de gebogen balk." />
  <figcaption>Stap 15</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-16.jpg')} width="600" alt="Bouwstap 16: Een zwarte balk van 7 gaten, schuin naar beneden aan de voorkant." />
  <figcaption>Stap 16</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-17.jpg')} width="600" alt="Bouwstap 17: Twee zwarte pinnen onderaan die balk." />
  <figcaption>Stap 17</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-18.jpg')} width="600" alt="Bouwstap 18: Een gebogen zwarte balk onderaan, bijna bij de grond." />
  <figcaption>Stap 18</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-19.jpg')} width="600" alt="Bouwstap 19: Twee zwarte pinnen in de onderkant van de gebogen balk." />
  <figcaption>Stap 19</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-20.jpg')} width="600" alt="Bouwstap 20: Een zwarte balk van 3 gaten onderaan de schuine arm." />
  <figcaption>Stap 20</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-21.jpg')} width="600" alt="Bouwstap 21: Twee lichtgrijze assen met een pin aan de twee zijarmen." />
  <figcaption>Stap 21</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-22.jpg')} width="600" alt="Bouwstap 22: Twee zwarte L-vormige balken aan de uiteinden van de zijarmen." />
  <figcaption>Stap 22</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-23.jpg')} width="600" alt="Bouwstap 23: Twee zwarte pinnen in de L-vormige balken." />
  <figcaption>Stap 23</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-24.jpg')} width="600" alt="Bouwstap 24: Twee zwarte haakse verbinders op die pinnen." />
  <figcaption>Stap 24</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-25.jpg')} width="600" alt="Bouwstap 25: Een zwarte pin en een lichtgrijze balk van 4 gaten bovenop de toren." />
  <figcaption>Stap 25</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-26.jpg')} width="600" alt="Bouwstap 26: Een lichtgrijze as van 4 gaten gaat door de verbinders. De Click Golfbot is klaar." />
  <figcaption>Stap 26</figcaption>
</figure>

*Bouwstappen: ClickGolfer-werkboek, ©Stichting Leaphy.*

## Keuze 2: de arm zelf maken \{#zelf-maken}

Staat je servo op 90° en zit het tandwiel erop? Zo niet, begin dan bij [Eerst de servo op 90°](#servo-op-90).

Elk ontwerp is goed, als je arm aan deze eisen voldoet:

1. De arm zit vast op de lange as, en draait mee. Gebruik daarvoor een stukje met een kruisvormig gat: een **asgat**. In een rond gat draait de as door, en blijft je arm stilstaan.
2. Je zet de arm op de as terwijl de servo op 90° staat. Bij 90° hangt de arm naar beneden, bij de bal in de halve ronding.
3. Onderaan zit een stuk dat de bal raakt. Het raakt de bal, maar schuurt niet over het hout.
4. De arm is stevig: hij buigt niet als hij slaat.
5. De arm is niet te zwaar. Een zware arm komt langzaam op gang, en kan je robot zelfs laten herstarten.

<details>
<summary>Tip</summary>

Begin met een balk met een asgat, recht naar beneden aan de as. Maak hem zo lang dat hij net boven het hout ophoudt, en zet er onderaan een dwarsbalk aan. Kijk bij [de arm namaken](#namaken) hoe Leaphy het deed.

</details>

<details>
<summary>Antwoord</summary>

Hier hoort geen vast antwoord bij: elke arm die de test hieronder doorstaat, is goed.

</details>

Test je arm voordat je hem op de baan zet. Zet je robot aan met **ON/OFF**, upload het programma **Servo 9 op 90** van hierboven, en kijk of de arm naar beneden hangt. Upload daarna het programma dat heen en weer draait:

1. Draait de arm mee, zonder te slippen op de as?
2. Draait hij soepel, zonder te zoemen of te haperen?
3. Buigt of wiebelt hij niet als hij stopt?

Is het antwoord drie keer ja, dan is je arm klaar.

## Hole in one

Zet je Golfbot weer op de vier gaatjes van de bodemplaat, met de arm boven de halve ronding waar de bal ligt. Upload het programma uit [Zie de bal, sla de bal](site:robotica/golfbot/bal-slaan) naar je robot en leg een bal in de halve ronding, voor de sensor. Rolt de bal de helling op en in het ronde gat?

Pas je programma aan tot de bal telkens netjes in het ronde gat gaat:

- De stand in **Servo 9 op 0** bepaalt hoe ver de arm uithaalt: hoe kleiner het getal, hoe verder hij naar achteren gaat. Zoemde je servo bij [de servo](site:robotica/golfbot/servo) op 0°, en gebruikte je daar 10°? Zet dan hier ook 10 in plaats van 0.
- De wachttijd na het slaan moet lang genoeg zijn, zodat een bal die terugrolt eerst stil ligt voordat de robot weer kijkt.

<details>
<summary>Tip</summary>

Verander steeds maar één getal tegelijk, en probeer daarna een paar keer. Zo weet je welk getal het verschil maakt.

</details>

<details>
<summary>Antwoord</summary>

Er is geen getal dat bij iedereen past: elke baan en elke Golfbot is net anders. Hoe verder de twee standen in de servo-blokken uit elkaar liggen, hoe verder de arm uithaalt en hoe harder de bal gaat. Zijn ze dichter bij elkaar, dan tikt hij zachter. Rolt de bal terug en slaat de arm te vroeg, maak dan de 2000 in **duurt** groter.

</details>

## Er gaat iets mis

<Probleem titel="De robot lijkt steeds opnieuw te beginnen als de arm slaat.">

**Oorzaak:** misschien krijgt de servo via alleen de usb-kabel te weinig stroom. Trekt hij te veel, dan valt de Arduino even uit en begint het programma opnieuw. Met een zware arm trekt de servo meer stroom.

**Oplossing:** vraag je docent of er een adapter of batterij bij je robot hoort. Probeer dan of het beter gaat als je robot daar stroom van krijgt, via de aansluiting op het shield, met **ON/OFF** aan.

**Zelf vinden:** zet bovenaan in het Leaphy-blok, vóór **herhaal voor altijd**, een **Toon op scherm** met de tekst `start`, en open het scherm. Verschijnt `start` opnieuw zonder dat jij op **RST** drukte, dan is je robot opnieuw begonnen.

</Probleem>

<Probleem titel="De arm slaat de verkeerde kant op.">

**Oorzaak:** de servo zit andersom in de toren. Dan haalt de arm bij 0° naar voren uit in plaats van naar achteren.

**Zelf vinden:** kijk naar het snoertje van de servo. Wijst het omlaag in plaats van omhoog, zoals bij [stap 4 van het bouwen](site:robotica/golfbot/bouwen)?

**Oplossing:** haal de toren uit elkaar tot stap 4 en zet de servo erin met het snoertje **omhoog**. Bouw daarna verder zoals op de plaatjes, en zet de servo weer op 90° voordat de arm op de as komt, zoals bij [Eerst de servo op 90°](site:robotica/golfbot/arm#servo-op-90). Zo blijven de getallen in je programma's kloppen: uithalen naar 0°, slaan naar 90°.

</Probleem>

<Probleem titel="De servo draait, maar de arm beweegt niet mee.">

**Oorzaak:** de beweging stopt ergens in de overbrenging, van het oranje tandwiel via het grijze tandwiel en de lange as naar de arm (zie [Hoe de servo de arm laat draaien](#hoe-de-servo-de-arm-laat-draaien)). Vaak grijpt het grijze tandwiel niet in het oranje, omdat het te ver naar buiten op de as zit. Of de arm zit niet vast op de as: bij een nagemaakte arm met de zwarte verbinder van stap 12, bij een zelfgemaakte arm met jouw stukje met een asgat.

**Zelf vinden:** kijk terwijl de servo draait naar elke stap. Draait het grijze tandwiel mee? Draait de lange as mee? Draait de arm mee? Waar het ophoudt, zit de fout.

**Oplossing:** draait het grijze tandwiel niet mee, zet de servo dan eerst op 90°, zoals bij [Eerst de servo op 90°](site:robotica/golfbot/arm#servo-op-90), en duw het grijze tandwiel naar binnen tot zijn tanden tussen die van het oranje vallen. Draait de as wel en de arm niet, zet de arm dan vast op de as. Zit je eigen arm met een rond gat op de as? Neem dan een stukje met een asgat.

</Probleem>

<Probleem titel="De arm ratelt of klikt, of hangt na een paar slagen steeds schever.">

**Oorzaak:** de tanden slaan over. Het grijze tandwiel zit niet ver genoeg in het oranje, of schuift bij het slaan een stukje naar buiten over de as. Bij een harde slag springen de tanden dan een tand verder, en elke tand is 22,5°.

**Zelf vinden:** kijk naar je stukjes plakband. Laat de arm een paar keer slaan, en upload dan **Servo 9 op 90**. Zitten de twee stukjes niet meer naast elkaar, dan zijn de tanden overgeslagen.

**Oplossing:** duw het grijze tandwiel helemaal naar binnen, tot het naast het oranje tandwiel zit en de tanden over hun hele breedte in elkaar grijpen. Kijk ook of de lange as recht door de toren gaat. Zet daarna de arm weer recht, zoals bij de kaart hieronder.

</Probleem>

<Probleem titel="De arm staat scheef, of haalt de bal niet.">

**Oorzaak:** het grijze tandwiel grijpt in de verkeerde tand van het oranje. Dat gebeurt als de servo niet op 90° stond toen het grijze tandwiel erop kwam, of als iemand de arm met de hand heeft gedraaid. Eén tand verkeerd is al 22,5°.

**Zelf vinden:** upload **Servo 9 op 90**. Hangt de arm dan niet recht naar beneden, bij de bal? Dan grijpt het tandwiel in de verkeerde tand.

**Oplossing:** laat de servo op 90° staan, zoals bij [Eerst de servo op 90°](site:robotica/golfbot/arm#servo-op-90), en zet je robot uit. Trek het grijze tandwiel een stukje naar buiten over de as, tot zijn tanden los zijn van het oranje tandwiel. Draai de arm tot hij goed staat, en duw het grijze tandwiel weer naar binnen, met zijn tanden tussen die van het oranje. Een nagemaakte arm staat dan zoals op het plaatje van stap 12. Een zelfgemaakte arm hangt recht naar beneden, bij de bal.

</Probleem>

<details>
<summary>Controlevraag</summary>

Waarom moet de servo op 90° staan als de arm op de as komt?

</details>

<details>
<summary>Antwoord</summary>

Je programma's gaan ervan uit dat de arm bij 90° bij de bal hangt. Zet je de arm er in een andere stand op, dan slaat hij te ver door of haalt hij de bal niet.

</details>

Gaat de bal erin? Dan kies je nu [een uitbreiding](site:robotica/golfbot/uitbreiding).
