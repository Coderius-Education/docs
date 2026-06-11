---
sidebar_position: 2
hide_table_of_contents: true
---

# 2.2 Soorten fysica

:::info Wat moet je al weten
- [2.1 Links en rechts bewegen](/docs/fysica/links_en_rechts) - hoe je `start_physics()` aanroept
:::

Niet elke vorm gedraagt zich hetzelfde. Een bal die rondstuitert is anders dan een platform dat stilstaat.

Met **physics_info()** kun je opvragen welk type fysica een vorm heeft.

```python
import play

cirkel = play.new_circle()
cirkel.start_physics()

cirkel.physics_info()
```

Je ziet nu in je console informatie over het type fysica. Het type wordt bepaald door drie attributen:

| Attribuut | Wat doet het? |
| --- | --- |
| **can_move** | `True` = de vorm mag bewegen, `False` = de vorm staat altijd stil |
| **obeys_gravity** | `True` = de zwaartekracht trekt de vorm naar beneden, `False` = geen zwaartekracht |
| **stable** | `True` = de vorm beweegt niet als iets ertegen botst, `False` = de vorm wordt weggeduwd bij een botsing |

Door deze drie attributen te combineren, krijg je drie soorten fysica:

## Dynamic

Een **dynamic** vorm beweegt vrij rond. De zwaartekracht en botsingen hebben er invloed op. Dit is de standaard.

```python
import play

bal = play.new_circle()
bal.start_physics(can_move=True, obeys_gravity=True, stable=False)

bal.physics_info()
```

- **can_move=True**: de bal mag bewegen
- **obeys_gravity=True**: de bal valt naar beneden
- **stable=False**: als iets tegen de bal botst, wordt de bal weggeduwd

De bal valt naar beneden en stuitert. Dat is dynamic gedrag.

## Static

Een **static** vorm staat helemaal stil en kan niet bewegen. Andere vormen kunnen er wel tegenaan botsen.

```python
import play

muur = play.new_box(y=-200, width=400, height=20)
muur.start_physics(can_move=False, obeys_gravity=True, stable=True)

muur.physics_info()
```

- **can_move=False**: de muur kan niet bewegen
- **obeys_gravity=True**: maakt niet uit, want de muur kan toch niet bewegen
- **stable=True**: de muur wordt niet weggeduwd bij een botsing

De muur blijft op zijn plek, wat er ook tegenaan botst.

## Kinematic

Een **kinematic** vorm beweegt volgens een vaste snelheid. De zwaartekracht heeft er geen invloed op, maar andere vormen botsen er wel tegenaan.

```python
import play

platform = play.new_box(width=200, height=20)
platform.start_physics(can_move=True, obeys_gravity=False, stable=True, x_speed=40)

platform.physics_info()
```

- **can_move=True**: het platform mag bewegen
- **obeys_gravity=False**: het platform valt niet naar beneden
- **stable=True**: het platform wordt niet weggeduwd bij een botsing

Het platform beweegt heen en weer, maar valt niet naar beneden.

## Overzicht

| Type | can_move | obeys_gravity | stable | Voorbeeld |
| --- | --- | --- | --- | --- |
| **dynamic** | True | True | False | Een bal die rondstuitert |
| **static** | False | -- | True | Een muur die stilstaat |
| **kinematic** | True | False | True | Een batje dat je bestuurt |

## Opdracht 2.2.a: Welk type gebruik je?

Stel je maakt een pong-spel. Welk type fysica (**dynamic**, **static** of **kinematic**) zou je gebruiken voor elk van deze onderdelen? Bedenk je antwoord eerst zelf.

| Onderdeel | Type fysica? |
| --- | --- |
| De bal die rondstuitert | ??? |
| Het batje dat je met de muis bestuurt | ??? |
| De muren aan de boven- en onderkant | ??? |

<details>
<summary>Klik hier voor de oplossing!</summary>

| Onderdeel | Type fysica | Waarom? |
| --- | --- | --- |
| De bal | **dynamic** | De bal beweegt vrij rond en reageert op botsingen. |
| Het batje | **kinematic** | Het batje beweegt, maar wordt bestuurd door de speler, niet door de zwaartekracht. |
| De muren | **static** | De muren staan stil en kunnen niet bewegen, maar andere vormen botsen er wel tegenaan. |

</details>

## Opdracht 2.2.b: Herken het type

Maak de volgende drie vormen en voorspel voor elk welk type fysica het is. Controleer je antwoord met **physics_info()**.

```python
import play

vorm_a = play.new_circle()
vorm_a.start_physics(can_move=True, obeys_gravity=True, stable=False)

vorm_b = play.new_box(y=-200, width=400, height=20)
vorm_b.start_physics(can_move=False, obeys_gravity=True, stable=True)

vorm_c = play.new_circle(y=200, color='red')
vorm_c.start_physics(can_move=True, obeys_gravity=False, stable=True, x_speed=50)

# print hier de physics_info() van elke vorm
```

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

vorm_a = play.new_circle()
vorm_a.start_physics(can_move=True, obeys_gravity=True, stable=False)
print("vorm_a:")
vorm_a.physics_info()

vorm_b = play.new_box(y=-200, width=400, height=20)
vorm_b.start_physics(can_move=False, obeys_gravity=True, stable=True)
print("vorm_b:")
vorm_b.physics_info()

vorm_c = play.new_circle(y=200, color='red')
vorm_c.start_physics(can_move=True, obeys_gravity=False, stable=True, x_speed=50)
print("vorm_c:")
vorm_c.physics_info()
```

- **vorm_a** is dynamic (kan bewegen, zwaartekracht aan, niet stabiel)
- **vorm_b** is static (kan niet bewegen, stabiel)
- **vorm_c** is kinematic (kan bewegen, geen zwaartekracht, stabiel)

</details>

:::info Waar kom je dit later weer tegen?
Bij [Pong (eindproject)](/docs/jouw_project/pong) pas je deze drie types direct toe: de bal is **dynamic**, de batjes zijn **kinematic**, en de muren zijn **static**. Opdracht 2.2.a hierboven is feitelijk al de voorbereiding op die keuze.
:::
