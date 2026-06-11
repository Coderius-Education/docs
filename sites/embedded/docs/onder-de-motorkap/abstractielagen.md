---
sidebar_position: 1
hide_table_of_contents: true
---

# 11.1 Abstractielagen

Je hebt de STM32 tot nu toe met **HAL** geprogrammeerd. Maar ook HAL is niet de bodem: onder elke HAL-functie zit nóg een laag, die rechtstreeks de hardware bestuurt via **registers**. In dit gevorderde hoofdstuk daal je af naar die bodem.

Je hoeft dit niet te kunnen om embedded te programmeren — maar het maakt je een veel betere programmeur als je begrijpt wat HAL voor je doet.

## De lagen

Tussen jouw regel code en de chip zitten lagen, van makkelijk naar dichtbij de hardware:

1. **Arduino-laag** — `digitalWrite()`, `pinMode()`. Makkelijk en draagbaar, maar je ziet niet wat er gebeurt. Die heb je voor de Arduino gebruikt.
2. **HAL** (*Hardware Abstraction Layer*) — `HAL_GPIO_WritePin()`, de officiële bibliotheek van ST. Dichter bij de chip, veel controle. Die gebruik je nu voor de STM32.
3. **Registers** — je schrijft rechtstreeks naar speciale geheugenplekken in de chip. Maximale controle en snelheid, maar je moet de datasheet erbij houden. Dit hoofdstuk.

## Wat is een register?

Een **register** is een speciaal stukje geheugen dat de hardware bestuurt. Schrijf je een `1` naar de juiste bit, dan gaat er bijvoorbeeld een pin aan. De chip "leest" die bits continu en gedraagt zich ernaar.

`HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET)` doet uiteindelijk niets anders dan één bit in één register zetten. HAL zoekt voor jou uit welk register en welke bit dat zijn, en controleert ondertussen van alles. Met registers doe je dat zelf — directer, maar zonder vangnet.

## Waarom zou je dieper gaan?

- **Snelheid.** Direct naar een register schrijven is veel sneller dan een HAL-functie, die er extra controles omheen doet. Voor de meeste projecten maakt dat niet uit, soms wel.
- **Begrip.** Als je één keer met registers een LED hebt laten knipperen, snap je voor altijd wat HAL en `digitalWrite()` eigenlijk doen.
- **Kleiner.** Registercode heeft geen bibliotheek nodig en past in zeer weinig geheugen.

In de volgende twee lessen doe je het zelf: een uitgang (LED) en een ingang (knop), allebei puur met registers.

:::note
Dit is verdiepingsstof. Loop je vast, dan is dat geen probleem — je kunt prima verder met HAL uit de vorige hoofdstukken.
:::
