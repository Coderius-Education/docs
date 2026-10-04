---
sidebar_position: 4
slug: /movement-grond
sidebar_label: "Deel 4: Je eerste if"
---

# Het bewegingsscript bouwen — Deel 4: Je eerste if

Je karakter valt, ook als hij allang op de vloer ligt. Dat zie je niet, maar het gaat straks wel wringen. In deze les schrijf je je eerste voorwaarde.

<GodotVersie />

<GDQuestLes slug="movement-grond" />

<Voorkennis
  items={[
    {site: 'python', to: '/docs/beslissen/05b-if-else', label: 'If en else'},
  ]}
/>

## Wat je nu gaat toevoegen

Twee begrippen: **`if`** om iets alleen soms te doen, en **`not`** om een voorwaarde om te draaien.

## Voorspel: wat gebeurt er met de snelheid op de vloer?

Je regel telt elke frame zwaartekracht op bij `velocity`, ook terwijl je karakter stilligt op de grond. De vloer houdt hem tegen, dus je ziet niets bewegen.

**Wat denk je dat er dan in `velocity.y` staat terwijl hij stilligt?**

<details>
<summary>Antwoord</summary>

Niet nul, maar ook niet een enorm getal: ongeveer `16`.

Dat is precies één frame zwaartekracht. Jouw regel telt er elke frame `16` bij op, en `move_and_slide()` haalt het er elke frame weer af zodra je de vloer raakt. Het loopt dus niet op — maar je snelheid staat wel voortdurend een tikje verkeerd, terwijl je stilstaat.

</details>

## Stap 1: Alleen vallen als je in de lucht bent \{#if-elif}

Zet je valregel binnen een `if`:

```gdscript
func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    move_and_slide()
```

Let op het inspringen: de valregel staat nu **twee** niveaus in. Eén niveau omdat hij bij de functie hoort, en nog één omdat hij bij de `if` hoort. Aan dat inspringen ziet GDScript wat er wel en niet bij de voorwaarde hoort.

En let op de dubbele punt aan het eind van de `if`-regel. Die hoort er altijd.

## Stap 2: Wat `is_on_floor()` teruggeeft

`is_on_floor()` geeft `true` als je karakter de vloer raakt en `false` als hij in de lucht hangt. Zulke ja-of-nee-waarden heten **booleans**.

Test het: zet deze regel boven je `if` en start met `F5`.

```gdscript
    print(is_on_floor())
```

In **Uitvoer** zie je `true` zolang je op de vloer staat, en `false` tijdens een val.

![Uitvoer-paneel met true/false-output van is_on_floor()](../images/is_on_floor.png)

Haal de `print` daarna weer weg.

## Stap 3: Wat `not` doet

`is_on_floor()` zegt "ik sta op de grond". Jij wilt juist het omgekeerde: alleen vallen als je er **niet** op staat. Met `not` draai je een boolean om:

| Situatie | `is_on_floor()` | `not is_on_floor()` |
| :--- | :---: | :---: |
| Op de vloer | `true` | `false` |
| In de lucht | `false` | `true` |

De code binnen de `if` draait alleen als wat erachter staat `true` is. Dus: alleen in de lucht.

## Stap 4: Test het

Start met `F5`. Aan de buitenkant is er niets veranderd: je karakter valt nog steeds en blijft op de vloer liggen.

Het verschil zit in de getallen. Zet tijdelijk `print(velocity)` boven `move_and_slide()`:

- **Zonder** de `if` staat er op de vloer `(0, 16.33)`, elke frame opnieuw.
- **Met** de `if` staat er `(0, 0)`.

Nu zegt je code wat je bedoelt: trek hem alleen naar beneden als hij in de lucht hangt. Dit is ook precies wat Godot zelf doet in het sjabloon dat je in de eerste les hebt weggegooid.

Deze les repareerde dus iets wat je niet kón zien zonder `print` — en dat is bij programmeren vaker het geval dan je zou denken.

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
<summary>Foutmelding: <code>Expected indented block after "if"</code></summary>

**Oorzaak:** De regel onder de `if` springt niet verder in dan de `if` zelf.

**Oplossing:** Zet de cursor voor `velocity` en druk één keer op `Tab`, zodat die regel dieper staat dan de `if`-regel erboven.

</details>

<details>
<summary>Mijn karakter valt helemaal niet meer</summary>

**Oorzaak:** De `not` is weggevallen, dus er staat `if is_on_floor():` — vallen gebeurt dan alleen nog op de grond.

**Oplossing:** De regel hoort te zijn: `if not is_on_floor():`.

**Zelf vinden:** zet `print(is_on_floor())` boven je `if`. Zie je `true` terwijl je in de lucht hangt, dan lees je de vloer verkeerd uit; zie je `false` op de grond, dan klopt je collision niet.

</details>

<details>
<summary>Foutmelding over een ontbrekende dubbele punt</summary>

**Oorzaak:** De `:` aan het eind van de `if`-regel ontbreekt.

**Oplossing:** Elke regel die een blok opent eindigt op een dubbele punt, net als in Python.

</details>

---

← [Deel 3 — Delta](./delta.md) · **Volgende:** [Deel 5 — Lopen](./krachten.md) →
