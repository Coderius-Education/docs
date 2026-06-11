---
sidebar_position: 3
hide_table_of_contents: true
---

# 2.3 setup en loop

Elke Arduino-sketch heeft precies twee vaste blokken: `setup()` en `loop()`. Ze hebben elk een eigen taak.

```cpp
void setup() {
  // draait één keer
}

void loop() {
  // draait daarna oneindig opnieuw
}
```

## setup: één keer, bij de start

`setup()` draait **één keer**, direct nadat het bord aangaat of je het reset. Hier zet je dingen klaar die maar één keer hoeven: welke pinnen ingang of uitgang zijn, de seriële verbinding starten, enzovoort.

In de blink-sketch staat daarom hier:

```cpp
pinMode(13, OUTPUT);
```

`pinMode(13, OUTPUT)` vertelt de microcontroller: "pin 13 ga ik gebruiken om iets aan te sturen". Dat hoeft maar één keer.

## loop: steeds opnieuw

`loop()` draait daarna **oneindig** opnieuw. Zodra de laatste regel klaar is, begint hij weer bij de eerste. Hier staat het gedrag dat zich moet herhalen — in de blink-sketch het aan- en uitzetten van de LED.

Een microcontroller stopt dus nooit uit zichzelf: zolang er stroom is, blijft `loop()` lopen.

:::caution
Zet `pinMode()` in `setup()`, niet in `loop()`. Het hoeft maar één keer, en in `loop()` zou het onnodig honderden keren per seconde herhaald worden.
:::

## Controlevraag

<details>
<summary>Waarom staat <code>digitalWrite</code> in <code>loop()</code> en niet in <code>setup()</code>?</summary>

Omdat het zich moet herhalen. Zou je het in `setup()` zetten, dan ging de LED één keer aan en uit en daarna nooit meer — `setup()` draait immers maar één keer.

</details>

Nu je weet hoe de twee blokken werken, ga je de blink zelf aanpassen in [2.4 Blink aanpassen](blink-aanpassen.mdx).
