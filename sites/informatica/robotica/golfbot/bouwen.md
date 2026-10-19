---
sidebar_position: 7
---
import useBaseUrl from '@docusaurus/useBaseUrl';

# Bouwen

Je sensor ziet de bal en je servo slaat. Nu komt de Golfbot van Lego eromheen. Je bouwt eerst de toren, met de servo erin. De arm komt later, als ook de houten baan klaar is.

:::tip
Twijfel je hoe een onderdeel eruitziet of waar het komt? Bekijk het [3D-model op de intropagina](site:robotica/golfbot/intro). Je kunt het draaien en zoomen. Het model komt uit een iets andere versie: sommige kleuren en pinnen wijken af. De plaatjes hieronder kloppen met je doosje.
:::

## Onderdelenlijst

Voor de toren heb je **22 Lego Technic-stukjes** nodig plus de **Leaphy-servo**. Leg ze klaar voordat je begint.

<details>
<summary>Welke stukjes heb je nodig?</summary>

| Aantal | Onderdeel | Kleur | BrickLink-nr |
|:---:|---|---|---|
| 6 | Technic-pin met lange wrijvingsribbels | Zwart | 4459 |
| 4 | Liftarm dik 1 × 15 | Zwart | 32278 |
| 4 | Pin 3L zonder wrijvingsribbels | Blauw | 32556 |
| 2 | Liftarm gebogen 1 × 9 (6–4) | Zwart | 6629 |
| 2 | As 1L met pin (met wrijvingsribbels) | Lichtgrijs | 43093 |
| 1 | Bus 1/2 (glad) | Lichtgrijs | 4265c |
| 1 | Liftarm dik 1 × 5 | Zwart | 32316 |
| 1 | As 6L | Lichtgrijs | 3706 |
| 1 | Frame-liftarm dik 5 × 7 (open midden) | Lichtgrijs | 64179 |
| 1 | Servo (Leaphy) | Donker nougat (oranjebruin) | – |

</details>

Mist er iets in je doosje? Vraag het je docent. Die bestelt de stukjes, bijvoorbeeld bij [BrickLink](https://www.bricklink.com), en heeft daarvoor <a href={useBaseUrl('/golfbot/onderdelenlijst.csv')} download>de onderdelenlijst (CSV)</a>. Daarin staan ook de stukjes voor de arm, die je later maakt.

## De toren

In stap 4 gaat de servo op **D9** de toren in. Zet je robot eerst uit met de knop **ON/OFF**. De draden van de servo mogen aan het shield blijven zitten. Haal je ze toch los, sluit ze dan na stap 10 weer aan zoals bij [de servo](site:robotica/golfbot/servo), met oranje op het signaal van **D9**. Voor de arm zet je de servo straks met een programma op 90°, en dat kan alleen als hij aangesloten is.

![Uitsnede van het schema: de servo met de bruine draad op GND, de rode op 5V en de oranje op het signaal van D9.](@site/static/fritzing/golfbot_servo.png)

Bij elke stap zie je linksboven welke stukjes je erbij pakt. Wat nieuw is, heeft een rode rand. Staat er onder een stap een latje met een getal in een rondje, dan is dat de lengte van de balk of de as: zoveel gaatjes lang. Tel de gaatjes van je stukje, want op je scherm is het latje niet even groot als het echte stukje. Een blauw vierkantje met twee pijlen betekent: draai je Golfbot om, het plaatje laat hem van de andere kant zien.

**Let op bij stap 4:** zet de servo zo in de toren dat het snoertje van de motor **omhoog** wijst, zoals op het plaatje van stap 4 staat.

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-01.jpg')} width="600" alt="Bouwstap 1: Het lichtgrijze frame van 5 bij 7 gaten met een open midden. Dit is de voet." />
  <figcaption>Stap 1</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-02.jpg')} width="600" alt="Bouwstap 2: Vier zwarte pinnen in de gaten aan de binnenkant van het frame." />
  <figcaption>Stap 2</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-03.jpg')} width="600" alt="Bouwstap 3: Twee lange zwarte balken van 15 gaten staan rechtop op het frame." />
  <figcaption>Stap 3</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-04.jpg')} width="600" alt="Bouwstap 4: De oranjebruine servo zit met vier blauwe pinnen tussen de twee balken. Een briefje zegt: het snoertje van de motor moet omhoog." />
  <figcaption>Stap 4</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-05.jpg')} width="600" alt="Bouwstap 5: Twee zwarte pinnen bovenin de twee balken." />
  <figcaption>Stap 5</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-06.jpg')} width="600" alt="Bouwstap 6: Een zwarte balk van 5 gaten ligt bovenop de twee balken en verbindt ze." />
  <figcaption>Stap 6</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-07.jpg')} width="600" alt="Bouwstap 7: Nog twee lange zwarte balken van 15 gaten aan de voorkant, over de servo heen." />
  <figcaption>Stap 7</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-08.jpg')} width="600" alt="Bouwstap 8: Een lichtgrijs busje en twee lichtgrijze assen met een pin bovenaan de toren." />
  <figcaption>Stap 8</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-09.jpg')} width="600" alt="Bouwstap 9: Twee gebogen zwarte balken aan de zijkanten van de toren." />
  <figcaption>Stap 9</figcaption>
</figure>

<figure>
  <img src={useBaseUrl('/golfbot/bouwen/stap-10.jpg')} width="600" alt="Bouwstap 10: Een lichtgrijze as van 6 gaten gaat door het midden, door de servo." />
  <figcaption>Stap 10</figcaption>
</figure>

Je toren staat. De servo zit erin, en de lange as van stap 10 steekt erdoorheen. Daar komt straks de arm aan.

<Voorspel soort="Controlevraag" vraag="Waarom moet het snoertje van de servo in stap 4 omhoog wijzen?">
  <Keuze uitleg="De servo past er ook andersom in. Daarom moet je er juist op letten.">Omdat de servo er anders niet tussen de balken past</Keuze>
  <Keuze uitleg="Hoe snel de servo draait, hangt niet af van hoe hij in de toren zit.">Met het snoertje omlaag draait hij langzamer</Keuze>
  <Keuze goed uitleg="Andersom draait de as de andere kant op, en dan haalt de arm naar voren uit in plaats van naar achteren.">Anders zit de servo andersom, en slaat de arm straks de verkeerde kant op</Keuze>
  <Uitleg>

Met het snoertje omlaag zit de servo andersom in de toren. Hij draait dan net zo goed, maar de andere kant op. De getallen in je programma's kloppen dan niet meer met de kant waar de bal ligt.

  </Uitleg>
</Voorspel>

*Bouwstappen: ClickGolfer-werkboek, ©Stichting Leaphy.*

Staat je toren? Dan maak je nu [de houten baan](site:robotica/golfbot/hout).
