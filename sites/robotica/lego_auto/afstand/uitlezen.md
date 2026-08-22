---
sidebar_position: 4
slug: /afstand/uitlezen
title: De afstand uitlezen
---

# De afstand uitlezen

Je lijnvolger is af; vanaf hier bouw je uit. De TOF-sensor zit gemonteerd en aangesloten op de multiplexer — dezelfde module waar je scherm al op zit. Eerst weer een minimale losse test, zoals bij elk nieuw onderdeel.

## Aansluiten

Steek de TOF in **channel 0** van de multiplexer. Het cijfer staat boven het stel pinnen. Channel **7** is al bezet: daar zit je OLED-scherm.

## Stap 1: De sensor alleen

```python
from time import sleep
from leaphymicropython.sensors.tof import TimeOfFlight

tof = TimeOfFlight(channel=0)

while True:
    print(tof.get_distance())
    sleep(1)
```

**`TimeOfFlight(channel=0)`** maakt het sensor-object aan op channel 0 van de multiplexer. **`get_distance()`** geeft de afstand in **millimeters**.

## Test het

Houd je hand op ongeveer 20 cm voor de sensor: de Shell toont rond de `200`. Beweeg je hand langzaam weg en zie het getal meegroeien.

<details>
<summary>Controlevraag</summary>

Je steekt de sensor om in het stel pinnen onder het cijfer **2**. Wat verandert er in je code?

</details>

<details>
<summary>Antwoord</summary>

Alleen `channel=2`. Het cijfer boven de pinnen op de multiplexer is precies het getal dat je invult.

</details>

## Er gaat iets mis

<details>
<summary>De sensor geeft steeds <code>8191</code></summary>

**Oorzaak:** `8191` is de code voor "geen geldige meting": het doel is te ver weg, te dichtbij, of de straal kaatst nergens op terug.

**Oplossing:** Houd een groot, licht voorwerp (een boek, je hand) op 10-50 cm recht voor de sensor. Blijft het `8191`, controleer dan of de sensor echt in channel **0** zit en je code hetzelfde getal noemt.

</details>

<details>
<summary>Foutmelding zodra het script start</summary>

**Oorzaak:** De sensor zit op een ander channel dan je code zegt, of de jumperkabel zit los — de bibliotheek vindt dan geen sensor op dat kanaal.

**Oplossing:** Vergelijk het cijfer boven de pinnen met `channel=` in je code, en druk de kabel stevig aan. **Zelf vinden:** je scherm zit op dezelfde multiplexer. Doet het scherm het nog wel, dan werkt de module en zit het verschil in het kanaal of de kabel van de TOF.

</details>

---

**Volgende:** [de afstand op het scherm](./tof_scherm.md) →
