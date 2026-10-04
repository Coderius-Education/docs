---
sidebar_position: 6
---
import Blokken from '@site/src/components/Blokken';
import balSlaan from './blokken/bal-slaan.json';

# Zie de bal, sla de bal

Je robot ziet de bal met [de IR-sensor](ir-sensor), en laat [de servo](servo) draaien. Nu zet je die twee samen: ligt er een bal, dan slaat de servo. Nog zonder Lego: kijk naar het asje, net als bij de servo.

## Het programma

Je kent alle blokken al. Nieuw is alleen dat de servo-blokken nu in **als … dan** staan. Begin met het programma uit stap 2 van [de IR-sensor](ir-sensor). Haal Toon op scherm uit als … dan, en zet daar de servo-blokken voor in de plaats. Het blok duurt 500 ms onder als … dan haal je ook weg: na een slag wacht de robot al.

<Blokken programma={balSlaan} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms." />

Tussen twee slagen staat de servo op 90°, recht in het midden. Ligt er een bal, dan draait hij eerst naar 0°: dat is uithalen. Daarna slaat hij terug naar 90°. Zoemde je servo bij [de servo](servo) op 0°, en gebruikte je daar 10°? Zet dan hier ook 10 in plaats van 0.

<Voorspel vraag="Wat doet je robot als er géén bal ligt?">
  <Keuze uitleg="De servo-blokken staan nu in als … dan. Die doet de robot alleen als het getal kleiner is dan 300, en dat is het alleen met een bal.">Het asje slaat steeds heen en weer, net als bij de servo</Keuze>
  <Keuze goed uitleg="Zonder bal is het getal groter dan 300, dus de robot slaat de blokken in als … dan over.">Niets: het asje blijft staan</Keuze>
  <Keuze uitleg="Het programma stopt niet: alles staat in herhaal voor altijd. De robot kijkt steeds opnieuw, en leg je later een bal neer, dan slaat hij alsnog.">Het programma stopt, want er is niets te doen</Keuze>
  <Uitleg>

Niets: het asje blijft staan. Het getal van de sensor is dan groter dan 300, dus de blokken in **als … dan** slaat de robot over. Hij kijkt wel steeds opnieuw, want alles staat in **herhaal voor altijd**.

Misschien draait het asje direct na de upload één keer naar 90°. Dat is geen slag: daar wacht de servo.

  </Uitleg>
</Voorspel>

Gebruik als grens het getal dat jij bij de IR-sensor hebt gekozen. Klik op **Upload naar robot** en leg een bal voor de sensor: het asje draait naar 0° en slaat terug naar 90°.

## Waarom wachten?

Na de slag wacht de robot twee seconden: **duurt 2000 ms**. Op de baan rolt de bal na een slag soms terug. Zonder wachttijd ziet de sensor die bal meteen weer, en slaat de robot nog een keer terwijl de bal nog rolt.

## Er gaat iets mis

<Probleem titel="De servo blijft slaan, ook als er geen bal ligt.">

**Oorzaak:** je grens is te hoog. Het getal zonder bal is al kleiner dan de grens.

**Oplossing:** kijk nog eens naar de twee getallen die je bij de IR-sensor opschreef, en kies een grens die daar netjes tussenin ligt.

</Probleem>

<Voorspel soort="Controlevraag" vraag="Je haalt herhaal voor altijd weg, zodat als … dan direct in het Leaphy-blok staat. Pas als de upload klaar is, leg je een bal voor de sensor. Wat gebeurt er?">
  <Keuze uitleg="Zonder herhaal voor altijd kijkt de robot maar één keer naar de sensor. Hij merkt de bal niet meer op.">Hij slaat, net als eerst</Keuze>
  <Keuze uitleg="Eén slag krijg je alleen als de bal er al lag toen de upload klaar was. Jij legt hem er pas later neer.">Hij slaat één keer, en daarna niet meer</Keuze>
  <Keuze goed uitleg="Het Leaphy-blok loopt maar één keer, direct na het uploaden. Toen lag er nog geen bal.">Hij slaat niet</Keuze>
  <Uitleg>

Hij slaat niet. Het Leaphy-blok loopt maar één keer, direct na het uploaden. Toen lag er nog geen bal, en daarna kijkt de robot niet meer. Draait het asje direct na de upload naar 90°, dan is dat geen slag: daar wacht de servo. Had er al een bal gelegen, dan had hij precies één keer geslagen.

  </Uitleg>
</Voorspel>

Werkt het op tafel? Dan [oefen je met twee sensoren en twee servo's](oefenen).
