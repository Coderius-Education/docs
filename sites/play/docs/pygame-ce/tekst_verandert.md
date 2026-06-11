---
sidebar_position: 6
hide_table_of_contents: true
---

# 7.6 Tekst die verandert

In de vorige les heb je geleerd hoe je tekst op het scherm toont. Maar wat als de tekst moet veranderen, bijvoorbeeld een score die omhoog gaat?

## KEYDOWN: reageren op een toetsdruk

In les 7.4 gebruikten we `pygame.key.get_pressed()` om continu te checken of een toets ingedrukt is. Maar soms wil je dat iets **één keer** gebeurt per toetsdruk. Hiervoor gebruik je `pygame.KEYDOWN` in de event loop:

```python
for event in pygame.event.get():
    if event.type == pygame.QUIT:
        actief = False
    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_SPACE:
            print("Spatie ingedrukt!")
```

:::info
Het verschil: `pygame.key.get_pressed()` checkt **continu** of een toets ingedrukt is (handig voor beweging). `pygame.KEYDOWN` detecteert het **moment** dat een toets wordt ingedrukt (handig voor een score verhogen).
:::

## Een score bijhouden

Je kunt tekst elke frame opnieuw renderen met een variabele:

```python
import pygame

pygame.init()

scherm = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()
font = pygame.font.SysFont("arial", 40)

score = 0

actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                score = score + 1

    scherm.fill((30, 30, 30))

    tekst = font.render("Score: " + str(score), True, (255, 255, 255))
    scherm.blit(tekst, (300, 280))

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
```

Elke keer dat je op spatie drukt, gaat de score omhoog. De tekst wordt elk frame opnieuw getekend met de nieuwe waarde van `score`.

## Opdracht 7.6.a: Scoreteller

Maak een programma waarbij:
1. Een score begint op 0
2. Met `pijltje omhoog` gaat de score omhoog
3. Met `pijltje omlaag` gaat de score omlaag
4. De score wordt op het scherm getoond

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
import pygame

pygame.init()

scherm = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()
font = pygame.font.SysFont("arial", 50)

score = 0

actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                score = score + 1
            if event.key == pygame.K_DOWN:
                score = score - 1

    scherm.fill((30, 30, 30))

    tekst = font.render("Score: " + str(score), True, (255, 255, 255))
    scherm.blit(tekst, (300, 280))

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
```

</details>
