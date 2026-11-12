Een nieuwe Arduino Nano RP2040 Connect heeft nog geen MicroPython: daar staat
software van Arduino op. MicroPython zet je er één keer zelf op. Heeft je docent
dat al gedaan, of zie je straks de prompt `>>>`, dan sla je dit stuk over.

### MicroPython op het bord zetten

1. Open de [online editor](site:robotica/editor) en klik op
   **1. MicroPython-firmware**. Er komt een bestand binnen dat eindigt op
   `.uf2`.
2. Druk **twee keer snel achter elkaar** op de resetknop van het bord. Op je
   computer verschijnt een nieuwe schijf met de naam `RPI-RP2`.
3. Sleep het `.uf2`-bestand op die schijf. Het bord start vanzelf opnieuw, nu
   met MicroPython, en de schijf verdwijnt.

Verschijnt `RPI-RP2` niet? Druk dan sneller twee keer, of probeer een andere
USB-kabel: een kabel die alleen oplaadt, laat het bord wel aangaan, maar geen
schijf zien.

### MicroPython kiezen in Thonny

Thonny moet weten dat het met **MicroPython** op de RP2040 moet praten, en niet met de gewone Python op je laptop. Dit doe je via de interpreter rechtsonder.

1. Open Thonny op je computer.
2. Sluit de microcontroller aan met de USB-kabel. Stappen kwijt? Kijk terug bij [Bord verbinden](site:robotica/docs/onderdelen/installatie#verbinden).
3. Klik **rechtsonder** in Thonny en kies de optie die begint met `MicroPython`.

![Thonny rechtsonder met de keuzelijst van interpreters, met MicroPython geselecteerd](@site/static/img/micropython_selecteren.png)

### Wat als het niet werkt?

Als je geen optie ziet die begint met `MicroPython`, kies dan **Configure interpreter...**. Je krijgt dit scherm:

![Het venster Configure interpreter in Thonny](@site/static/img/thonny_options.png)

Kies:

- **Interpreter:** MicroPython (RP2040)
- **Port:** kies er één met `COM` in de naam

Klik op **OK**.

**Controlevraag:** Wanneer is deze stap gelukt?

<details>
<summary>Antwoord</summary>

Als je onderaan Thonny dit ziet staan:

![De Shell van Thonny met de opstartmelding van MicroPython](@site/static/img/micropython_succes.png)

</details>
