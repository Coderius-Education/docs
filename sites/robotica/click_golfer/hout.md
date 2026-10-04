---
sidebar_position: 8
---

# De houten baan

Naast het robotje maak je ook een **houten baan** van dunne plankjes. Je docent heeft ze al uitgesneden met een lasersnijder. Op de baan staat je Golfer, naast de plek waar de bal ligt. De sensor ziet of de bal er ligt, de arm slaat hem weg, en de bal rolt de helling op naar het gat.

Dit heb je nodig:

- de plankjes van je docent: de bodemplaat, de lange helling met het ronde gat, een klein steunplankje, een gebogen zijplankje en een blokje voor de sensor;
- de sensor, een kleine schroef van je docent en een schroevendraaier, om de sensor vast te zetten;
- je Golfer van Lego;
- een bal (vraag je docent welke).

Werk de foto's van boven naar beneden af. Zo groeit de baan onder je handen in elkaar.

:::tip
Twijfel je hoe een onderdeel eruitziet of waar het komt? Bekijk het [3D-model op de intropagina](intro), of kijk nog eens bij [de bouwstappen](bouwen). Je kunt het 3D-model draaien en zoomen.
:::

## Stap voor stap

<figure>
  <img src="/click_golfer/hout/hout-8.jpg" width="600" alt="De houten bodemplaat: een lang plankje met een halve ronding aan de rand, en aan het eind een breder stuk met vier gaatjes." />
  <figcaption>De bodemplaat. Hierop komt alles te staan. Op de vier gaatjes komt straks je Golfer, en in de halve ronding ligt de bal.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-7.jpg" width="600" alt="De lange houten helling met een groot rond gat, en een klein steunplankje met twee sleuven dat erop past." />
  <figcaption>De helling met het ronde gat: daar moet de bal in. Het kleine steunplankje klikt aan het eind met het gat.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-1.jpg" width="600" alt="De helling staat op het steunplankje; het ronde gat zit aan de hoge kant, de andere kant loopt schuin naar beneden." />
  <figcaption>De helling op het steunplankje. Het gat zit aan de hoge kant. De lage kant loopt schuin af, zodat de bal makkelijk de helling op rolt.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-5.jpg" width="600" alt="De helling ligt met de lage kant tegen de bodemplaat, naast de halve ronding." />
  <figcaption>De lage kant van de helling komt tegen de bodemplaat, vlak naast de halve ronding waar de bal ligt.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-4.jpg" width="600" alt="Onder de helling zit het gebogen zijplankje; de helling ligt tegen de bodemplaat." />
  <figcaption>Het gebogen zijplankje komt onder de helling en houdt hem op zijn plek.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-2.jpg" width="600" alt="Het kleine houten blokje voor de sensor, met blauwe tape en een gaatje voor de schroef, zit op de hoek van de bodemplaat naast de halve ronding." />
  <figcaption>Het blokje voor de sensor klikt op de hoek van de bodemplaat, naast de halve ronding. De plankjes klikken met de uitsparingen stevig aan elkaar.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-3.jpg" width="600" alt="De blauwe infraroodsensor zit aan de voorkant van de houten baan." />
  <figcaption>Schroef de sensor met de kleine schroef op het blokje, zoals op de foto. Zo ziet hij of er een bal in de halve ronding ligt.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-6.jpg" width="600" alt="De infraroodsensor met een blauw stelschroefje, vastgezet op de houten baan." />
  <figcaption>De sensor vastgezet op de baan. Het blauwe schroefje laat je met rust: in dit project lees je de sensor uit als een getal, en dat getal verandert er niet van. Hoe gevoelig je robot is, stel je straks in je programma in.</figcaption>
</figure>

Staat de baan in elkaar? Zet je Golfer dan met de vier hoeken van het Lego-frame op de vier gaatjes van de bodemplaat, met de arm boven de halve ronding waar de bal ligt. Hij staat er los op; of hij vast moet, en hoe, zegt je docent. Kijk daarna of de sensor en de servo nog goed aan het shield zitten, en vergelijk je draden met het hele schema:

![Het hele schema: links de sensor op de rij van A0, rechts de servo op de rij van D9, allebei op het shield met de Arduino Nano in het midden.](@site/static/fritzing/click_golfer_bb.png)

Let op: op dit plaatje loopt de oranje draad van de sensor langs de rij van A4. Hij hoort op het signaal van **A0**, zoals bij [de IR-sensor](ir-sensor).

## Hole in one

Upload het programma uit [Zie de bal, sla de bal](bal-slaan) naar je robot en leg een bal in de halve ronding, voor de sensor. Rolt de bal de helling op en in het ronde gat?

Pas je programma aan tot de bal telkens netjes in het ronde gat gaat:

- De stand in **Servo 9 op 0** bepaalt hoe ver de arm uithaalt: hoe kleiner het getal, hoe verder hij naar achteren gaat. Zoemde je servo bij [de servo](servo) op 0°, en gebruikte je daar 10°? Zet dan hier ook 10 in plaats van 0.
- De wachttijd na het slaan moet lang genoeg zijn, zodat een bal die terugrolt eerst stil ligt voordat de robot weer kijkt.

<details>
<summary>Tip</summary>

Verander steeds maar één getal tegelijk, en probeer daarna een paar keer. Zo weet je welk getal het verschil maakt.

</details>

<details>
<summary>Antwoord</summary>

Er is geen getal dat bij iedereen past: elke baan en elke Golfer is net anders. Hoe verder de twee standen in de servo-blokken uit elkaar liggen, hoe verder de arm uithaalt en hoe harder de bal gaat. Zijn ze dichter bij elkaar, dan tikt hij zachter. Rolt de bal terug en slaat de arm te vroeg, maak dan de 2000 in **duurt** groter.

</details>

## Er gaat iets mis

<Probleem titel="De robot lijkt steeds opnieuw te beginnen als de arm slaat.">

**Oorzaak:** misschien krijgt de servo via alleen de usb-kabel te weinig stroom. Trekt hij te veel, dan valt de Arduino even uit en begint het programma opnieuw.

**Oplossing:** vraag je docent of er een adapter of batterij bij je robot hoort. Probeer dan of het beter gaat als je robot daar stroom van krijgt, via de aansluiting op het shield, met **ON/OFF** aan.

**Zelf vinden:** zet bovenaan in het Leaphy-blok, vóór **herhaal voor altijd**, een **Toon op scherm** met de tekst `start`, en open het scherm. Verschijnt `start` opnieuw zonder dat jij op **RST** drukte, dan is je robot opnieuw begonnen.

</Probleem>

<Probleem titel="De arm slaat de verkeerde kant op.">

**Oorzaak:** de servo zit andersom in de toren. Dan haalt de arm bij 0° naar voren uit in plaats van naar achteren.

**Zelf vinden:** kijk naar het snoertje van de servo. Wijst het omlaag in plaats van omhoog, zoals bij [stap 4 van het bouwen](bouwen)?

**Oplossing:** haal de toren uit elkaar tot stap 4 en zet de servo erin met het snoertje **omhoog**. Bouw daarna verder zoals op de plaatjes, en zet de servo vóór stap 12 weer op 90°, zoals bij [Eerst de servo op 90°](bouwen#servo-op-90). Zo blijven de getallen in je programma's kloppen: uithalen naar 0°, slaan naar 90°.

</Probleem>

<Probleem titel="De servo draait, maar de arm beweegt niet mee.">

**Oorzaak:** de servo draait de lange as van stap 10, en de arm zit met de zwarte verbinder van stap 12 op die as. Zit de as niet door de servo, of zit de verbinder niet op de as, dan draait de arm niet mee.

**Zelf vinden:** kijk naar de as terwijl de servo draait. Draait de as niet mee, dan zit hij niet goed in de servo. Draait de as wel en de arm niet, dan zit de verbinder los.

**Oplossing:** zet de servo eerst op 90°, zoals vóór stap 12 bij [Eerst de servo op 90°](bouwen#servo-op-90). Duw dan de as door de servo, of de verbinder op de as, zoals op de plaatjes van stap 10 en 12.

</Probleem>

<Probleem titel="De arm staat scheef, of haalt de bal niet.">

**Oorzaak:** de verbinder van stap 12 ging op de as terwijl de servo niet op 90° stond.

**Oplossing:** haal de verbinder met de arm eraan van de as, zet de servo op 90° zoals bij [Eerst de servo op 90°](bouwen#servo-op-90), en zet de verbinder er weer op zoals op het plaatje van stap 12.

</Probleem>

<details>
<summary>Controlevraag</summary>

Je legt de bal een stukje naast de halve ronding. Waarom slaat je robot dan misschien niet?

</details>

<details>
<summary>Antwoord</summary>

De sensor kijkt naar de halve ronding. Ligt de bal ernaast, dan ziet de sensor hem niet, en blijft het getal boven je grens.

</details>

Gaat de bal erin? Dan leer je je Golfer nu [netter mikken](mikken).
