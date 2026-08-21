---
sidebar_position: 3
slug: /movement-krachten
---

# Het bewegingsscript bouwen — Deel 3: Lopen

Je karakter valt, maar je kunt hem nog niet besturen. In deze les leest je script de pijltjestoetsen uit en zet het die om in horizontale snelheid.

<GodotVersie />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/beslissen/05b-if-else', label: 'If en else'},
  ]}
/>

## Wat je nu gaat toevoegen

Een eigen constante voor de loopsnelheid, en vier regels die links en rechts afhandelen. Na deze les loopt je karakter, en staat hij stil als je loslaat.

## Voorspel: hoe vertaal je een toets naar snelheid?

Je wilt dat links indrukken `velocity.x` negatief maakt en rechts indrukken positief. **Hoeveel verschillende waarden moet je script daarvoor uit elkaar houden?**

<details>
<summary>Antwoord</summary>

Drie: links, rechts, en niets. Je zou dat met twee losse `if`-checks kunnen doen, maar Godot heeft er één functie voor die de drie gevallen in één getal stopt: `-1`, `0` of `1`. Dat getal kun je direct met je snelheid vermenigvuldigen.

</details>

## Stap 1: Een eigen constante \{#var-const}

Zet deze regel bovenaan je script, ónder `extends` en bóven de functie:

```gdscript
const SPEED = 300.0
```

Een **constante** is een waarde met een naam die nooit verandert terwijl je spel draait. Schrijf ze in hoofdletters — dat is de afspraak, zodat je in één oogopslag ziet dat er niet aan gesleuteld wordt.

<GDQuestLes nummer={8} />

**Wat verwacht je dat er gebeurt als je `SPEED` ergens in de functie probeert te veranderen, bijvoorbeeld `SPEED = 500.0`?**

<details>
<summary>Antwoord</summary>

Godot weigert het met een foutmelding. Een `const` staat vast. Waarden die tijdens het spelen wél veranderen — zoals een score of het aantal levens — zet je in een `var`.

</details>

## Stap 2: De toets uitlezen

Zet deze regels binnen de functie, ónder het zwaartekracht-blok en bóven `move_and_slide()`:

```gdscript
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)
```

## Stap 3: Wat `Input.get_axis()` teruggeeft

In plaats van twee losse checks doet `get_axis` het in één regel:

- niets ingedrukt → `direction` is `0`
- links ingedrukt → `direction` is `-1`
- rechts ingedrukt → `direction` is `1`

Probeer het: zet `print(direction)` eronder en kijk in **Uitvoer** terwijl je de pijltjes indrukt.

Dat getal vermenigvuldig je met je snelheid: `-1 * 300` is 300 naar links, `1 * 300` is 300 naar rechts. Eén regel, twee richtingen.

## Stap 4: `:=` in plaats van `=`

Bij `var direction :=` staat een dubbele punt vóór het isgelijkteken. Dat is **type-inferentie**: Godot kijkt zelf naar de waarde rechts en concludeert dat `direction` een `float` is. Je hoeft het type niet op te schrijven.

Dit is hetzelfde als:

```gdscript
var direction: float = Input.get_axis("ui_left", "ui_right")
```

Beide werken. De korte vorm is gebruikelijker.

## Stap 5: `if direction:` zonder vergelijking \{#if-elif}

Er staat geen `==` of `!=` in die `if`. Dat kan, omdat GDScript het getal `0` als "onwaar" behandelt en elk ander getal als "waar":

- `direction` is `0` → de `if` is onwaar → de `else` draait.
- `direction` is `-1` of `1` → de `if` is waar → je gaat lopen.

**Doet `if direction != 0:` precies hetzelfde?**

<details>
<summary>Antwoord</summary>

Ja. `if direction:` is een kortere schrijfwijze van `if direction != 0:`. Kies wat jij duidelijker vindt en houd het consequent.

</details>

## Stap 6: Afremmen met `move_toward()`

Drukt de speler niets in, dan moet je karakter stoppen. Dat gebeurt in de `else`.

`move_toward(huidige, doel, stap)` geeft een waarde terug die dichter bij het doel ligt, en hoogstens `stap` groot. Met `move_toward(velocity.x, 0, SPEED)` stap je dus met 300 tegelijk richting nul — en omdat je snelheid ook 300 was, sta je meteen stil.

**Wat gebeurt er als je de hele `else`-tak weghaalt?**

<details>
<summary>Antwoord</summary>

Je karakter blijft voor eeuwig doorrijden zodra je één keer een pijltje hebt ingedrukt. Zonder `else` zet niemand de snelheid ooit terug naar nul.

</details>

:::tip
Wil je een glij-effect, alsof je karakter over ijs loopt? Maak de stap kleiner dan `SPEED`, bijvoorbeeld `move_toward(velocity.x, 0, 50)`. Hij glijdt dan nog een stukje door na het loslaten.
:::

## Stap 7: Test het

Start met `F5`. Je karakter loopt naar links en rechts met de pijltjestoetsen, valt nog steeds van platforms af, en staat stil als je loslaat.

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```gdscript
extends CharacterBody2D

const SPEED = 300.0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)

    move_and_slide()
```

</details>

## Opdracht 4.4.a: kies je eigen loopsnelheid

Zoek de snelheid die bij jouw level past. Probeer minstens drie waarden voor `SPEED`, bijvoorbeeld `100.0`, `300.0` en `1000.0`, en start telkens opnieuw met `F5`.

<details>
<summary>Klik hier voor een tip.</summary>

Let niet alleen op hoe snel het voelt, maar ook of je nog nauwkeurig op een smal platform kunt landen. Te snel is net zo onspeelbaar als te traag.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

Er is geen goede waarde — er is een waarde die bij jouw level past. Twee vuistregels:

- Bij `100.0` voelt je karakter zwaar en duurt oversteken lang.
- Bij `1000.0` schiet je over smalle platforms heen en is precies landen bijna onmogelijk.

Ergens tussen `250.0` en `400.0` speelt een platformer meestal prettig. Noteer welke waarde je kiest; in Deel 4 stem je de sprongkracht daarop af.

</details>

## Er gaat iets mis

<details>
<summary>Mijn karakter beweegt niet als ik op de pijltjes druk</summary>

**Oorzaak:** De regels staan buiten de functie, of de actienamen kloppen niet.

**Oplossing:**

1. Controleer dat de vier regels ingesprongen staan binnen `_physics_process`.
2. Controleer de spelling: `"ui_left"` en `"ui_right"`, met een underscore en kleine letters.
3. Staat `move_and_slide()` nog steeds als laatste regel binnen de functie?

</details>

<details>
<summary>Mijn karakter beweegt maar stopt nooit meer</summary>

**Oorzaak:** De `else`-tak ontbreekt, of hij springt niet goed in.

**Oplossing:** Zorg dat `else:` op hetzelfde niveau staat als de `if` erboven, en dat de regel met `move_toward` daaronder één niveau verder inspringt.

</details>

<details>
<summary>Foutmelding: <code>Expected end of statement after expression</code></summary>

**Oorzaak:** Meestal een ontbrekende dubbele punt aan het eind van de `if`- of `else`-regel.

**Oplossing:** Zowel `if direction:` als `else:` eindigt op een dubbele punt.

</details>

---

← [Deel 2 — Vallen](./motor.md) · **Volgende:** [Deel 4 — Springen](./afsluiter.md) →
