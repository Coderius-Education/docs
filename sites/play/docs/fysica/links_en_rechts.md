---
sidebar_position: 1
hide_table_of_contents: true
---

# 2.1 Links en rechts bewegen

Tijd voor beweging! Met **start_physics()** kun je een vorm laten bewegen.

Bekijk de code hieronder. Wat denk je dat er gebeurt?

```python
import play

cirkel = play.new_circle()
cirkel.start_physics(obeys_gravity=False, x_speed=60)
```

<details>
<summary>Klik hier om het antwoord te zien</summary>

Voer de code uit. De bal beweegt naar rechts en stuitert tegen de muur!

:::info
`coderius-play` maakt automatisch onzichtbare muren aan de randen van het scherm. Vormen stuiteren hier standaard tegenaan.
:::
</details>

Wat gebeurt hier?

```python
cirkel.start_physics(obeys_gravity=False, x_speed=60)
```
- **obeys_gravity=False**: de zwaartekracht staat uit, dus de bal valt niet naar beneden
- **x_speed=60**: de bal beweegt met snelheid 60 naar rechts

Als het goed is, zie je de bal heen en weer bewegen.

### Onderzoek

Probeer eens de volgende aanpassingen en kijk wat er verandert:
- Wat gebeurt er als je `x_speed` op `0` zet?
- Wat als je `obeys_gravity=False` weghaalt (of op `True` zet)?

<details>
<summary>Klik hier voor het antwoord</summary>

- Met `x_speed=0` staat de bal stil (er is geen horizontale snelheid).
- Met `obeys_gravity=True` valt de bal naar beneden door de zwaartekracht!

</details>

## Opdracht 2.1.a

a) Laat de bal met snelheid 100 naar **links** bewegen.

<details>
<summary>Klik hier voor een tip!</summary>

Positief is naar rechts, negatief is naar links.
</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

cirkel = play.new_circle()
cirkel.start_physics(obeys_gravity=False, x_speed=-100)
```

</details>

b) Laat de bal schuin naar de rechterboven hoek bewegen.

<details>
<summary>Klik hier voor een tip!</summary>

Naast **x_speed** bestaat er ook **y_speed**.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

cirkel = play.new_circle()
cirkel.start_physics(obeys_gravity=False, x_speed=100, y_speed=100)
```

</details>

:::info Waar kom je dit later weer tegen?
- In [5.1 Wachten in je spel](/docs/tijd/bal) gebruik je opnieuw `x_speed` om een bal te laten bewegen — en zie je waarom `time.sleep()` daar problemen veroorzaakt.
- In [Pong (eindproject)](/docs/jouw_project/pong) gebruik je `x_speed` én `y_speed` om de bal diagonaal te laten stuiteren.
:::
