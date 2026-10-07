---
sidebar_position: 3
sidebar_label: "Stap 3: Python installeren"
title: "Stap 3: Python installeren"
---

# Stap 3: Python installeren

Windows levert Python niet mee. Je hoeft er geen website voor te zoeken: typ het commando en Windows wijst je zelf de weg.

1. Typ in PowerShell:

```bash
python
```

2. Windows opent de Microsoft Store op de pagina van Python. Klik daar op **Ophalen** en wacht tot de installatie klaar is
3. Sluit het PowerShell-venster. Een venster dat al open stond kent het nieuwe commando nog niet
4. Ga in de Verkenner opnieuw naar je projectmap en open PowerShell zoals in [stap 2](./stap-2-powershell)
5. Controleer of het gelukt is:

```bash
python --version
```

## Wat je nu ziet

Een regel die begint met `Python 3`, bijvoorbeeld `Python 3.12.4`. Opent de Microsoft Store opnieuw, dan is de installatie niet afgerond: loop de vier stappen hierboven nog eens na.

<details>
<summary>De Microsoft Store doet niets, of is geblokkeerd</summary>

Op een computer van school staat de Store vaak dicht. Dan installeer je Python van de website:

1. Ga naar [python.org/downloads](https://www.python.org/downloads/) en download Python 3
2. Vink tijdens de installatie het vakje **Add Python to PATH** aan. Zonder dat vakje kent PowerShell het commando `python` niet
3. Klik op **Install Now**
4. Sluit PowerShell, open hem opnieuw vanuit je projectmap en controleer met `python --version`

</details>

<details>
<summary>Op een Mac of Linux</summary>

Daar opent `python` geen Store. Download Python van [python.org/downloads](https://www.python.org/downloads/) en installeer het. Het commando heet er `python3`, dus je controleert met `python3 --version`. In de rest van deze tutorial lees je overal `python3` waar `python` staat.

</details>
