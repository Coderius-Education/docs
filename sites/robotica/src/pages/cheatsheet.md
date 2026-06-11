# Robotica Cheatsheet

Handige tips en veelvoorkomende problemen voor jouw robotica-project.

:::danger Let op: A4 en A5 zijn bezet bij gebruik van een multiplexer!

Pinnen **A4** en **A5** worden gebruikt voor **I2C communicatie** (SDA en SCL). Als je een multiplexer, TOF-sensor of OLED-scherm gebruikt, zijn deze pinnen al bezet. Sluit hier **geen** IR-sensoren op aan! Gebruik alleen **A0, A1, A2, A3, A6, A7** voor IR-sensoren.

:::

:::danger Let op: D2, D3, D4 en D11 zijn bezet bij gebruik van het motor shield!

Pinnen **D2**, **D3**, **D4** en **D11** worden door het motor shield gebruikt om de motoren aan te sturen. Sluit hier **geen** andere sensoren of actuatoren op aan!

:::
---

## 🔴 IR-Sensor (Analoog)

<details>
<summary>IR-sensor uitlezen</summary>

```python
from leaphymicropython.sensors.linesensor import AnalogIR

a0 = AnalogIR("A0", 2500)  # Pin A0, threshold 2500
waarde = a0.get_analog_value()  # Geeft 0-65535
kleur = a0.black_or_white()     # Geeft "black" of "white"
```
</details>

---

## ⚙️ DC Motoren

<details>
<summary>Testen welke motor welke is</summary>

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

motor_a.test()  # Motor A gaat kort vooruit en achteruit
motor_b.test()  # Motor B gaat kort vooruit en achteruit
```
</details>

<details>
<summary>Vooruit rijden</summary>

```python
# Snelheid tussen 0-255
motor_a.forward(200)
motor_b.forward(200)
```
</details>

<details>
<summary>Achteruit rijden</summary>

```python
motor_a.backward(200)
motor_b.backward(200)
```
</details>

<details>
<summary>Stoppen</summary>

```python
motor_a.stop()
motor_b.stop()
```
</details>

<details>
<summary>Motor shield uitschakelen</summary>

Gebruik de zwarte schakelaar op het motor shield om de motoren volledig uit te schakelen. Dit voorkomt dat de motoren onverwacht gaan draaien tijdens het programmeren.
</details>



---

## 📏 TOF-Sensor (Time of Flight)

<details>
<summary>Basis code (zonder multiplexer)</summary>

```python
from leaphymicropython.sensors.tof import TimeOfFlight

tof = TimeOfFlight()
afstand = tof.get_distance()  # In millimeters (betrouwbaar ~5-200 cm)

print(afstand)  # Bijvoorbeeld: 234 (= 23,4 cm)
```
</details>

<details>
<summary>Basis code (met multiplexer)</summary>

```python
from leaphymicropython.sensors.tof import TimeOfFlight

tof_1 = TimeOfFlight(channel=0)
tof_2 = TimeOfFlight(channel=1)

afstand_1 = tof_1.get_distance()
afstand_2 = tof_2.get_distance()
```
</details>

<details>
<summary>Alleen geldige metingen gebruiken</summary>

`get_distance()` geeft altijd een getal terug. **Alles boven 8090 is geen echte afstand.**

```python
afstand = tof.get_distance()

if afstand > 8090:
    print("geen geldige meting")
else:
    print(afstand)  # echte afstand in mm
```
</details>

<details>
<summary>Betekenis van de getallen</summary>

| Waarde | Betekenis |
|---|---|
| `0` – ~`8090` | Geldige afstand in millimeters |
| `8191` | Geen geldig object: te ver, niets ervoor, of te dichtbij (< ~5 cm) |
| `9000 + errno` (bijv. `9110`) | I2C-/communicatiefout (losse SDA/SCL-draad, sensor niet gevonden, verkeerd channel). Foutcode = waarde − 9000 |
| `9999` | Onbekende fout |

De volgende `get_distance()` probeert na een fout vanzelf opnieuw te verbinden.
</details>
---

## 🖥️ OLED-Scherm (SH1106 128x64)

<details>
<summary>Basis code</summary>

```python
from leaphymicropython.actuators.oled_screen import OLEDSH1106

oled = OLEDSH1106(width=128, height=64, channel=7)

# Tekst tonen
oled.fill("white")
oled.text('Hallo!', x=0, y=0)
oled.show()  # Vergeet deze niet!

# Scherm wissen
oled.fill("black")
oled.show()
```
</details>

<details>
<summary>Sensorwaarden tonen op het scherm</summary>

```python
# Zet getallen om naar tekst met str()
afstand = 123
oled.fill("white")
oled.text('Afstand: ' + str(afstand), x=0, y=0)
oled.show()
```
</details>



