---
sidebar_position: 3
sidebar_label: "Stap 3: Python installeren"
title: "Stap 3: Python installeren"
---

# Stap 3: Python installeren

Windows levert Python niet mee. Je hoeft er geen website voor te zoeken: typ het commando en Windows wijst je zelf de weg.

Je installeert **Python 3.14**, ook als er al een nieuwere versie is. Packages lopen een paar maanden achter op een nieuwe Python: op 3.15 liet FastAPI zich niet installeren.

1. Typ in PowerShell:

```bash
python
```

2. Windows opent de Microsoft Store op de pagina van Python. Kijk naar de titel: daar moet **Python 3.14** staan. Staat er een ander nummer, typ dan bovenin de Store `Python 3.14` en kies die. Klik op **Ophalen** en wacht tot de installatie klaar is
3. Sluit het PowerShell-venster. Een venster dat al open stond kent het nieuwe commando nog niet
4. Ga in de Verkenner opnieuw naar je projectmap en open PowerShell zoals in [stap 2](site:editor/python/stap-2-powershell)
5. Controleer of het gelukt is:

```bash
python --version
```

## Wat je nu ziet

Een regel die begint met `Python 3.14`, bijvoorbeeld `Python 3.14.2`. Opent de Microsoft Store opnieuw, dan is de installatie niet afgerond: loop de vier stappen hierboven nog eens na.

Staat er een ander nummer, zoals `Python 3.15.0` of `Python 3.12.4`, dan had je al een Python. Zet eerst 3.14 neer zoals in [Van Python-versie wisselen](site:editor/python/andere-versie), voordat je verdergaat met stap 4.

<details>
<summary>De Microsoft Store doet niets, of is geblokkeerd</summary>

Op een computer van school staat de Store vaak dicht. Dan installeer je Python van de website:

1. Ga naar [python.org/downloads/windows](https://www.python.org/downloads/windows/) en kies de bovenste release die met **Python 3.14** begint, niet die van 3.15. Download daarbij de **Windows installer (64-bit)**
2. Vink tijdens de installatie het vakje **Add Python to PATH** aan. Zonder dat vakje kent PowerShell het commando `python` niet
3. Klik op **Install Now**
4. Sluit PowerShell, open hem opnieuw vanuit je projectmap en controleer met `python --version`

</details>

<details>
<summary>Op een Mac of Linux</summary>

Daar opent `python` geen Store. Download Python 3.14 van [python.org/downloads](https://www.python.org/downloads/) (de nieuwste release die met 3.14 begint, niet 3.15) en installeer het. Het commando heet er `python3`, dus je controleert met `python3 --version`. In de rest van deze tutorial lees je overal `python3` waar `python` staat.

</details>
