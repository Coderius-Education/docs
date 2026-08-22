---
sidebar_position: 2
slug: /eerste-programma/lampje
title: "Deel 1: Een lampje aan"
---

# Het robotscript bouwen — Deel 1: Een lampje aan

Je script is nog leeg. In deze les schrijf je de eerste twee concepten die je straks overal gebruikt: iets **importeren** en een **methode aanroepen**. Meer heb je niet nodig om een lampje aan te zetten.

## Wat je nu gaat toevoegen

Vier regels. Daarna brandt het ingebouwde lampje van je bord — zonder dat je iets hoeft aan te sluiten.

## Stap 1: Typ dit in je editor

Op je Nano RP2040 Connect zit een ingebouwd lampje met de naam `LED`. Typ dit over (niet plakken — het typen zelf is het oefenen) en klik op **Run op board**:

```python
from machine import Pin

lampje = Pin('LED', Pin.OUT)
lampje.on()
```

## Stap 2: Wat hier staat, regel voor regel

**`from machine import Pin`** haalt het gereedschap `Pin` uit de module `machine`. Die module zit ingebouwd in MicroPython en regelt alles wat met de pinnen van je bord te maken heeft.

**`Pin('LED', Pin.OUT)`** maakt een pin-object aan: de pin met de naam `LED`, gebruikt als **uitgang** — het bord stuurt er stroom naartoe in plaats van iets te meten. Dat object bewaar je in de variabele `lampje`.

**`lampje.on()`** roept de methode `on()` aan op dat object. Nu loopt er stroom, en brandt het lampje.

## Test het

Het groene lampje op het bord brandt. Blijft branden, ook — er staat niets in je script dat het weer uitzet.

## Voorspel: hoe zet je het uit?

**Welke regel zou het lampje weer uitzetten?**

<details>
<summary>Antwoord</summary>

```python
lampje.off()
```

Dezelfde variabele, een andere methode. Zet je die regel direct onder `lampje.on()`, dan lijkt het lampje overigens nooit aan te gaan: de twee regels volgen elkaar zo snel op dat je ogen het aan-moment missen. Daar gaat Deel 2 over.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```python
from machine import Pin

lampje = Pin('LED', Pin.OUT)
lampje.on()
```

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>ImportError: no module named 'machine'</code></summary>

**Oorzaak:** Je code draait niet op het bord maar op je computer. De module `machine` bestaat alleen in MicroPython.

**Oplossing:** Controleer in [MicroPython op je bord](../software_editor/repl.md) dat je interpreter op **MicroPython (RP2040)** staat en dat je bord verbonden is.

</details>

<details>
<summary>Er gebeurt niets, en er is ook geen foutmelding</summary>

**Oorzaak:** Je code is niet naar het bord gestuurd, of hij draait wel maar het lampje was al aan.

**Oplossing:** Klik op **Run op board** (niet alleen opslaan). **Zelf vinden:** zet `print("mijn code draait")` als eerste regel. Zie je die tekst niet in de Shell verschijnen, dan draait je code niet en ligt het aan de verbinding, niet aan je regels.

</details>

<details>
<summary>Controlevraag</summary>

Wat betekent `Pin.OUT`?

</details>

<details>
<summary>Antwoord</summary>

Dat deze pin een **uitgang** is: het bord stuurt er stroom naartoe. Een sensor is straks het omgekeerde — daar leest het bord juist iets af.

</details>

---

**Volgende:** [Deel 2 — Knipperen](./deel2_knipperen.md) →
