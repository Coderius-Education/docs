---
sidebar_position: 4
title: Leerdoel, les en beoordeling op één lijn
---

# Leerdoel, les en beoordeling op één lijn

**De tip:** schrijf eerst op wat een leerling aan het eind kan, laat de les
precies dat oefenen, en beoordeel precies dat. Dan leert een leerling wat je
bedoelt, en niet alleen wat hij denkt dat getoetst wordt.

**Controlevraag:** Oefent de les het werkwoord uit het leerdoel waarop de leerling beoordeeld wordt?

## Waar komt dit vandaan

John Biggs noemde dit in 1996 **constructive alignment**. Het woord bestaat
uit twee delen. *Constructive* komt uit het constructivisme: een leerling
bouwt zijn kennis zelf op, door wat hij doet. Wat de docent doet, telt alleen
voor zover het de leerling aan het werk zet. *Alignment* betekent dat de
leerdoelen, de lesactiviteiten en de beoordeling in dezelfde richting wijzen.

## Het onderzoek

Biggs beschrijft drie stappen die op elkaar aansluiten.

1. **Het leerdoel** beschrijft wat een leerling met de stof kan, met een
   werkwoord en een niveau: niet "kent lijsten", maar "kan een lijst
   doorlopen en de grootste waarde vinden". Biggs gebruikt daarvoor zijn
   eigen indeling in niveaus van begrip (SOLO), maar het idee werkt met elke
   indeling die werkwoorden geeft.
2. **De lesactiviteit** laat de leerling precies dat werkwoord doen. Een
   leerling die moet leren uitleggen, moet in de les uitleggen. Luisteren naar
   een uitleg is een andere activiteit.
3. **De beoordeling** kijkt of de leerling het werkwoord op dat niveau laat
   zien. Biggs beoordeelt tegen het leerdoel, niet tegen de rest van de klas.

Waarom het uitmaakt: leerlingen leren wat ze denken dat beoordeeld wordt.
Biggs noemt dat het terugslageffect van de toets (*backwash*). Toetst de
beoordeling alleen onthouden, terwijl het leerdoel om toepassen vraagt, dan
gaan leerlingen onthouden. Sluiten de drie op elkaar aan, dan werkt dat
effect in je voordeel: wie zich op de beoordeling voorbereidt, oefent het
leerdoel.

Biggs, J. (1996). *Enhancing teaching through constructive alignment.* Higher
Education, 32(3), 347–364.

[Lees de paper (DOI)](https://doi.org/10.1007/BF00138871)

## Hoe wij dit toepassen

De pagina Leerdoelen van elke cursus is waar de drie samenkomen. Neem
[de leerdoelen van niveau 1 bij Algoritmiek](site:algorithms/leerdoelen/niveau-1):

- **Het leerdoel** is een rij in `src/leerdoelen.json`: een concept, met per
  niveau de moeilijkheid (basis, gevorderd of expert). Wat de leerling ermee
  moet kunnen, beschrijft de
  [denkvaardigheid volgens Bloom](site:didactiek/bronnen/taxonomie-van-bloom),
  met een werkwoord per trede. Leerdoel en denkvaardigheid staan voor de
  leerling op dezelfde pagina.
- **De lesactiviteit** zit vast aan het leerdoel. Elke rij wijst met `les`
  naar de les waar je het concept leert, en de leerdoelenpagina linkt ernaar.
  Een les die niet bestaat, stopt de build. In die les doorloopt de leerling
  PRIMM: voorspellen, draaien, onderzoeken, aanpassen en zelf maken. Zo
  oefent hij in de les de werkwoorden waarop hij later beoordeeld wordt.
- **De beoordeling** leest hetzelfde bestand. De nakijker herkent per rij of
  het concept in het project zit, en een rij zonder herkenning is een fout in
  de test. De docent kiest de denkvaardigheid die hij in het project en het
  mondeling zag, en het cijfer staat in dezelfde tabel die de leerling op de
  pagina Leerdoelen al zag.

Omdat leerdoel, les en nakijker uit één bestand komen, kan het ene niet
stil wegdrijven van het andere: zet je er een rij bij, dan wil de build een
les en de test een herkenning.

Eén ding regelt het bestand niet: of de les het werkwoord ook echt laat
doen. Dat de les bestaat, ziet de build; dat de opdracht de leerling laat
vergelijken in plaats van overtypen, zie je alleen door de les zelf door te
lopen. Bij een cursus met meer niveaus laat de pagina
[vergelijken bij Godot](site:godot/leerdoelen/vergelijken) zien hoe hetzelfde
concept per niveau een andere moeilijkheid krijgt.
