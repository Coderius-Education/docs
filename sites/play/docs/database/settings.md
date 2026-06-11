---
sidebar_position: 3
hide_table_of_contents: true
---

# 6.3 Instellingen opslaan

:::info Wat moet je al weten
- [6.1 Gegevens opslaan en ophalen](/docs/database/basis) - `set_data()` en `get_data()`
:::

Naast de high score kun je ook instellingen van de speler opslaan. Denk aan de moeilijkheidsgraad, de kleur van de speler, of het geluid aan of uit staat.

## Meerdere gegevens opslaan

Je kunt zoveel gegevens opslaan als je wilt. Elke waarde krijgt een eigen sleutel:

```python
import play

database = play.new_database()

database.set_data('punten', 0)
database.set_data('moeilijkheid', 'makkelijk')
```

## Opdracht 6.3.a: Kleur onthouden

Maak een programma waarbij:
1. Een cirkel op het scherm staat
2. Met de toets `r` wordt de cirkel rood, met `b` blauw, met `g` groen
3. De gekozen kleur wordt opgeslagen in de database
4. Als je het programma opnieuw start, heeft de cirkel meteen de kleur die je de vorige keer had gekozen

<details>
<summary>Klik hier voor een tip!</summary>

Haal bij het aanmaken van de cirkel de kleur op uit de database met een default waarde, bijvoorbeeld `'black'`.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

kleur = database.get_data('kleur', 'black')

cirkel = play.new_circle(color=kleur, radius=80)

@play.when_key_pressed("r")
def rood():
    cirkel.color = 'red'
    database.set_data('kleur', 'red')

@play.when_key_pressed("b")
def blauw():
    cirkel.color = 'blue'
    database.set_data('kleur', 'blue')

@play.when_key_pressed("g")
def groen():
    cirkel.color = 'green'
    database.set_data('kleur', 'green')
```

</details>

## Opdracht 6.3.b: Moeilijkheid kiezen

Maak een programma waarbij:
1. De moeilijkheid wordt opgehaald uit de database (default: `'makkelijk'`)
2. De moeilijkheid staat op het scherm
3. Met de toets `1` kies je makkelijk, met `2` normaal, met `3` moeilijk
4. De keuze wordt opgeslagen in de database

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

moeilijkheid = database.get_data('moeilijkheid', 'makkelijk')

tekst = play.new_text(words="Moeilijkheid: " + moeilijkheid)

@play.when_key_pressed("1")
def makkelijk():
    database.set_data('moeilijkheid', 'makkelijk')
    tekst.words = "Moeilijkheid: makkelijk"

@play.when_key_pressed("2")
def normaal():
    database.set_data('moeilijkheid', 'normaal')
    tekst.words = "Moeilijkheid: normaal"

@play.when_key_pressed("3")
def moeilijk():
    database.set_data('moeilijkheid', 'moeilijk')
    tekst.words = "Moeilijkheid: moeilijk"
```

</details>
