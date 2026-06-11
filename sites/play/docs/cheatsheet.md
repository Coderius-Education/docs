---
sidebar_position: 99
displayed_sidebar: null
hide_pagination: true
---

# Cheatsheet

<CheatsheetSearch />

## play package

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe upgrade of downgrade ik de versie van play?</summary>

Je kunt een specifieke versie van play installeren of de huidige versie bijwerken met de volgende commando's 

Zie [hier](installatie/Thonny.md) voor waar je het commando kan invoeren.

**Upgraden naar de nieuwste versie:**
```bash
pip install --upgrade coderius-play
```

Mocht je meldingen krijgen zoals `Toegang geweigerd` kan het helpen om `--user` toe te voegen:
```bash
pip install --upgrade --user coderius-play
```

**Installeren van een specifieke versie:**
```bash
pip install coderius-play==VERSIENUMMER
```
Vervang `VERSIENUMMER` door de gewenste versie, bijvoorbeeld `3.3.3`.

**Tip:** Als je niet zeker weet welke versies er beschikbaar zijn, kun je deze bekijken op [PyPI](https://pypi.org/project/coderius-play/#history).

</details>

<details>
  <summary>Nieuw of verbeterd in coderius-play versie 3.3.3</summary>

In versie 3.3.3 hebben we een nieuwe feature en een aantal verbeteringen toegevoegd!

Bij **Kleuren**: je kunt nu **hex-codes** gebruiken om kleuren op te geven, bijvoorbeeld `play.new_circle(color='#FF8800')`. Handig als je een heel specifieke kleur wilt — dit werkt naast de bestaande kleurnamen (`'red'`, `'blue'`, ...) en RGB-tuples.

Bij **Toetsenbord**: `@play.while_key_pressed` heeft geen vertraging meer bij het eerste frame. Beweging voelt nu echt direct en vloeiend.

Bij **Tekst**: rotatie via `angle` werkt nu correct op Text-objecten. Als je `font='Arial'` of een andere systeemfont opgeeft, wordt die nu betrouwbaar gevonden wanneer je het programma lokaal uitvoert (in de browser zijn systeemfonts niet beschikbaar — daar wordt automatisch het standaardfont gebruikt).

</details>

<details>
  <summary>Nieuw of verbeterd in coderius-play versie 3.3.2</summary>

In versie 3.3.2 hebben we **`while_`-gebeurtenissen** toegevoegd! Deze vuren **elk frame** zolang je een toets, muisknop of controller-knop ingedrukt houdt. Perfect voor vloeiende beweging!

Bij **Toetsenbord**: nieuw: `@play.while_key_pressed('left')` vuurt elk frame zolang je de toets inhoudt. Ideaal voor het besturen van een karakter. Er is ook `@play.while_any_key_pressed` voor een willekeurige toets.

Bij **Muis**: nieuw: `@play.while_mouse_pressed` vuurt elk frame zolang je de muisknop inhoudt.

Bij **Controller**: nieuw: `@play.controllers.while_button_pressed(0, 1)` vuurt elk frame zolang je de knop inhoudt. Er is ook `@play.controllers.while_any_button_pressed(0)` voor een willekeurige knop.

Bij **Bugfix**: `when_button_pressed` op de controller vuurt nu echt maar één keer bij het indrukken (net als `when_key_pressed` op het toetsenbord). Gebruik `while_button_pressed` als je wilt dat het elk frame vuurt.

</details>

<details>
  <summary>Nieuw of verbeterd in coderius-play versie 3.3.1</summary>

In versie 3.3.1 hebben we meer dan 30 bugs opgelost en een aantal verbeteringen doorgevoerd!

Bij **Async**: meerdere `await`-aanroepen in dezelfde callback blokkeren het spel niet meer. Animaties en timers draaien nu netjes naast elkaar, zonder dat het scherm vastloopt.

Bij **Fysica**: botsingen met gedraaide vormen kloppen nu. Voorheen kon de botsingsrand de verkeerde kant op staan bij een geroteerde vorm.

Bij **Fysica**: verborgen vormen ontvangen nu correct een `when_stopped_touching` callback.

Bij **Geluid**: de Sound-klasse crasht niet meer als er geen geluid geladen is.

Bij **Toetsenbord**: `when_key_pressed` vuurt nu echt maar één keer per toetsaanslag, ook als je de toets ingedrukt houdt.

Bij **Controller**: knop-callbacks geven nu de juiste knopwaarde door in plaats van een verkeerde waarde.

Bij **Database**: `set_data()` maakt nu automatisch tussenliggende sleutels aan bij geneste paden (bijv. `'speler:naam'`).

Bij **Scherm**: `play.screen.resize()` vuurt nu correct de resize-callback af.

Bij **Bugfixes**: het programma sluit nu altijd netjes af, ook bij een fout. Foutmeldingen tonen nu de volledige traceback.

</details>

<details>
  <summary>Nieuw of verbeterd in coderius-play versie 3.3</summary>

We hebben flink wat verbeteringen doorgevoerd in coderius-play versie 3.3!

Bij **Scherm**: je kunt nu het scherm van grootte veranderen met `play.screen.resize()`. Handig als je een groter of kleiner speelveld wilt!

Bij **Programma starten**: `play.start_program()` is nu optioneel. Als je het niet aanroept, start het programma automatisch.

Bij **Fysica**: `stop_physics()` reset nu netjes de fysica in plaats van alles te verwijderen. Hierdoor kun je later opnieuw `start_physics()` aanroepen zonder problemen.

Bij **Fysica**: er mag nu maar één callback per botsing tussen twee vormen. Dit voorkomt verwarrende situaties waarbij dezelfde botsing meerdere keren werd afgehandeld.

Bij **Vormen**: `clone()` bij een Box kopieert nu ook de `border_radius` correct mee.

Bij **Vormen**: afbeeldingen (Image) worden nu correct gedraaid en geschaald, zonder rare vervormingen.

Bij **Vormen**: de `size` eigenschap werkt nu daadwerkelijk bij Box, Circle en Text.

Bij **Vormen**: `is_hidden` en `is_shown` kun je nu ook als setter gebruiken (bijv. `bal.is_hidden = True`), en de fysica wordt dan automatisch gepauzeerd.

Bij **Tekst**: transparantie (`transparency`) werkt nu correct bij Text-objecten, ook na een `clone()`.

Bij **Bugfixes**: toetsenbord-events worden nu maar één keer per frame afgevuurd, en alleen de aangeklikte sprite krijgt de klik-callback (niet alle sprites).

Bij **Bugfixes**: het wisselen van een achtergrondafbeelding terug naar een kleur met `set_backdrop()` werkt nu correct.

Bij **Fysica**: je kunt nu `sensor=True` meegeven aan `start_physics()`. Een sensor detecteert botsingen (bijv. `when_touching`) maar blokkeert andere vormen niet — ze gaan er gewoon doorheen. Handig voor scorezones, triggers en checkpoints!

Bij **Verwijderd**: het `Line`-object is verwijderd omdat het niet goed werkte met de physics engine.

</details>

<details>
  <summary>Nieuw of verbeterd in coderius-play versie 3.2</summary>

We hebben flink wat verbeteringen doorgevoerd in coderius-play versie 3.2.

Bij **Fysica**: alle vormen hebben nu altijd fysica, al merk je dit niet altijd. Weet wel: dit lost stiekem heel veel bugs op en maakt de code simpeler voor de ontwikkelaar en voor jou :).

Bij **SNES-controller**: Bug is gefixt bij `when_button_pressed`. Sinds versie 3.3.2 gebruik je `while_button_pressed` als je wilt dat de gebeurtenis elk frame afgaat zolang je de knop inhoudt.

Bij **Database (JSON)**: je kunt nu een zogenaamde "default" waarde meegeven, erg handig als je een high-score systeem gaat maken


</details>


<details>
  <summary>Nieuw of verbeterd in coderius-play versie 3.1</summary>

We hebben flink wat verbeteringen doorgevoerd in coderius-play versie 3.1.

Bij **een foutmelding** sluit het spel nu meteen. Dat helpt bij het debuggen.

Bij **Acties**: als je twee of meer keer achter elkaar **hide**, **show** of **remove** aanroept, krijg je geen foutmelding meer

Bij **Acties**: the *distance_to* wordt nu uitgelegd in deze cheatsheet. Misschien leuk voor het programmeren van een tegenstander bij pong!

Bij **Fysica**: bij grote vormen raken de vormen weer netjes de muren zonder gekke onzichtbare rand

Bij **Gebeurtenis bij een vorm**: je kunt nu ook weten welke  muur je hebt aangeraakt bij **when_touching_wall** en **when_stopped_touching_wall**

Bij **Database (JSON)**: nu zelfs [met aparte uitlegpagina](database/basis.md)


</details>

</CheatsheetGrid>

## Editor

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe sla ik een bestand op in Thonny?</summary>

Je kunt een bestand opslaan in Thonny op verschillende manieren:

**Methode 1: Via het menu**
- Klik op **File** (Bestand) in de menubalk
- Klik op **Save** (Opslaan) of **Save As...** (Opslaan als...)

**Methode 2: Met sneltoetsen**
- Windows/Linux: druk op **Ctrl + S**
- Mac: druk op **Cmd + S**

**Tip:** Als je een nieuw bestand voor het eerst opslaat, moet je een naam en locatie kiezen. 
Zorg ervoor dat je bestand eindigt op `.py` (bijvoorbeeld `mijn_spel.py`).

</details>

</CheatsheetGrid>

## Achtergrond

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe verander ik de achtergrondkleur? (set_backdrop)</summary>

<PygbagRunner code={`import play

play.set_backdrop('black')

play.new_circle(color='yellow')
`} height={350} />

Je kunt elke kleur gebruiken die je ook bij vormen gebruikt, bijvoorbeeld `'red'`, `'white'` of een RGB-waarde zoals `(30, 30, 30)`.

</details>

<details>
  <summary>Hoe stel ik een achtergrondafbeelding in? (set_backdrop_image)</summary>

Met **play.set_backdrop_image()** kun je een afbeelding als achtergrond gebruiken in plaats van een kleur. De afbeelding moet in dezelfde map staan als je Python-bestand.

:::warning Online speeltuin
Achtergrondafbeeldingen laden werkt **niet** in de online speeltuin. Je hebt hiervoor een lokale installatie nodig (Thonny of VS Code).
:::

```python
import play

play.set_backdrop_image('achtergrond.png')

play.new_circle(color='yellow')
```

**Let op:** de afbeelding wordt **niet** automatisch geschaald. Zorg ervoor dat de afbeelding dezelfde grootte heeft als je scherm (standaard 800x600 pixels).

</details>

</CheatsheetGrid>

## Vormen

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Cirkel (play.new_circle)</summary>

<PygbagRunner code={`import play 

play.new_circle()
`} height={350} />

Wat kan ik aanpassen aan een cirkel?
Hierbij de lijst van attributen voor een cirkel:
- **color**: Kleur, staat standaard op 'black'. [Op deze pagina](https://www.pygame.org/docs/ref/color_list.html) zie je welke kleuropties er zijn. Je kunt ook direct een [RGB-waarde opgeven](https://www.w3schools.com/colors/colors_picker.asp) zoals **color=(100,100,100)**.
- **x**: x-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar links, groter dan 0 is naar rechts.
- **y**: y-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar beneden, groter dan 0 is naar boven.
- **radius**: straal, staat standaard op 100. Hoe groter de waarde, hoe groter de cirkel.
- **border_color**: kleur van de rand, staat standaard op  'light blue'. Let op, als de **border_width** 0 is, zie je de rand niet.
- **border_width**: de breedte van de rand. Staat standaard op 0 (geen rand zichtbaar)
- **transparency**: doorzichtigheid, 0 is onzichtbaar. 100 is volledig zichtbaar.
- **angle**: de hoek van de cirkel in graden. Staat standaard op 0.
- **size**: de schaal van de cirkel als percentage. Staat standaard op 100.

Voorbeeld van een kleine blauwe cirkel die een beetje naar rechts staat:

<PygbagRunner code={`import play

cirkel = play.new_circle(color='blue', radius=20, x=100)
`} height={350} />
</details>

<details>
  <summary>Vierkant of rechthoek (play.new_box)</summary>

<PygbagRunner code={`import play 

play.new_box()
`} height={350} />

Net zoals bij **play.new_circle** heeft het programma voor ons nu ook al de kleur en grootte bepaald. Je kunt dit zelf natuurlijk aanpassen!
Dit zijn de attributen voor **play.new_box**:
- **color**: Kleur, staat standaard op 'black'. [Op deze pagina](https://www.pygame.org/docs/ref/color_list.html) zie je welke kleuropties er zijn. Je kunt ook direct een [RGB-waarde opgeven](https://www.w3schools.com/colors/colors_picker.asp) zoals **color=(100,100,100)**.
- **x**: x-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar links, groter dan 0 is naar rechts.
- **y**: y-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar beneden, groter dan 0 is naar boven.
- **width**: de breedte van de rechthoek. Staat standaard op 100.
- **height**: de hoogte van de rechthoek. Staat standaard op 200.
- **border_color**: kleur van de rand, staat standaard op  'light blue'. Let op, als de **border_width** 0 is, zie je de rand niet.
- **border_width**: de breedte van de rand. Staat standaard op 0 (geen rand zichtbaar).
- **border_radius**: de afronding van de hoeken. Staat standaard op 0 (scherpe hoeken). Hoe hoger de waarde, hoe ronder de hoeken.
- **transparency**: doorzichtigheid, 0 is onzichtbaar. 100 is volledig zichtbaar.
- **angle**: de hoek van de rechthoek in graden. Staat standaard op 0.
- **size**: de schaal van de rechthoek als percentage. Staat standaard op 100.

Voorbeeld van een rode rechthoek die een beetje boven het midden staat:
<PygbagRunner code={`import play

box = play.new_box(color='red', y=100)
`} height={350} />
</details>

<details>
  <summary>Tekst (play.new_text)</summary>

<PygbagRunner code={`import play 

play.new_text()
`} height={350} />

Je kunt voor **play.new_text** kiezen uit:
- **words**: Woorden op het scherm, de woorden die op het scherm komen te staan
- **x**: x-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar links, groter dan 0 is naar rechts.
- **y**: y-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar beneden, groter dan 0 is naar boven.
- **font**: de font van de tekst. Je kunt een pad naar een fontbestand opgeven (bijv. `'mijnfont.ttf'`). Sinds versie 3.3.3 kun je ook de naam van een systeemfont opgeven (bijv. `'Arial'`) — dat werkt wanneer je het programma lokaal uitvoert. In de browser zijn systeemfonts niet beschikbaar; daar wordt automatisch het standaardfont gebruikt.
- **font_size**: de grootte van de font. Staat standaard op 50.
- **color**: Kleur, staat standaard op 'black'. [Op deze pagina](https://www.pygame.org/docs/ref/color_list.html) zie je welke kleuropties er zijn. Je kunt ook direct een [RGB-waarde opgeven](https://www.w3schools.com/colors/colors_picker.asp) zoals **color=(100,100,100)**.
- **angle**: de hoek van de tekst in graden. Staat standaard op 0.
- **transparency**: doorzichtigheid, 0 is onzichtbaar. 100 is volledig zichtbaar.
- **size**: de schaal van de tekst als percentage. Staat standaard op 100.

Voorbeeld van een blauwe tekst midden bovenaan het scherm met een net iets grote font size:
<PygbagRunner code={`import play

tekst = play.new_text(words="Hello world", y=200, font_size=50)
`} height={350} />
</details>

<details>
  <summary>Afbeelding (play.new_image)</summary>

:::warning Online speeltuin
Afbeeldingen laden werkt **niet** in de online speeltuin. Je hebt hiervoor een lokale installatie nodig (Thonny of VS Code).
:::

```python
import play 

play.new_image('VERVANG_DIT_DOOR_NAAM_VAN_AFBEELDING')
```
Je **moet** voor **play.new_image** kiezen uit:
- **image**: dit is de naam van het bestand op jouw computer, bijvoorbeeld **cat.jpg** (als je je afbeelding zo genoemd hebt)

Je **kunt** voor **play.new_image** kiezen uit:
- **x**: x-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar links, groter dan 0 is naar rechts.
- **y**: y-positie, staat standaard op 0 (het midden). Kleiner dan 0 is naar beneden, groter dan 0 is naar boven.
- **size**: de grootte van de afbeelding. De grootte staat standaard op 100. Een hoger getal dan 100 maakt de afbeelding groter en een lager getal maakt de afbeelding kleiner.
- **transparency**: doorzichtigheid, 0 is onzichtbaar. 100 is volledig zichtbaar.
- **angle**: de hoek. Je kunt je afbeelding draaien door de **angle** te veranderen. Als je **angle** naar 180 verandert, staat de afbeelding op z'n kop.

</details>

<details>
  <summary>Hoe weet ik precies de locatie van de rechterkant (right), linkerkant (left), bovenkant (top) en onderkant (bottom) van een vorm?</summary>

Dat gaat via:
- rechterkant (right)
- linkerkant (left)
- bovenkant (top)
- onderkant (bottom)

Als ik bijvoorbeeld wil weten wat de meest rechter pixel is van een cirkel, kan ik het volgende doen:

<PygbagRunner code={`import play 

cirkel = play.new_circle()

print(cirkel.right)
`} height={350} />

Als het goed is, zie je in het **console-paneel** onder het scherm iets als:
```
100.0
```

Nu weet je dus dat de meest rechter pixel van de bal op x=100 staat.
</details>

</CheatsheetGrid>

## Fysica

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe voeg ik fysica toe aan een vorm? (start_physics)</summary>

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.start_physics()
`} height={350} />
</details>

<details>
  <summary>Hoe verander ik de fysica-eigenschappen van een vorm? (start_physics)</summary>

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.start_physics(obeys_gravity=False)
`} height={350} />

OF (nuttig als je iets wil veranderen tijdens het spel)

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.start_physics()

cirkel.physics.obeys_gravity = False
`} height={350} />

</details>


<details>
  <summary>Wat kan ik allemaal aanpassen aan de fysica? (start_physics)</summary>

| Attribuut | Uitleg | 
|:---:|:---:|
| obeys_gravity | True --> zwaartekracht wordt nagedaan, False --> geen zwaartekracht | 
| x_speed | hoe hard wil je dat de bal beweegt op de horizontale as? | 
| y_speed | hoe hard wil je dat de bal beweegt op de verticale as? | 
| can_move | True --> de vorm mag bewegen, False, de vorm staat altijd stil | 
| stable | True --> als iets botst tegen vorm, zal deze niet bewegen, False, de vorm zal bewegen bij een botsing.
| bounciness | 1.0 is het maximum: de vorm kaatst net zo hard terug als dat deze aankwam. 0 --> vorm kaatst niet terug bij botsing. Standaard: 1.0 (maximaal stuiteren). |
| mass | hoe 'zwaar' is je vorm? Een zwaardere vorm duwt een lichtere vorm makkelijker weg bij een botsing. Standaard: 10. | 
| friction | 0 --> geen frictie (energie blijft behouden). |
| sensor | True --> de vorm detecteert botsingen maar blokkeert ze niet (objecten gaan er doorheen). False --> normaal gedrag (standaard). |
</details>


<details>
  <summary>Hoe zet ik de fysica op pauze en weer aan? (.physics.pause() & .physics.unpause())</summary>

Met **.physics.pause** zet je de fysica op pauze en met **.physics.unpause** zet je de fysica weer aan.

Een voorbeeld met **pause**:
<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.start_physics()
cirkel.physics.pause()
`} height={350} />

Een voorbeeld met ook **unpause**:

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.start_physics()
cirkel.physics.pause()
cirkel.physics.unpause()
`} height={350} />


</details>

<details>
  <summary>Hoe zet ik de fysica uit? (stop_physics())</summary>

Met **stop_physics()** zet je de physics uit.

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.start_physics()
cirkel.stop_physics()
`} height={350} />
</details>

<details>
  <summary>Welke soorten fysica zijn er? (dynamic, static, kinematic)</summary>

Er zijn drie soorten fysica. Je kunt met **physics_info()** opvragen welk type een vorm heeft.

| Type | Wat doet het? | Voorbeeld | Code |
|:---:|:---:|:---:|:---:|
| **dynamic** | Beweegt vrij rond, reageert op zwaartekracht en botsingen. Dit is de standaard. | Een bal die rondstuitert | `vorm.start_physics()` |
| **static** | Staat helemaal stil, kan niet bewegen. Andere vormen botsen er wel tegenaan. | Een muur of platform dat stilstaat | `vorm.start_physics(can_move=False)` |
| **kinematic** | Beweegt met een vaste snelheid. Geen zwaartekracht, maar andere vormen botsen er wel tegenaan. | Een batje dat je bestuurt | `vorm.start_physics(obeys_gravity=False, stable=True, x_speed=40)` |

<PygbagRunner code={`import play

bal = play.new_circle()
bal.start_physics()
bal.physics_info()
`} height={350} />

</details>

</CheatsheetGrid>

## Acties

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe maak  ik een vorm onzichtbaar (hide)?</summary>

Hiermee teken je een cirkel en maak je hem onmiddelijk onzichtbaar.

Let op: .hide() verandert het volgende:
- **cirkel.is_hidden** krijgt de waarde **True**
- **cirkel.is_shown** krijgt de waarde **False**
- Als je fysica gebruikt, gaat die op pauze :)

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.hide()
`} height={350} />
</details>

<details>
  <summary>Hoe maak een ik vorm weer zichtbaar (show)?</summary>

Hiermee teken je een cirkel en maak je hem onmiddelijk onzichtbaar en weer zichtbaar

Let op: .show() verandert het volgende:
- **cirkel.is_hidden** krijgt de waarde **False**
- **cirkel.is_shown** krijgt de waarde **True**
- Als je fysica gebruikte, gaat deze weer aan en weer werken

<PygbagRunner code={`import play 

cirkel = play.new_circle()
cirkel.hide()
cirkel.show()
`} height={350} />
</details>


<details>
  <summary>Hoe verwijder ik een vorm? (remove)?</summary>

Allereerst een vraag: heb je dit echt nodig of is **.hide()** misschien ook al genoeg?
Met **.remove()**:
- verwijder je de vorm
- je kunt opvragen of de vorm 'leeft' via **cirkel.alive()**. Deze is **False** als de vorm verwijderd is.

<PygbagRunner code={`import play

cirkel = play.new_circle()
cirkel.remove()
`} height={350} />

</details>

<details>
  <summary>Hoe bereken ik de afstand tussen twee vormen (distance_to)?</summary>

Met **.distance_to()** kun je de afstand tussen twee vormen berekenen.

Je berekent de afstand tussen het **midden** van de ene vorm en het **midden** van de andere vorm,
dus niet vanaf de zijkanten.

<PygbagRunner code={`import play

cirkel1 = play.new_circle(x=-100, radius=20)
cirkel2 = play.new_circle(x=100, radius=20)

afstand = cirkel1.distance_to(cirkel2)
play.new_text(words=f"Afstand: {afstand}", y=200)
`} height={350} />

Je kunt ook de afstand tot een punt (x, y) berekenen:

<PygbagRunner code={`import play

cirkel = play.new_circle(x=100)

afstand = cirkel.distance_to(0, 0)  # afstand tot het midden van het scherm
play.new_text(words=f"Afstand tot midden: {afstand}", y=200)
`} height={350} />

</details>

<details>
  <summary>Hoe kopieer ik een vorm? (clone)</summary>

Met **.clone()** maak je een kopie van een vorm. De kopie heeft dezelfde kleur, grootte en positie als het origineel.

**Let op:** bij een `Image` kopieert `.clone()` **niet** de positie, grootte, hoek of transparantie. Je moet deze zelf opnieuw instellen na het klonen.

<PygbagRunner code={`import play

cirkel = play.new_circle(color='red', x=-100, radius=30)

kopie = cirkel.clone()
kopie.x = 100
`} height={350} />

Je hebt nu twee rode cirkels: het origineel links en de kopie rechts.

**Let op:** `.clone()` kopieert de kleur, grootte, positie en andere attributen, maar **niet** de gebeurtenissen (zoals `@when_clicked` of `@when_touching`). Die moet je opnieuw instellen op de kopie.

</details>

<details>
  <summary>Hoe vraag ik alle informatie van een vorm op? (info)</summary>

Met **.info()** kun je in één keer alle informatie over een vorm printen. Dit is erg handig bij het debuggen!

<PygbagRunner code={`import play

cirkel = play.new_circle(color='red', x=50, radius=30)

cirkel.info()
`} height={350} />

In het **console-paneel** onder het scherm verschijnt dan informatie zoals de kleur, positie, grootte en andere attributen van de vorm.

</details>

<details>
  <summary>Hoe stop ik het spel vanuit mijn code? (stop_program)</summary>

Met **play.stop_program()** kun je het spel beëindigen vanuit je code. Dit is handig voor een game-over scherm.

<PygbagRunner code={`import play

play.new_text(words="Druk op Escape om te stoppen", font_size=30)

@play.when_key_pressed("escape")
def stop():
    play.stop_program()
`} height={350} />

</details>

</CheatsheetGrid>

## Willekeurig

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe maak ik een willekeurig getal? (random_number)</summary>

Met **play.random_number()** krijg je een willekeurig geheel getal:

<PygbagRunner code={`import play

getal = play.random_number(1, 10)
play.new_text(words="Getal: " + str(getal))
`} height={350} />

</details>

<details>
  <summary>Hoe krijg ik een willekeurige positie op het scherm? (random_position)</summary>

Met **play.random_position()** krijg je een willekeurige positie op het scherm:

<PygbagRunner code={`import play

positie = play.random_position()
play.new_circle(x=positie.x, y=positie.y, radius=20, color='red')
`} height={350} />

</details>

<details>
  <summary>Hoe krijg ik een willekeurige kleur? (random_color)</summary>

Met **play.random_color()** krijg je een willekeurige kleur:

<PygbagRunner code={`import play

kleur = play.random_color()
play.new_circle(color=kleur)
`} height={350} />

</details>

<details>
  <summary>Hex-kleurcodes gebruiken (color='#FF8800') ⭐ nieuw in 3.3.3</summary>

Naast namen (`'red'`, `'blue'`, ...) en RGB-tuples (`(255, 136, 0)`) kun je sinds versie 3.3.3 ook **hex-codes** opgeven. Handig als je een hele specifieke kleur wilt — bijvoorbeeld eentje die je hebt uitgekozen via een [kleurkiezer](https://www.w3schools.com/colors/colors_picker.asp).

<PygbagRunner code={`import play

play.new_circle(color='#FF8800', radius=60, x=-100)
play.new_circle(color='#00B4D8', radius=60, x=0)
play.new_circle(color='#9D4EDD', radius=60, x=100)
`} height={350} />

Een hex-code begint altijd met `#` gevolgd door 6 tekens (cijfers 0-9 of letters A-F). De eerste twee tekens bepalen hoeveel rood er in zit, de volgende twee groen, en de laatste twee blauw.

</details>

</CheatsheetGrid>

## Gebeurtenissen

:::info
**Goed om te weten:** je hoeft `play.start_program()` niet zelf aan te roepen. Play start automatisch zodra je programma klaar is met laden. Alle voorbeelden in dit lesmateriaal werken daarom zonder `start_program()`.
:::

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Bij de start van het programma (@play.when_program_starts)</summary>

  <PygbagRunner code={`import play

@play.when_program_starts
def setup_game():
    play.new_text(words="Welkom!")
`} height={350} />
</details>

<details>
  <summary>Bij het indrukken van één specifieke toets (@play.when_key_pressed)</summary>

Je gebruikt **@play.when_key_pressed** om te checken of een toets ingedrukt wordt. Wat je tussen de haakjes zet (in dit geval 'space') is welke toets gedetecteerd wordt.

  <PygbagRunner code={`import play

box = play.new_box()

@play.when_key_pressed("space")
def spatie_ingedrukt():
    box.x = box.x + 10
`} height={350} />
</details>

<details>
  <summary>Bij het indrukken van twee of meerdere toetsen (@play.when_key_pressed)</summary>

Als je met meerdere toetsen te maken hebt, heb je in ieder geval twee opties. 
- twee losse **@play.when_key_pressed** gebeurtenissen
- één **play.when_key_pressed** gebeurtenis

**twee @play.when_key_pressed gebeurtenissen**

<PygbagRunner code={`import play

box = play.new_box()

@play.when_key_pressed("up")
def omhoog():
    box.y = box.y + 10

@play.when_key_pressed('down')
def omlaag():
    box.y = box.y - 10
`} height={350} />

OF

**één @play.when_key_pressed gebeurtenis**
Let op, nu heb je **key** nodig.

<PygbagRunner code={`import play

box = play.new_box()

@play.when_key_pressed("down", "up")
def omhoog_of_omlaag(key):
    if key == 'up':
        box.y = box.y + 10
    if key == 'down':
        box.y = box.y - 10
`} height={350} />


</details>

<details>
  <summary>Bij het loslaten van één specifieke toets (@play.when_key_released)</summary>

Je gebruikt **@play.when_key_released** om te checken of een toets losgelaten wordt. 

<PygbagRunner code={`import play

box = play.new_box()

@play.when_key_released("up")
def omhoog():
    box.y = box.y + 10
`} height={350} />
</details>


<details>
  <summary>Bij het loslaten van twee of meerdere toetsen (@play.when_key_released)</summary>

Als je met meerdere toetsen te maken hebt, heb je in ieder geval twee opties. 
- twee losse **@play.when_key_released** gebeurtenissen
- één **play.when_key_released** gebeurtenis

**twee @play.when_key_released gebeurtenissen**

<PygbagRunner code={`import play

box = play.new_box()

@play.when_key_released("up")
def omhoog():
    box.y = box.y + 10

@play.when_key_released('down')
def omlaag():
    box.y = box.y - 10
`} height={350} />

OF

**één @play.when_key_released gebeurtenis**
Let op, nu heb je **key** nodig.

<PygbagRunner code={`import play

box = play.new_box()

@play.when_key_released("down", "up")
def omhoog_of_omlaag(key):
    if key == 'up':
        box.y = box.y + 10
    if key == 'down':
        box.y = box.y - 10
`} height={350} />


</details>

<details>
  <summary>Bij het indrukken van een willekeurige toets (@play.when_any_key_pressed)</summary>

  Met **@play.when_any_key_pressed** kun je een functie uitvoeren zodra een willekeurige toets op het toetsenbord wordt ingedrukt. Met de `key` parameter weet je welke toets is ingedrukt.

  <PygbagRunner code={`import play

instructie_tekst = play.new_text("Druk op een toets", y=50)
feedback_tekst = play.new_text(words="", y=0)

@play.when_any_key_pressed
def handel_toets_af(key):
    feedback_tekst.words = "Je drukte op: " + key
`} height={350} />
</details>


<details>
  <summary>Bij het loslaten van een willekeurige toets (@play.when_any_key_released)</summary>

  Met **@play.when_any_key_released** kun je een functie uitvoeren zodra een willekeurige toets op het toetsenbord wordt losgelaten. Met de `key` parameter weet je welke toets is losgelaten.

<PygbagRunner code={`import play

instructie_tekst = play.new_text("Laat een toets los", y=50)
feedback_tekst = play.new_text(words="", y=0)

@play.when_any_key_released
def toets_wordt_losgelaten(key):
    feedback_tekst.words = "Je liet los: " + key
`} height={350} />
</details>

<details>
  <summary>Welke toetsen kun je gebruiken bij @play.when_key_pressed?</summary>

  Op [deze site](https://pyga.me/docs/ref/key.html) kun je een lijst vinden van alle toetsen. Scrol naar beneden tot je bij de lijst bent. Het gaat om de kolom "pygame Constant".

  Het is belangrijk dat je `K_` weghaalt en kleine letters gebruikt, bijvoorbeeld:

  ```
  K_up --> up
  ```
</details>

<details>
  <summary>Continu checken of een toets ingedrukt is (play.key_is_pressed)</summary>

Met **play.key_is_pressed()** kun je continu checken of een toets ingedrukt is. Dit is handig voor vloeiende beweging in combinatie met `@play.repeat_forever`:

<PygbagRunner code={`import play

box = play.new_box()

@play.repeat_forever
def beweeg():
    if play.key_is_pressed("up"):
        box.y = box.y + 2
    if play.key_is_pressed("down"):
        box.y = box.y - 2
`} height={350} />

Het verschil met `@play.when_key_pressed`: die reageert één keer per klik, terwijl `key_is_pressed` elk frame checkt zolang je de toets inhoudt.

**Tip:** Sinds versie 3.3.2 kun je ook `@play.while_key_pressed` gebruiken. Dat is korter en duidelijker!

</details>

<details>
  <summary>Zolang een toets ingedrukt is (@play.while_key_pressed) ⭐ nieuw in 3.3.2</summary>

Met **@play.while_key_pressed** vuurt de functie **elk frame** zolang je de toets inhoudt. Dit is ideaal voor vloeiende beweging!

**Sinds 3.3.3:** geen vertraging meer bij het eerste frame — de beweging begint direct.

<PygbagRunner code={`import play

blok = play.new_box()

@play.while_key_pressed('left', 'right')
def beweeg(key):
    if key == 'right':
        blok.x = blok.x + 5
    if key == 'left':
        blok.x = blok.x - 5
`} height={350} />

Het verschil met `@play.when_key_pressed`: die reageert één keer bij het indrukken. `@play.while_key_pressed` vuurt elk frame zolang je de toets inhoudt.

</details>

<details>
  <summary>Zolang een willekeurige toets ingedrukt is (@play.while_any_key_pressed) ⭐ nieuw in 3.3.2</summary>

Met **@play.while_any_key_pressed** vuurt de functie elk frame zolang je een willekeurige toets inhoudt. Met de `key` parameter weet je welke toets het is.

<PygbagRunner code={`import play

tekst = play.new_text(words="Houd een toets ingedrukt")

@play.while_any_key_pressed
def toon_toets(key):
    tekst.words = f"Je houdt ingedrukt: {key}"
`} height={350} />

</details>

<details>
  <summary>Zolang de muis ingedrukt is (@play.while_mouse_pressed) ⭐ nieuw in 3.3.2</summary>

Met **@play.while_mouse_pressed** vuurt de functie elk frame zolang je de muisknop ingedrukt houdt.

<PygbagRunner code={`import play

cirkel = play.new_circle(color='blue', radius=20)

@play.while_mouse_pressed
def volg_muis():
    cirkel.x = play.mouse.x
    cirkel.y = play.mouse.y
`} height={350} />

</details>

<details>
  <summary>Bij het indrukken van de muis (@play.when_mouse_clicked)</summary>

**when_mouse_clicked** gebruik je om een muisklik te detecteren.

<PygbagRunner code={`import play

# Maak een cirkel
circle = play.new_circle(color="blue")

# Deze functie wordt uitgevoerd als je op de muis klikt
@play.when_mouse_clicked
def muis_geklikt():
    if circle.color == "blue":
        circle.color = "red"
    else:
        circle.color = "blue"
    print("Muis geklikt! De cirkel is nu " + str(circle.color))
`} height={350} />
</details>

<details>
  <summary>Bij het loslaten van de muis (@play.when_click_released)</summary>

Let op, deze gebeurtenis gebeurt pas als je de muis loslaat.

<PygbagRunner code={`import play

# Maak een cirkel
circle = play.new_circle(color="blue")

# Deze functie wordt uitgevoerd als je op de muis klikt
@play.when_click_released
def muis_geklikt():
    if circle.color == "blue":
        circle.color = "red"
    else:
        circle.color = "blue"
    print("Muis geklikt! De cirkel is nu " + str(circle.color))
`} height={350} />
</details>

<details>
<summary>Bij elk frame (@play.repeat_forever)</summary>

<PygbagRunner code={`import play

frames=0
play.new_text('Aantal frames sinds start:', y=100)
tekst = play.new_text(words=str(frames))

@play.repeat_forever
def altijd():
    global frames
    frames = frames + 1
    tekst.words = str(frames)
`} height={350} />

</details>

</CheatsheetGrid>

## Gebeurtenis bij een vorm

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Zodra twee vormen elkaar raken (@VARIABLE.when_touching)</summary>

Je gebruikt @VARIABLE.when_touching als je wilt weten of twee vormen elkaar raken.

<PygbagRunner code={`import play

bal = play.new_circle(radius=50)
bal.start_physics(obeys_gravity=False, x_speed=20)

batje = play.new_box(x=200)

tekst = play.new_text("batje nog niet aangeraakt", y=200)

@bal.when_touching(batje)
def batje_aangeraakt():
    tekst.words = 'batje wel aangeraakt'
`} height={350} />

**Let op:** je kunt maar **één** `@VARIABLE.when_touching()` per vormenpaar gebruiken. Als je twee keer `@bal.when_touching(batje)` schrijft, krijg je een foutmelding.

Je kunt overigens ook **VARIABLE.is_touching(VARIABLE)** gebruiken om te checken of twee vormen elkaar raken. Je kunt ook een coördinaat meegeven als tuple, bijvoorbeeld `bal.is_touching((100, 200))`.

Elke keer als je pijltje omhoog klikt, zie je of de bal het batje aanraakt:
<PygbagRunner code={`import play

bal = play.new_circle(radius=50)
bal.start_physics(obeys_gravity=False, x_speed=50)

batje = play.new_box(x=200)

tekst = play.new_text("bal raakt batje niet", y=200)

@play.when_key_pressed('up')
def pijltje_omhoog():
    if bal.is_touching(batje):
        tekst.words = 'bal raakt batje'
    else:
        tekst.words = 'bal raakt batje niet'
`} height={350} />

</details>

<details>
  <summary>Wanneer een vorm stopt met het aanraken van een andere vorm (@VARIABLE.when_stopped_touching)</summary>

<PygbagRunner code={`import play

bal = play.new_circle(color="blue", radius=50)
bal.start_physics(obeys_gravity=False, x_speed=60)

batje = play.new_box(x=300)

text = play.new_text(words="batje is niet aangeraakt", y=200)

@bal.when_stopped_touching(batje)
def weggekaatst():
    text.words = 'bal is weggekaatst van batje'
`} height={350} />
</details>

<details>
  <summary>Wanneer een vorm de muur aanraakt (@VARIABLE.when_touching_wall)</summary>

<PygbagRunner code={`import play

bal = play.new_circle(radius=50)
bal.start_physics(obeys_gravity=False, x_speed=50)

@bal.when_touching_wall
def teleport():
    bal.x=0
`} height={350} />

Je kunt ook specifiek detecteren wanneer een vorm een bepaalde muur aanraakt door een `WallSide` parameter mee te geven:

<PygbagRunner code={`import play

bal = play.new_circle(radius=50)
bal.start_physics(obeys_gravity=False, x_speed=300)

tekst = play.new_text("", y=200)

@bal.when_touching_wall(wall=play.WallSide.LEFT)
def linkermuur_aangeraakt():
    tekst.words = "Linkermuur geraakt!"
    bal.x = 0
`} height={350} />

Mogelijke waardes voor WallSide zijn:
- **play.WallSide.LEFT** - linkermuur
- **play.WallSide.RIGHT** - rechtermuur
- **play.WallSide.TOP** - bovenmuur
- **play.WallSide.BOTTOM** - ondermuur

</details>

<details>
  <summary>Wanneer een vorm stopt met het aanraken van de muur (@VARIABLE.when_stopped_touching_wall)</summary>

<PygbagRunner code={`import play

bal = play.new_circle(color="blue", radius=50)
bal.start_physics(obeys_gravity=False, x_speed=60)

text = play.new_text(words="muur is niet aangeraakt", y=200)

@bal.when_stopped_touching_wall
def aangeraakt():
    text.words = 'muur is aangeraakt'
`} height={350} />

Je kunt ook specifiek detecteren wanneer een vorm stopt met het aanraken van een bepaalde muur door een `WallSide` parameter mee te geven:

<PygbagRunner code={`import play

bal = play.new_circle(color="blue", radius=50)
bal.start_physics(obeys_gravity=False, x_speed=300)

tekst = play.new_text("", y=200)

@bal.when_stopped_touching_wall(wall=play.WallSide.LEFT)
def linkermuur_verlaten():
    tekst.words = "Linkermuur verlaten!"
`} height={350} />

Mogelijke waardes voor WallSide zijn:
- **play.WallSide.LEFT** - linkermuur
- **play.WallSide.RIGHT** - rechtermuur
- **play.WallSide.TOP** - bovenmuur
- **play.WallSide.BOTTOM** - ondermuur

</details>

<details>
  <summary>Wanneer er op een vorm geklikt wordt (@VARIABLE.when_clicked)</summary>

<PygbagRunner code={`import play

bal = play.new_circle(radius=50)
bal.start_physics(obeys_gravity=False, x_speed=50)

@bal.when_clicked
def geklikt():
    bal.x=0
`} height={350} />
</details>

<details>
  <summary>Wanneer een klik op een vorm losgelaten wordt (@VARIABLE.when_click_released)</summary>

Dit lijkt op `@VARIABLE.when_clicked`, maar de functie wordt pas uitgevoerd als je de muisknop **loslaat** terwijl je op de vorm klikte.

<PygbagRunner code={`import play

bal = play.new_circle(radius=50, color='blue')

@bal.when_click_released
def losgelaten():
    bal.color = 'red'
`} height={350} />
</details>

</CheatsheetGrid>

## Tijd


<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Ik wil tijdelijk iets veranderen aan een vorm, bijvoorbeeld de snelheid (async await)</summary>

<PygbagRunner code={`import play

bal = play.new_circle(color='black')
bal.start_physics(obeys_gravity=False, x_speed=10)

@play.when_mouse_clicked
async def tijdelijk_sneller():
    bal.physics.x_speed = 30
    await play.timer(seconds=1)
    bal.physics.x_speed = 10
`} height={350} />

</details>

<details>
  <summary>Hoe maak ik een timer?</summary>

<PygbagRunner code={`import play
 
time = 10
text = play.new_text(str(time))
print(time)
 
@play.repeat_forever
async def timer():
    global time
    if time > 0:
        await play.timer(seconds=1)
        time -= 1
        text.words = str(time)
`} height={350} />
</details>

</CheatsheetGrid>

## Global

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe houd ik de score van mijn spel bij? (global)</summary>

<PygbagRunner code={`import play

score = 0
score_tekst = play.new_text(str(score), y=100, font_size=40)

@play.when_key_released("space")
def spatie_ingedrukt():
    global score
    score = score + 1
    score_tekst.words = str(score)
`} height={350} />

</details>

</CheatsheetGrid>

## Screen

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe pas ik de titel van het venster aan? (play.screen.caption)</summary>

Met **play.screen.caption** kun je de titel van het venster aanpassen. Standaard staat hier "coderius-play".

<PygbagRunner code={`import play

play.screen.caption = "Mijn gave spel"

play.new_circle(color='blue')
`} height={350} />

</details>

<details>
  <summary>Hoe weet ik hoeveel pixels breed het scherm is? (play.screen.width)?</summary>

  Met **play.screen.width** kun je weten hoeveel pixels breed het scherm is.

```python
import play

print(play.screen.width)
```
</details>

<details>
  <summary>Hoe weet ik hoeveel pixels hoog het scherm is? (play.screen.height)?</summary>

  Met **play.screen.height** kun je weten hoeveel pixels hoog het scherm is.

```python
import play

print(play.screen.height)
```
</details>

<details>
  <summary>Hoe weet ik wat de x-positie is van de linkerkant van het scherm (play.screen.left)?</summary>

  Met **play.screen.left** kun je weten wat de x-positie is van de linkerkant van het scherm.
  Standaard staat dit op **-400**. Het midden van het scherm heeft een x-positie van 0. Naar links wordt de x-positie dus negatief

```python
import play

print(play.screen.left)
```
</details>

<details>
  <summary>Hoe weet ik wat de x-positie is van de rechterkant van het scherm (play.screen.right)?</summary>

  Met **play.screen.right** kun je weten wat de x-positie is van de rechterkant van het scherm.
  Standaard staat dit op **400**. Het midden van het scherm heeft een x-positie van 0. Naar rechts wordt de x-positie dus hoger.

```python
import play

print(play.screen.right)
```
</details>

<details>
  <summary>Hoe weet ik wat de y-positie is van de bovenkant van het scherm (play.screen.top)?</summary>

  Met **play.screen.top** kun je weten wat de y-positie is van de bovenkant van het scherm.
  Standaard staat dit op **300**. Het midden van het scherm heeft een y-positie van 0. Naar boven wordt de y-positie dus hoger.

```python
import play

print(play.screen.top)
```
</details>

<details>
  <summary>Hoe weet ik wat de y-positie is van de onderkant van het scherm (play.screen.bottom)?</summary>

  Met **play.screen.bottom** kun je weten wat de y-positie is van de onderkant van het scherm.
  Standaard staat dit op **-300**. Het midden van het scherm heeft een y-positie van 0. Naar onder wordt de y-positie dus lager.

```python
import play

print(play.screen.bottom)
```
</details>

<details>
  <summary>Hoe verander ik de grootte van het scherm? (play.screen.resize)</summary>

Met **play.screen.resize()** kun je de grootte van het scherm aanpassen.

**Let op:** dit moet je doen **voordat** je vormen aanmaakt. Anders krijg je een foutmelding.

<PygbagRunner code={`import play

play.screen.resize(1024, 768)

play.new_circle(color='blue')
`} height={350} />

</details>

</CheatsheetGrid>

## Database (JSON)

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Hoe maak ik een database aan (new_database)?</summary>

Met **play.new_database()** maak je een nieuwe database aan. Deze database slaat gegevens op in een JSON-bestand, zodat je informatie kunt bewaren tussen verschillende keren dat je je programma draait.

```python
import play

database = play.new_database()
```

Als je een database aanmaakt, wordt automatisch een bestand aangemaakt waar je gegevens worden opgeslagen.
Dit bestand heet **database.json** en staat in dezelfde map als je Python bestand.

</details>

<details>
  <summary>Hoe sla ik gegevens op in de database (set_data)?</summary>

Met **set_data()** sla je gegevens op in de database. Je geeft twee dingen mee:
- Een **sleutel** (key): de naam waaronder je de gegevens opslaat
- Een **waarde** (value): de gegevens die je wilt opslaan

```python
import play

database = play.new_database()

# Sla de score op onder de naam 'punten'
database.set_data('punten', 100)

# Je kunt ook tekst opslaan
database.set_data('speler_naam', 'Jan')
```

De gegevens blijven bewaard, zelfs als je het programma afsluit en weer opnieuw start.

Je kunt ook geneste sleutels gebruiken met `:` als scheidingsteken:
```python
database.set_data('speler:naam', 'Jan')
database.set_data('speler:score', 100)
```

**Let op:** de bovenliggende sleutel (bijv. `'speler'`) moet al bestaan voordat je een geneste waarde kunt opslaan.

</details>

<details>
  <summary>Hoe haal ik gegevens op uit de database (get_data)?</summary>

Met **get_data()** haal je eerder opgeslagen gegevens op uit de database.
Je geeft de **sleutel** (naam) mee van de gegevens die je wilt ophalen.

```python
import play

database = play.new_database()

# Haal de opgeslagen score op
opgeslagen_score = database.get_data('punten')

play.new_text(words=f"Je score is: {opgeslagen_score}")
```

Als de sleutel niet bestaat, krijg je **None** terug. Je kunt ook een default waarde meegeven:

```python
opgeslagen_score = database.get_data('punten', 0)
```

Als `'punten'` niet bestaat, krijg je nu `0` terug in plaats van `None`.
</details>

</CheatsheetGrid>

## SNES-controller

<CheatsheetGrid data-cheatsheet-grid>

<details>
  <summary>Wat is een SNES-controller?</summary>

Een SNES-controller is een controller, die zo populair was dat deze zelfs [een eigen Wikipedia pagina](https://en.wikipedia.org/wiki/Super_Nintendo_Entertainment_System) heeft.
Als je via een zoekmachine zoekt op `SNES controller`, dan zul je zien dat deze op verschillende webshops nog te koop is.

</details>

<details>
  <summary>Hoe weet ik of mijn computer de SNES-controller herkent?</summary>
  
Je kunt onderstaande codefragment draaien om te kijken of je computer de controller herkent

```python
import play 

for controller in play.controllers.get_all_controllers():
    print(controller.get_instance_id(), controller.get_name())
```
In de console zie je vervolgens voor elke controller een `index` en een `naam`, bijvoorbeeld als er één SNES-controller verbonden is:

```
pygame-ce 2.5.5 (SDL 2.32.6, Python 3.12.10)
0 usb gamepad
```

De `0` geeft de **index** van de controller aan (welke controller het is) en `usb gamepad` geeft de naam van de controller aan. 
</details>

<details>
  <summary>Bij het indrukken van een knop op de controller (play.controllers.when_button_pressed)</summary>


Je gebruikt **play.controllers.when_button_pressed** om te checken of een knop op de controller ingedrukt wordt. Verder geef je twee argumenten mee:
- `index` dit is de index van de controller, vaak is dit 0 als je maar één controller gebruikt
- `button_id` het nummer dat bij een knop hoort

Bijvoorbeeld:
```python 
import play 

play.new_text('Welke kleur is knop 0?', y=200, font_size=40)
play.new_text('Probeer de knoppen uit', y=100, font_size=40)

@play.controllers.when_button_pressed(0, 0)
def controller_0_knop_0():
    play.new_text('Die knop dus')
```

Wanneer je dit codefragment draait, zou je de tekst `Die knop dus` moeten zien als je de knop indrukt die hoort bij knop 0.

</details>

<details>
  <summary>Bij het loslaten van een knop op de controller (play.controllers.when_button_released)</summary>

Je gebruikt **play.controllers.when_button_released** om te checken of een knop op de controller losgelaten wordt. Verder geef je twee argumenten mee:
- `index` dit is de index van de controller, vaak is dit 0 als je maar één controller gebruikt
- `button_id` het nummer dat bij een knop hoort

```python 
import play 

play.new_text('Welke kleur is knop 0?', y=200, font_size=40)
play.new_text('Probeer de knoppen uit', y=100, font_size=40)

@play.controllers.when_button_released(0, 0)
def controller_0_knop_0():
    play.new_text('Die knop dus')
```

Wanneer je dit codefragment draait, zou je de tekst `Die knop dus` moeten zien als je de knop loslaat die hoort bij knop 0.

</details>

<details>
  <summary>Bij het indrukken van een willekeurige knop op een controller (play.controllers.when_any_button_pressed)</summary>

Je gebruikt **play.controllers.when_any_button_pressed** wanneer je een actie uit wilt voeren bij welke knop dan ook. Dit is ook een fijne manier om te weten welk nummer bij welke knop hoort.
Je geeft alleen maar op welke controller je gebruikt (de `index`).

Bijvoorbeeld:

```python
import play 

play.new_text('Welk nummer hoort bij welke knop?', y=200, font_size=40)
play.new_text('Probeer de knoppen uit', y=100, font_size=40)

tekst = play.new_text("Nog geen knop ingedrukt")

@play.controllers.when_any_button_pressed(0)
def een_knop_ingedrukt(button):
    tekst.words = f'De ingedrukte knop is: {button}'
```

</details>

<details>
  <summary>Bij het loslaten van een willekeurige knop op een controller (play.controllers.when_any_button_released)</summary>

Je gebruikt **play.controllers.when_any_button_released** wanneer je een actie uit wilt voeren bij het loslaten van welke knop dan ook. Dit is ook een fijne manier om te weten welk nummer bij welke knop hoort.
Je geeft alleen maar op welke controller je gebruikt (de `index`).

Bijvoorbeeld:

```python
import play

play.new_text('Welk nummer hoort bij welke knop?', y=200, font_size=40)
play.new_text('Probeer de knoppen uit', y=100, font_size=40)

tekst = play.new_text("Nog geen knop losgetalen")

@play.controllers.when_any_button_released(0)
def een_knop_losgelaten(button):
    tekst.words = f'De losgelaten knop is: {button}'
```

</details>

<details>
  <summary>Zolang een knop ingedrukt is op de controller (play.controllers.while_button_pressed) ⭐ nieuw in 3.3.2</summary>

Je gebruikt **play.controllers.while_button_pressed** als je wilt dat een actie **elk frame** wordt uitgevoerd zolang een knop ingedrukt is. Ideaal voor vloeiende besturing!

```python
import play

cirkel = play.new_circle(color='blue', radius=20)

@play.controllers.while_button_pressed(0, 0)
def knop_ingehouden(button):
    cirkel.x = cirkel.x + 3
```

Het verschil met `when_button_pressed`: die vuurt één keer bij het indrukken. `while_button_pressed` vuurt elk frame zolang je de knop inhoudt.

</details>

<details>
  <summary>Zolang een willekeurige knop ingedrukt is op de controller (play.controllers.while_any_button_pressed) ⭐ nieuw in 3.3.2</summary>

Je gebruikt **play.controllers.while_any_button_pressed** als je wilt dat een actie elk frame wordt uitgevoerd zolang een willekeurige knop ingedrukt is.

```python
import play

tekst = play.new_text("Houd een knop ingedrukt")

@play.controllers.while_any_button_pressed(0)
def knop_ingehouden(button):
    tekst.words = f"Knop {button} wordt ingehouden!"
```

</details>

<details>
  <summary>Bij het indrukken van een pijltje op een controller (play.controllers.when_axis_moved)</summary>

Je gebruikt **play.controllers.when_axis_moved** om te detecteren of een pijltje is ingedrukt.

Je geeft twee argumenten mee: `index` en `richting`

`index` is het nummer dat bij de controller hoort (waarschijnlijk 0 als je er één gebruikt)

`richting`:
- 0: voor `horizontaal`, -1 is links en 1 is rechts
- 1 voor `verticaal`, -1 is boven en 1 is beneden

Bijvoorbeeld
```python
import play 

play.new_text('Druk een pijltje in?', y=200, font_size=40)

tekst = play.new_text("Nog geen pijltje ingedrukt")

@play.controllers.when_axis_moved(0, 0)
def links_rechts(axis, value):
    if value == 1:
        tekst.words = "rechts ingedrukt"
    if value == -1:
        tekst.words = "links ingedrukt"

@play.controllers.when_axis_moved(0, 1)
def boven_beneden(axis, value):
    if value == 1:
        tekst.words = "naar onder ingedrukt"
    if value == -1:
        tekst.words = "naar boven ingedrukt"

```

</details>

<details>
  <summary>Bij het bewegen van een willekeurig pijltje op een controller (play.controllers.when_any_axis_moved)</summary>

Je gebruikt **play.controllers.when_any_axis_moved** wanneer je wilt detecteren of een willekeurig pijltje wordt ingedrukt, zonder dat je vooraf hoeft op te geven welke richting.

```python
import play

tekst = play.new_text("Beweeg een pijltje")

@play.controllers.when_any_axis_moved(0)
def pijltje_bewogen(axis, value):
    tekst.words = f"As {axis} bewoog naar {value}"
```

De `axis` parameter geeft aan welke as bewoog (0 = horizontaal, 1 = verticaal) en `value` geeft de richting aan (-1, 0 of 1).

</details>

</CheatsheetGrid>
