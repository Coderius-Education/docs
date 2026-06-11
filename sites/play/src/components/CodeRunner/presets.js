export const presets = [
  {
    name: 'Rode cirkel',
    mode: 'play',
    code: `import play

play.set_backdrop('white')

play.new_circle(color='red', radius=80)`,
  },
  {
    name: 'Bewegend blok',
    mode: 'play',
    code: `import play

play.set_backdrop('light gray')

blok = play.new_box(color='blue', width=60, height=60)

@play.when_key_pressed('right')
def ga_rechts():
    blok.x += 10

@play.when_key_pressed('left')
def ga_links():
    blok.x -= 10

@play.when_key_pressed('up')
def ga_omhoog():
    blok.y += 10

@play.when_key_pressed('down')
def ga_omlaag():
    blok.y -= 10`,
  },
  {
    name: 'Tekst en kleuren',
    mode: 'play',
    code: `import play

play.set_backdrop('navy')

play.new_text('Hallo wereld!', color='yellow', font_size=50, y=100)
play.new_circle(color='red', radius=60, x=-150, y=-50)
play.new_box(color='green', width=100, height=100, x=150, y=-50)`,
  },
  {
    name: 'Eerste pygame venster',
    mode: 'pygame',
    code: `import pygame

pygame.init()

scherm = pygame.display.set_mode((400, 300))
pygame.display.set_caption("Mijn eerste spel")

klok = pygame.time.Clock()
actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False

    scherm.fill((30, 30, 60))

    pygame.draw.circle(scherm, (255, 100, 100), (200, 150), 50)
    pygame.draw.rect(scherm, (100, 255, 100), (50, 200, 80, 40))

    pygame.display.flip()
    klok.tick(60)

pygame.quit()`,
  },
  {
    name: 'Bewegende bal (pygame)',
    mode: 'pygame',
    code: `import pygame

pygame.init()

scherm = pygame.display.set_mode((400, 300))
klok = pygame.time.Clock()

bal_x, bal_y = 200, 150
snelheid_x, snelheid_y = 3, 2
straal = 20

actief = True
while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False

    bal_x += snelheid_x
    bal_y += snelheid_y

    if bal_x - straal <= 0 or bal_x + straal >= 400:
        snelheid_x = -snelheid_x
    if bal_y - straal <= 0 or bal_y + straal >= 300:
        snelheid_y = -snelheid_y

    scherm.fill((20, 20, 40))
    pygame.draw.circle(scherm, (255, 200, 50), (int(bal_x), int(bal_y)), straal)
    pygame.display.flip()
    klok.tick(60)

pygame.quit()`,
  },
];
