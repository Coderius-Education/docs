---
sidebar_position: 1
displayed_sidebar: null
hide_pagination: true
---

# Debuggen

Werkt iets niet zoals je verwacht? Loop deze pagina door. De problemen staan gegroepeerd per onderwerp. Klik op een vraag om de oorzaak en oplossing te zien.

## Stroom

<details>
<summary>Mijn robot doet helemaal niets</summary>

- Brandt het **groene lampje** op de microcontroller? Zo niet, dan krijgt hij geen stroom.
- Staat de ON/OFF-schakelaar op **ON** bij het **Murphy Shield**?
- Staat de ON/OFF-schakelaar op **ON** bij het **Motor Shield**?
- Staat de ON/OFF-schakelaar op **ON** bij de **batterijhouder**?

</details>

<details>
<summary>Mijn computer heeft geen verbinding met de robot</summary>

- **USB-kabel:** zit hij goed aan beide kanten? Probeer een andere USB-poort of een andere kabel (sommige laadkabels kunnen geen data versturen).
- **Interpreter:** staat rechtsonder in Thonny iets dat begint met `MicroPython (RP2040)`? Zo niet, klik er rechts onderin op en kies hem.
- **Poort:** ga naar `Run > Configure interpreter...` en kies de juiste poort. Soms helpt het om de microcontroller los te koppelen en opnieuw aan te sluiten, en dan in Thonny op **Stop/Restart backend** te drukken.

</details>

<details>
<summary>Mijn computer heeft alleen USB-C-ingangen</summary>

Dan heb je een moderne laptop. Gebruik een **USB-C naar USB-A**-adapter of vraag je docent om een geschikte kabel.

</details>

## IR-sensoren

:::danger A4 en A5 zijn bezet bij gebruik van een multiplexer

Pinnen **A4** en **A5** zijn nodig voor **I2C** (SDA en SCL). Heb je een multiplexer, TOF-sensor of OLED-scherm? Dan zijn deze pinnen bezet. Sluit IR-sensoren alleen aan op **A0, A1, A2, A3, A6** of **A7**.

:::

<details>
<summary>Mijn sensor geeft rare of geen waardes</summary>

- **Krijgt de sensor stroom?** Brandt het groene lampje op de sensor?
- **Print de ruwe waardes** zodat je ziet wat er gebeurt:

```python
from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

sensor = AnalogIR("A0", 2500)

while True:
    print(sensor.get_analog_value())
    sleep(0.1)
```

Beweeg je hand boven de sensor of houd er een zwart/wit vel papier voor. Veranderen de waardes?

</details>

<details>
<summary>Mijn lijnvolger volgt de lijn niet</summary>

- **Kalibreer de drempel:** print de waardes boven de lijn én ernaast. Kies een drempel daar precies tussenin (zie [11.2 Eén analoge IR-sensor](../Tutorial-analoge%20IR-sensor/analog_ir.md)).
- **Sensorpositie:** zitten de sensoren laag genoeg en op de goede breedte?
- **Logica:** loop in je hoofd of op papier door wat de motoren moeten doen bij elke combinatie van zwart/wit.

</details>

## Motoren

:::danger D2, D3, D4 en D11 zijn bezet door het motor shield

Sluit hier **geen** andere sensoren of actuatoren op aan (geen buzzer, LED of sensor). Zie [13.3 Let op: bezet pinnen](../Tutorial-Dcmotor/2_b_let_op.md).

:::

<details>
<summary>Motor draait niet</summary>

Snelheid te laag? Probeer minimaal **180–200** vanwege het gewicht. Check ook of de batterijen vol zijn.

</details>

<details>
<summary>Motor draait de verkeerde kant op</summary>

Wissel de `+` en `-` draden van de motor om op het motor shield. Of pas in je code `forward()` en `backward()` om.

</details>

<details>
<summary>Motor shield-lampje brandt maar motor draait niet</summary>

Check of de batterijen vol zijn en zet de snelheid op minstens **180–200**.

</details>

<details>
<summary>Robot rijdt niet rechtdoor</summary>

Motoren draaien zelden precies even snel. Geef ze losse snelheden, bijvoorbeeld `motor_a.forward(200)` en `motor_b.forward(210)`.

</details>

<details>
<summary>Eén of beide motoren werken niet</summary>

- Gebruik **`test()`** om snel te checken of de aansturing klopt:

  ```python
  from leaphymicropython.actuators.dcmotor import DCMotors

  motoren = DCMotors()
  motoren.motor_a.test()
  motoren.motor_b.test()
  ```

- Onder **200** beweegt de robot vaak niet. Probeer eerst `motor_a.forward(255)`.
- Zitten de draden goed in de schroefterminals?

</details>

## TOF-sensoren

<details>
<summary>TOF-sensor geeft 8191 (geen geldige meting)</summary>

- `8191` betekent: **geen geldig object**. Het object is te ver weg, er staat niets voor de sensor, of het object is juist te dichtbij (onder ongeveer **5 cm**). De TOF meet betrouwbaar tussen ongeveer **5 cm en 200 cm**.
- Vuistregel: elk getal **boven 8090** is geen echte afstand.
- Test met een wit vel op 10–30 cm afstand:

```python
from leaphymicropython.sensors.tof import TimeOfFlight
from time import sleep

tof = TimeOfFlight()

while True:
    print(tof.get_distance())
    sleep(0.1)
```

</details>

<details>
<summary>TOF-sensor geeft een getal boven 9000</summary>

- Een getal **boven 9000** is geen afstand, maar een **communicatiefout** (I2C). Veelvoorkomende oorzaken: een losse **SDA**- of **SCL**-draad, de sensor wordt niet gevonden, een verkeerd `channel`, of geen stroom.
- Het getal verraadt de fout: `9110` is bijvoorbeeld een **timeout** (de foutcode is het getal min 9000). `9999` betekent een onbekende fout.
- Herstel je de draad? Dan komen de geldige metingen vanzelf weer terug — de sensor probeert het bij de volgende meting opnieuw.
- Werkt het daarna nog niet? Loop dan de checks bij **"TOF-sensor werkt helemaal niet"** hieronder door.

</details>

<details>
<summary>TOF-sensor geeft onstabiele metingen</summary>

- Gebruik een **wit oppervlak** om op te richten — donkere of glanzende oppervlakken werken slechter.
- Voeg `sleep(0.05)` toe tussen metingen.
- Check de SDA- en SCL-kabels naar de multiplexer of de Nano.

</details>

<details>
<summary>Meerdere TOF-sensoren werken niet tegelijk</summary>

- Je hebt een **multiplexer** nodig — alle TOFs hebben hetzelfde I2C-adres.
- Geef elke sensor zijn eigen channel:

```python
tof_1 = TimeOfFlight(channel=0)
tof_2 = TimeOfFlight(channel=1)
```

</details>

<details>
<summary>TOF-sensor werkt helemaal niet</summary>

- Check de multiplexer: is die goed aangesloten op de SDA- en SCL-pinnen?
- Krijgt de sensor stroom? (VCC en GND.)
- Klopt het `channel`-nummer in je code met de plek op de multiplexer?

</details>

## OLED-scherm

<details>
<summary>OLED-scherm blijft leeg of zwart</summary>

- Vergeet **`oled.show()`** niet aan te roepen — anders verschijnt er niets:

```python
oled.text('Hallo!', x=0, y=0)
oled.show()
```

- Check het **channel** van de multiplexer (meestal 7).
- Check de bedrading: SDA, SCL, VCC en GND.

</details>

<details>
<summary>Oude tekst blijft op het scherm staan</summary>

- Wis eerst met `oled.fill("white")` of `oled.fill("black")`:

```python
oled.fill("white")
oled.text('Nieuwe tekst', x=0, y=0)
oled.show()
```

</details>

<details>
<summary>Error bij het tonen van getallen</summary>

- Zet getallen om met **`str()`**:

```python
afstand = 123
oled.text('Afstand: ' + str(afstand), x=0, y=0)
oled.show()
```

</details>

<details>
<summary>Tekst valt buiten het scherm</summary>

- Het scherm is **128** pixels breed en **64** pixels hoog.
- Een tekstregel is ongeveer **10** pixels hoog. Gebruik `y=0`, `y=10`, `y=20`, ...:

```python
oled.text('Regel 1', x=0, y=0)
oled.text('Regel 2', x=0, y=10)
oled.text('Regel 3', x=0, y=20)
oled.show()
```

</details>

<details>
<summary>Scherm flikkert of is traag</summary>

- Update niet vaker dan **10 keer per seconde**. Zet `sleep(0.1)` in je loop.
- Roep `show()` alleen aan als de tekst echt verandert.

</details>
