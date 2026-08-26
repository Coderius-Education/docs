---
sidebar_position: 5
---

# 4.5 Een score bijhouden met `global`

<Voorkennis
  items={[
    {site: 'python', to: '/docs/basis/jij-als-variabele', label: 'Jij als variabele'},
    {site: 'python', to: '/docs/functies/09c-scope', label: 'Scope'},
    {site: 'python', to: '/docs/beslissen/05b-if-else', label: 'If en else'},
  ]}
/>

Hoe houd je een score bij in een spel? Als je een variabele, zoals `score`, wilt aanpassen *binnen* een functie, heb je het speciale sleutelwoord `global` nodig.

## Een veelgemaakte fout

Draai het programma en druk een paar keer op de spatiebalk:

```python
import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    score = score + 1
    score_tekst.words = str(score)
```

<PygbagRunner code={`import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    score = score + 1
    score_tekst.words = str(score)`} height={300} />

Druk maar eens op spatie. Als het goed is verandert er **niets** en zie je het volgende in je console (de eerste regel kan er bij jou anders uitzien):

```
UnboundLocalError: cannot access local variable 'score' where it is not associated with a value
```

Python denkt dat `score` in de functie (bij score = score + 1) een nieuwe variabele is.
Daardoor kent hij de `score` van buiten de functie (score = 0) niet.
Met `global score` geef je aan dat de score die buiten de functie is gemaakt, binnen de functie gebruikt en aangepast moet worden.

## De oplossing: `global`

Met `global score` vertel je Python dat je de variabele van *buiten* de functie wilt gebruiken:

<CodeUitleg>

```python showLineNumbers
import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    global score
    score = score + 1
    score_tekst.words = str(score)
```

<Regel n={3}>De score zelf, buiten elke functie. Dit is de variabele die straks moet blijven bestaan tussen twee toetsaanslagen door.</Regel>
<Regel n={4}>De tekst op het scherm. `str(score)` maakt van het getal 0 de tekst `"0"`, want `new_text` wil tekst.</Regel>
<Regel n={6} tot={7}>Koppelt de functie eronder aan de spatiebalk. Laat je die los, dan roept play `spatie_ingedrukt()` aan.</Regel>
<Regel n={8}>De sleutelregel. Zonder deze regel maakt Python op regel 9 een nieuwe variabele die alleen binnen de functie bestaat; met `global` gebruikt hij de `score` van regel 3.</Regel>
<Regel n={9}>Eén punt erbij.</Regel>
<Regel n={10}>Zet de nieuwe stand op het scherm. De tekst verandert niet vanzelf mee als `score` verandert; dat moet je zelf doen.</Regel>

</CodeUitleg>

<PygbagRunner code={`import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    global score
    score = score + 1
    score_tekst.words = str(score)`} height={300} />

## Opdracht 4.5.a: Score met twee toetsen

Maak een programma waarbij:
1. De score begint op 0
2. Met spatie gaat de score omhoog
3. Met `r` wordt de score teruggezet naar 0
4. De score wordt op het scherm getoond

<details>
<summary>Klik hier voor de oplossing.</summary>

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

<PygbagRunner code={`import play

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
    score_tekst.words = str(score)`} height={300} />

</details>

## Handige Python-kennis: `if`-statements

Nu je een score kunt bijhouden, wil je misschien ook iets laten gebeuren op basis van die score. Daarvoor gebruik je een `if`-statement:

```python
if score == 10:
    score_tekst.words = "Je hebt gewonnen!"
```

Dit checkt of `score` gelijk is aan `10`. Let op de **dubbele** `==` (vergelijken) in plaats van een enkele `=` (toewijzen).

### Er gaat iets mis?

Een veelgemaakte fout is het gebruik van `=` in plaats van `==`:

{/* niet-compileren: toont bewust de SyntaxError van = versus == */}
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
3. Als de score 10 bereikt, verandert de tekst in 'Je hebt gewonnen.' en stopt het programma

<details>
<summary>Klik hier voor een tip.</summary>

Combineer `global`, `if score == 10:` en `play.stop_program()` in dezelfde functie.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

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

<PygbagRunner code={`import play

score = 0
tekst = play.new_text(words="Score: 0", font_size=40)

@play.when_key_pressed("space")
def punt():
    global score
    score = score + 1
    tekst.words = "Score: " + str(score)
    if score == 10:
        tekst.words = "Je hebt gewonnen!"
        play.stop_program()`} height={300} />

</details>
