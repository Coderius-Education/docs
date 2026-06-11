---
sidebar_position: 3
hide_table_of_contents: true
---

# Onleesbare tekens in de monitor

```
V���x�?�jl��  in plaats van leesbare tekst
```

**Oorzaak:** De seriële monitor staat op een andere snelheid (baud) dan je `Serial.begin()` in de code. De bits komen dan op het verkeerde ritme binnen.

**Oplossing:** Zet beide op dezelfde waarde. Gebruik je in de code `Serial.begin(9600)`, zet dan de monitor ook op 9600. In PlatformIO doe je dat met `monitor_speed`.

```cpp
# FOUT
Serial.begin(9600);   // code op 9600
// maar de monitor staat op 115200 → onleesbaar
```

```ini
# GOED — in platformio.ini gelijk aan de code
monitor_speed = 9600
```

**Zie je helemaal niets?** Dan is het iets anders: je bent waarschijnlijk `Serial.begin()` in `setup()` vergeten.

Meer uitleg: [5.1 De seriële monitor](/docs/serieel/serial-monitor).
