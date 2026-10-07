---
sidebar_position: 2
---

# 2.2 Laat het lampje knipperen

Je script uit 2.1 stopt zodra de laatste regel is uitgevoerd. Knipperen is iets anders: aan, even wachten, uit, even wachten — en dat steeds opnieuw. Daarvoor heb je twee nieuwe dingen nodig: herhaling (een **loop**) en tijd (een **pauze**).

<Voorkennis
  items={[
    {site: 'python', to: '/docs/herhalen/while-loop', label: 'De while-loop'},
  ]}
/>

## Stap 1: Een tweede import

Pauzeren kan met `sleep`, een functie uit de module `time`. Zet de nieuwe import onder de eerste:

```python
from machine import Pin
from time import sleep

pin_van_lampje = Pin('LED', Pin.OUT)
```

De regel `pin_van_lampje.on()` heb je hier weggehaald; die komt zo in de loop terecht.

## Stap 2: De loop erbij

Voeg de loop toe en druk op **Run**. Let op het **inspringen**: de regel onder `while True:` staat een tab naar rechts, en dat is niet voor de sier — zo weet Python welke regels bij de loop horen.

```python
from machine import Pin
from time import sleep

pin_van_lampje = Pin('LED', Pin.OUT)

while True:
    pin_van_lampje.on()
```

`while True:` betekent: blijf de ingesprongen regels herhalen, voor altijd. Het lampje brandt nu gewoon — maar onder water zet de loop het duizenden keren per seconde opnieuw aan.

## Stap 3: Uit, en wachten

Vul de loop aan tot vier regels en druk op **Run**:

```python
from machine import Pin
from time import sleep

pin_van_lampje = Pin('LED', Pin.OUT)

while True:
    pin_van_lampje.on()
    sleep(1)
    pin_van_lampje.off()
    sleep(1)
```

`sleep(1)` pauzeert één seconde. De loop doet nu steeds: aan, seconde wachten, uit, seconde wachten. Je lampje knippert tot je op **Stop** drukt of de stekker eruit trekt.

## Voorspel: wat als je de twee sleep-regels weghaalt?

<details>
<summary>Antwoord</summary>

De loop draait dan duizenden keren per seconde. Het lampje gaat nog steeds aan en uit, maar zo snel dat je ogen er één zwak brandend lampje van maken. De code is niet kapot — hij is alleen te snel om te zien.

</details>

<details>
<summary>Controlevraag</summary>

Waarom staat `pin_van_lampje = Pin('LED', Pin.OUT)` **boven** de loop en niet erin?

</details>

<details>
<summary>Antwoord</summary>

De pin hoeft maar één keer klaargezet te worden. Alles wat eenmalig is staat boven de loop; alles wat steeds opnieuw moet gebeuren staat erin.

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>IndentationError: expected an indented block</code></summary>

**Oorzaak:** De regels onder `while True:` springen niet in.

**Oplossing:** Zet één tab (of vier spaties) voor elke regel die bij de loop hoort. Gebruik overal hetzelfde — tabs en spaties mengen geeft ook fouten.

</details>

<details>
<summary>Het lampje knippert niet, het brandt gewoon</summary>

**Oorzaak:** Eén van de twee `sleep`-regels ontbreekt, of `pin_van_lampje.off()` staat buiten de loop.

**Oplossing:** Vergelijk je script letterlijk met het blok bij Stap 3.

**Zelf vinden:** zet `print("rondje")` in de loop. Komen er in de Shell wél regels voorbij maar knippert er niets, dan draait de loop en zit de fout in de aan/uit-regels; zie je niets, dan draait de loop zelf niet.

</details>
