---
sidebar_position: 5
hide_table_of_contents: true
---

# Sketch te groot

```
Sketch too big / region 'text' overflowed / not enough memory
```

**Oorzaak:** Je programma past niet in het geheugen van het bord. Een Arduino Uno heeft maar 32 KB programmageheugen en 2 KB werkgeheugen. Vooral grote `String`-teksten en zware libraries vullen dat snel.

**Oplossing:** Maak je programma kleiner, of stap over op een ruimer bord (de STM32 heeft veel meer geheugen).

- Gebruik de `F()`-macro rond vaste teksten, zodat ze niet in het schaarse werkgeheugen komen:

```cpp
# FOUT — tekst vult het werkgeheugen
Serial.println("Een lange uitleg die veel RAM kost");

# GOED — tekst blijft in het programmageheugen
Serial.println(F("Een lange uitleg die veel RAM kost"));
```

- Verwijder libraries die je niet echt gebruikt.
- Vervang grote `String`-objecten door gewone `char`-tekst waar het kan.

**Loop je hier vaak tegenaan?** Dan is dit precies een reden om naar de STM32 over te stappen. Zie [8.1 Waarom STM32?](/docs/stm32-intro/waarom-stm32).
