---
sidebar_position: 3
slug: /lijnvolgen/rechtdoor
title: "Deel 7: Rechtdoor rijden"
---

# Het robotscript bouwen — Deel 7: Rechtdoor rijden

Voor het eerst reageren de motoren op de sensoren. Je begint met het makkelijkste geval uit [Hoe werkt lijnvolgen?](./hoe_werkt.md): beide sensoren zien wit, dus de robot mag rechtdoor.

<Voorkennis
  items={[
    {site: 'python', to: '/docs/beslissen/05b-if-else', label: 'If en else'},
  ]}
/>

## Wat je nu gaat toevoegen

Een `if` met de eerste van de vier situaties, en een snellere loop. Na deze les rijdt je robot rechtdoor zolang de lijn tussen de sensoren zit.

## Stap 1: De eerste voorwaarde

Twee wijzigingen in je loop: het `if`-blok erbij, en de `sleep` omlaag naar `0.01` — een robot die maar vijf keer per seconde kijkt, is in een bocht al van de lijn af.

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(width=128, height=64, channel=7)

motoren = DCMotors()
motor_a = motoren.motor_a  # links (gecheckt met .test() in Deel 6)
motor_b = motoren.motor_b  # rechts

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text('Links: ' + kleur_links, 0, 0)
    oled.text('Rechts: ' + kleur_rechts, 0, 10)
    oled.show()

    if kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(255)
        motor_b.forward(255)

    sleep(0.01)
```

**`==`** vergelijkt: is de tekst in `kleur_links` gelijk aan `"white"`? **`and`** eist dat het aan beide kanten klopt. Alleen dan draaien beide motoren vol vooruit.

## Test het

Zet de robot op de baan met de lijn tussen de sensoren, en houd hem nog even losjes vast. Hij rijdt rechtdoor — en het scherm laat zien waarom: twee keer `white`.

## Voorspel: wat doet hij zodra één sensor zwart ziet?

<details>
<summary>Antwoord</summary>

Niets nieuws. Er is maar één `if`-tak, en die klopt dan niet meer — dus niemand geeft de motoren een nieuwe opdracht en ze houden hun laatste snelheid. De robot rijdt gewoon door, de bocht uit. Dat bijsturen is precies wat er nog mist.

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
motor_a = motoren.motor_a  # links
motor_b = motoren.motor_b  # rechts

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text('Links: ' + kleur_links, 0, 0)
    oled.text('Rechts: ' + kleur_rechts, 0, 10)
    oled.show()

    if kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(255)
        motor_b.forward(255)

    sleep(0.01)
```

</details>

## Er gaat iets mis

<details>
<summary>De robot rijdt meteen vol vooruit, ook als hij op de lijn staat</summary>

**Oorzaak:** Een van de sensoren zegt altijd `white` — de drempel past niet meer bij dit licht of deze hoogte.

**Oplossing:** Kijk op het scherm wat de sensoren echt zeggen terwijl je de robot boven de lijn houdt. Zie je geen `black`, kalibreer dan opnieuw ([Opdracht 5.4.a](../analoog_ir/deel3_een_sensor.md)). Het scherm is hier je gereedschap: het toont het verschil tussen "mijn if klopt niet" en "mijn sensor ziet het verkeerd".

</details>

<details>
<summary>Foutmelding over inspringen bij de <code>if</code></summary>

**Oorzaak:** De motor-regels onder de `if` staan niet één niveau dieper dan de `if` zelf.

**Oplossing:** Binnen de loop staat alles al één tab naar rechts; de regels binnen de `if` krijgen er nog een — twee tabs vanaf de kantlijn.

</details>

**In het volgende deel krijg je geen uitwerking meer.** Alles wat je nodig hebt, heb je nu gezien — Deel 8 is aan jou.

---

← [Hoe werkt lijnvolgen?](./hoe_werkt.md) · **Volgende:** [Deel 8 — Nu jij](./nu_jij.md) →
