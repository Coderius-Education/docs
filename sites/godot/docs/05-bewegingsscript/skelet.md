---
sidebar_position: 1
slug: /basis_movement_begrijpen
sidebar_label: "Deel 1: Een script dat draait"
---

# Het bewegingsscript bouwen — Deel 1: Een script dat draait

Je script bestaat uit één regel: `extends CharacterBody2D`. In deze les voeg je de functie toe waar de rest van je spel in komt te staan — het kloppend hart dat Godot zestig keer per seconde aanroept.

<GodotVersie />

<GDQuestLes slug="basis_movement_begrijpen" />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/functies/functies', label: 'Functies'},
    {site: 'python', to: '/docs/functies/09a-parameters', label: 'Parameters'},
  ]}
/>

## Een oefenspoor ernaast \{#gdquest}

Programmeren leer je door het te doen, maar in je eigen game oefenen is lastig: als er iets niet werkt, weet je niet of het aan je code ligt of aan je scène.

Daarom loopt er vanaf hier een tweede spoor mee. **Hier** bouw je je game: elke les voegt regels toe aan een script dat je zelf typt, en aan het eind draait je spel weer. **Bij GDQuest** oefen je elk concept los, in je browser, zonder Godot erbij — gaat het daar mis, dan ligt het aan de code, meer kan het niet zijn.

Ga naar [Learn GDScript From Zero](https://gdquest.github.io/learn-gdscript/). Je werkt direct in je browser en hoeft niets te installeren.

![GDQuest learn-gdscript lessenoverzicht met de relevante lessen gemarkeerd](../images/gdscript.png)

Begin met les 1 en 2. Die kosten samen een kwartier en leggen uit wat code is en hoe je een foutmelding leest. Les 3 gaat over `extends` — de regel die al in je script staat.

Het GDQuest-blok bovenaan deze pagina verschijnt in elke les van dit hoofdstuk, telkens bij de regel die je net hebt geschreven. Je hoeft de GDQuest-cursus niet uitgespeeld te hebben; je loopt hem ernaast door, in je eigen tempo.

<details>
<summary>Welke GDQuest-les hoort bij welke les hier?</summary>

<GDQuestTabel />

Alles hieruit staat kort bij elkaar in de [GDScript-tips](/gdscript-tips), de naslag bij alle lessen.

</details>

## Wat je nu gaat toevoegen

Een functie die vanzelf draait, met daarin één opdracht aan Godot: verplaats mijn karakter. Na deze les beweegt er nog niets — maar het skelet staat, en alles wat je hierna schrijft komt op deze plek.

## Voorspel: hoe vaak draait een functie in een spel?

In Python roep je een functie zelf aan: je schrijft ergens `groet()` en dan gebeurt het. **Hoe zou dat werken in een spel, waar dingen continu doorgaan zonder dat iemand iets aanroept?**

<details>
<summary>Antwoord</summary>

Godot roept bepaalde functies **zelf** aan, telkens opnieuw, zolang je spel draait. Zo'n functie heet een game loop. Je schrijft hem één keer op, en Godot voert hem ongeveer zestig keer per seconde uit.

Dat is de reden dat een spel beweegt: zestig keer per seconde rekent Godot een nieuwe positie uit en tekent het beeld opnieuw.

</details>

## Stap 1: De functie die vanzelf draait \{#physics-process}

Typ dit onder `extends CharacterBody2D`, met één lege regel ertussen:

```gdscript
func _physics_process(delta: float) -> void:
    move_and_slide()
```

Let op het inspringen: `move_and_slide()` staat één tab naar rechts. Daaraan ziet GDScript dat die regel **binnen** de functie hoort. Alles wat je in de volgende lessen toevoegt komt op datzelfde niveau te staan.

## Stap 2: Wat hier staat, woord voor woord

**`func`** begint een functie, net als `def` in Python.

**`_physics_process`** is geen naam die jij verzint. Godot kent deze naam en roept hem automatisch aan, ongeveer zestig keer per seconde. De underscore vooraan is het teken dat het een functie van Godot zelf is.

**`(delta: float)`** is een parameter: informatie die Godot bij elke aanroep meegeeft. `delta` is de tijd in seconden sinds de vorige keer. In Deel 3 ga je hem gebruiken.

**`-> void`** zegt: deze functie geeft niets terug. Ze *doet* iets, in plaats van iets te berekenen dat je later gebruikt. In Python is dat een functie zonder `return`.

**`move_and_slide()`** is de opdracht "verplaats mij nu". Godot kijkt naar de snelheid van je karakter, houdt rekening met muren en vloeren, en zet hem op zijn nieuwe plek. Die snelheid is nu nog nul, dus er beweegt niets.

:::tip
Zet Godot een gele waarschuwing bij `delta` dat de parameter niet gebruikt wordt? Dat klopt, en het mag. Vanaf Deel 2 gebruik je hem wel en verdwijnt de waarschuwing.
:::

## Stap 3: Test het

Start met `F5`.

Je karakter staat nog steeds stil, en er is geen foutmelding. Dat is precies goed: de functie draait, hij doet alleen nog niets zinnigs.

Wil je zien dát hij draait? Zet er tijdelijk een `print()` in:

```gdscript
func _physics_process(delta: float) -> void:
    print("ik draai")
    move_and_slide()
```

In het paneel **Uitvoer** onderin verschijnt nu een eindeloze stroom regels. Haal die `print` daarna weer weg — zestig regels per seconde maakt Uitvoer onbruikbaar.

## Voorspel: wat als je `_physics_process` vervangt door `_ready`?

<details>
<summary>Antwoord</summary>

`_ready` draait maar één keer, bij de start van de scène. Met de `print` erin zie je dan één regel in plaats van een stroom. Beweging zou één frame duren en daarna stoppen.

Beide functies bestaan naast elkaar: `_ready` voor wat één keer moet gebeuren, `_physics_process` voor wat continu moet gebeuren.

</details>

## `_process` of `_physics_process`?

Godot heeft twee functies die elke frame draaien. Welke je kiest hangt af van of er physics bij komt kijken:

| Functie                   | Wanneer gebruik je het?                                              |
| :------------------------ | :------------------------------------------------------------------- |
| `_process(delta)`         | UI bijwerken, tellers, animatie-logica zonder botsingen              |
| `_physics_process(delta)` | Beweging, zwaartekracht, botsingen — alles waar physics bij hoort     |

Wij bouwen beweging met botsingen, dus `_physics_process`. Deze tabel staat ook in de [GDScript-tips](/gdscript-tips#functies).

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```gdscript
extends CharacterBody2D

func _physics_process(delta: float) -> void:
    move_and_slide()
```

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding over inspringen (Indentation / Expected indented block)</summary>

**Oorzaak:** De regel `move_and_slide()` springt niet in, of je hebt tabs en spaties door elkaar gebruikt.

**Oplossing:**

1. Zet de cursor aan het begin van `move_and_slide()` en verwijder alle witruimte ervoor.
2. Druk één keer op `Tab`.
3. Gebruik in het hele bestand hetzelfde: alleen tabs, of alleen spaties.

</details>

<details>
<summary>Foutmelding: <code>move_and_slide called without physics frame</code></summary>

**Oorzaak:** `move_and_slide()` staat buiten `_physics_process`, bijvoorbeeld helemaal links tegen de kantlijn.

**Oplossing:** Zorg dat de regel ingesprongen staat onder `func _physics_process(delta: float) -> void:`.

</details>

<details>
<summary>Ik krijg een foutmelding over een dubbele punt</summary>

**Oorzaak:** De `:` aan het eind van de `func`-regel ontbreekt.

**Oplossing:** Elke functie-regel eindigt op een dubbele punt: `func _physics_process(delta: float) -> void:`. Net als in Python.

</details>

---

**Volgende:** [Deel 2 — Vallen](./motor.md) →
