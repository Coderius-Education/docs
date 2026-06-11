---
sidebar_position: 4
hide_table_of_contents: true
---

# 1.4 MicroPython kiezen

Thonny moet weten dat het met **MicroPython** op de RP2040 moet praten, en niet met de gewone Python op je laptop. Dit doe je via de interpreter rechtsonder.

## Stap 1: open Thonny

Open Thonny op je computer.

## Stap 2: verbind je microcontroller

Sluit de microcontroller aan met de USB-kabel. (Stappen kwijt? Kijk terug bij [1.3 Bord verbinden](3_verbinden.md).)

## Stap 3: kies de juiste interpreter

Klik **rechtsonder** in Thonny en kies de optie die begint met `MicroPython`.

![kies poort](@site/static/img/micropython_selecteren.png)

## Wat als het niet werkt?

Als je geen optie ziet die begint met `MicroPython`, kies dan **Configure interpreter...**. Je krijgt dit scherm:

![kies interpreter](@site/static/img/thonny_options.png)

Kies:

- **Interpreter:** MicroPython (RP2040)
- **Port:** kies er één met `COM` in de naam

Klik op **OK**.

<details>
<summary>Controlevraag</summary>

Wanneer is deze stap gelukt?

</details>

<details>
<summary>Antwoord</summary>

Als je onderaan Thonny dit ziet staan:

![kies interpreter](@site/static/img/micropython_succes.png)

</details>
