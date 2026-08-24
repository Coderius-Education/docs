---
sidebar_position: 3
slug: /eerste-programma/knipperen
title: "Deel 2: Knipperen met een loop"
---

# Het robotscript bouwen — Deel 2: Knipperen met een loop

<Voorkennis
  items={[
    {site: 'python', to: '/docs/herhalen/while-loop', label: 'De while-loop'},
  ]}
/>


Je lampje brandt, maar je programma is na vier regels klaar en stopt. Een robot stopt nooit: die blijft kijken, meten en reageren zolang hij aanstaat. Daarvoor bestaat de **loop** — en die schrijf je nu zelf.

## Wat je nu gaat toevoegen

Een `while True:`-loop en twee pauzes. Daarna knippert je lampje, eindeloos.

## Voorspel: wat doet een programma zonder eind?

In Python stopt een script als de laatste regel is uitgevoerd. **Wat zou er moeten gebeuren om een lampje te laten kníppéren in plaats van één keer aan te gaan?**

<details>
<summary>Antwoord</summary>

Aan, even wachten, uit, even wachten — en dat steeds opnieuw. Je hebt dus herhaling nodig (een loop) én tijd (een pauze). Zonder pauze wisselt het lampje zo snel dat je alleen een vaag schijnsel ziet.

</details>

## Stap 1: De loop erbij

Breid je script uit tot dit. Let op het **inspringen**: de vier regels onder `while True:` horen bij de loop en staan daarom een tab naar rechts.

```python
from machine import Pin
from time import sleep

lampje = Pin('LED', Pin.OUT)

while True:
    lampje.on()
    sleep(0.5)
    lampje.off()
    sleep(0.5)
```

**`while True:`** betekent: blijf dit herhalen, voor altijd. Alles wat ingesprongen onder die regel staat, wordt keer op keer uitgevoerd.

**`sleep(0.5)`** pauzeert een halve seconde. Daarvoor importeer je `sleep` uit de module `time` — vandaar de nieuwe regel bovenaan.

## Test het

Klik op **Run op board**. Het lampje gaat aan, een halve seconde later uit, weer aan — en dat blijft zo tot je op **Stop** klikt of de stekker eruit trekt. Eén volledige knipper duurt één seconde.

## Voorspel: wat als je de pauzes weghaalt?

<details>
<summary>Antwoord</summary>

De loop draait dan duizenden keren per seconde. Het lampje gaat nog steeds aan en uit, maar zo snel dat je ogen er één zwak brandend lampje van maken. De code is niet kapot — hij is alleen te snel om te zien. Onthoud dit: het verschil tussen "werkt niet" en "werkt te snel om te zien" kom je bij robots vaker tegen.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```python
from machine import Pin
from time import sleep

lampje = Pin('LED', Pin.OUT)

while True:
    lampje.on()
    sleep(0.5)
    lampje.off()
    sleep(0.5)
```

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>IndentationError: expected an indented block</code></summary>

**Oorzaak:** De regels onder `while True:` springen niet in.

**Oplossing:** Alles wat bij de loop hoort, krijgt één tab (of vier spaties) ervoor. Gebruik overal hetzelfde — tabs en spaties mengen geeft ook fouten.

</details>

<details>
<summary>Het lampje knippert niet, het brandt gewoon</summary>

**Oorzaak:** Eén van de twee `sleep`-regels ontbreekt, of `lampje.off()` staat buiten de loop.

**Oplossing:** Vergelijk je script letterlijk met "Je script tot nu toe" hierboven. **Zelf vinden:** zet `print("rondje")` in de loop. Zie je in de Shell wél regels voorbijkomen maar knippert er niets, dan draait de loop en zit de fout in de aan/uit-regels; zie je niets, dan draait de loop zelf niet.

</details>

<details>
<summary>Controlevraag</summary>

Waarom staat `lampje = Pin('LED', Pin.OUT)` **boven** de loop en niet erin?

</details>

<details>
<summary>Antwoord</summary>

De pin hoeft maar één keer klaargezet te worden. Alles wat éénmalig is (klaarzetten, instellen) staat boven de loop; alles wat steeds opnieuw moet gebeuren staat erin. Zo bouw je vanaf nu elk robotscript op.

</details>

---

← [Deel 1 — Een lampje aan](./deel1_lampje.md) · **Volgende:** [de lijnsensor](../analoog_ir/doel.md) →
