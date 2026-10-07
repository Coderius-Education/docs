---
sidebar_position: 6
slug: /power_up
---

# Een power-up: tijdelijk hoger springen

Je karakter springt altijd even hoog. In deze les bouw je een power-up die je vijf seconden lang veel hoger laat springen, en daarna vanzelf uitwerkt. Daarvoor heb je iets nodig wat je nog niet kent: een manier om je code even te laten **wachten**.

<GodotVersie />

## Voorspel: kan dit?

Je sprongkracht staat bovenaan je karakter-script:

```gdscript
const JUMP_VELOCITY = -800.0
```

De power-up wil die waarde tijdelijk op `-1300.0` zetten.

**Wat gebeurt er als je ergens in je script `JUMP_VELOCITY = -1300.0` schrijft?**

<details>
<summary>Antwoord</summary>

Dat kan niet, en Godot laat je spel niet eens starten. `const` betekent *constante*: een waarde die vastligt zodra je script laadt. Dat is precies waarom je hem destijds als `const` schreef — de sprongkracht veranderde nooit.

Nu verandert hij wél. Dus hoort hij geen constante meer te zijn, maar een variabele.

</details>

## Stap 1: Van constante naar variabele \{#const-naar-var}

Open je karakter-script en vervang de constante door een variabele:

```gdscript
extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0
```

Twee dingen veranderen tegelijk, en allebei met reden:

- `const` wordt `var`, want de waarde gaat straks veranderen.
- De naam gaat van hoofdletters naar kleine letters. Hoofdletters zijn in GDScript het teken dat iets een constante is; een variabele die er zo uitziet leest als een belofte die je niet nakomt.

Zoek nu in `_physics_process` de regel waar je springt, en gebruik de nieuwe naam:

```gdscript
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = sprongkracht
```

Start je spel met `F5`. Er hoort niets veranderd te zijn: dezelfde sprong, dezelfde hoogte. Je hebt alleen de waarde verplaatst van een plek waar hij vastligt naar een plek waar hij mag bewegen.

Kom je verderop in de cursus nog een voorbeeld tegen met `JUMP_VELOCITY` erin, dan is dat de versie van vóór deze les. Jouw script heet vanaf nu `sprongkracht`.

## Stap 2: Een functie die de boost geeft

Het karakter weet zelf het beste hoe hard hij springt, dus daar komt de code. Zet deze functie onderaan je karakter-script, buiten `_physics_process`:

```gdscript
func geef_sprongboost() -> void:
    sprongkracht = -1300.0
    print("Boost!")
```

Dit is een gewone functie, zoals `is_game_over()` uit [Global variables](./global_variables.md). Hij doet nu nog maar één ding: de sprongkracht omhoog zetten.

## Stap 3: De power-up die hem aanroept

De power-up is een `Area2D` met een `Sprite2D` en een `CollisionShape2D`, precies zoals het muntje in [Signals & een muntje oppakken](./signals_muntje.md). Maak hem op dezelfde manier, koppel `body_entered`, en sla hem op als `power_up.tscn`.

In het script van de power-up:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    body.geef_sprongboost()
    queue_free()
```

Bij het muntje deed je `body.score += 1`: je las een variabele van het karakter. Hier roep je er een **functie** van aan. Dat is hetzelfde idee — `body` is je karakter, en met een punt erachter kom je bij wat erin zit.

Sleep `power_up.tscn` in je level en start het spel. Loop tegen de power-up aan en spring: je vliegt een stuk hoger, en dat blijft zo. Te lang, want je wilt dat het uitwerkt.

## Voorspel: hoe laat je iets vijf seconden duren?

Je functie zet de sprongkracht op `-1300.0`. Vijf seconden later moet hij weer op `-800.0` staan.

**Hoe zou je dat aanpakken met wat je nu kent?**

<details>
<summary>Antwoord</summary>

Je zou kunnen tellen in `_physics_process`. Iets als: een variabele `boost_tijd` die je op 5 zet, er elke frame `delta` van aftrekt, en zodra hij onder nul komt de sprongkracht terugzetten.

Dat werkt. Maar het is veel boekhouding voor "wacht even": een extra variabele, een `if` in een functie die zestig keer per seconde draait, en de code die bij elkaar hoort staat op twee plekken.

GDScript heeft er één woord voor. Dat is `await`.

</details>

## Stap 4: Wachten met `await` \{#await}

Breid je functie uit met twee regels:

```gdscript
func geef_sprongboost() -> void:
    sprongkracht = -1300.0
    print("Boost!")
    await get_tree().create_timer(5.0).timeout
    sprongkracht = -800.0
    print("Boost voorbij")
```

Start je spel, pak de power-up en spring. Vijf seconden lang spring je hoog, daarna weer normaal, en in **Uitvoer** zie je de twee berichten na elkaar verschijnen.

|                 Code                  | Wat doet het?                                                |
| :-----------------------------------: | :----------------------------------------------------------- |
| `get_tree().create_timer(5.0)`        | Maakt ter plekke een stopwatch van vijf seconden             |
| `.timeout`                            | Het signal dat die stopwatch stuurt als de tijd om is        |
| `await`                               | Zet deze functie op pauze tot dat signal komt                |

Merk op wat je hier afwacht: een **signal**, net als het `body_entered` van je muntje. Alleen komt dit signal niet van een node die je in je scène hebt gezet. Je vraagt Godot om één stopwatch, voor deze ene keer, en die gooit hij daarna zelf weg. In hoofdstuk 8 kom je `timeout` terug tegen, dan van een echte `Timer`-node.

## Wat `await` met je functie doet

`await` pauzeert **alleen de functie waar het in staat**. Je spel loopt gewoon door: je kunt rondlopen, springen en muntjes pakken terwijl `geef_sprongboost` staat te wachten.

Dat heeft een keerzijde die je moet kennen. Een functie met `await` erin geeft de besturing tussendoor terug, dus hij is niet klaar als hij terugkomt:

```gdscript
geef_sprongboost()
print("en nu?")
```

`"en nu?"` verschijnt **meteen**, niet vijf seconden later. Wil je daar wél op wachten, dan zet je er zelf ook `await` voor: `await geef_sprongboost()`.

Daarom hoort `await` ook nooit in `_physics_process`: die functie draait zestig keer per seconde, en dan staan er binnen een paar tellen honderden wachtende kopieën klaar.

## Opdracht 7.6.a: een power-up die je sneller maakt

Maak een tweede power-up die je drie seconden lang sneller laat lopen in plaats van hoger springen.

1. Je loopsnelheid staat nog als `const SPEED = 300.0`. Die moet dezelfde behandeling krijgen als de sprongkracht.
2. Schrijf in je karakter een functie `geef_snelheidsboost()` die de snelheid verdubbelt, drie seconden wacht en hem dan terugzet.
3. Maak een power-up-scène die die functie aanroept.

<details>
<summary>Klik hier voor een tip.</summary>

- Stap 1 is precies wat je in Stap 1 van deze les deed: `const SPEED` wordt `var snelheid`, en overal waar `SPEED` stond komt `snelheid` te staan. Vergeet de regel in `_physics_process` niet waar je `move_toward` gebruikt.
- De functie lijkt op `geef_sprongboost`, met andere waardes: `600.0` in plaats van `300.0`, en `3.0` in de timer.
- Het script van de power-up verschilt maar in één woord van dat van de eerste.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

**In je karakter-script:**

```gdscript
extends CharacterBody2D

var snelheid = 300.0
var sprongkracht = -800.0


func geef_snelheidsboost() -> void:
    snelheid = 600.0
    print("Snel!")
    await get_tree().create_timer(3.0).timeout
    snelheid = 300.0
    print("Snelheid voorbij")
```

Overal waar `SPEED` stond, staat nu `snelheid`:

```gdscript
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * snelheid
    else:
        velocity.x = move_toward(velocity.x, 0, snelheid)
```

**In het script van de tweede power-up:**

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    body.geef_snelheidsboost()
    queue_free()
```

</details>

:::tip
Je hebt nu een stopwatch gebruikt die één keer afloopt. Moet er telkens opnieuw iets gebeuren — elke twee seconden een nieuwe vijand, bijvoorbeeld — dan is een `Timer`-node handiger. Die bouw je in [Automatisch spawnen met een Timer](../08-meer-levels-en-menu/spawn_timer.md).
:::

## Er gaat iets mis

<details>
<summary>Mijn boost stopt te vroeg als ik twee power-ups snel achter elkaar pak</summary>

**Oorzaak:** elke power-up start zijn eigen stopwatch, maar ze zetten allebei dezelfde variabele terug. Pak je er één na twee seconden nog een, dan loopt de eerste stopwatch drie seconden later af en zet de sprongkracht terug — terwijl de tweede boost nog vier seconden te gaan had.

**Oplossing:** houd bij hoeveel boosts er lopen, en zet pas terug als de laatste afloopt:

```gdscript
var boosts = 0

func geef_sprongboost() -> void:
    boosts += 1
    sprongkracht = -1300.0
    await get_tree().create_timer(5.0).timeout
    boosts -= 1
    if boosts == 0:
        sprongkracht = -800.0
```

**Zelf vinden:** print `boosts` en `sprongkracht` op de regel vlak na `await`. Zie je `sprongkracht` teruggezet worden terwijl je net een tweede power-up pakte, dan is dit het.

</details>

<details>
<summary>Mijn spel start niet meer en de regel met de sprongkracht is rood</summary>

**Oorzaak:** de sprongkracht staat nog als `const`, en daar kun je geen nieuwe waarde aan geven. Godot ziet dat al voordat je spel draait.

**Oplossing:** maak er een `var` van, zoals in Stap 1. Let op dat je hem overal hernoemt: bovenaan, in `_physics_process` en in je boost-functie.

</details>

<details>
<summary>De power-up doet niets, en ik krijg een fout over een functie die niet bestaat</summary>

**Oorzaak:** `body.geef_sprongboost()` roept een functie aan op de node die de power-up raakte. Raakt er iets anders dan je karakter de power-up — een muntje, een vijand, de vloer — dan heeft díé node de functie niet.

**Oplossing:** kijk eerst of de node de functie heeft:

```gdscript
func _on_body_entered(body: Node2D) -> void:
    if body.has_method("geef_sprongboost"):
        body.geef_sprongboost()
        queue_free()
```

**Zelf vinden:** zet `print(body.name)` als eerste regel in `_on_body_entered`. Je ziet dan welke node de power-up raakte, en of dat je karakter is.

</details>

Staat je fout er niet bij? In [Fouten zoeken](../05-bewegingsscript/fouten-zoeken.md) staat hoe je hem zelf opspoort.
