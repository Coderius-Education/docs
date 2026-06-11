---
sidebar_position: 1
hide_table_of_contents: true
---

# Poort niet gevonden

```
No port selected / geen poort beschikbaar
```

**Oorzaak:** Je computer herkent het bord niet. Meestal door een kabel die alleen stroom geeft (geen data), of een ontbrekende driver.

**Oplossing:** Werk deze punten af:

1. Gebruik een **datakabel**, geen pure oplaadkabel. Een goede test: brengt de kabel ook bestanden over naar een telefoon?
2. Controleer of het groene `ON`-lampje op de Arduino brandt.
3. Kies in je editor de juiste poort opnieuw (`COM…` op Windows, `/dev/cu…` op macOS).
4. Werkt het nog niet, installeer dan de driver. Sommige goedkope klonen gebruiken een **CH340**-chip met een eigen driver.

```text
# FOUT
Een telefoon-oplaadkabel zonder datadraadjes.

# GOED
Een USB-datakabel; in je editor de juiste poort geselecteerd.
```

Meer uitleg: [2.1 De Arduino IDE installeren](/docs/arduino-ide/installeren).
