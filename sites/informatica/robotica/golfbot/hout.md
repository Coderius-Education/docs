---
sidebar_position: 8
---
import useBaseUrl from '@docusaurus/useBaseUrl';

# De houten baan

Naast het robotje maak je ook een **houten baan** van dunne plankjes. Je docent heeft ze al uitgesneden met een lasersnijder. Op de baan staat je Golfbot, naast de plek waar de bal ligt. De sensor ziet of de bal er ligt. Straks slaat de arm hem weg, en rolt de bal de helling op naar het gat.

Dit heb je nodig:

- de plankjes van je docent: de bodemplaat, de lange helling met het ronde gat, een klein steunplankje, een gebogen zijplankje en een blokje voor de sensor;
- de sensor, een kleine schroef van je docent en een schroevendraaier, om de sensor vast te zetten;
- de toren van je Golfbot;
- een bal (vraag je docent welke).

Werk de foto's van boven naar beneden af. Zo groeit de baan onder je handen in elkaar.

:::tip
Twijfel je hoe een onderdeel eruitziet of waar het komt? Bekijk het [3D-model op de intropagina](site:robotica/golfbot/intro), of kijk nog eens bij [de bouwstappen](site:robotica/golfbot/bouwen). Je kunt het 3D-model draaien en zoomen.
:::

## Stap voor stap

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-8.jpg')} width="600" alt="De houten bodemplaat: een lang plankje met een halve ronding aan de rand, en aan het eind een breder stuk met vier gaatjes." />
  <figcaption>De bodemplaat. Hierop komt alles te staan. Op de vier gaatjes komt straks je Golfbot, en in de halve ronding ligt de bal.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-7.jpg')} width="600" alt="De lange houten helling met een groot rond gat, en een klein steunplankje met twee sleuven dat erop past." />
  <figcaption>De helling met het ronde gat: daar moet de bal in. Het kleine steunplankje klikt aan het eind met het gat.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-1.jpg')} width="600" alt="De helling staat op het steunplankje; het ronde gat zit aan de hoge kant, de andere kant loopt schuin naar beneden." />
  <figcaption>De helling op het steunplankje. Het gat zit aan de hoge kant. De lage kant loopt schuin af, zodat de bal makkelijk de helling op rolt.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-5.jpg')} width="600" alt="De helling ligt met de lage kant tegen de bodemplaat, naast de halve ronding." />
  <figcaption>De lage kant van de helling komt tegen de bodemplaat, vlak naast de halve ronding waar de bal ligt.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-4.jpg')} width="600" alt="Onder de helling zit het gebogen zijplankje; de helling ligt tegen de bodemplaat." />
  <figcaption>Het gebogen zijplankje komt onder de helling en houdt hem op zijn plek.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-2.jpg')} width="600" alt="Het kleine houten blokje voor de sensor, met blauwe tape en een gaatje voor de schroef, zit op de hoek van de bodemplaat naast de halve ronding." />
  <figcaption>Het blokje voor de sensor klikt op de hoek van de bodemplaat, naast de halve ronding. De plankjes klikken met de uitsparingen stevig aan elkaar.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-3.jpg')} width="600" alt="De blauwe infraroodsensor zit aan de voorkant van de houten baan." />
  <figcaption>Schroef de sensor met de kleine schroef op het blokje, zoals op de foto. Zo ziet hij of er een bal in de halve ronding ligt.</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/hout/hout-6.jpg')} width="600" alt="De infraroodsensor met een blauw stelschroefje, vastgezet op de houten baan." />
  <figcaption>De sensor vastgezet op de baan. Het blauwe schroefje laat je met rust: in dit project lees je de sensor uit als een getal, en dat getal verandert er niet van. Hoe gevoelig je robot is, stel je straks in je programma in.</figcaption>
</figure>

Staat de baan in elkaar? Zet je toren dan met de vier hoeken van het Lego-frame op de vier gaatjes van de bodemplaat. Hij staat er los op; of hij vast moet, en hoe, zegt je docent. Kijk daarna of de sensor en de servo nog goed aan het shield zitten, en vergelijk je draden met het hele schema:

![Het hele schema: links de sensor op de rij van A0, rechts de servo op de rij van D9, allebei op het shield met de Arduino Nano in het midden.](@site/static/fritzing/golfbot_bb.png)

Let op: op dit plaatje loopt de oranje draad van de sensor langs de rij van A4. Hij hoort op het signaal van **A0**, zoals bij [de IR-sensor](site:robotica/golfbot/ir-sensor).

## Ziet de sensor de bal op de baan?

Op tafel hield je de bal zelf voor de sensor. Nu zit de sensor vast, en ligt de bal in de halve ronding. Kijk of je robot hem daar ook ziet.

Upload het programma uit [Zie de bal, sla de bal](site:robotica/golfbot/bal-slaan) en leg een bal in de halve ronding. Draait de lange as van de servo even heen en weer? Dan ziet de sensor de bal. Haal de bal weg: dan staat de as stil.

## Er gaat iets mis

<Probleem titel="De as draait niet als de bal in de halve ronding ligt.">

**Oorzaak:** de sensor ziet de bal niet. Hij zit scheef op het blokje, of de bal ligt verder weg dan toen je op tafel je grens koos.

**Zelf vinden:** upload het programma uit stap 1 van [de IR-sensor](site:robotica/golfbot/ir-sensor), dat het getal op je scherm toont. Leg de bal in de halve ronding. Wordt het getal kleiner dan je grens?

**Oplossing:** zet de sensor recht op het blokje, zodat hij in de halve ronding kijkt. Wordt het getal met de bal wel kleiner, maar niet kleiner dan je grens? Maak je grens dan groter, maar houd hem onder het getal zonder bal.

</Probleem>

<Probleem titel="De as draait steeds, ook zonder bal.">

**Oorzaak:** de sensor ziet iets anders, zoals het hout van de baan, en geeft dan ook zonder bal een laag getal.

**Zelf vinden:** toon het getal op je scherm, zoals in stap 1 van [de IR-sensor](site:robotica/golfbot/ir-sensor), en haal de bal weg. Is het getal nu kleiner dan je grens?

**Oplossing:** kies een nieuwe grens met de getallen die je nu op de baan ziet: één met bal en één zonder. Je grens ligt ertussenin.

</Probleem>

<details>
<summary>Controlevraag</summary>

Je legt de bal een stukje naast de halve ronding. Waarom ziet je sensor hem dan misschien niet?

</details>

<details>
<summary>Antwoord</summary>

De sensor kijkt naar de halve ronding. Ligt de bal ernaast, dan ziet de sensor hem niet, en blijft het getal boven je grens.

</details>

Ziet de sensor de bal op de baan? Dan maak je nu [de arm](site:robotica/golfbot/arm).
