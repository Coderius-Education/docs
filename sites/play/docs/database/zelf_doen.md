---
sidebar_position: 4
---

# 6.4 Maar kan ik dit niet allemaal zelf?

<Voorkennis
  items={[
    {to: '/docs/gebeurtenissen/score_bijhouden', label: '4.5 Een score bijhouden met global'},
    {site: 'python', to: '/docs/data/11a-dictionaries-basis', label: 'Dictionaries'},
    {site: 'python', to: '/docs/functies/09d-modules', label: 'Modules importeren'},
  ]}
/>

Zeker. Mocht je Informatica-ACTIEF gebruiken, is er een mooi hoofdstuk over dictionaries waarin je ook leert om deze als JSON op te slaan. Durf je het aan om dit zelf te doen?

:::warning[Online speeltuin]
Deze opdracht draait niet in de online speeltuin: je moet het bestand `database.json` op je eigen computer kunnen openen om te zien wat er verandert. Gebruik Thonny of VS Code, zie [installatie](/docs/installatie).
:::

Hieronder geven we je een voorzet om je op gang te helpen.
- Kopieer dit codefragment en voer de code uit
- Klik op spatie en update de database
- Zoek naar het bestand `database.json` in **dezelfde** folder als je Python bestand. Als het goed is, zie je de inhoud van het bestand veranderen iedere keer dat je op spatie klikt.

```python
import play
import os
import json

pad_mijn_db = 'database.json'
mijn_db = None

boven = play.new_text("Klik op spatie om de teller te verhogen",
                      y=100,
                      font_size=40)
onder = play.new_text("Dit wordt ook opgeslagen in je database",
                      y=0,
                      font_size=40)
daaronder = play.new_text("Aantal kliks:",
                          y=-100,
                          font_size=40)
daarweeronder = play.new_text('0',
                              y=-150,
                              font_size=40)

@play.when_program_starts  # deze functie wordt automatisch uitgevoerd bij het starten van het programma
def start():
    global mijn_db
    # kijk of jouw 'pad_mijn_db' al bestaat
    if os.path.exists(pad_mijn_db):
        with open(pad_mijn_db, 'r') as infile:
            mijn_db = json.load(infile)
    else:
        mijn_db = {'aantal kliks': 0}

@play.when_key_released('space')
def update_database():
    global mijn_db

    # update je dictionary
    mijn_db['aantal kliks'] += 1
    daarweeronder.words = str(mijn_db['aantal kliks'])

    # update database.json (dit verandert het bestand op je harde schijf)
    with open(pad_mijn_db, 'w') as outfile:
        json.dump(mijn_db, outfile)
```

:::info[Waar kom je dit later weer tegen?]
In [9.3 Wanneer ga je naar het volgende level?](/docs/levels/wanneer-volgende) gebruik je de database om te onthouden hoe ver een speler kwam.
:::
