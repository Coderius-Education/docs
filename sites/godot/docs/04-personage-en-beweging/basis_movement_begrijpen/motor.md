---
sidebar_position: 2
slug: /movement-motor
---

# Het bewegingsscript bouwen — Deel 2: Vallen

Je functie draait, maar je karakter staat stil. In deze les geef je hem snelheid, zodat hij naar beneden valt zodra hij geen grond onder zich heeft.

<GodotVersie />

<GDQuestLes slug="movement-motor" />

## Wat je nu gaat toevoegen

Twee regels die zwaartekracht op je karakter loslaten. Na deze les valt hij van een platform af en blijft hij op de vloer liggen.

## Voorspel: wat heeft Godot nodig om iets te laten vallen?

Je karakter moet naar beneden bewegen, steeds sneller, maar alleen als hij niet op de grond staat. **Welke twee dingen moet je script daarvoor per frame doen?**

<details>
<summary>Antwoord</summary>

1. **Kijken of hij op de grond staat.** Staat hij op de vloer, dan hoeft er niets te gebeuren.
2. **Zijn snelheid verhogen** in de richting van de zwaartekracht — en wel een beetje per frame, zodat hij steeds sneller valt.

Die snelheid heet in Godot `velocity`, en die bestaat al: elke `CharacterBody2D` heeft hem.

</details>

## Stap 1: Snelheid opbouwen \{#velocity}

Zet deze twee regels **boven** `move_and_slide()`, binnen de functie:

```gdscript
func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    move_and_slide()
```

Let op het inspringen: de regel met `velocity` staat twee niveaus in, want hij hoort bij de `if`.

## Stap 2: Wat `velocity` is

`velocity` is de snelheid van je karakter: een `Vector2`, dus een X en een Y in één waarde. Je hebt hem niet zelf aangemaakt — hij hoort bij `CharacterBody2D`, en door `extends` is hij van jou.

Zet tijdelijk `print(velocity)` boven `move_and_slide()` en kijk in **Uitvoer** terwijl je speelt:

- Stilstaan: `(0, 0)` — geen beweging.
- Vallen: `(0, 200)`, dan `(0, 400)`, dan `(0, 600)` — steeds sneller naar beneden.

Je kunt `.x` en `.y` los aanspreken, bijvoorbeeld `velocity.y = 0`. Dat gebruik je in Deel 3 en 4.

## Stap 3: Waarom `+=` en niet `=`

`velocity += iets` is de korte schrijfwijze van `velocity = velocity + iets`. De zwaartekracht wordt dus **opgeteld bij de snelheid die er al was**, frame na frame. Zo bouwt valsnelheid zich op: na één seconde val je hard, na twee seconden harder.

**Wat zou er gebeuren als je `+=` vervangt door `=`?**

<details>
<summary>Antwoord</summary>

Je karakter valt met een constante, hele lage snelheid in plaats van versneld. Elke frame zet je `velocity` dan terug op `get_gravity() * delta` — een klein getal — in plaats van het op te bouwen. Het voelt als zweven, niet als vallen.

</details>

## Stap 4: Wat `delta` doet

`get_gravity()` geeft de zwaartekracht terug die in je project is ingesteld, standaard ongeveer `(0, 980)`: 980 pixels per seconde naar beneden.

Dat getal is per **seconde**, maar je functie draait zestig keer per seconde. Daarom vermenigvuldig je met `delta`, de tijd sinds de vorige frame (ongeveer `0.0167`). Zo telt elke frame precies zijn eigen stukje van die seconde mee.

**Wat gebeurt er als je `* delta` weglaat?**

<details>
<summary>Antwoord</summary>

Je karakter valt belachelijk snel. Zonder `delta` tel je elke frame `980` op bij `velocity.y`, zestig keer per seconde. Na één seconde sta je op `58800` in plaats van `980`.

Dit is precies waarom `delta` bestaat: het maakt je spel even snel op een trage en een snelle computer.

</details>

## Stap 5: Waarom de `if not is_on_floor()`

`is_on_floor()` geeft `true` als je karakter de vloer raakt, en `false` als hij in de lucht hangt. Met `not` draai je dat om: "als hij *niet* op de grond staat".

**Wat denk je dat er gebeurt als je die check weghaalt en altijd zwaartekracht toepast?**

<details>
<summary>Antwoord</summary>

Je `velocity.y` blijft eeuwig groeien terwijl je stilstaat op de vloer. De collision houdt je fysiek tegen, dus je ziet het niet — maar je verticale snelheid loopt onzichtbaar op tot enorme waarden. Spring je dan, dan moet die eerst helemaal worden weggewerkt en voelt de sprong raar.

</details>

Test het zelf: zet `print(is_on_floor())` boven de `if` en kijk in **Uitvoer**. Je ziet `true` zolang je staat, en `false` tijdens een val.

![Uitvoer-paneel met true/false-output van is_on_floor()](../../images/is_on_floor.png)

## Stap 6: Waarom `move_and_slide()` onderaan blijft

Nu er een regel bóven `move_and_slide()` staat, wordt de volgorde belangrijk. Eerst reken je uit wat de snelheid moet zijn, daarna pas laat je Godot verplaatsen.

**Wat gebeurt er als je `move_and_slide()` juist bovenaan zet?**

<details>
<summary>Antwoord</summary>

Godot verplaatst je karakter dan met de snelheid van de **vorige** frame, want jouw aanpassing komt er pas achteraan. Alles loopt één frame achter. Dat voelt als traagheid die je nergens kunt terugvinden in je code.

Houd dus de volgorde: eerst snelheid aanpassen, dan als laatste `move_and_slide()`.

</details>

## Stap 7: Test het

Start met `F5` en zet je karakter in de editor boven de grond, of loop van een platform af.

Hij valt, komt op de vloer terecht en blijft daar liggen. Nog geen besturing — die komt in Deel 3.

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```gdscript
extends CharacterBody2D

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    move_and_slide()
```

</details>

## Er gaat iets mis

<details>
<summary>Mijn karakter valt door de vloer heen</summary>

**Oorzaak:** De vloer heeft geen collision, of je karakter heeft geen `CollisionShape2D`.

**Oplossing:**

1. Controleer of je tegels een Physics Layer hebben ([Collision op je tegels](../../03-level-bouwen/tilemap_collision.md)).
2. Controleer of je `CharacterBody2D` een `CollisionShape2D` als child heeft, mét een **Shape** ingesteld.

</details>

<details>
<summary>Mijn karakter valt niet, hij blijft zweven</summary>

**Oorzaak:** De regel met `velocity` staat op het verkeerde inspringniveau, of `move_and_slide()` ontbreekt.

**Oplossing:** De regel `velocity += get_gravity() * delta` hoort twee niveaus in te springen (binnen de `if`, binnen de functie). En `move_and_slide()` blijft als laatste regel binnen de functie staan.

</details>

<details>
<summary>Foutmelding: <code>Identifier "velocity" not declared in the current scope</code></summary>

**Oorzaak:** De eerste regel van je script klopt niet. `velocity` bestaat alleen als je script van een `CharacterBody2D` erft.

**Oplossing:** Controleer dat er bovenaan `extends CharacterBody2D` staat.

</details>

---

← [Deel 1 — Een script dat draait](./skelet.md) · **Volgende:** [Deel 3 — Lopen](./krachten.md) →
