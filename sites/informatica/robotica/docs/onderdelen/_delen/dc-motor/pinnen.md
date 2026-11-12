### De pinnen in je code

De motormodule steekt in de bus aan de linkerkant van het shield. Die bus is in het shield vast verbonden met vier pinnen van de Nano: D2, D3, D4 en D11. Daarom zijn die pinnen bezet, ook al zit er geen draadje op. In je code geef je ze mee als je `DCMotors` maakt:

```python
from leaphymicropython.actuators.dcmotor import DCMotors

motoren = DCMotors(
    dir_pin_motor_a="D2",
    pwm_pin_motor_a="D3",
    dir_pin_motor_b="D4",
    pwm_pin_motor_b="D11",
)
```

`dir_pin_motor_a="D2"` is een **keyword-argument**: de naam voor de `=` zegt welke pin het is, de tekst erachter op welke pin van de Nano hij zit. Zo lees je in je eigen code welke pin wat doet, en maakt de volgorde niet uit.

### Richting en snelheid

Elke motor heeft er twee:

| Motor | Richting (`dir_pin_…`) | Snelheid (`pwm_pin_…`) |
|:---:|:---:|:---:|
| A | D2 | D3 |
| B | D4 | D11 |

- De **richtingspin** (*direction*) staat aan of uit. `forward()` zet hem aan en `backward()` zet hem uit; de module stuurt de stroom dan de ene of de andere kant op door de motor.
- De **snelheidspin** gaat heel snel aan en uit, 20.000 keer per seconde. Hoe langer hij elke keer aan blijft, hoe harder de motor draait: bij `forward(255)` staat hij steeds aan, bij `forward(0)` nooit. Dat heet **PWM** (*pulse-width modulation*).

Laat je de vier weg en schrijf je `DCMotors()`, dan kiest de bibliotheek precies dezelfde pinnen. Alleen zie je dan niet meer welke bezet zijn.

### Controlevraag \{#motorpinnen-controlevraag}

<Voorspel soort="Controlevraag" vraag="Je robot voert motoren.motor_b.backward(200) uit. Wat doet pin D4 dan?">
  <Keuze goed uitleg="backward() zet de richtingspin van motor B uit, en die richtingspin is D4.">Uit.</Keuze>
  <Keuze uitleg="Aanzetten doet forward(). Kijk welke van de twee hier staat.">Aan.</Keuze>
  <Keuze uitleg="Zo werkt de snelheidspin. Zoek in de tabel welke soort pin D4 is.">Snel aan en uit.</Keuze>
  <Uitleg>D4 is de richtingspin van motor B en staat aan voor vooruit en uit voor achteruit. De 200 gaat naar de snelheidspin, D11.</Uitleg>
</Voorspel>
