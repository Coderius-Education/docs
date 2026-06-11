---
sidebar_position: 4
hide_table_of_contents: true
---

# 2.3 Obstakels ontwijken

Op de baan staan blokjes die je niet mag raken. Je hebt dus een **afstandssensor** nodig en een plan om om het obstakel heen te rijden.

## Stap 1: kies een afstandssensor

Drie opties:

- **Ultrasone sensor** (RCWL-1601). Goedkoop, werkt op afstand. Zie [hoofdstuk 8](/docs/category/tutorial---afstandssensor).
- **Time of Flight** (TOF). Preciezer en kleiner. Zie [hoofdstuk 9](/docs/category/tutorial---time-of-flight).
- **Piezo**. Vraag je docent naar beschikbaarheid.

## Stap 2: lees de afstand uit

Lukt het je om in **centimeters** uit te lezen op welke afstand een obstakel staat? Print in een loop:

```python
from time import sleep
from leaphymicropython.sensors.sonar import read_distance

while True:
    print(read_distance(19, 18))
    sleep(0.1)
```

## Stap 3: samenwerken met het lampje

Laat het ingebouwde lampje **branden** zodra een hand binnen 10 cm van de sensor komt, en uit gaan zodra hij verder weg is.

## Stap 4: hoe ontwijk je het obstakel?

Twee strategieën:

1. **Hard-coded**: rijd een vaste route om het obstakel heen, tot je de lijn weer vindt.
2. **Sweep**: zet de afstandssensor op een **servo** zodat hij rond kan kijken. Op basis daarvan beslis je welke kant op.

<details>
<summary>Tip: combineer met lijnvolgen</summary>

De truc is om obstakelontwijken en lijnvolgen **in dezelfde loop** te doen. Eerst checken of er een obstakel is, anders gewoon lijn volgen.

</details>
