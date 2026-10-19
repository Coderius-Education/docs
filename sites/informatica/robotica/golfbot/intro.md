---
sidebar_position: 1
---
import useBaseUrl from '@docusaurus/useBaseUrl';
import ObjViewer from '@site/src/components/ObjViewer';

# De Golfbot

Leuk dat je er bent. Je gaat je eigen **Golfbot** bouwen: een robotje van Lego dat een balletje wegtikt, net als bij minigolf. Eerst leer je de onderdelen kennen en programmeer je ze met **blokken**. Daarna bouw je het robotje en de baan.

Je hoeft hier niets voor te kunnen. Ook als je nog nooit hebt geprogrammeerd, kom je er helemaal doorheen.

## Bekijk het robotje

Hieronder zie je de Golfbot in 3D. Sleep met je muis of je vinger om hem te draaien. Zoom in en uit met het scrollwiel, of met twee vingers. Met de knop **Volledig scherm** rechtsboven in het model maak je hem zo groot als je scherm; met Esc of **Sluiten** kom je terug.

<ObjViewer src="/models/golfer.obj" mtl="/models/golfer.mtl" />

Wil je zelf sleutelen aan het model? <a href={useBaseUrl('/golfbot/golfer.io')} download>Download het model</a> en open het in het gratis programma BrickLink Studio.

## Wat is een robot?

Jouw Golfbot voelt straks met een sensor of er een balletje ligt, en slaat het dan weg. Zo'n machine heet een **robot**: je kunt hem programmeren, en hij reageert zelf op wat er om hem heen gebeurt.

## Wat ga je doen?

1. Leer [de microcontroller](site:robotica/golfbot/microcontroller) kennen, het brein van je robot, en zet er in [Easybloqs](site:robotica/golfbot/easybloqs) je eerste programma op.
2. Sluit [de IR-sensor](site:robotica/golfbot/ir-sensor) aan, die de bal ziet.
3. Laat [de servo](site:robotica/golfbot/servo) bewegen, de motor van de arm.
4. Zet ze samen: [zie de bal, sla de bal](site:robotica/golfbot/bal-slaan).
5. [Bouw de toren](site:robotica/golfbot/bouwen) van Lego en maak [de houten baan](site:robotica/golfbot/hout).
6. Maak [de arm](site:robotica/golfbot/arm), en sla een hole in one.
7. Kies [een uitbreiding](site:robotica/golfbot/uitbreiding): een eigen hoofd uit de 3D-printer, of een lampje dat een hole in one viert.

<Voorspel soort="Controlevraag" vraag="Waarom kan de Golfbot een robot genoemd worden?">
  <Keuze uitleg="Waar hij van gemaakt is, telt niet. Een huis van Lego noem je ook geen robot.">Hij is van Lego gemaakt</Keuze>
  <Keuze uitleg="Een ventilator heeft ook een motor, en toch noem je die geen robot.">Hij heeft een motor die beweegt</Keuze>
  <Keuze goed uitleg="Met de sensor merkt hij of de bal er ligt, en jouw programma zegt wat hij dan doet.">Je kunt hem programmeren, en hij reageert op wat er om hem heen gebeurt</Keuze>
  <Uitleg>

Een robot is een machine die je kunt programmeren en die reageert op zijn omgeving. Een motor of een mooi model alleen is niet genoeg.

  </Uitleg>
</Voorspel>

---

*ClickGolfer-lesmateriaal: ©Stichting Leaphy. Robotontwerp en lesmateriaal: Roeland Smith, Ronald Moesbergen en Peter Kaim.*
