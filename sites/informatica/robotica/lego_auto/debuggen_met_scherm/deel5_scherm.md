---
sidebar_position: 4
slug: /scherm/waardes-op-scherm
title: "Deel 5: Waardes op het scherm"
---

import I2C from '@site/docs/onderdelen/_delen/i2c/pinnen.md';

# Het robotscript bouwen — Deel 5: Waardes op het scherm

<Voorkennis
  items={[
    {site: 'python', to: '/docs/projecten/staafdiagram/stap-4-midden', label: 'Een keyword-argument meegeven'},
  ]}
/>


Straks rijdt je robot los van de laptop, en dan is de Shell weg. Vanaf dat moment is het OLED-scherm je venster in de robot: daar zie je wat de sensoren zien. In dit deel vervang je de `print` door het scherm — en daarmee staat het eerste grote mijlpunt: een robot die zelf laat zien wat hij meet.

:::danger[A4 en A5 zijn bezet]

De multiplexer en het OLED-scherm praten via **I2C**, en dat gebruikt de pinnen **A4** en **A5**. Sluit daar dus **geen** IR-sensoren op aan; gebruik **A0, A1, A2, A3, A6** of **A7**.

:::

## Aansluiten

![Aansluitschema: het OLED-scherm op channel 7 van de multiplexer, en de twee IR-sensoren op het rijtje van A0 en van A1](@site/static/fritzing/shield_oled_mux_ir_bb.png)

Het scherm gaat via een 4-pins jumperkabel naar de **multiplexer**, die in de bus rechts op het shield steekt: VCC, GND, SDA en SCL elk naar de pin met dezelfde naam op channel **7**. De IR-sensoren blijven zitten waar ze zaten, op A0 en A1. Steek je hem in een ander channel, pas dan het getal in je code aan.

## Stap 1: Eerst het scherm alleen

Nieuw onderdeel, dus eerst een minimale test — los van je robotscript:

<CodeUitleg>

```python showLineNumbers
from leaphymicropython.actuators.oled_screen import OLEDSH1106

oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)

oled.fill('white')
oled.text('Hallo robot', 0, 0)
oled.show()
```

<Regel n={3} tot={6}>
Maakt het scherm-object: 128 pixels breed, 64 hoog, op channel 7 van de multiplexer, en aangesloten op de pinnen SDA en SCL. Elke instelling is een keyword-argument: de naam voor de `=` zegt welke instelling het is.
</Regel>

<Regel n={8} tot={10}>
Tekenen gaat altijd in drie stappen: `fill('white')` maakt het scherm leeg, `text(tekst, x, y)` zet tekst klaar op een positie, en `show()` stuurt alles in één keer naar het scherm.
</Regel>

</CodeUitleg>

<details>
<summary>Waarom staat er "SDA" en "SCL"?</summary>

<I2C />

</details>

## Voorspel: wat gebeurt er zonder `show()`?

<details>
<summary>Antwoord</summary>

Het scherm blijft leeg. `fill()` en `text()` werken in een kladversie in het geheugen; pas `show()` stuurt die naar het echte scherm. Dit is de vergeten-regel nummer één bij schermen — onthoud hem.

</details>

## Stap 2: Het scherm in je robotscript

Terug naar je script uit Deel 4. De `print`-regel gaat eruit; het scherm komt ervoor in de plaats:

<CodeUitleg>

```python showLineNumbers
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text(f'Links: {kleur_links}', 0, 0)
    oled.text(f'Rechts: {kleur_rechts}', 0, 10)
    oled.show()
    sleep(0.2)
```

<Regel n={7} tot={10}>
Het scherm-object staat bóven de loop: je zet het één keer klaar. Die opbouw ken je al van de sensoren.
</Regel>

<Regel n={16} tot={19}>
Het tekenen zit in de loop, elke ronde opnieuw.
</Regel>

<Regel n={17}>
`f'Links: {kleur_links}'` is dezelfde f-string als in je `print` uit [Deel 3](site:robotica/lego_auto/lijnsensor/een-sensor): op het scherm komt `Links: white` of `Links: black`. Hoe een f-string werkt, staat bij [Tekst en getallen combineren met f-strings](site:python/docs/tekst/04a-f-strings).
</Regel>

<Regel n={18}>
De tweede regel staat op `y=10`, tien pixels lager. Anders schrijven de twee regels door elkaar heen.
</Regel>

</CodeUitleg>

## Test het

Beweeg de robot boven de lijn. Het scherm toont `Links:` en `Rechts:` en wisselt live mee tussen `white` en `black` — zonder dat je nog naar de Shell hoeft te kijken.

:::tip[Grotere letters]
Is de tekst te klein om te lezen terwijl de robot rijdt? `text()` heeft ook een `scale`: met `scale=2` is elke letter twee keer zo groot. Er passen dan wel maar 8 tekens op een regel, dus `Links: white` past niet meer. Hoe dat werkt staat bij [grotere tekst](site:robotica/docs/onderdelen/oled-scherm#grotere-tekst).
:::

## Opdracht 6.4.a: een teller op het scherm

Nog even los van je robotscript: laat het scherm elke seconde een teller zien die één hoger wordt (0, 1, 2, 3, …).

<details>
<summary>Klik hier voor een tip.</summary>

Je hebt een variabele nodig die boven de loop op `0` begint en er in de loop `1` bij krijgt. Het scherm kan alleen tekst tonen, dus zet het getal in een f-string.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
from time import sleep
from leaphymicropython.actuators.oled_screen import OLEDSH1106

oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)
teller = 0

while True:
    oled.fill('white')
    oled.text(f'Teller: {teller}', 0, 0)
    oled.show()
    teller = teller + 1
    sleep(1)
```

`teller = teller + 1` is het patroon voor alles wat moet oplopen; de f-string maakt er tekst van, want `text()` accepteert geen kaal getal.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.oled_screen import OLEDSH1106

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(
    width=128, height=64, channel=7,
    sda_gpio_pin="SDA", scl_gpio_pin="SCL",
)

while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()

    oled.fill('white')
    oled.text(f'Links: {kleur_links}', 0, 0)
    oled.text(f'Rechts: {kleur_rechts}', 0, 10)
    oled.show()
    sleep(0.2)
```

</details>

## Er gaat iets mis

<details>
<summary>Het scherm blijft helemaal leeg</summary>

**Oorzaak:** `show()` ontbreekt, het scherm zit op een ander channel dan je code zegt, of de kabel zit los.

**Oplossing:**

1. Controleer dat er ergens in je loop `oled.show()` staat.
2. Kijk op de multiplexer bij welk channel de kabel echt zit en vergelijk met `channel=7`.

**Zelf vinden:** zet een `print("teken")` naast `oled.show()`. Verschijnt die regel wél in de Shell, dan draait je code en zit het bij het scherm of de kabel; verschijnt hij niet, dan komt je code daar nooit.

</details>

<details>
<summary>Oude tekst blijft op het scherm staan of schuift door elkaar</summary>

**Oorzaak:** `oled.fill('white')` ontbreekt, waardoor elke ronde óver de vorige heen tekent.

**Oplossing:** Begin elke tekenronde met `oled.fill('white')`: eerst schoonvegen, dan schrijven.

</details>

<details>
<summary>Foutmelding zodra je een getal op het scherm wilt zetten</summary>

**Oorzaak:** `text()` accepteert alleen tekst, geen kaal getal.

**Oplossing:** Zet het getal in een f-string: `oled.text(f'Waarde: {meting}', 0, 0)`.

</details>

**Controlevraag:** Waarom staat er `y=10` bij de tweede tekstregel?

<details>
<summary>Antwoord</summary>

De y is de hoogte in pixels waarop de tekst begint. Twee regels op dezelfde y schrijven dwars door elkaar heen; tien pixels verschil zet ze netjes onder elkaar.

</details>

---

← [Deel 4 — Twee sensoren](site:robotica/lego_auto/lijnsensor/twee-sensoren) · **Volgende:** [de motoren](site:robotica/lego_auto/motoren) →
