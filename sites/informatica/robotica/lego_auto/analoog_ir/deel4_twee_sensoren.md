---
sidebar_position: 5
slug: /lijnsensor/twee-sensoren
title: "Deel 4: Twee sensoren"
---

# Het robotscript bouwen — Deel 4: Twee sensoren

Eén sensor vertelt je wat er onder één plek gebeurt. Om een lijn te kunnen volgen moet je robot straks weten aan **welke kant** de lijn ligt — en daarvoor heb je er twee nodig: één links en één rechts van de lijn.

## Wat je nu gaat toevoegen

Een tweede sensor-object, op pin **A1**. Drie nieuwe regels, en verder precies wat je al kent.

## Voorspel: wat vertellen twee sensoren samen?

De robot rijdt straks met de lijn **tussen** de twee sensoren. **Wat zien beide sensoren als de robot netjes op koers ligt? En wat verandert er als hij naar links afdwaalt?**

<details>
<summary>Antwoord</summary>

Op koers: allebei wit, want de lijn loopt onzichtbaar tussen ze door. Dwaalt de robot naar links af, dan schuift de lijn onder de rechtersensor: links ziet wit, rechts ziet zwart. De combinatie van de twee vertelt dus waar de lijn is — dat wordt in Deel 7 en 8 de kern van je lijnvolger.

</details>

## Stap 1: De tweede sensor erbij

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()
    print("Links:", kleur_links, "| Rechts:", kleur_rechts)
    sleep(0.2)
```

Voor elke sensor maak je een eigen object met zijn eigen pin. De methodes werken hetzelfde; alleen de variabelenamen houden de twee uit elkaar. Vul op beide plekken je eigen drempel uit [Deel 3](./deel3_een_sensor.md) in.

## Test het

Schuif een vel met een zwarte lijn onder de robot door, van links naar rechts. In de Shell zie je de kolommen om de beurt omklappen: eerst wordt links zwart, dan rechts.

## Opdracht 5.5.a: welke sensor is links?

De namen `links` en `rechts` in je code zijn een aanname — de draadjes bepalen wat waar zit. Controleer het.

Houd alleen de **linker**sensor (gezien vanaf de achterkant van de robot, alsof je meerijdt) boven de zwarte lijn. Klopt de Shell-regel met wat je doet?

<details>
<summary>Klik hier voor een tip.</summary>

Beweeg één sensor rustig boven de lijn en kijk welke kolom in de Shell omklapt. Klapt de verkeerde kolom om, dan zitten je draadjes andersom dan je code aanneemt.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Klopt het niet, dan heb je twee keuzes: verwissel de twee signaaldraadjes op het shield (A0 ↔ A1), of draai de pinnen in je code om:

```python
links = AnalogIR("A1", 2500)
rechts = AnalogIR("A0", 2500)
```

Allebei prima — als code en werkelijkheid maar hetzelfde zeggen. Noteer je keuze; in Deel 8 stuurt de robot op deze namen.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()
    print("Links:", kleur_links, "| Rechts:", kleur_rechts)
    sleep(0.2)
```

</details>

## Er gaat iets mis

<details>
<summary>Beide kolommen geven altijd hetzelfde</summary>

**Oorzaak:** Beide objecten lezen per ongeluk dezelfde pin, bijvoorbeeld twee keer `"A0"`.

**Oplossing:** Controleer dat de ene regel `"A0"` heeft en de andere `"A1"`. **Zelf vinden:** houd je vinger voor één sensor. Klappen beide kolommen tegelijk om, dan lezen ze dezelfde pin; klapt er één om, dan zit het verschil in je bedrading.

</details>

<details>
<summary>Eén sensor blijft altijd zwart (of altijd wit) zeggen</summary>

**Oorzaak:** Die sensor hangt op een andere hoogte dan de eerste, of zijn drempel past niet — sensoren verschillen onderling.

**Oplossing:** Doe [Opdracht 5.4.a](./deel3_een_sensor.md) nog een keer, maar dan voor deze sensor. Elke sensor mag zijn eigen drempel hebben.

</details>

<details>
<summary>Controlevraag</summary>

Waarom heeft elke sensor een eigen object nodig — waarom kun je niet één `AnalogIR` voor allebei gebruiken?

</details>

<details>
<summary>Antwoord</summary>

Een object onthoudt zijn eigen pin en drempel. Eén object kan maar op één pin tegelijk luisteren; twee sensoren zijn dus twee objecten, elk met hun eigen instellingen.

</details>

---

← [Deel 3 — Eén sensor uitlezen](./deel3_een_sensor.md) · **Volgende:** [Code beter begrijpen](./while_loop.md) →
