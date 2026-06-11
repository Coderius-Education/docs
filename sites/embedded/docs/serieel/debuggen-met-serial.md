---
sidebar_position: 2
hide_table_of_contents: true
---

# 5.2 Debuggen met serieel

Je code doet niet wat je verwacht. Geen foutmelding, maar gewoon ander gedrag. Hoe vind je het probleem? Bij een microcontroller is je belangrijkste gereedschap de seriële monitor: je laat de Arduino **vertellen** wat hij doet.

## Print wat je niet ziet

De truc: zet `Serial.println()` op de plekken waar je twijfelt. Dan zie je welke regels echt worden uitgevoerd en welke waarden de variabelen hebben.

Stel, je knop-sketch reageert niet. Voeg een print toe:

```cpp
void loop() {
  int stand = digitalRead(2);
  Serial.println(stand);
  delay(200);
}
```

Zie je altijd `1`, ook als je drukt? Dan komt de druk niet binnen — waarschijnlijk een bedradingsfout of de verkeerde pin. Verandert het wél van `1` naar `0`? Dan werkt het inlezen en zit het probleem ergens anders.

## Een vaste werkwijze

Zoek je een fout, ga dan stap voor stap te werk:

1. **Verwacht eerst.** Wat zou er moeten gebeuren, en wat gebeurt er echt?
2. **Print op één plek.** Zet één `Serial.println()` neer en kijk of die regel überhaupt wordt bereikt.
3. **Print de waarde.** Klopt de variabele met wat je verwacht?
4. **Verklein.** Werkt het niet, haal dan code weg tot het simpelste geval dat nog werkt, en bouw van daaruit op.

:::tip
Begin altijd met de vraag: "haalt de code deze regel wel?" Heel vaak draait een stuk code helemaal niet, bijvoorbeeld omdat een `if` nooit waar wordt.
:::

## Veelgemaakte fouten

Twee klassiekers waar bijna iedereen tegenaan loopt:

- **Niets in de monitor.** Je bent `Serial.begin()` in `setup()` vergeten. Zonder die regel verstuurt de Arduino niets.
- **Onleesbare tekens.** De monitor staat op een andere snelheid dan je `Serial.begin()`. Zet ze gelijk.

Meer foutmeldingen en oplossingen vind je in [Er gaat iets mis](/docs/category/er-gaat-iets-mis).
