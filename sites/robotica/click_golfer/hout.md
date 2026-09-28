---
sidebar_position: 8
---

# De houten baan

Naast het robotje maak je ook een **houten baan**. Die is gemaakt van dunne, laser-gesneden plankjes. In de baan zit een plek voor de **servo** (dat is de tikker die de bal wegslaat) en voor de **sensor** (die voelt of er een bal ligt).

Werk de foto's van boven naar beneden af; zo groeit de baan onder je handen in elkaar.

:::tip
Twijfel je hoe een onderdeel eruitziet of waar het komt? Bekijk het [3D-model op de intropagina](intro), of kijk nog eens bij [de bouwstappen](bouwen). Je kunt het 3D-model draaien en zoomen.
:::

## Stap voor stap

<figure>
  <img src="/click_golfer/hout/hout-8.jpg" width="600" alt="De houten bodemplaat met vier schroefgaten in de hoeken." />
  <figcaption>De bodemplaat met vier schroefgaten. Hierop komt alles te staan.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-7.jpg" width="600" alt="Een lange houten plaat met een rond servo-gat en een los klemstukje dat erop past." />
  <figcaption>De lange zijplaat met een gat voor de servo, en een los klemstukje voor de servo.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-1.jpg" width="600" alt="Houten bovenplaat met een rond gat voor de servo; de voorkant loopt schuin naar beneden." />
  <figcaption>De bovenplaat met het servo-gat. De voorkant loopt schuin af, zodat de bal makkelijk op de baan komt.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-5.jpg" width="600" alt="De samengevoegde houten zijkant en bovenplaat vormen het frame van de baan." />
  <figcaption>De zijkant en de bovenplaat samen: het frame van de baan.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-4.jpg" width="600" alt="Het houten frame staat rechtop op de gebogen zijkant; de bodemplaat ligt ernaast." />
  <figcaption>Het frame staat rechtop, met de bodemplaat ernaast.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-2.jpg" width="600" alt="Twee houten plankjes klikken met vingerverbindingen aan elkaar." />
  <figcaption>De plankjes klikken met de vingerverbindingen stevig aan elkaar.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-3.jpg" width="600" alt="De blauwe infraroodsensor zit aan de voorkant van de houten baan." />
  <figcaption>De sensor komt vooraan in de baan, zodat hij ziet of er een bal ligt.</figcaption>
</figure>

<figure>
  <img src="/click_golfer/hout/hout-6.jpg" width="600" alt="De infraroodsensor met een blauw stelschroefje, vastgezet op de houten baan." />
  <figcaption>De sensor vastgezet op de baan. Het blauwe schroefje laat je met rust: in dit project lees je de sensor uit als een getal, en dat getal verandert er niet van. Hoe gevoelig je robot is, stel je straks in je programma in.</figcaption>
</figure>

Staat de baan in elkaar? Zet je Golfer erop, met de arm boven de bal. Zitten de sensor en de servo nog aan het shield? Vergelijk je draden met het hele schema:

![Het hele schema: links de sensor op de rij van A0, rechts de servo op de rij van D9, allebei op het shield met de Arduino Nano in het midden.](@site/static/fritzing/click_golfer_bb.png)

## Hole in one

Upload het programma uit [Zie de bal, sla de bal](bal-slaan) naar je robot en leg een bal voor de sensor. Gaat de bal in het gat?

Pas je programma aan tot de bal telkens netjes in het gat gaat:

- De stand in **Servo 9 op 90** bepaalt hoe ver de arm uithaalt.
- De wachttijd na het slaan moet lang genoeg zijn, zodat een bal die terugrolt eerst stil ligt voordat de robot weer kijkt.

<details>
<summary>Klik hier voor een tip!</summary>

Verander steeds maar één getal tegelijk, en probeer daarna een paar keer. Zo weet je welk getal het verschil maakt.

</details>

<details>
<summary>Klik hier voor het antwoord!</summary>

Er is geen getal dat bij iedereen past: elke baan en elke Golfer is net anders. Hoe verder die 90 van de 0 in **Servo 9 op 0** af ligt, hoe verder de arm uithaalt en hoe harder de bal gaat. Rolt de bal terug en slaat de arm te vroeg, maak dan de 2000 in **duurt** groter.

</details>

## Er gaat iets mis

**De robot lijkt steeds opnieuw te beginnen als de arm slaat.**

**Oorzaak:** misschien krijgt de servo via alleen de usb-kabel te weinig stroom. Trekt hij te veel, dan valt de Arduino even uit en begint het programma opnieuw.

**Oplossing:** probeer of het beter gaat met stroom via de aansluiting op het shield, met de knop **ON/OFF** aan.

**Zelf vinden:** zet bovenaan in het Leaphy-blok, vóór **herhaal voor altijd**, een **Toon op scherm** met de tekst `start`, en open het scherm. Verschijnt `start` opnieuw zonder dat jij op **RST** drukte, dan is je robot opnieuw begonnen.

**De arm slaat de verkeerde kant op.**

**Oorzaak:** dat hangt af van hoe de servo in de toren zit.

**Oplossing:** wissel de twee getallen in de servo-blokken om: waar 90 staat komt 0, en waar 0 staat komt 90. De arm wacht dan op 90° en slaat naar 0°.

**De servo draait, maar de arm beweegt niet mee.**

**Oorzaak:** het tandwiel slipt op de as van de servo, of zit niet goed vast.

**Zelf vinden:** kijk naar de as terwijl de servo draait. Draait de as wel en het tandwiel niet, dan zit het tandwiel los.

**Oplossing:** druk het tandwiel stevig op de as. Zet de servo eerst op 90°, zoals bij [stap 11 van het bouwen](bouwen).

**De arm staat scheef, of haalt de bal niet.**

**Oorzaak:** het tandwiel ging op de as terwijl de servo niet op 90° stond.

**Oplossing:** haal het tandwiel eraf, zet de servo op 90° zoals bij [het bouwen](bouwen), en zet het tandwiel er met de arm recht weer op.

Gaat de bal erin? Dan leer je je Golfer nu [netter mikken](mikken).
