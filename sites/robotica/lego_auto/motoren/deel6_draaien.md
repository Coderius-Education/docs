---
sidebar_position: 6
slug: /motoren/draaien
title: "Deel 6: De motoren wakker maken"
---

# Het robotscript bouwen — Deel 6: De motoren wakker maken

Je robot kan kijken en laten zien wat hij ziet. Nu komt het onderdeel waarmee hij straks reageert: de motoren. Die test je eerst los, op tafel — de wielen zitten er nog niet aan, dus er kan niets wegrijden.

## Wat je nu gaat toevoegen

Eerst twee losse testjes om te ontdekken welke motor welke is. Daarna zet je de motor-setup in je robotscript, klaar voor Deel 7.

## Stap 1: Welke motor is motor A?

Op het shield staan de letters **A** en **B** bij de twee motoruitgangen. Draai dit als los testje:

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motoren.motor_a.test()
```

**`DCMotors()`** maakt één object voor het motorshield; **`motoren.motor_a`** en **`motoren.motor_b`** zijn de twee uitgangen. **`.test()`** laat een motor kort vooruit en achteruit draaien — zo zie je meteen wélke van de twee `motor_a` is.

Draai daarna hetzelfde testje met `motoren.motor_b.test()`.

## Voorspel: wat doet `forward(100)`?

Een motor stuur je met een snelheid tussen **0** en **255**: `motoren.motor_a.forward(255)` is vol vooruit. **Wat verwacht je bij `forward(100)`?**

<details>
<summary>Antwoord</summary>

Waarschijnlijk minder dan je denkt: een losse motor draait er traag mee, en zodra de robot straks op zijn wielen staat, komt hij onder de **180–200 vaak helemaal niet in beweging** — het gewicht wint dan van de motor. Het lampje op het shield knippert wel: de motor probeert het, maar de kracht is te klein. Onthoud dit voor het afstellen in Deel 8.

</details>

## Stap 2: De motoren in je robotscript

De testjes waren losse scripts. In je robotscript komt nu alleen de **setup** erbij, boven de loop:

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(width=128, height=64, channel=7)

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text('Links: ' + kleur_links, 0, 0)
    oled.text('Rechts: ' + kleur_rechts, 0, 10)
    oled.show()
    sleep(0.2)
```

De loop doet nog niets met de motoren — dat is bewust. In Deel 7 laat je hem op de sensoren reageren, en dan staat alles al klaar.

## Test het

Start het script. De robot doet hetzelfde als na Deel 5 (scherm toont de kleuren) en de motoren blijven stil. Precies goed: klaargezet is nog niet gebruikt.

## Opdracht 7.6.a: rij twee seconden vooruit

Een los script, niet in je robotscript: laat beide motoren twee seconden vooruit draaien en dan stoppen. Houd de motoren vast of leg ze op hun kant.

<details>
<summary>Klik hier voor een tip.</summary>

`sleep(2)` ken je al uit Deel 2. Stoppen is een snelheid van `0` meegeven.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
from time import sleep
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

motor_a.forward(255)
motor_b.forward(255)
sleep(2)
motor_a.forward(0)
motor_b.forward(0)
```

Geen `while True` dit keer: dit script moet juist één keer iets doen en dan klaar zijn.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(width=128, height=64, channel=7)

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text('Links: ' + kleur_links, 0, 0)
    oled.text('Rechts: ' + kleur_rechts, 0, 10)
    oled.show()
    sleep(0.2)
```

</details>

## Er gaat iets mis

<details>
<summary>Er draait helemaal niets bij <code>.test()</code></summary>

**Oorzaak:** De motordraadjes zitten niet (goed) in de schroefklemmen van het shield, of je motor zit op de andere uitgang dan je aanroept.

**Oplossing:**

1. Controleer dat beide draadjes van de motor stevig vastzitten in de klem van uitgang **A** (of **B**).
2. Probeer de andere uitgang: `motoren.motor_b.test()`.

**Zelf vinden:** kijk naar het lampje op het shield tijdens `.test()`. Knippert het wél maar draait er niets, dan krijgt de uitgang stroom en zit het in de draadjes of de motor; blijft het uit, dan bereikt je code het shield niet.

</details>

<details>
<summary>De verkeerde motor draait</summary>

**Oorzaak:** De letters in je code en de aansluitingen op het shield zijn omgewisseld — niets kapot, alleen verwisseld.

**Oplossing:** Wissel de twee motorstekkers op het shield om, of wissel `motor_a` en `motor_b` in je code. Kies één van de twee en noteer het: in Deel 8 moet "links zachter" ook echt de linkermotor zachter zetten.

</details>

<details>
<summary>Controlevraag</summary>

Waarom staat de motor-setup wél in je robotscript, maar de rij-opdracht niet?

</details>

<details>
<summary>Antwoord</summary>

De setup hoort bij het robotscript: die heb je in Deel 7 nodig. De rij-opdracht is een los experiment — een script dat één keer iets doet en stopt. Niet alles wat je schrijft hoeft in het ene groeiende script te belanden.

</details>

---

← [Deel 5 — Waardes op het scherm](../debuggen_met_scherm/deel5_scherm.md) · **Volgende:** [motoren op het frame](../motoren_aan_legoframe/monteren.md) →
