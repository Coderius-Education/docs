---
sidebar_position: 1
---

# 2.1 Ingebouwd lampje aanzetten

Je eerste programma. Op de Nano RP2040 Connect zit een **ingebouwd lampje** met de naam `LED`, dus je hoeft niets aan te sluiten. Het hele programma is drie regels — en je bouwt het regel voor regel op, zodat je van elke regel weet wat hij doet.

<Voorkennis
  items={[
    {site: 'python', to: '/docs/basis/jij-als-variabele', label: 'Variabelen'},
    {site: 'python', to: '/docs/tekst/04b-string-methoden', label: 'Aanroepen met een punt'},
  ]}
/>

## Stap 1: Haal het gereedschap op

Typ deze regel in je editor en druk op **Run**:

<CodeUitleg>

```python showLineNumbers
from machine import Pin
```

Er gebeurt na Run niets zichtbaars. Dat klopt: je hebt alleen gereedschap klaargelegd, je gebruikt het nog nergens.

## Stap 2: Kies een pin en bewaar hem

Voeg de tweede regel toe en druk weer op **Run**:

```python
from machine import Pin

pin_van_lampje = Pin('LED', Pin.OUT)
```

<Regel n={1}>
`machine` is een module: een verzameling kant-en-klaar gereedschap die al op je bord zit. Met `from machine import Pin` pak je er één stuk uit, `Pin`, waarmee je de pinnen van het bord kunt bedienen.
</Regel>

</CodeUitleg>

`Pin('LED', Pin.OUT)` maakt een pin-object aan. Tussen de haakjes geef je twee dingen mee:

- `'LED'` is de naam van de pin op het bord waar het ingebouwde lampje aan hangt.
- `Pin.OUT` zegt dat je de pin als **uitgang** gebruikt: het bord stuurt er stroom naartoe, in plaats van iets te meten.

Dat object bewaar je in de variabele `pin_van_lampje`, zodat je er in de volgende regel iets mee kunt doen.

Ook nu zie je nog niets gebeuren. De pin staat klaar, meer niet.

## Stap 3: Zet het lampje aan

Voeg de derde regel toe en druk op **Run**:

```python
from machine import Pin

pin_van_lampje = Pin('LED', Pin.OUT)
pin_van_lampje.on()
```

`pin_van_lampje.on()` roept met de punt de **methode** `on()` aan op jouw pin-object. Nu loopt er stroom naar de pin — het lampje brandt.

## Weer uit

Uitzetten is dezelfde variabele met een andere methode:

```python
pin_van_lampje.off()
```

<details>
<summary>Controlevraag</summary>

Wat doet `Pin.OUT`?

</details>

<details>
<summary>Antwoord</summary>

`Pin.OUT` vertelt de microcontroller dat deze pin een **uitgang** is. De microcontroller stuurt dan stroom naar buiten (om bijvoorbeeld een lampje aan te zetten) in plaats van iets te lezen.

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>ImportError: no module named 'machine'</code></summary>

**Oorzaak:** Je code draait op je computer in plaats van op het bord. De module `machine` bestaat alleen in MicroPython.

**Oplossing:** Controleer in [1.4 MicroPython kiezen](../Tutorial-installatie/4_REPL.md) dat je interpreter op MicroPython staat en dat je bord verbonden is.

</details>

<details>
<summary>Foutmelding: <code>NameError: name '...' isn't defined</code></summary>

**Oorzaak:** De naam in regel 3 is niet precies dezelfde als de naam in regel 2. Python ziet `pin_van_lampje` en `pin_van_lampie` als twee verschillende variabelen.

**Oplossing:** Vergelijk de twee namen letter voor letter en maak ze gelijk.

</details>
