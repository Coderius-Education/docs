---
sidebar_position: 6
slug: /afstand/stoppen
title: "Deel 10: Stoppen voor een obstakel"
---

# Het robotscript bouwen — Deel 10: Stoppen voor een obstakel

Je robot volgt de lijn, en je TOF meet de afstand. Nu komen die twee samen: staat er iets op minder dan 10 cm voor de robot, dan stopt hij. Gaat het weg, dan rijdt hij verder.

:::info
Deze les bouwt verder op je robotscript uit [Deel 9](site:robotica/lego_auto/lijnvolgen/vier-sensoren) en op [De afstand uitlezen](site:robotica/lego_auto/afstand/uitlezen). Heb je Deel 9 overgeslagen, dan staan de regels met `buiten` niet in je script; de rest is gelijk.
:::

## Wat je nu gaat toevoegen

De TOF in je robotscript, de afstand op het scherm, en een `if` bovenaan je `if`-blok die de motoren stilzet.

## Stap 1: De TOF in je robotscript

De TOF zit al op channel **0** van de multiplexer, en je scherm op channel **7**. Zet de import en het object bij de andere, en lees de afstand één keer per ronde. Je `if`-blok laat je staan; hieronder staat het er niet in, zodat je ziet wat er nieuw is.

<CodeUitleg>

```python showLineNumbers
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.sensors.tof import TimeOfFlight
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
buiten_links = AnalogIR("A2", 2500)
buiten_rechts = AnalogIR("A3", 2500)
tof = TimeOfFlight(
    channel=0,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)
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
    afstand = tof.get_distance()

    oled.fill('white')
    oled.text(f'Links: {kleur_links}', 0, 0)
    oled.text(f'Rechts: {kleur_rechts}', 0, 10)
    oled.text(f'Buiten L: {kleur_buiten_links}', 0, 20)
    oled.text(f'Buiten R: {kleur_buiten_rechts}', 0, 30)
    oled.text(f'Afstand: {afstand}', 0, 40)
    oled.show()

    # hier staat je if-blok uit Deel 9

    sleep(0.01)
```

<Regel n={3}>
De import uit [De afstand uitlezen](site:robotica/lego_auto/afstand/uitlezen), nu tussen de andere.
</Regel>

<Regel n={11} tot={14}>
Het TOF-object op channel 0. Het scherm op channel 7 zit op dezelfde multiplexer.
</Regel>

<Regel n={34}>
Eén meting per ronde, in millimeters.
</Regel>

<Regel n={41}>
De afstand als vijfde regel op het scherm, met een f-string zoals in [Opdracht 11.5.a](site:robotica/lego_auto/afstand/op-het-scherm).
</Regel>

</CodeUitleg>

## Voorspel: er staat niets voor de robot

<Voorspel vraag="Er staat niets voor de robot. Welk getal meet de TOF, en wat doet een if met afstand < 100 dan?">
  <Keuze uitleg="Een lege meting is geen 0. Kijk in De afstand uitlezen welk getal de sensor geeft als hij niets ziet.">Hij meet 0, dus de robot stopt</Keuze>
  <Keuze uitleg="get_distance() geeft ook een getal als de sensor niets ziet. Het script loopt gewoon door.">Het script stopt met een foutmelding</Keuze>
  <Keuze goed uitleg="8191 betekent: geen geldige meting. Dat getal is groter dan 100, dus de if klopt niet en de lijnvolger gaat zijn gang.">Hij meet 8191, dus de robot rijdt door</Keuze>
  <Uitleg>

Je hoeft een lege meting hier niet apart af te vangen: alles vanaf 100 betekent voor deze `if` "rijden". Let wel op de andere kant. Onder ongeveer 5 cm geeft de TOF ook 8191, en daar kom je bij Er gaat iets mis op terug.

  </Uitleg>
</Voorspel>

## Stap 2: Stoppen gaat voor

Zet een nieuwe `if` bovenaan je `if`-blok, en maak van de `if` die er stond een `elif`:

```python
    if afstand < 100:
        motor_a.forward(0)
        motor_b.forward(0)
    elif kleur_buiten_links == "black":
        motor_a.forward(0)
        motor_b.forward(255)
```

De rest van je takken blijft zoals hij was. `100` is 10 cm, want de TOF meet in millimeters.

De `if` staat bovenaan omdat stoppen voor elke bocht gaat. Stond hij onderaan, dan won een bocht of rechtdoor, en reed de robot tegen het obstakel.

## Test het

Zet de robot op de lijn en houd je hand op ongeveer 20 cm voor de TOF. Kom langzaam dichterbij: rond `100` op het scherm stopt de robot. Haal je hand weg en hij rijdt verder.

<details>
<summary>Controlevraag</summary>

Je wilt dat de robot al op 15 cm stopt. Wat verander je?

</details>

<details>
<summary>Antwoord</summary>

`afstand < 150`. De TOF meet in millimeters, dus 15 cm is 150.

</details>

## Opdracht 11.6.a: Laat zien waarom hij stilstaat

Zet de tekst `Obstakel` onderaan het scherm zolang de robot voor een obstakel staat. Rijdt hij weer, dan verdwijnt de tekst.

<details>
<summary>Klik hier voor een tip.</summary>

Het scherm heeft deze ronde al getoond wat er bovenaan staat. In de tak die stopt, zet je er een regel bij en stuur je het scherm opnieuw. De volgende ronde begint met `fill`, en dat wist alles weer.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
    if afstand < 100:
        motor_a.forward(0)
        motor_b.forward(0)
        oled.text('Obstakel', 0, 50)
        oled.show()
```

`text` zet de regel op hoogte 50, onder de afstand, en `show` stuurt het scherm. Staat er geen obstakel meer, dan wordt deze tak niet uitgevoerd, en wist de `fill` van de volgende ronde de tekst.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

Je eigen takken uit Opdracht 10.4.a staan hier als commentaar; die heb jij zelf gemaakt.

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.sensors.tof import TimeOfFlight
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
buiten_links = AnalogIR("A2", 2500)
buiten_rechts = AnalogIR("A3", 2500)
tof = TimeOfFlight(
    channel=0,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)
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
    afstand = tof.get_distance()

    oled.fill('white')
    oled.text(f'Links: {kleur_links}', 0, 0)
    oled.text(f'Rechts: {kleur_rechts}', 0, 10)
    oled.text(f'Buiten L: {kleur_buiten_links}', 0, 20)
    oled.text(f'Buiten R: {kleur_buiten_rechts}', 0, 30)
    oled.text(f'Afstand: {afstand}', 0, 40)
    oled.show()

    if afstand < 100:
        motor_a.forward(0)
        motor_b.forward(0)
    elif kleur_buiten_links == "black":
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
<summary>Hij stopt nooit, ook niet met je hand vlak ervoor</summary>

**Oorzaak:** Je hand is dichterbij dan ongeveer 5 cm. Dan meet de TOF `8191`, en dat is niet kleiner dan 100. Of de TOF zit niet op channel 0.

**Oplossing:** Begin op 20 cm en kom langzaam dichterbij. **Zelf vinden:** kijk op het scherm naar `Afstand`. Zakt het getal mee met je hand, dan werkt de TOF en zit het in je `if`. Blijft het `8191`, kijk dan bij [De afstand uitlezen](site:robotica/lego_auto/afstand/uitlezen) onder Er gaat iets mis.

</details>

<details>
<summary>Hij stopt, rolt nog door en rijdt dan toch tegen het obstakel</summary>

**Oorzaak:** Na het stoppen rolt de robot nog een stukje uit. Komt hij daarbij onder ongeveer 5 cm, dan meet de TOF `8191`. Dat is groter dan 100, de `if` klopt niet meer, en de robot rijdt verder.

**Oplossing:** Stop eerder, bijvoorbeeld met `afstand < 150`, zodat hij niet zo dichtbij uitrolt.

</details>

<details>
<summary>Sinds de TOF erbij is, mist hij bochten die hij eerst wel nam</summary>

**Oorzaak:** Een meting van de TOF duurt langer dan die van een IR-sensor. De loop kijkt daardoor minder vaak naar de lijn.

**Zelf vinden:** zet een `#` voor de regel met `get_distance()` en een regel `afstand = 8191` eronder. Neemt de robot de bochten dan weer wel, dan ligt het aan de meting.

**Oplossing:** Meet de afstand niet elke ronde, maar eens per vijf rondes. Tel de rondes met een teller, zoals in [Code beter begrijpen](site:robotica/lego_auto/lijnsensor/code-begrijpen). De teller begint bij 0, dus de eerste ronde meet hij altijd, en daarna blijft `afstand` de vorige meting tot de teller weer op 0 staat:

```python
teller = 0

while True:
    if teller == 0:
        afstand = tof.get_distance()
    teller = teller + 1
    if teller == 5:
        teller = 0
```

`teller = 0` zet je vóór je `while True:`, de vijf regels erin komen op de plek van `afstand = tof.get_distance()`.

</details>

<details>
<summary>Foutmelding zodra het script start, bij <code>TimeOfFlight</code></summary>

**Oorzaak:** De bibliotheek vindt geen TOF op channel 0: hij zit op een ander channel, of de kabel zit los.

**Oplossing:** Dezelfde fout staat bij [De afstand uitlezen](site:robotica/lego_auto/afstand/uitlezen), met hoe je hem vindt.

</details>

Klaar? Op [Robot checken](site:robotica/robot-checken) zie je wat er nu in je `main.py` zit.

---

← [De afstand op het scherm](site:robotica/lego_auto/afstand/op-het-scherm)
