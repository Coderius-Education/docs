---
sidebar_position: 7
---

# Een bal detecteren

De IR-sensor die je hebt [aangesloten](aansluiten) kan de bal "zien". De sensor geeft een **getal**: de analoge waarde. Als er een bal voor de sensor ligt, verandert dat getal. Zo weet je robot of er een bal klaarligt.

## Stap 1: De waarde uitlezen

Met het blok **Read anapin A0** lees je het getal van de sensor. Met **Show on screen** zet je dat getal op het scherm, zodat je het kunt zien.

<figure>
  <img src="/click_golfer/analoog_ir/analoog_uitlezen.png" width="600" alt="Leaphy-blok: Show on screen met daarin Read anapin A0." />
  <figcaption>Lees de sensor uit op pin A0 en laat de waarde op het scherm zien.</figcaption>
</figure>

Leg nu een bal voor de sensor en kijk hoe het getal verandert. Zonder bal is het getal laag, met bal wordt het hoger. Onthoud die twee getallen.

## Stap 2: Reageren op de bal

Nu laat je de robot zelf reageren. Met een **if** (als …) kijk je of de waarde groter is dan een grens. In het voorbeeld is die grens **300**. Is de waarde groter, dan ligt er een bal en verschijnt **klaar om te golfen!** op het scherm.

<figure>
  <img src="/click_golfer/analoog_ir/klaar_om_te_golfen.png" width="600" alt="Leaphy-blok: als Read anapin A0 groter is dan 300, dan Show on screen 'klaar om te golfen!'." />
  <figcaption>Is de waarde groter dan 300? Dan ligt er een bal.</figcaption>
</figure>

:::tip
Het getal **300** is maar een voorbeeld. Gebruik het getal dat jij in stap 1 hebt gemeten. Kies een grens die netjes tussen "geen bal" en "wel bal" ligt.
:::

Weet je robot nu of er een bal ligt? Dan kun je dit combineren met het wegtikken van de bal.
