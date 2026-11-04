---
sidebar_position: 5
slug: /tweens
---

# Tweens: een muntje dat wegzweeft

Pak je nu een muntje, dan is het in één frame weg. Dat werkt, maar het voelt kaal. In veel spellen springt een muntje eerst even omhoog en vervaagt het dan. Dat hoef je niet frame voor frame in `_process` uit te rekenen: een **tween** schuift een eigenschap in een aantal seconden van de ene waarde naar de andere.

<GodotVersie />

## Voorspel: wat zie je?

Dit is het muntje-script met twee nieuwe regels erin:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.score += 1
    var tween = create_tween()
    tween.tween_property(self, "position:y", position.y - 40, 0.5)
```

**Wat gebeurt er met het muntje als je het pakt?**

<details>
<summary>Antwoord</summary>

Het muntje schuift in een halve seconde veertig pixels omhoog, en blijft daar hangen. Er staat geen `queue_free()` meer, dus het gaat niet weg.

En er is nog iets: het muntje bestaat nog. Loop je eronder door en spring je er opnieuw tegenaan, dan krijg je nog een punt. Dat los je verderop op.

</details>

## Een tween \{#tween}

|                    Code                     | Wat doet het?                                         |
| :-----------------------------------------: | :---------------------------------------------------- |
| `create_tween()`                            | Maakt een tween die bij deze node hoort               |
| `tween_property(self, "position:y", ..., 0.5)` | Schuift `position.y` van dit muntje in 0,5 seconde naar de nieuwe waarde |

`tween_property` krijgt vier dingen mee: welke node (`self` is het muntje zelf), welke eigenschap, naar welke waarde, en in hoeveel seconden. De tween rekent elke frame de tussenstand uit en zet die voor je.

Een eigenschap van een eigenschap schrijf je in de tekst met een dubbele punt: `"position:y"` is de `y` van `position`. In gewone code schrijf je `position.y`, maar hier is het een tekst, en daarin gebruikt Godot de dubbele punt.

## Stap 1: Omhoog en vervagen

Een tween kan meer dingen achter elkaar doen. Elke `tween_property` begint pas als de vorige klaar is. Zet er een tweede bij die de doorzichtigheid naar `0` brengt:

```gdscript
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    Global.score += 1
    var tween = create_tween()
    tween.tween_property(self, "position:y", position.y - 40, 0.3)
    tween.tween_property(self, "modulate:a", 0.0, 0.2)
```

`modulate:a` is de `a` van de kleur `modulate`: hoe doorzichtig de node is. Bij `1.0` zie je hem helemaal, bij `0.0` niet meer.

Start je spel en pak een muntje. Het springt omhoog en vervaagt.

## Stap 2: Daarna pas weg

Het muntje is onzichtbaar, maar staat nog in je level. Je wilt `queue_free()` aanroepen als de tween klaar is, niet ervoor. Daar is `tween_callback` voor: die roept een functie aan op dat moment in de rij.

```gdscript
    tween.tween_callback(queue_free)
```

Let op: `queue_free` staat hier zonder haakjes. Je geeft de functie zelf mee, zodat de tween hem straks kan aanroepen. Met haakjes erachter zou je hem op deze regel al aanroepen, en dat weigert Godot (zie [Er gaat iets mis](#er-gaat-iets-mis)).

## Stap 3: Eén keer tellen

Er is nog een probleem uit de voorspelling: tijdens de halve seconde van de tween kan je karakter het muntje nog een keer raken. Met een variabele houd je bij of het al gepakt is:

```gdscript
extends Area2D

var gepakt = false

func _on_body_entered(body: Node2D) -> void:
    if gepakt:
        return
    gepakt = true
    Global.score += 1
    var tween = create_tween()
    tween.tween_property(self, "position:y", position.y - 40, 0.3)
    tween.tween_property(self, "modulate:a", 0.0, 0.2)
    tween.tween_callback(queue_free)
```

De eerste keer is `gepakt` nog `false`, dus het muntje telt. Daarna staat hij op `true`, en stopt de functie meteen bij `return`.

## Opdracht 10.5.a: een power-up die pulseert

Laat je power-up uit [Een power-up](site:godot/docs/power_up) de hele tijd een beetje groter en kleiner worden, zodat de speler ziet dat hij bijzonder is.

<details>
<summary>Klik hier voor een tip.</summary>

- De tween begint als de power-up in het level verschijnt. Welke functie roept Godot dan aan?
- Schuif `scale` in een halve seconde naar `Vector2(1.2, 1.2)`, en daarna in een halve seconde terug naar `Vector2(1, 1)`.
- Met `create_tween().set_loops()` begint de tween na de laatste stap opnieuw, en dat blijft hij doen.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```gdscript
extends Area2D

func _ready() -> void:
    var tween = create_tween().set_loops()
    tween.tween_property(self, "scale", Vector2(1.2, 1.2), 0.5)
    tween.tween_property(self, "scale", Vector2(1, 1), 0.5)


func _on_body_entered(body: Node2D) -> void:
    body.geef_sprongboost()
    queue_free()
```

Je hoeft de tween niet zelf te stoppen. Hij hoort bij de power-up, en als die met `queue_free()` verdwijnt, stopt de tween mee.

</details>

## Opdracht 10.5.b: zelf een effect bedenken

Kies een moment in je spel dat nu in één frame gebeurt, en maak er met een tween een kleine animatie van. Bijvoorbeeld: een vijand die rood knippert als je hem raakt, de vlag die omhoog schuift als je een level haalt, of de titel van je menu die bij de start van boven het scherm in schuift.

<details>
<summary>Klik hier voor een tip.</summary>

- Bedenk eerst welke eigenschap verandert: `position`, `scale`, `rotation` of `modulate`.
- Wil je twee dingen tegelijk laten gebeuren in plaats van na elkaar, zet dan `.parallel()` voor de tweede: `tween.parallel().tween_property(...)`.
- Een tween voelt levendiger met een andere vorm van versnellen. Zet `.set_trans(Tween.TRANS_BOUNCE)` achter een `tween_property` en kijk wat er gebeurt.

</details>

<details>
<summary>Klik hier voor een voorbeeld.</summary>

Een vijand die rood knippert. Deze functie zet je in het script van de vijand, en je roept hem aan op het moment dat hij geraakt wordt:

```gdscript
extends Area2D

func knipper() -> void:
    var tween = create_tween()
    tween.tween_property(self, "modulate", Color.RED, 0.1)
    tween.tween_property(self, "modulate", Color.WHITE, 0.1)
    tween.tween_property(self, "modulate", Color.RED, 0.1)
    tween.tween_property(self, "modulate", Color.WHITE, 0.1)
```

Er is geen goed of fout antwoord: elk effect dat je met een tween maakt en dat in je spel klopt, telt.

</details>

## Er gaat iets mis

<details>
<summary>The tweened property "modulate.a" does not exist in object "Muntje:...".</summary>

```
The tweened property "modulate.a" does not exist in object "Muntje:<Area2D#...>".
```

**Oorzaak:** in de tekst van een tween schrijf je een eigenschap van een eigenschap met een dubbele punt, niet met een punt. Godot zoekt nu een eigenschap die letterlijk `modulate.a` heet.

**Oplossing:**

```gdscript
# FOUT
tween.tween_property(self, "modulate.a", 0.0, 0.2)

# GOED
tween.tween_property(self, "modulate:a", 0.0, 0.2)
```

</details>

<details>
<summary>Cannot get return value of call to "queue_free()" because it returns "void".</summary>

```
Cannot get return value of call to "queue_free()" because it returns "void".
```

**Oorzaak:** je schreef `tween_callback(queue_free())`, met haakjes. Dan roep je `queue_free()` op die regel al aan, en geef je wat hij teruggeeft aan de tween. Maar `queue_free()` geeft niets terug, en Godot weigert je script: je spel start niet.

{/* verwacht-fout: Cannot get return value of call to "queue_free()" because it returns "void". */}

```gdscript
# FOUT
extends Area2D

func _on_body_entered(body: Node2D) -> void:
    var tween = create_tween()
    tween.tween_property(self, "modulate:a", 0.0, 0.2)
    tween.tween_callback(queue_free())
```

**Oplossing:** laat de haakjes weg: `tween.tween_callback(queue_free)`. Zo geef je de functie zelf mee, en roept de tween hem aan als hij klaar is.

</details>

<details>
<summary>Het muntje is meteen weg, ik zie geen animatie</summary>

**Oorzaak:** er staat nog een `queue_free()` aan het eind van `_on_body_entered`. Het muntje verdwijnt dan in hetzelfde frame, en de tween met hem.

**Oplossing:** haal die losse `queue_free()` weg. De tween ruimt het muntje op met `tween_callback(queue_free)`.

**Zelf vinden:** zet `print("weg")` vlak voor elke `queue_free` in je script. Zie je `weg` op hetzelfde moment als je het muntje raakt, dan wordt hij te vroeg aangeroepen.

</details>

<details>
<summary>Mijn spel wordt steeds trager als ik een tween in _process zet</summary>

**Oorzaak:** `_process` draait elke frame, dus je maakt zestig nieuwe tweens per seconde. Ze lopen allemaal tegelijk en vechten om dezelfde eigenschap.

**Oplossing:** maak een tween één keer, op het moment dat er iets gebeurt: in `_ready()`, of in de functie van een signal. Dat is dezelfde regel als bij `await` in [Een power-up](site:godot/docs/power_up).

</details>

Staat je fout er niet bij? In [Fouten zoeken](site:godot/docs/fouten-zoeken) staat hoe je hem zelf opspoort.
