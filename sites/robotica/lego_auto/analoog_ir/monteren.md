---
sidebar_position: 3
slug: /lijnsensor/monteren
---

# IR-sensoren monteren en aansluiten

Volg de foto's stap voor stap. Per IR-sensor heb je één **3D-geprinte adapter** nodig.

<img src={require('./ir_0.jpg').default} alt="IR-sensor aan adapter, stap 1" loading="lazy" width="600" />
<img src={require('./ir_1.jpg').default} alt="IR-sensor aan adapter, stap 2" loading="lazy" width="600" />
<img src={require('./ir_2.jpg').default} alt="IR-sensor aan adapter, stap 3" loading="lazy" width="600" />

Als de sensor in de adapter zit, klik je het geheel aan je Lego-frame. Plaats hem **onderaan de balk, vóór de wielen** — daar kan hij de lijn op de grond goed zien.

<details>
<summary>Tip: hoogte goed zetten</summary>

De IR-sensor werkt het best op ongeveer **5–10 mm** boven de ondergrond. Te hoog en hij ziet alles als wit; te laag en hij schraapt over de grond.

</details>

## Aansluiten op het shield

Elke sensor heeft drie draadjes: signaal, voeding en ground. Steek ze op de driepins-rij van één analoge pin van het Leaphy Murphy Shield, precies zoals op het schema:

![twee analoge IR-sensoren aangesloten op A0 en A1 van het shield](@site/static/fritzing/analog_irs_shield_bb.png)

Sluit de ene sensor aan op pin **A0** en de andere op pin **A1**. Welke van de twee links zit, maakt nu nog niet uit — dat controleer je straks in [Deel 4](./deel4_twee_sensoren.md) met de code erbij.

## Wanneer heb je deze stap gehaald?


- Elke IR-sensor zit vast aan een 3D-geprinte adapter.
- Het geheel (sensor + adapter) zit op je Lego-frame, op de juiste hoogte om de ondergrond te zien.
- Beide sensoren zijn met hun drie draadjes aangesloten op het shield: één op **A0**, één op **A1**.
