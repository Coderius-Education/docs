---
sidebar_position: 7
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

Staat de baan in elkaar? Zet je Golfer erop, met de arm boven de bal. Zitten de sensor en de servo nog aan het shield? Kijk het na bij [de IR-sensor](ir-sensor) en [de servo](servo).

## Hole in one

Zet het programma uit [Zie de bal, sla de bal](bal-slaan) op je robot en leg een bal voor de sensor. Gaat de bal in het gat?

Pas je programma aan tot de bal telkens netjes in het gat gaat:

- De stand in het subprogramma `slaan` bepaalt hoe ver de arm uithaalt.
- De wachttijd na het slaan moet lang genoeg zijn, zodat een bal die terugrolt eerst stil ligt voordat de robot weer kijkt.

<details>
<summary>Klik hier voor een tip!</summary>

Verander steeds maar één getal tegelijk, en probeer daarna een paar keer. Zo weet je welk getal het verschil maakt.

</details>

<details>
<summary>Klik hier voor het antwoord!</summary>

Er is geen getal dat bij iedereen past: elke baan en elke Golfer is net anders. Hoe verder de stand in `slaan` van de 0 in `achter` af ligt, hoe verder de arm uithaalt en hoe harder de bal gaat. Rolt de bal terug en slaat de arm te vroeg, maak dan de 2000 in **duurt** groter.

</details>

Gaat de bal erin? Dan leer je je Golfer nu [netter mikken](mikken).
