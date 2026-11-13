---
sidebar_position: 8
sidebar_label: "Van Python-versie wisselen"
title: "Van Python-versie wisselen"
---

# Van Python-versie wisselen

Deze tutorial gebruikt Python 3.14. Heb je een andere versie, of loopt je project vast en wil je opnieuw beginnen, dan doe je drie dingen: je zet Python 3.14 neer, je gooit de oude virtual environment weg en je maakt een nieuwe.

Een virtual environment hoort bij de Python waarmee je hem maakte. Installeer je een andere Python, dan wisselt `.venv` niet mee. Je maakt hem dus opnieuw. Je code raak je daarbij niet kwijt: die staat naast `.venv`, niet erin.

## Welke versie heb je \{#welke-versie}

Open PowerShell vanuit je projectmap zoals in [stap 2](site:editor/python/stap-2-powershell) en typ:

```bash
python --version
```

Begint het antwoord met `Python 3.14`, sla dan het volgende deel over en ga verder bij [De oude omgeving weggooien](#de-oude-omgeving-weggooien).

## Python 3.14 neerzetten \{#python-neerzetten}

1. Open **Instellingen** en ga naar Apps → Geïnstalleerde apps en typ `Python` in het zoekveld
2. Verwijder elke Python die niet met 3.14 begint: klik op de drie puntjes erachter en kies **Verwijderen**. De Python Launcher mag blijven staan
3. Installeer Python 3.14 zoals in [stap 3](site:editor/python/stap-3-installeren)
4. Sluit PowerShell en open hem opnieuw vanuit je projectmap. Een venster dat al open stond, kent de nieuwe Python nog niet
5. Controleer met `python --version` dat het antwoord nu met `Python 3.14` begint

<details>
<summary>In de lijst staat Python install manager</summary>

Die app beheert zelf welke versies er op je computer staan. Kijk welke dat zijn:

```bash
py list
```

Zet 3.14 erbij, en haal de versie weg die je niet wilt, hier 3.15:

```bash
py install 3.14
py uninstall 3.15
```

Sluit daarna PowerShell, open hem opnieuw en controleer met `python --version`.

</details>

<details>
<summary>Je wilt de andere versie houden</summary>

Twee versies naast elkaar kan, maar dan kiest `python` er zelf een. Werk je met het commando `py`, dan kies je de versie bij het maken van de omgeving:

```bash
py -3.14 -m venv .venv
```

Gebruik dat commando in het deel [Een nieuwe omgeving maken](#een-nieuwe-omgeving-maken) in plaats van `python -m venv .venv`. In de omgeving zelf is `python` daarna altijd 3.14.

</details>

## De oude omgeving weggooien \{#de-oude-omgeving-weggooien}

1. Sluit VS Code helemaal. Zolang VS Code openstaat, gebruikt hij bestanden in `.venv`, en dan weigert Windows ze weg te gooien
2. Typ in PowerShell, in je projectmap:

```bash
Remove-Item -Recurse -Force .venv
```

Het commando zegt niets terug. In de Verkenner is de map `.venv` weg. Je mag hem ook in de Verkenner zelf weggooien, met de rechtermuisknop en **Verwijderen**.

## Een nieuwe omgeving maken \{#een-nieuwe-omgeving-maken}

Maak in hetzelfde PowerShell-venster een nieuwe omgeving en open je project:

```bash
python -m venv .venv
code .
```

De nieuwe omgeving is leeg: de packages van de oude zijn met de map meegegaan. Open in VS Code een terminal via **Terminal** → **New Terminal**, kijk of er `(.venv)` voor de prompt staat en installeer ze opnieuw. Heb je een `requirements.txt` zoals in [stap 7](site:editor/python/stap-7-pip), dan gaat dat in één keer:

```bash
python -m pip install -r requirements.txt
```

Anders installeer je ze één voor één, bijvoorbeeld:

```bash
python -m pip install "fastapi[standard]"
```

## Wat je nu ziet

In de terminal van VS Code staat `(.venv)` voor de prompt. Typ daar:

```bash
python --version
```

Het antwoord begint met `Python 3.14`. Met `python -m pip list` zie je de packages die je net terugzette.

Staat er nog een andere versie, dan maakte `python` de omgeving met de verkeerde Python. Kijk dan bij [Python 3.14 neerzetten](#python-neerzetten) of er nog een andere versie in de lijst staat.

<details>
<summary>Op een Mac of Linux</summary>

Installeer Python 3.14 zoals in [stap 3](site:editor/python/stap-3-installeren). Een andere versie hoef je niet weg te halen: je noemt de versie in het commando. Sluit VS Code en typ in de Terminal, in je projectmap:

```bash
rm -rf .venv
python3.14 -m venv .venv
code .
```

In de terminal van VS Code is `python3 --version` daarna `Python 3.14`, en je installeert de packages opnieuw met `python3 -m pip`.

</details>
