---
sidebar_position: 3
hide_table_of_contents: true
---

# Een startmenu maken

Veel spellen beginnen met een startmenu. In deze tutorial leer je hoe je een simpel menu maakt dat overschakelt naar het spel.

:::info
In deze tutorial gebruik je het `global` keyword (zie [4.5 Een score bijhouden](/docs/gebeurtenissen/score_bijhouden)) en `@play.when_key_pressed` (zie [4.1 Toetsenbord](/docs/gebeurtenissen/toetsenbord)).
:::

## Het idee

We maken een variabele `scherm` die bijhoudt in welk scherm we zitten: `'menu'` of `'spel'`. Afhankelijk van de waarde tonen we andere vormen.

## Stap 1: De menu-elementen

```python
import play

scherm = 'menu'

titel = play.new_text(words="Mijn Spel", y=100, font_size=60)
uitleg = play.new_text(words="Druk op SPATIE om te starten", y=-50, font_size=30)
```

## Stap 2: De spel-elementen

We maken de spel-elementen alvast aan, maar verbergen ze:

```python
bal = play.new_circle(color='blue', radius=20)
bal.hide()

score_tekst = play.new_text(words="Score: 0", y=250, font_size=30)
score_tekst.hide()
```

## Stap 3: Overschakelen

Met spatie schakelen we over van menu naar spel:

```python
@play.when_key_pressed("space")
def start_spel():
    global scherm
    if scherm == 'menu':
        scherm = 'spel'

        titel.hide()
        uitleg.hide()

        bal.show()
        score_tekst.show()
        bal.start_physics(obeys_gravity=False, x_speed=200, y_speed=150)
```

## Het volledige programma

```python
import play

scherm = 'menu'

titel = play.new_text(words="Mijn Spel", y=100, font_size=60)
uitleg = play.new_text(words="Druk op SPATIE om te starten", y=-50, font_size=30)

bal = play.new_circle(color='blue', radius=20)
bal.hide()

score_tekst = play.new_text(words="Score: 0", y=250, font_size=30)
score_tekst.hide()

@play.when_key_pressed("space")
def start_spel():
    global scherm
    if scherm == 'menu':
        scherm = 'spel'

        titel.hide()
        uitleg.hide()

        bal.show()
        score_tekst.show()
        bal.start_physics(obeys_gravity=False, x_speed=200, y_speed=150)
```

## Opdracht: Game-over scherm

Breid het programma uit met een game-over scherm. Wanneer de bal de onderkant van het scherm raakt, moet het spel stoppen en een "Game Over" tekst tonen.

<details>
<summary>Klik hier voor een tip!</summary>

Gebruik `@bal.when_touching_wall` met `wall=play.WallSide.BOTTOM` om te detecteren wanneer de bal de onderkant raakt.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

Voeg dit toe aan je programma:

```python
game_over_tekst = play.new_text(words="Game Over", font_size=60, color='red')
game_over_tekst.hide()

@bal.when_touching_wall
def muur_geraakt(wall):
    global scherm
    if wall == play.WallSide.BOTTOM and scherm == 'spel':
        scherm = 'gameover'
        bal.hide()
        score_tekst.hide()
        game_over_tekst.show()
```

</details>
