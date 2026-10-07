---
sidebar_position: 4
slug: /lijnsensor/een-sensor
title: "Deel 3: Eén sensor uitlezen"
---

# Het robotscript bouwen — Deel 3: Eén sensor uitlezen

<Voorkennis
  items={[
    {site: 'python', to: '/docs/basis/jouw-naam-op-het-scherm', label: 'Tekst tonen met print'},
  ]}
/>


Je sensoren zitten aangesloten en gemonteerd. Tijd om te zien wat zo'n sensor eigenlijk **ziet** — en dat blijkt geen "zwart" of "wit" te zijn, maar een getal.

## Wat je nu gaat toevoegen

De sensor komt in je loop. Het lampje uit Deel 1 en 2 heeft zijn werk gedaan: die regels gaan eruit, de loop is voortaan van de sensor.

## Stap 1: Kijk naar het ruwe getal

Vervang je script door dit — de loop-opbouw herken je, alleen de inhoud is nieuw:

<CodeUitleg>

```python showLineNumbers
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR

links = AnalogIR("A0", 2500)

while True:
    print(links.get_analog_value())
    sleep(0.2)
```

<Regel n={4}>
Maakt een sensor-object voor de sensor op pin **A0**. We noemen hem alvast `links` — in Deel 4 komt er een tweede bij. Wat die `2500` doet, zie je in Stap 2.
</Regel>

<Regel n={7}>
`get_analog_value()` geeft het ruwe meetgetal terug, tussen 0 en 65535.
</Regel>

</CodeUitleg>

Klik op **Run op board** en beweeg je robot langzaam van de witte ondergrond naar de zwarte lijn en terug. In de Shell stroomt een rij getallen voorbij: **laag** boven wit, **hoog** boven zwart.

## Voorspel: hoe maak je van een getal "zwart" of "wit"?

De sensor geeft alleen getallen. **Hoe zou je programma kunnen beslissen of dat getal "zwart" of "wit" betekent?**

<details>
<summary>Antwoord</summary>

Met een grens: alles boven een gekozen waarde noem je zwart, alles eronder wit. Die grens heet de **drempelwaarde** — en dat is precies wat die `2500` in je script is.

</details>

## Stap 2: Van getal naar kleur

Vervang de print-regel:

<CodeUitleg>

```python showLineNumbers
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR

links = AnalogIR("A0", 2500)

while True:
    kleur_links = links.black_or_white()
    print("Links:", kleur_links)
    sleep(0.2)
```

<Regel n={7}>
Vergelijkt de meting met je drempel van `2500` en geeft `"black"` of `"white"` terug. Die tekst bewaar je in de variabele `kleur_links`, zodat je er straks op kunt reageren.
</Regel>

</CodeUitleg>

## Test het

Beweeg de sensor boven wit en boven de zwarte lijn. De Shell wisselt mee tussen `Links: white` en `Links: black`.

## Opdracht 5.4.a: kalibreer je drempel

De `2500` is een gok. Meet wat jouw sensor écht ziet en kies een betere drempel.

1. Zet de print uit Stap 1 terug en noteer het getal boven **wit** en boven **zwart**.
2. Kies de waarde die er precies tussenin ligt en vul die in op de plek van `2500`.
3. Controleer met Stap 2 dat de kleuren nu kloppen.

<details>
<summary>Klik hier voor een tip.</summary>

Neem het midden van je twee metingen. Bijvoorbeeld: wit = 800, zwart = 5000, dan is je drempel (800 + 5000) / 2 = 2900.

</details>

<details>
<summary>Klik hier voor de oplossing.</summary>

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR

links = AnalogIR("A0", 2900)

while True:
    kleur_links = links.black_or_white()
    print("Links:", kleur_links)
    sleep(0.2)
```

De `2900` is hier een voorbeeld — jouw getal hangt af van jouw sensor, de hoogte boven de grond en het licht in het lokaal. Daarom kalibreer je zelf in plaats van een getal over te nemen.

</details>

## Je script tot nu toe

<details>
<summary>Klik hier om te vergelijken</summary>

```python
from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR

links = AnalogIR("A0", 2500)

while True:
    kleur_links = links.black_or_white()
    print("Links:", kleur_links)
    sleep(0.2)
```

Met jouw eigen drempel op de plek van `2500`.

</details>

## Er gaat iets mis

<details>
<summary>Foutmelding: <code>ImportError: no module named 'leaphymicropython'</code></summary>

**Oorzaak:** De library staat niet (goed) op je bord.

**Oplossing:** Volg [leaphymicropython installeren](../software_editor/bibliotheek.md); de bestanden horen in de map `lib` op de microcontroller.

</details>

<details>
<summary>De waarde verandert niet, wat ik ook onder de sensor houd</summary>

**Oorzaak:** De sensor zit op een andere pin dan je code zegt, of een draadje zit los.

**Oplossing:** Controleer op het shield dat de signaaldraad echt op **A0** zit en dat alle drie de draadjes vastzitten. **Zelf vinden:** houd je vinger vlak voor de sensor. Verandert het getal dan wél, dan werkt de sensor en ligt het aan de hoogte boven de grond; verandert er niets, dan zit het in de bedrading of de pin.

</details>

<details>
<summary>Controlevraag</summary>

Je drempel staat op 2500 en de sensor meet 2400 boven de lijn. Wat zegt `black_or_white()` dan — en klopt dat?

</details>

<details>
<summary>Antwoord</summary>

`"white"`, want 2400 ligt onder de drempel. Het klopt niet: de sensor hangt boven de lijn. Precies daarom kalibreer je — de drempel moet tussen jouw eigen wit- en zwartmeting liggen.

</details>

---

**Volgende:** [Deel 4 — Twee sensoren](./deel4_twee_sensoren.md) →
