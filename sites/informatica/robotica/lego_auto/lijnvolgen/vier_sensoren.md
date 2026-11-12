---
sidebar_position: 5
slug: /lijnvolgen/vier-sensoren
title: "Deel 9: Vier sensoren"
---

# Het robotscript bouwen — Deel 9: Vier sensoren

Je lijnvolger stuurt bij zodra een van de twee sensoren de lijn ziet. In een scherpe bocht is dat soms te laat: de lijn schuift onder een sensor door, en de robot rijdt de bocht uit. Twee extra sensoren, verder naar buiten, zien de lijn dan nog. Op dat moment stuurt de robot hard bij.

:::info
Deze les bouwt verder op je lijnvolger uit [Deel 8](site:robotica/lego_auto/lijnvolgen/nu-jij). Volgt hij de lijn nog niet, maak hem dan eerst af.
:::

## Wat je nu gaat toevoegen

Twee sensoren op **A2** en **A3**, twee regels op het scherm, en twee `elif`-takken bovenaan je `if`-blok voor een scherpe bocht.

## Stap 1: Twee sensoren erbij

Je hebt twee extra analoge IR-sensoren nodig, elk met een 3D-geprinte adapter, net als bij de eerste twee ([Materiaal](site:robotica/lego_auto/lijnsensor/materiaal)).

Monteer ze zoals de eerste twee ([IR-sensoren monteren](site:robotica/lego_auto/lijnsensor/monteren)): één links naast je linkersensor, één rechts naast je rechtersensor. Zet ze zo dicht naast de binnenste dat de lijn er niet tussen past. Dan ziet altijd minstens één sensor de lijn zodra de robot ervan afdwaalt. Staat de robot recht op de lijn, dan zien alle vier wit.

De sensoren op **A0** en **A1** blijven zitten. De nieuwe gaan op het rijtje van **A2** (links buiten) en **A3** (rechts buiten):

![Twee extra analoge IR-sensoren op het shield: links een op het rijtje van A2, rechts een op het rijtje van A3, elk met AO binnen, VCC in het midden en GND buiten](@site/static/fritzing/analog_irs_buiten_shield_bb.png)

- **AO** van de sensor aan de pin zelf, **A2** of **A3** (binnenste rij, naast de Nano)
- **VCC** aan **3V3** (middelste rij)
- **GND** aan **GND** (buitenste rij)

De pin **DO** laat je weer leeg.

## Stap 2: Uitlezen en tonen

Lees de twee nieuwe sensoren uit en toon ze op het scherm. Je `if`-blok uit Deel 8 blijft staan, al staat het hier niet.

<CodeUitleg>

```python showLineNumbers
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
buiten_links = AnalogIR("A2", 2500)
buiten_rechts = AnalogIR("A3", 2500)
oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)

motoren = DCMotors(
    dir_pin_motor_a="D2",
    pwm_pin_motor_a="D3",
    dir_pin_motor_b="D4",
    pwm_pin_motor_b="D11",
)
motor_a = motoren.motor_a  # links
motor_b = motoren.motor_b  # rechts

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()
    kleur_buiten_links = buiten_links.black_or_white()
    kleur_buiten_rechts = buiten_rechts.black_or_white()

    oled.fill('white')
    oled.text(f'Links: {kleur_links}', 0, 0)
    oled.text(f'Rechts: {kleur_rechts}', 0, 10)
    oled.text(f'Buiten L: {kleur_buiten_links}', 0, 20)
    oled.text(f'Buiten R: {kleur_buiten_rechts}', 0, 30)
    oled.show()

    # hier staat je if-blok uit Deel 8

    sleep(0.01)
```

<Regel n={8} tot={9}>
Twee nieuwe sensor-objecten, op A2 en A3. `2500` is de drempel van de eerste twee; past hij hier niet, kalibreer dan opnieuw zoals in [Opdracht 5.4.a](site:robotica/lego_auto/lijnsensor/een-sensor).
</Regel>

<Regel n={27} tot={28}>
Elke ronde lees je nu vier sensoren in plaats van twee.
</Regel>

<Regel n={33} tot={34}>
Twee regels lager op het scherm, op hoogte 20 en 30, zodat ze niet over de eerste twee heen vallen.
</Regel>

</CodeUitleg>

### Test de vier sensoren

Houd de robot boven de lijn en schuif hem langzaam opzij. Op het scherm klapt eerst `Links` of `Rechts` om naar `black`, en pas als je verder schuift ook `Buiten L` of `Buiten R`. Klapt een buitenste sensor als eerste om, dan zit hij te dicht bij de binnenste.

<details>
<summary>Controlevraag</summary>

Je hebt de linker buitensensor per ongeluk op het rijtje van **A3** gestoken. Wat zie je op het scherm als je hem afdekt?

</details>

<details>
<summary>Antwoord</summary>

Dan klapt `Buiten R` om in plaats van `Buiten L`. De code leest A3 als `buiten_rechts`, en het scherm toont wat de code denkt, niet waar de sensor zit. Verwissel de twee draadjes, of de twee namen in je code.

</details>

## Voorspel: wat doet je robot nu?

<Voorspel vraag="De lijn ligt onder de linker buitensensor, de andere drie zien wit. Wat doet je robot met alleen het if-blok uit Deel 8?">
  <Keuze uitleg="Daarvoor moet een tak naar de buitensensor kijken. Welke variabelen staan er in je if-blok uit Deel 8?">Hij stuurt naar links bij</Keuze>
  <Keuze uitleg="Stoppen doet je if-blok hooguit bij een kruising uit Opdracht 10.4.b, en hier zien de twee binnenste sensoren wit.">Hij stopt</Keuze>
  <Keuze goed uitleg="Je if-blok kijkt alleen naar links en rechts. Die zien allebei wit, dus de tak voor rechtdoor klopt.">Hij rijdt rechtdoor</Keuze>
  <Uitleg>

Een nieuwe sensor doet niets zolang geen regel in je `if`-blok hem gebruikt. De robot rijdt dus door, de bocht uit. Daarom krijgen de buitenste sensoren in stap 3 hun eigen takken.

  </Uitleg>
</Voorspel>

## Stap 3: Scherp bijsturen

Zet twee takken bovenaan je `if`-blok, en maak van de `if` die er stond een `elif`:

```python
    if kleur_buiten_links == "black":
        motor_a.forward(0)
        motor_b.forward(255)
    elif kleur_buiten_rechts == "black":
        motor_a.forward(255)
        motor_b.forward(0)
    elif kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(255)
        motor_b.forward(255)
```

Daaronder volgen je eigen `elif`-takken uit Opdracht 10.4.a, zoals ze waren.

### Wat de takken doen

Ligt de lijn onder de linker buitensensor, dan staat de linkermotor stil en draait de rechter vol: de robot draait om zijn linkerwiel, scherper dan bij je eigen bijsturen. Rechts precies andersom.

De nieuwe takken staan bovenaan omdat Python de eerste tak neemt die klopt. Ligt de lijn onder een buitensensor, dan zien de binnenste sensoren wit, en dan zou de tak voor rechtdoor winnen als hij eerst kwam.

### Test de scherpe bocht

Zet de robot voor een scherpe bocht en laat los. In een flauwe bocht stuurt hij bij zoals eerst. In de scherpe bocht klapt op het scherm een `Buiten` om, en draait hij hard. Werkt het aan de kabel, zet je script dan weer als `main.py` op het bord ([Batterijen](site:robotica/lego_auto/batterijen/main-py)).

## Opdracht 10.5.a: Nog scherper

In een haarspeldbocht is draaien om een stilstaand wiel soms nog te traag. Laat in de twee nieuwe takken het binnenste wiel dan achteruit draaien in plaats van stil te staan.

<details>
<summary>Klik hier voor een tip.</summary>

`backward()` werkt net als `forward()`, met een snelheid van 0 tot 255 ([DC-motor](site:robotica/docs/onderdelen/dc-motor)). Onder de 180 tot 200 komt een beladen robot vaak niet in beweging.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
    if kleur_buiten_links == "black":
        motor_a.backward(200)
        motor_b.forward(255)
    elif kleur_buiten_rechts == "black":
        motor_a.forward(255)
        motor_b.backward(200)
```

Het ene wiel vooruit en het andere achteruit: de robot draait nu om zijn midden in plaats van om een wiel.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

Je eigen takken uit Opdracht 10.4.a staan hier als commentaar; die heb jij zelf gemaakt.

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
buiten_links = AnalogIR("A2", 2500)
buiten_rechts = AnalogIR("A3", 2500)
oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)

motoren = DCMotors(
    dir_pin_motor_a="D2",
    pwm_pin_motor_a="D3",
    dir_pin_motor_b="D4",
    pwm_pin_motor_b="D11",
)
motor_a = motoren.motor_a  # links
motor_b = motoren.motor_b  # rechts

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()
    kleur_buiten_links = buiten_links.black_or_white()
    kleur_buiten_rechts = buiten_rechts.black_or_white()

    oled.fill('white')
    oled.text(f'Links: {kleur_links}', 0, 0)
    oled.text(f'Rechts: {kleur_rechts}', 0, 10)
    oled.text(f'Buiten L: {kleur_buiten_links}', 0, 20)
    oled.text(f'Buiten R: {kleur_buiten_rechts}', 0, 30)
    oled.show()

    if kleur_buiten_links == "black":
        motor_a.forward(0)
        motor_b.forward(255)
    elif kleur_buiten_rechts == "black":
        motor_a.forward(255)
        motor_b.forward(0)
    elif kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(255)
        motor_b.forward(255)
    # hier jouw elif-takken uit Opdracht 10.4.a

    sleep(0.01)
```

</details>

## Er gaat iets mis

<details>
<summary>De robot rijdt rechtdoor terwijl een buitenste sensor zwart ziet</summary>

**Oorzaak:** De nieuwe takken staan onder de tak voor rechtdoor. Python neemt de eerste tak die klopt, en dat is dan rechtdoor.

**Oplossing:** Zet de twee takken voor de buitenste sensoren bovenaan, met een `if`, en maak van de tak voor rechtdoor een `elif`.

</details>

<details>
<summary>In een scherpe bocht rijdt hij even rechtdoor en raakt hij de lijn kwijt</summary>

**Oorzaak:** Tussen een binnenste en een buitenste sensor zit zoveel ruimte dat de lijn ertussen past. Op dat moment zien alle vier wit, en dan wint de tak voor rechtdoor.

**Oplossing:** Zet de buitenste sensoren dichter tegen de binnenste. **Zelf vinden:** schuif de robot met de hand langzaam opzij over de lijn en kijk op het scherm. Staan er tussen `Links` en `Buiten L` even vier keer `white`, dan zit de lijn in dat gat.

</details>

<details>
<summary>Hij neemt elke bocht met een ruk, ook een flauwe</summary>

**Oorzaak:** De buitenste sensoren zitten zo dicht bij het midden dat ze de lijn al in een flauwe bocht zien, en dan wint hun tak.

**Oplossing:** Schuif ze iets naar buiten, maar niet zo ver dat de lijn ertussen past (zie stap 1). **Zelf vinden:** schuif de robot met de hand langzaam door een flauwe bocht en kijk op het scherm. Klapt `Buiten L` of `Buiten R` om, dan zit die sensor te dicht bij het midden.

</details>

<details>
<summary>Een buitenste sensor zegt altijd <code>white</code></summary>

**Oorzaak:** De drempel van `2500` past niet bij deze sensor, of het draadje zit op een ander rijtje dan je code zegt.

**Oplossing:** Houd de sensor boven de lijn en kijk op het scherm. Zie je geen `black`, kalibreer hem dan zoals in [Opdracht 5.4.a](site:robotica/lego_auto/lijnsensor/een-sensor), met `A2` of `A3` in plaats van `A0`. Klapt een andere regel om dan je verwacht, kijk dan naar de controlevraag bij Test de vier sensoren in stap 2.

</details>

<details>
<summary>Bij de kruising draait hij nu ineens af</summary>

**Oorzaak:** Op een kruising zien ook de buitenste sensoren zwart, en hun tak staat nu bovenaan. Je kruising-tak uit Opdracht 10.4.b komt daardoor nooit meer aan de beurt.

**Oplossing:** Zet je kruising-tak helemaal bovenaan, boven de twee takken voor de buitenste sensoren.

</details>

---

← [Deel 8 — Nu jij](site:robotica/lego_auto/lijnvolgen/nu-jij) · **Volgende:** [de afstandssensor](site:robotica/lego_auto/afstand) →
