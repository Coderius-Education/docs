---
sidebar_position: 1
hide_table_of_contents: true
---

# 2.1 Ingebouwd lampje aanzetten

Je eerste programma! Op de Nano RP2040 Connect zit een **ingebouwd lampje** met de naam `LED`. Dat zetten we aan met een paar regels code, zonder dat je iets aan hoeft te sluiten.

## Code

Kopieer dit in je editor en druk op **Run**:

```python
from machine import Pin

pin_van_lampje = Pin('LED', Pin.OUT)
pin_van_lampje.on()
```

## Uitleg

- `Pin('LED', Pin.OUT)` zegt: ik wil de pin met de naam `LED` gebruiken als **uitgang**.
- `.on()` zet de pin aan. Het lampje brandt nu.

Wil je het lampje weer uitzetten? Gebruik dan:

```python
pin_van_lampje.off()
```

<details>
<summary>Controlevraag</summary>

Wat doet `Pin.OUT`?

</details>

<details>
<summary>Antwoord</summary>

`Pin.OUT` vertelt de microcontroller dat deze pin een **uitgang** is. De microcontroller stuurt dan stroom naar buiten (om bijvoorbeeld een lampje aan te zetten) in plaats van iets te lezen.

</details>
