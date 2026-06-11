---
sidebar_position: 2
hide_table_of_contents: true
---

# Projectideeën

Hieronder staan vier projecten, van makkelijk naar uitdagend. Bij elk staan stappen en een tip, maar geen volledige oplossing — die bedenk je zelf. Gebruik de [cheatsheet](/cheatsheet) als naslag.

## Idee 1: Reactiespel

Een LED gaat na een willekeurige tijd aan. Wie het snelst op de knop drukt, wint. Print de reactietijd in milliseconden.

1. Wacht een willekeurige tijd (`random()`), zet dan de LED aan.
2. Onthoud het moment met `millis()`.
3. Wacht op de knop en bereken het verschil.

<details>
<summary>Tip</summary>

Gebruik `millis()` om de tijd vast te leggen op het moment dat de LED aangaat en op het moment van de druk. Het verschil is de reactietijd.

</details>

**Mogelijke uitbreidingen:** meerdere rondes met een gemiddelde, een tweede knop voor twee spelers, een "te vroeg!"-melding.

## Idee 2: Thermometer met waarschuwing

Lees een temperatuursensor uit en laat een groene LED branden als het goed is, en een rode als het te warm wordt.

1. Lees de sensor uit (analoog of via I2C met een library).
2. Vergelijk met een grenswaarde in een `if`.
3. Stuur de juiste LED aan.

<details>
<summary>Tip</summary>

Begin met een potmeter in plaats van een echte sensor om je `if`-logica te testen. Werkt dat, vervang dan de potmeter door de sensor.

</details>

**Mogelijke uitbreidingen:** de temperatuur op de seriële monitor, een zoemer bij alarm, de grenswaarde instelbaar met een knop.

## Idee 3: Parkeersensor (STM32)

Bouw de parkeersensor uit [6.2](/docs/timing-sensoren/een-sensor-uitlezen) na op de STM32, en gebruik de extra mogelijkheden van het bord.

1. Sluit een ultrasoonsensor aan op de Blue Pill.
2. Laat een LED sneller knipperen naarmate iets dichterbij komt.
3. Gebruik een hardware-timer voor het knipperen.

<details>
<summary>Tip</summary>

Houd het meten in je `while`-lus, maar laat het knipperen lopen via een **hardware-timer** met HAL (zie [10.4 Hardware-timers](/docs/stm32-interfaces/timers-pwm)). Pas de timer-instelling aan op basis van de afstand.

</details>

**Mogelijke uitbreidingen:** een zoemer met PWM-toonhoogte, meerdere sensoren, een schermpje via I2C.

## Idee 4: Mini-weerstation (STM32 + interfaces)

Combineer een sensor (I2C) met een schermpje (I2C of SPI) tot een klein weerstation.

1. Lees de sensor uit via I2C (gebruik de I2C-scanner om het adres te vinden).
2. Toon de waarde op een OLED-schermpje.
3. Ververs elke paar seconden.

<details>
<summary>Tip</summary>

Werk in twee stukken: krijg eerst de sensor printend naar de seriële monitor, en krijg los daarvan tekst op het scherm. Voeg ze pas samen als beide afzonderlijk werken.

</details>

**Mogelijke uitbreidingen:** min/max bijhouden, een knop om tussen waarden te wisselen, gegevens loggen via een tweede UART.
