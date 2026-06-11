---
sidebar_position: 99
hide_pagination: true
title: Ik krijg een foutmelding
---

## Op zoek naar het probleem

<details>
  <summary>Er gaat iets mis, maar ik weet niet waar ik moet beginnen met oplossen.</summary>

Als er iets misgaat, ga je op zoek naar twee zaken:
- wat voor `soort` fout het is
- op welke `regel` code deze fout wordt veroorzaakt

De `console` geeft ons deze informatie. Je vindt de console onderin je code-editor.
Als alles goed gaat met je programma, zie je alleen deze tekst (of een kleine variant hierop):

![console](@site/static/img/console.png)

Zodra er een fout is, zie je meer tekst in je `console`.
Bijvoorbeeld met het onderstaande codefragment:

```
import play

  cirkel = play.new_circle()

```

zie je het volgende in je `console`:

![indentation_error](@site/static/img/indentation_error.png)

We zien nu dat er een probleem is:
- op `line 3`
- en dat het soort fout `IndentationError` is

Deze informatie heb je nodig om de fout op te lossen.
Zoek nu je fout op in een van de andere tips op deze pagina.

</details>

## Het soort probleem begrijpen

<details>
  <summary>Een <code>IndentationError</code></summary>

Je hebt een `IndentationError` gevonden. Goed gedaan!

Ergens is er een regel code waar je `te veel` of `te weinig` spaties hebt gebruikt.

Laten we naar een paar voorbeelden kijken.

```python
import play
  cirkel = play.new_circle()
```
De `console` vertelt ons:
![indenterror one](@site/static/img/indent_error_1.png)

Op de tweede regel staat een `indent` (inspringing van vier spaties) die Python niet verwacht.
De oplossing is dus om deze spaties te verwijderen.

```python
import play
cirkel = play.new_circle()
```

Een ander veelvoorkomend voorbeeld:

```python
import play

box = play.new_box()

@play.when_key_pressed("space")
def spatie_ingedrukt():
box.x = box.x + 10
```

De `console` toont het volgende:
![indenterror two](@site/static/img/indent_error_2.png)

Python verwacht hier een `indent` (inspringing), maar die is er niet.

De oplossing is om de juiste inspringing toe te voegen:

```python
import play

box = play.new_box()

@play.when_key_pressed("space")
def spatie_ingedrukt():
    box.x = box.x + 10
```
</details>

<details>
  <summary>Een <code>NameError</code></summary>

Je hebt een `NameError` gevonden. Goed gedaan!
Je gebruikt ergens een `variabele` die nog niet is aangemaakt.

Hier is een voorbeeld:

```python
import play

box = play.new_box()
cirkel.start_physics()
```
De `console` toont het volgende:
![nameerror](@site/static/img/name_error.png)

Je vraagt Python om de `variabele` `cirkel`, maar die is nergens aangemaakt.
De oplossing is in dit geval:

```python
import play

box = play.new_box()
box.start_physics()
```

</details>

<details>
  <summary>Een <code>SyntaxError</code></summary>

Een `SyntaxError` betekent dat Python je code niet begrijpt. Er zit een taalfout in je code. Dit zijn de meest voorkomende oorzaken:

**1. Een dubbele punt `:` vergeten na `def`, `if`, `for`, of `while`:**

```python
import play

@play.when_key_pressed("space")
def spatie_ingedrukt()        # ← hier mist een :
    print("spatie!")
```

De `console` toont:
```
SyntaxError: expected ':'
```

De oplossing:
```python
@play.when_key_pressed("space")
def spatie_ingedrukt():        # ← nu wel een :
    print("spatie!")
```

**2. Aanhalingstekens niet goed sluiten:**

```python
import play

play.new_text(words='hallo)
```

De `console` toont:
```
SyntaxError: unterminated string literal
```

De oplossing: zorg dat elk aanhalingsteken een partner heeft.
```python
play.new_text(words='hallo')
```

**3. Haakjes niet goed sluiten:**

```python
import play

play.new_circle(color='red'
```

De `console` toont:
```
SyntaxError: '(' was never closed
```

De oplossing: sluit het haakje.
```python
play.new_circle(color='red')
```

</details>

<details>
  <summary>Een <code>TypeError</code></summary>

Een `TypeError` betekent dat je iets op een verkeerde manier gebruikt. Dit zijn de meest voorkomende oorzaken:

**1. Een verkeerd type meegeven:**

```python
import play

play.new_circle(radius='groot')
```

De `console` toont iets als:
```
TypeError: '>' not supported between instances of 'str' and 'int'
```

`radius` verwacht een getal, geen tekst. De oplossing:
```python
play.new_circle(radius=50)
```

**2. Een attribuut vergeten:**

```python
import play

play.new_image()
```

De `console` toont:
```
TypeError: new_image() missing 1 required positional argument: 'image'
```

`new_image` heeft een bestandsnaam nodig. De oplossing:
```python
play.new_image("mijn_afbeelding.png")
```

</details>

<details>
  <summary>Een <code>AttributeError</code></summary>

Een `AttributeError` betekent dat je een eigenschap of actie gebruikt die niet bestaat op dat object.

```python
import play

cirkel = play.new_circle()
cirkel.kleur = 'red'
```

De `console` toont:
```
AttributeError: 'Circle' object has no attribute 'kleur'
```

Het attribuut heet `color`, niet `kleur`. De oplossing:
```python
cirkel.color = 'red'
```

**Tip:** kijk in de Cheatsheet voor de juiste namen van attributen.

</details>

<details>
  <summary>Een <code>ModuleNotFoundError</code></summary>

Een `ModuleNotFoundError` betekent dat Python een pakket niet kan vinden.

```python
import play
```

De `console` toont:
```
ModuleNotFoundError: No module named 'play'
```

Dit betekent dat `coderius-play` nog niet geïnstalleerd is. Installeer het met:

```bash
pip install --upgrade coderius-play
```

Gebruik je Thonny? Ga dan naar `Tools` → `Open system shell` en voer het commando daar in.

Gebruik je VS Code? Open een terminal (`Terminal` → `New terminal`) en voer het commando daar in.

</details>

<details>
  <summary>Een <code>UnboundLocalError</code></summary>

Een `UnboundLocalError` komt vaak voor als je een variabele wilt veranderen *binnen* een functie.

```python
import play

score = 0
tekst = play.new_text(str(score))

@play.when_key_pressed("space")
def punt():
    score = score + 1
    tekst.words = str(score)
```

De `console` toont:
```
UnboundLocalError: local variable 'score' referenced before assignment
```

Python denkt dat `score` een nieuwe variabele is binnen de functie. Met `global` vertel je Python dat je de variabele van *buiten* de functie bedoelt:

```python
@play.when_key_pressed("space")
def punt():
    global score
    score = score + 1
    tekst.words = str(score)
```

</details>

<details>
  <summary>Een <code>FileNotFoundError</code></summary>

Een `FileNotFoundError` betekent dat Python een bestand niet kan vinden. Dit komt vaak voor bij `play.new_image()`.

```python
import play

play.new_image("mijn_plaatje.png")
```

De `console` toont:
```
FileNotFoundError: No file 'mijn_plaatje.png' found
```

Controleer het volgende:
1. **Staat het bestand in dezelfde map als je Python-bestand?** Het plaatje moet in dezelfde folder staan.
2. **Klopt de bestandsnaam precies?** Let op hoofd- en kleine letters. `Plaatje.PNG` is niet hetzelfde als `plaatje.png`.
3. **Klopt de extensie?** Misschien heet het bestand `.jpg` in plaats van `.png`.

</details>

## Het programma doet iets anders dan verwacht

<details>
  <summary>Het scherm opent, maar ik zie niets</summary>

Controleer het volgende:

**1. Is de kleur van je vorm hetzelfde als de achtergrond?**
Standaard is de achtergrond grijs en zijn vormen zwart. Als je de achtergrond zwart maakt, zie je zwarte vormen niet meer:

```python
import play

play.set_backdrop('black')
play.new_circle()                # ← zwarte cirkel op zwarte achtergrond!
```

De oplossing: geef je vorm een andere kleur.
```python
play.set_backdrop('black')
play.new_circle(color='white')
```

**2. Staat de vorm buiten het scherm?**
Als je een grote `x` of `y` waarde gebruikt, kan de vorm buiten het zichtbare scherm staan:

```python
play.new_circle(x=9999)         # ← ver buiten het scherm
```

Het scherm is standaard 800 bij 600 pixels. De `x` loopt van -400 tot 400 en de `y` van -300 tot 300.

</details>

<details>
  <summary>Mijn vorm beweegt niet</summary>

Controleer het volgende:

**1. Heb je `start_physics()` aangeroepen?**
```python
cirkel = play.new_circle()
cirkel.start_physics(obeys_gravity=False, x_speed=50)
```

**2. Staat de zwaartekracht aan terwijl er geen vloer is?**
Als `obeys_gravity=True` (de standaard), valt de vorm naar beneden en verdwijnt buiten het scherm. Zet de zwaartekracht uit als je dat niet wilt:

```python
cirkel.start_physics(obeys_gravity=False, x_speed=50)
```

**3. Gebruik je `can_move=False`?**
Een vorm met `can_move=False` kan niet bewegen. Dat is bedoeld voor muren en platforms.

</details>

<details>
  <summary>Mijn toets doet niets</summary>

Controleer het volgende:

**1. Gebruik je de juiste toetsnaam?**
De toetsnaam moet in kleine letters en tussen aanhalingstekens:
- `"space"` voor de spatiebalk
- `"up"`, `"down"`, `"left"`, `"right"` voor de pijltjestoetsen
- `"a"`, `"b"`, `"c"` etc. voor letters

**2. Staat je code in een functie onder de decorator?**
```python
# Fout:
@play.when_key_pressed("space")
print("spatie!")               # ← dit werkt niet

# Goed:
@play.when_key_pressed("space")
def spatie():
    print("spatie!")           # ← dit werkt wel
```

**3. Heb je `global` vergeten?**
Als je een variabele wilt veranderen binnen een functie, heb je `global` nodig. Zie de uitleg bij `UnboundLocalError` hierboven.

</details>

<details>
  <summary>Mijn fysica gedraagt zich raar</summary>

**1. Vormen vliegen door elkaar heen**
Dit kan gebeuren als vormen te snel bewegen. Probeer de snelheid te verlagen. Check ook of je per ongeluk `sensor=True` hebt meegegeven bij `start_physics()`. Een sensor laat vormen er doorheen bewegen.

**2. Vormen trillen of schudden**
Dit kan gebeuren als twee vormen overlappen op het moment dat de fysica start. Zorg dat vormen niet op dezelfde positie staan bij het aanmaken.

**3. De bal kaatst niet terug**
Check of je `bounciness` hebt ingesteld. Standaard staat deze op `1.0` (maximaal stuiteren). Wil je minder stuiteren? Verlaag de waarde:

```python
bal.start_physics(bounciness=0.5)
```

</details>
