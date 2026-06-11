---
sidebar_position: 5
hide_table_of_contents: true
hide_title: true
title: Code beter begrijpen
---

# Code beter begrijpen

Op deze pagina oefen je met **voorspellen** wat code doet. Lees elke vraag, probeer eerst zelf het antwoord te bedenken, en kijk dan pas naar de tip of de oplossing.

---

## Opdracht 1: simpele while-loop

```python
from time import sleep

teller = 0

while teller < 3:
    print("Hallo!")
    teller = teller + 1
    sleep(1)
```

**Vraag:** hoe vaak wordt `"Hallo!"` geprint?

<details>
<summary>Tip</summary>

Kijk goed naar `teller`. Deze begint bij 0 en wordt elke keer met 1 verhoogd. De loop stopt zodra `teller < 3` niet meer waar is.

</details>

<details>
<summary>Oplossing</summary>

`"Hallo!"` wordt **3 keer** geprint:

- 1e keer: `teller = 0` (0 < 3 is waar)
- 2e keer: `teller = 1` (1 < 3 is waar)
- 3e keer: `teller = 2` (2 < 3 is waar)
- Daarna: `teller = 3` (3 < 3 is niet waar → loop stopt)

Tussen elke print zit 1 seconde pauze door `sleep(1)`.

</details>

---

## Opdracht 2: twee loops onder elkaar

```python
from time import sleep

teller = 0

while teller < 2:
    print("Eerste loop!")
    teller = teller + 1
    sleep(1)

teller = 0

while teller < 3:
    print("Tweede loop!")
    teller = teller + 1
    sleep(1)

print("Klaar!")
```

**Vraag:** wat wordt geprint en in welke volgorde?

<details>
<summary>Tip</summary>

De tweede loop begint pas als de eerste **helemaal klaar** is. Let ook op dat `teller` weer op 0 wordt gezet.

</details>

<details>
<summary>Oplossing</summary>

```
Eerste loop!
Eerste loop!
Tweede loop!
Tweede loop!
Tweede loop!
Klaar!
```

De eerste loop draait 2 keer (teller 0 en 1), daarna wordt `teller` weer 0 en draait de tweede loop 3 keer (teller 0, 1 en 2). Tot slot komt `"Klaar!"`.

</details>

---

## Opdracht 3: while True met sensor

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor = AnalogIR("A0", 2500)

while True:
    kleur = sensor.black_or_white()
    print(kleur)
    sleep(0.5)
```

**Vraag:** wanneer stopt deze code met printen?

<details>
<summary>Tip</summary>

Wat betekent `while True:`?

</details>

<details>
<summary>Oplossing</summary>

**Nooit**, totdat je het programma handmatig stopt. `while True:` is een oneindige loop. Elke halve seconde wordt de kleur geprint.

</details>

---

## Opdracht 4: while met voorwaarde

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor = AnalogIR("A0", 2500)

while sensor.black_or_white() == "white":
    print("Ik zie wit!")
    sleep(0.1)

print("Ik zie zwart!")
```

**Vraag:** wanneer wordt `"Ik zie zwart!"` geprint?

<details>
<summary>Tip</summary>

De loop draait zolang de sensor `"white"` ziet. Wat gebeurt er als de sensor `"black"` detecteert?

</details>

<details>
<summary>Oplossing</summary>

Zodra de sensor **zwart** ziet stopt de while-loop, en dan komt `"Ik zie zwart!"` één keer onderaan in de Shell te staan.

</details>

---

## Opdracht 5: teller met sensor

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor = AnalogIR("A0", 2500)
zwarte_lijnen = 0

while zwarte_lijnen < 5:
    if sensor.black_or_white() == "black":
        zwarte_lijnen = zwarte_lijnen + 1
        print("Lijn gevonden! Totaal:", zwarte_lijnen)
    sleep(0.1)

print("Klaar! 5 lijnen gevonden!")
```

**Vraag:** wat moet je doen om dit programma te laten stoppen?

<details>
<summary>Tip</summary>

`zwarte_lijnen` houdt bij hoe vaak `"black"` is gedetecteerd. Wanneer wordt deze verhoogd?

</details>

<details>
<summary>Oplossing</summary>

Je moet de sensor **5 keer** over een zwarte lijn bewegen. Pas dan is `zwarte_lijnen` gelijk aan 5 en stopt de loop.

**Let op:** als je de sensor te lang stil houdt boven dezelfde zwarte lijn, telt hij vaak meerdere keren omdat de loop elke 0,1 seconde checkt.

</details>

---

## Opdracht 6: met of zonder sleep?

**Code A:**

```python
from leaphymicropython.sensors.linesensor import AnalogIR

sensor = AnalogIR("A0", 2500)

while True:
    kleur = sensor.black_or_white()
    print(kleur)
```

**Code B:**

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor = AnalogIR("A0", 2500)

while True:
    kleur = sensor.black_or_white()
    print(kleur)
    sleep(1)
```

**Vraag:** wat is het verschil?

<details>
<summary>Tip</summary>

Let op de aan- of afwezigheid van `sleep()`. Wat doet die functie?

</details>

<details>
<summary>Oplossing</summary>

- **Code A** print de kleur **duizenden keren per seconde**. Onleesbaar snel.
- **Code B** print de kleur **elke seconde** — rustig en goed te volgen.

Gebruik altijd een kleine `sleep()` in je loop, anders rent het programma weg.

</details>

---

## Opdracht 7: twee sensoren combineren

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor_links = AnalogIR("A0", 2500)
sensor_rechts = AnalogIR("A1", 2500)

while True:
    links = sensor_links.black_or_white()
    rechts = sensor_rechts.black_or_white()

    if links == "black" and rechts == "black":
        print("Beide sensoren zien zwart!")
        break

    sleep(0.1)

print("Programma gestopt!")
```

**Vraag:** wanneer stopt dit programma?

<details>
<summary>Tip</summary>

Let op `and` in de `if` en het woord `break`.

</details>

<details>
<summary>Oplossing</summary>

Het programma stopt zodra **beide** sensoren tegelijk zwart zien.

- `and` betekent: allebei moeten waar zijn.
- `break` stopt de while-loop direct.
- Zolang minstens één sensor wit ziet, blijft de loop draaien.

Handig om bijvoorbeeld een **kruising** op de baan te detecteren.

</details>

---

## Opdracht 8: alleen bij verandering

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor = AnalogIR("A0", 2500)
vorige_kleur = "white"

while True:
    huidige_kleur = sensor.black_or_white()

    if huidige_kleur != vorige_kleur:
        print("Verandering!", vorige_kleur, "->", huidige_kleur)
        vorige_kleur = huidige_kleur

    sleep(0.1)
```

**Vraag:** wanneer wordt er iets geprint?

<details>
<summary>Tip</summary>

Wat betekent `!=`?

</details>

<details>
<summary>Oplossing</summary>

Alleen wanneer de kleur **verandert** (van wit naar zwart of van zwart naar wit).

- `!=` betekent **niet gelijk aan**.
- `vorige_kleur` onthoudt wat de sensor de vorige keer zag.
- Blijft de kleur gelijk → niets gebeurt. Verandert hij → één regel print.

Voorbeeld output:

```
Verandering! white -> black
Verandering! black -> white
Verandering! white -> black
```

Veel handiger dan `"black"` of `"white"` duizenden keren per seconde te printen.

</details>

---

## Klaar

Je hebt nu geoefend met:

- While-loops met een teller
- Oneindige loops (`while True:`)
- While-loops met een voorwaarde
- `sleep()` om de snelheid te beheersen
- IR-sensoren uitlezen in een loop
- Meerdere sensoren combineren
- Veranderingen detecteren

Dit zijn de bouwstenen voor een lijnvolgende robot.
