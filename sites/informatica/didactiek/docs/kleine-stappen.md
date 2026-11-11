---
sidebar_position: 5
title: Kleine stappen met een succesmoment
---

# Kleine stappen met een succesmoment

**De tip:** laat een stap één ding doen, en laat de leerling aan iets concreets
zien dat het gelukt is voordat de volgende stap begint.

**Controlevraag:** Doet de stap één ding, en staat erbij wat de leerling ziet als het gelukt is?

## Waar komt dit vandaan

Deze tip komt uit onze eigen praktijk, niet uit een onderzoek. Het is een
afspraak die we maakten toen lessen te groot bleken. Het idee erachter sluit
wel aan op onderzoek: wie minder tegelijk aanbiedt, houdt werkgeheugen over
voor het leren zelf. Dat staat bij
[Verlaag de cognitieve belasting](site:didactiek/bronnen/cognitieve-belasting).

## Wat we zagen

De route Online zetten van de fullstack-cursus had lessen met drie of vier
nieuwe dingen in duizend woorden. Wie in zo'n les halverwege vastloopt, weet
niet welk van die dingen niet werkt, en ook niet of het stuk ervoor wel goed
ging.

We hebben de route opgeknipt tot elke les nog één ding deed. Een les over de
container werd er drie: de container starten, hem op de achtergrond laten
draaien, en de databases erin. Elke stap kreeg één blok dat zegt wat de
leerling ziet als het gelukt is, met een vinkje dat hij zelf zet. Dezelfde vorm
kreeg daarna de route Veiligheid. Ook de lessen over SqliteDict gingen om
dezelfde reden van drie naar zes.

Wat het voor het leren oplevert, hebben we niet gemeten. Wat de vorm wel
geeft: wie vastloopt, weet in welke stap, en een docent die meekijkt ook.

## Hoe wij dit toepassen

Zo ziet een stap eruit in [Online zetten](site:fullstack/docs/online) en
[Veiligheid](site:fullstack/docs/veiligheid):

- Een stap doet één ding. Doet hij er twee, dan worden het twee stappen.
- Elke stap heeft één succesmoment: een blok "Gelukt als je dit ziet" met een
  concrete waarneming, zoals een regel in de terminal, een pagina in de browser
  of een statuscode. Geen "als alles goed is gegaan".
- Pas na het succesmoment komt het begrip: één controlevraag over het idee van
  de stap, op een nieuw geval.
- Onder "Er gaat iets mis" staan alleen de fouten van deze stap, zodat de
  leerling niet hoeft te zoeken.
- De uitleg voor het succesmoment is hooguit 450 woorden.
- Een stap bouwt op de hoofdtekst van eerdere stappen, nooit op een opdracht
  die een leerling mag overslaan.

Tests in de fullstack-cursus bewaken die vorm, en in Veiligheid doet de build
elk succesmoment na: wat de les belooft, moet de code van de les ook geven.
