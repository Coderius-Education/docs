---
sidebar_position: 3
hide_table_of_contents: true
---

# 2.3 Fysica-eigenschappen

:::info Wat moet je al weten
- [2.1 Links en rechts bewegen](/docs/fysica/links_en_rechts) en [2.2 Soorten fysica](/docs/fysica/physics_info) - de basis van fysica in play
:::

Je hebt al geleerd hoe je vormen kunt laten bewegen en welke soorten fysica er zijn. Maar er is meer! Met eigenschappen als **bounciness**, **mass** en **sensor** kun je het gedrag van je vormen fijner instellen.

## Bounciness (stuiteren)

`bounciness` bepaalt hoe hard een vorm terugkaatst na een botsing.

- `1.0` = de vorm kaatst net zo hard terug als dat deze aankwam (dit is het maximum)
- `0.0` = de vorm kaatst helemaal niet terug

```python
import play

vloer = play.new_box(y=-200, width=600, height=20)

bal = play.new_circle(y=200, radius=20)
bal.start_physics(bounciness=1.0)
```

De bal stuitert bijna eindeloos op en neer (maar verliest heel langzaam energie).

### Opdracht 2.3.a: Stuiterballen vergelijken

Maak drie ballen naast elkaar met verschillende `bounciness` waarden: `0.2`, `0.6` en `1.0`. Laat ze allemaal vanaf dezelfde hoogte vallen op een vloer. Welke bal stuitert het hoogst?

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

vloer = play.new_box(y=-200, width=600, height=20)

bal_a = play.new_circle(x=-150, y=200, radius=20, color='red')
bal_a.start_physics(bounciness=0.2)

bal_b = play.new_circle(x=0, y=200, radius=20, color='blue')
bal_b.start_physics(bounciness=0.6)

bal_c = play.new_circle(x=150, y=200, radius=20, color='green')
bal_c.start_physics(bounciness=1.0)
```

De groene bal (`bounciness=1.0`) stuitert het hoogst.

</details>

## Mass (massa)

`mass` bepaalt hoe "zwaar" een vorm is. Dit merk je bij botsingen: een zware vorm duwt een lichte vorm makkelijker weg.

```python
import play

licht = play.new_circle(x=-200, radius=20, color='red')
licht.start_physics(obeys_gravity=False, x_speed=50, mass=1)

zwaar = play.new_circle(x=200, radius=40, color='blue')
zwaar.start_physics(obeys_gravity=False, x_speed=-50, mass=10)
```

De blauwe bal (mass=10) duwt de rode bal (mass=1) makkelijk weg.

### Opdracht 2.3.b: Botsende ballen

Maak twee ballen die naar elkaar toe bewegen:
1. Eén bal met `mass=1`
2. Eén bal met `mass=1`

Wat gebeurt er? Verander daarna de massa van één bal naar `mass=20`. Wat is het verschil?

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

bal_a = play.new_circle(x=-200, radius=20, color='red')
bal_a.start_physics(obeys_gravity=False, x_speed=50, mass=1)

bal_b = play.new_circle(x=200, radius=20, color='blue')
bal_b.start_physics(obeys_gravity=False, x_speed=-50, mass=20)
```

Bij gelijke massa kaatsen de ballen gelijk terug. Met ongelijke massa wordt de lichtere bal veel verder weggeduwd.

</details>

## Sensor

`sensor` bepaalt of een vorm botsingen **detecteert** zonder ze fysiek te **blokkeren**. Een sensor-vorm laat andere vormen er doorheen bewegen, maar je kunt nog steeds `when_touching` gebruiken om te weten wanneer ze elkaar raken.

- `True` = de vorm is een sensor (objecten gaan er doorheen)
- `False` = de vorm is normaal en blokkeert andere vormen (dit is de standaard)

```python
import play

vloer = play.new_box(y=-200, width=600, height=20)

bal = play.new_circle(y=200, radius=20)
bal.start_physics()

zone = play.new_box(y=0, width=200, height=100, color='green', transparency=50)
zone.start_physics(sensor=True)

tekst = play.new_text("", y=250, font_size=30)

@bal.when_touching(zone)
def in_de_zone():
    tekst.words = "In de zone!"
```

De bal valt door de groene zone heen (want die is een sensor), maar de tekst verandert zodra ze elkaar raken.

Je kunt `sensor` ook tijdens het spel veranderen:

```python
zone.physics.sensor = False
```

### Opdracht 2.3.c: Scorezone

Maak een spel met:
1. Een vloer onderaan het scherm
2. Een onzichtbare scorezone (gebruik `sensor=True` en `transparency=50`) in het midden van het scherm
3. Een bal die van boven valt

Als de bal door de scorezone valt, laat een tekst zien: "Punt!"

<details>
<summary>Klik hier voor een tip!</summary>

Gebruik `@bal.when_touching(zone)` om te detecteren wanneer de bal de zone raakt. De bal valt er doorheen omdat de zone een sensor is.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

vloer = play.new_box(y=-200, width=600, height=20)

zone = play.new_box(y=0, width=200, height=100, color='green', transparency=50)
zone.start_physics(sensor=True)

bal = play.new_circle(y=200, radius=20, color='red')
bal.start_physics()

tekst = play.new_text("", y=250, font_size=30)

@bal.when_touching(zone)
def punt():
    tekst.words = "Punt!"
```

De bal valt door de groene zone en landt op de vloer. Zodra de bal de zone raakt, verschijnt "Punt!".

</details>

:::info Waar kom je dit later weer tegen?
- `when_touching` zie je terug bij [4.2 Gebeurtenissen bij een vorm](/docs/gebeurtenissen/vormen) om botsingen af te handelen.
- `bounciness` is essentieel bij [Pong (eindproject)](/docs/jouw_project/pong): zonder stuiterende bal is er geen spel.
- Sensors zijn handig voor scorezones en triggers — denk aan een onzichtbaar vakje waar je een punt scoort.
:::
