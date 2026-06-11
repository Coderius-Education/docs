---
sidebar_position: 4
hide_table_of_contents: true
---

# 7.4 Beweging

In coderius-play kon je een vorm laten bewegen met `start_physics()`. In pygame-ce doe je dit zelf: je verandert de positie van een vorm elke frame.

## Een cirkel besturen met toetsen

```python
import pygame

pygame.init()

scherm = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

x = 400
y = 300
snelheid = 5

actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False

    toetsen = pygame.key.get_pressed()

    if toetsen[pygame.K_LEFT]:
        x = x - snelheid
    if toetsen[pygame.K_RIGHT]:
        x = x + snelheid
    if toetsen[pygame.K_UP]:
        y = y - snelheid
    if toetsen[pygame.K_DOWN]:
        y = y + snelheid

    scherm.fill((30, 30, 30))
    pygame.draw.circle(scherm, (0, 200, 255), (x, y), 30)
    pygame.display.flip()

    clock.tick(60)

pygame.quit()
```

Wat is er nieuw?

```python
clock = pygame.time.Clock()
```
Een klok die bijhoudt hoe snel het spel draait.

```python
toetsen = pygame.key.get_pressed()
```
Geeft een lijst van alle toetsen. Als een toets ingedrukt is, is de waarde `True`.

```python
if toetsen[pygame.K_LEFT]:
    x = x - snelheid
```
Als de linker pijltoets ingedrukt is, wordt `x` kleiner (de cirkel beweegt naar links).

```python
clock.tick(60)
```
Zorgt ervoor dat de game loop maximaal 60 keer per seconde draait. Zonder dit zou het spel veel te snel gaan.

## Opdracht 7.4.a: Snelheid aanpassen

Verander het programma zodat:
1. De cirkel sneller beweegt als je `shift` ingedrukt houdt
2. De normale snelheid is 5, de snelle snelheid is 15

<details>
<summary>Klik hier voor een tip!</summary>

Je kunt checken of shift ingedrukt is met `toetsen[pygame.K_LSHIFT]`.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import pygame

pygame.init()

scherm = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

x = 400
y = 300

actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False

    toetsen = pygame.key.get_pressed()

    if toetsen[pygame.K_LSHIFT]:
        snelheid = 15
    else:
        snelheid = 5

    if toetsen[pygame.K_LEFT]:
        x = x - snelheid
    if toetsen[pygame.K_RIGHT]:
        x = x + snelheid
    if toetsen[pygame.K_UP]:
        y = y - snelheid
    if toetsen[pygame.K_DOWN]:
        y = y + snelheid

    scherm.fill((30, 30, 30))
    pygame.draw.circle(scherm, (0, 200, 255), (x, y), 30)
    pygame.display.flip()

    clock.tick(60)

pygame.quit()
```

</details>

## Opdracht 7.4.b: Niet van het scherm af

De cirkel kan nu van het scherm af bewegen. Zorg ervoor dat de cirkel niet buiten het venster kan komen.

<details>
<summary>Klik hier voor een tip!</summary>

Het scherm is 800 breed en 600 hoog. De cirkel heeft een straal van 30. Dus `x` mag niet kleiner worden dan 30 en niet groter dan 770.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

Voeg dit toe na de toetsen-code, maar voor het tekenen:

```
    if x < 30:
        x = 30
    if x > 770:
        x = 770
    if y < 30:
        y = 30
    if y > 570:
        y = 570
```

</details>
