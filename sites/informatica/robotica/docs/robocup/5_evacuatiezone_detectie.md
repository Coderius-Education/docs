---
sidebar_position: 7
description: De ingang van de evacuatiezone is een strook aluminiumtape; die herken je met twee draadjes en een pin met pull-up.
---

# De ingang van de evacuatiezone

Aan het eind van de baan stopt de zwarte lijn. Daar ligt een strook
**aluminiumtape** van minstens 3 cm breed, dwars op de rijrichting: de ingang
van de **evacuatiezone**. Je robot moet dat herkennen, want daarna is er geen
lijn meer om te volgen.

## Optie 1: twee draadjes die de tape raken

Aluminiumtape geleidt stroom. Laat twee draadjes naast elkaar over de vloer
slepen, zonder dat ze elkaar raken. Komen ze allebei op de tape, dan verbindt de
tape ze. Het ene draadje zit aan een pin, het andere aan GND.

![Aansluitschema: een blauw draadje van D5 en een zwart draadje van GND, allebei op het rijtje van D5, liggen op de aluminiumtape; raken ze allebei de tape, dan wordt D5 0](@site/static/fritzing/shield_aluminiumtape_bb.png)

```python
from machine import Pin
from time import sleep

pin = Pin("D5", Pin.IN, Pin.PULL_UP)

while True:
    print(pin.value())
    sleep(0.1)
```

Zolang de draadjes los zijn, print dit `1`. Zodra ze via de tape verbonden zijn,
valt pin D5 naar `0`.

:::danger[Gebruik nooit D2, D3, D4 of D11]

Deze pinnen zijn bezet door het **motor shield**. Kies een andere vrije pin,
bijvoorbeeld D5 zoals hierboven.

:::

<details>
<summary>Controlevraag</summary>

Waarom staat er `Pin.PULL_UP` en niet alleen `Pin.IN`?

</details>

<details>
<summary>Antwoord</summary>

Met `PULL_UP` hangt er binnen in de chip een weerstand naar de plus. Daardoor
staat de pin op **1** zolang de draadjes los zijn. Verbindt de tape de pin met
GND, dan valt hij naar **0**. Zonder pull-up hangt de pin nergens aan als de
draadjes los zijn, en dan geeft hij willekeurig 0 of 1.

</details>

## Optie 2: een kleursensor

Een **RGB-sensor** onder de robot geeft een andere waarde bij wit, bij zwart en
bij de glanzende tape. Vraag je docent of er een is. Meet dan zelf:

- Welke waarden lees je op wit, op zwart en op de tape?
- Is het verschil groot genoeg, ook als het licht in de zaal anders is?

## Er gaat iets mis

**De draadjes geven al een 0 op de gewone vloer.** Ze raken elkaar. Buig ze
verder uit elkaar, of zet een stukje isolatietape tussen de uiteinden.

**De robot rijdt over de tape zonder te stoppen.** De draadjes slepen niet over
de vloer, of de robot rijdt zo snel dat de tape tussen twee metingen in valt.
Haal de `sleep()` uit je wedstrijdlus en kijk of de draadjes de vloer echt
raken.

Door naar [Rijden in de evacuatiezone](site:robotica/docs/robocup/rijden_evacuatiezone).
