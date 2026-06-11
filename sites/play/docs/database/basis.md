---
sidebar_position: 1
hide_table_of_contents: true
---

# 6.1 Gegevens opslaan en ophalen

Gegevens opslaan op je computer is erg handig bij een spel.
Je kunt bijvoorbeeld de high score opslaan, maar ook de instellingen van de gebruiker. Speelde de gebruiker het spel de laatste keer op *easy* of toch op *medium*?

## Een database aanmaken

Met `play.new_database()` maak je een nieuwe database aan:

```python
import play

database = play.new_database()
```

In dezelfde map als je Python bestand verschijnt nu het bestand **database.json**. Hierin worden je gegevens opgeslagen!

## Gegevens opslaan met set_data

Met `set_data()` sla je gegevens op. Je geeft twee dingen mee:
- Een **sleutel**: de naam waaronder je de gegevens opslaat
- Een **waarde**: de gegevens die je wilt opslaan

```python
import play

database = play.new_database()

database.set_data('punten', 5)
```

We slaan hier het getal `5` op onder de naam `'punten'`.

## Gegevens ophalen met get_data

Met `get_data()` haal je gegevens weer op:

```python
import play

database = play.new_database()

database.set_data('punten', 5)

mijn_punten = database.get_data('punten')

tekst = play.new_text(words="Punten: " + str(mijn_punten))
```

## Default waarde

Wat als je een waarde ophaalt die nog niet bestaat? Dan krijg je `None` terug. Maar je kunt ook een **default waarde** meegeven:

```python
mijn_punten = database.get_data('punten', 0)
```

Als `'punten'` nog niet in de database staat, krijg je nu `0` terug in plaats van `None`. Dit is handig bij de eerste keer dat je programma start, wanneer de database nog leeg is!

### Er gaat iets mis?

Een veelgemaakte fout is `get_data` aanroepen zonder default waarde wanneer de sleutel nog niet bestaat:

```python
database = play.new_database()

mijn_punten = database.get_data('punten')
tekst = play.new_text(words="Punten: " + str(mijn_punten))
```

Als `'punten'` nog niet in de database staat, is `mijn_punten` gelijk aan `None`. De tekst op het scherm wordt dan `"Punten: None"` — waarschijnlijk niet wat je bedoelde! Gebruik altijd een default waarde als je niet zeker weet of de sleutel al bestaat:

```python
mijn_punten = database.get_data('punten', 0)
```

## Opdracht 6.1.a: Sla je naam op

Maak een programma dat:
1. Een database aanmaakt
2. Je naam opslaat met `set_data('naam', 'jouw naam')`
3. Je naam ophaalt met `get_data('naam')`
4. Je naam op het scherm toont

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

database.set_data('naam', 'Anna')

opgeslagen_naam = database.get_data('naam')

tekst = play.new_text(words="Hallo " + opgeslagen_naam)
```

</details>

## Opdracht 6.1.b: Meerdere gegevens opslaan

Je kunt meerdere gegevens opslaan in dezelfde database. Maak een programma dat:
1. Je naam opslaat
2. Je leeftijd opslaat
3. Je favoriete kleur opslaat
4. Alle drie de gegevens ophaalt en op het scherm toont

<details>
<summary>Klik hier voor een tip!</summary>

Je kunt `set_data()` meerdere keren aanroepen met verschillende sleutels.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

database.set_data('naam', 'Anna')
database.set_data('leeftijd', 15)
database.set_data('kleur', 'blauw')

naam = database.get_data('naam')
leeftijd = database.get_data('leeftijd')
kleur = database.get_data('kleur')

play.new_text(words=naam, y=100)
play.new_text(words=str(leeftijd) + " jaar", y=0)
play.new_text(words="Favoriete kleur: " + kleur, y=-100)
```

</details>

## Opdracht 6.1.c: Default waarde gebruiken

Maak een programma dat:
1. Een database aanmaakt
2. De waarde van `'level'` ophaalt met een default waarde van `1`
3. Het level op het scherm toont

Draai het programma twee keer. De eerste keer zou je `1` moeten zien (de default waarde). Voeg daarna een `set_data('level', 5)` toe en draai opnieuw. Wat zie je nu?

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

level = database.get_data('level', 1)

tekst = play.new_text(words="Level: " + str(level))
```

De eerste keer zie je `Level: 1` omdat `'level'` nog niet bestaat. Als je `database.set_data('level', 5)` toevoegt en opnieuw draait, zie je `Level: 5`.

</details>
