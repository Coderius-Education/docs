---
sidebar_position: 5
hide_table_of_contents: true
---

# 4.5 Een score bijhouden met `global`

:::info Wat moet je al weten
- [4.1 Gebeurtenissen](/docs/gebeurtenissen/toetsenbord) - reageren op een toets
- Basis-Python: `if`-statements en variabelen
:::

Hoe houd je een score bij in een spel? Als je een variabele, zoals `score`, wilt aanpassen *binnen* een functie, heb je het speciale sleutelwoord `global` nodig.

## Een veelgemaakte fout

Kopieer onderstaande code naar je editor en voer de code uit:

```python
import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    score = score + 1
    score_tekst.words = str(score)
```

Druk maar eens op spatie. Als het goed is verandert er **niets** en zie je het volgende in je console (de eerste regel kan er bij jou anders uitzien):

```
UnboundLocalError: local variable 'score' referenced before assignment
```

Python denkt dat `score` in de functie (bij score = score + 1) een nieuwe variabele is.
Daardoor kent hij de `score` van buiten de functie (score = 0) niet.
Met `global score` geef je aan dat de score die buiten de functie is gemaakt, binnen de functie gebruikt en aangepast moet worden.

## De oplossing: `global`

Met `global score` vertel je Python dat je de variabele van *buiten* de functie wilt gebruiken:

```python
import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    global score
    score = score + 1
    score_tekst.words = str(score)
```

## Opdracht 4.5.a: Score met twee toetsen

Maak een programma waarbij:
1. De score begint op 0
2. Met spatie gaat de score omhoog
3. Met `r` wordt de score teruggezet naar 0
4. De score wordt op het scherm getoond

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def punt():
    global score
    score = score + 1
    score_tekst.words = str(score)

@play.when_key_released("r")
def reset():
    global score
    score = 0
    score_tekst.words = str(score)
```

</details>

## 4.5.1 Handige Python-kennis: `if`-statements

Nu je een score kunt bijhouden, wil je misschien ook iets laten gebeuren op basis van die score. Daarvoor gebruik je een `if`-statement:

```python
if score == 10:
    score_tekst.words = "Je hebt gewonnen!"
```

Dit checkt of `score` gelijk is aan `10`. Let op de **dubbele** `==` (vergelijken) in plaats van een enkele `=` (toewijzen).

### Er gaat iets mis?

Een veelgemaakte fout is het gebruik van `=` in plaats van `==`:

```python
# FOUT - dit geeft een foutmelding
if score = 10:

# GOED - dubbele == voor vergelijken
if score == 10:
```

De foutmelding die je krijgt bij een enkele `=` is:
```
SyntaxError: invalid syntax
```

## Opdracht 4.5.b: Winnen bij 10 punten

Maak een programma waarbij:
1. Een score begint op 0
2. Met spatie gaat de score +1
3. Als de score 10 bereikt, verandert de tekst in 'Je hebt gewonnen!' en stopt het programma

<details>
<summary>Klik hier voor een tip!</summary>

Combineer `global`, `if score == 10:` en `play.stop_program()` in dezelfde functie.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import play

score = 0
tekst = play.new_text(words="Score: 0", font_size=40)

@play.when_key_pressed("space")
def punt():
    global score
    score = score + 1
    tekst.words = "Score: " + str(score)
    if score == 10:
        tekst.words = "Je hebt gewonnen!"
        play.stop_program()
```

</details>
