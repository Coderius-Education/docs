---
sidebar_position: 2
hide_table_of_contents: true
---

# 6.2 High score bijhouden

:::info Wat moet je al weten
- [6.1 Gegevens opslaan en ophalen](/docs/database/basis) - `set_data()` en `get_data()`
:::

Nu we weten hoe `set_data()` en `get_data()` werken, kunnen we een high score systeem maken!

## Een simpele high score

```python
import play

database = play.new_database()

huidige_highscore = database.get_data('punten', 0)

tekst = play.new_text(words="High score: " + str(huidige_highscore))

@play.when_key_pressed("space")
def update_high_score():
    punten = database.get_data('punten', 0)
    database.set_data('punten', punten + 1)
    tekst.words = "High score: " + str(database.get_data('punten'))
```

Elke keer dat je op spatie drukt, wordt de high score met 1 verhoogd en opgeslagen. Sluit het programma af en start het opnieuw. Je high score is bewaard!

## Opdracht 6.2.a: Klik-teller

Maak een programma waarbij:
1. Je een cirkel op het scherm zet
2. Elke keer als je op de cirkel klikt, gaat een teller omhoog
3. De teller wordt opgeslagen in de database
4. Als je het programma opnieuw start, begint de teller waar je was gebleven

<details>
<summary>Klik hier voor een tip!</summary>

Gebruik `@cirkel.when_clicked` om te detecteren of je op de cirkel klikt. Vergeet niet om de teller op te halen met een default waarde!

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

teller = database.get_data('klikken', 0)

cirkel = play.new_circle(color='blue', radius=80)
tekst = play.new_text(words=str(teller), y=200)

@cirkel.when_clicked
def geklikt():
    global teller
    teller = teller + 1
    database.set_data('klikken', teller)
    tekst.words = str(teller)
```

</details>

## Opdracht 6.2.b: Alleen opslaan als het beter is

Bij een echte high score sla je alleen de score op als die **hoger** is dan de vorige. Maak een programma waarbij:
1. De huidige high score uit de database wordt opgehaald
2. Bij elke spatie gaat de score omhoog
3. Bij de toets `r` wordt de score gereset naar 0
4. Alleen als de score hoger is dan de high score, wordt de high score bijgewerkt

<details>
<summary>Klik hier voor een tip!</summary>

Je hebt twee variabelen nodig: `score` (de huidige score) en `highscore` (de opgeslagen best score). Vergelijk ze met een `if`-statement.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

database = play.new_database()

score = 0
highscore = database.get_data('highscore', 0)

score_tekst = play.new_text(words="Score: " + str(score), y=100)
highscore_tekst = play.new_text(words="High score: " + str(highscore), y=-100)

@play.when_key_pressed("space")
def punt():
    global score, highscore
    score = score + 1
    score_tekst.words = "Score: " + str(score)

    if score > highscore:
        highscore = score
        database.set_data('highscore', highscore)
        highscore_tekst.words = "High score: " + str(highscore)

@play.when_key_pressed("r")
def reset():
    global score
    score = 0
    score_tekst.words = "Score: " + str(score)
```

</details>
