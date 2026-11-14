---
sidebar_position: 9
title: "Er gaat iets mis"
# Hier zoek je je melding: geen tabbladen, want zoeken vindt niets in een tabblad dat dicht is.
les_tabs: false
---

# Er gaat iets mis

De foutmeldingen die je bij deze zeven stappen tegenkomt, met de reden erbij. Zoek de melding op zoals hij in je terminal staat.

## `'python' is not recognized as an internal or external command`

**Oorzaak:** PowerShell kent het commando `python` niet. Dat gebeurt als Python nog niet geïnstalleerd is, of als het venster al open stond tijdens de installatie: een venster leest de lijst met commando's één keer, bij het openen.

**Oplossing:** sluit het venster, open PowerShell opnieuw vanuit je projectmap en probeer het nog eens. Blijft de melding staan, dan is Python nog niet geïnstalleerd.

Meer uitleg: [Stap 3: Python installeren](site:editor/python/stap-3-installeren).

## De Microsoft Store blijft opengaan

**Oorzaak:** Windows heeft een snelkoppeling voor `python` die naar de Store wijst zolang Python er niet is. Zie je die pagina opnieuw, dan is de installatie afgebroken of nooit begonnen.

**Oplossing:** klik in de Store op **Ophalen** en wacht tot er **Openen** staat. Sluit daarna PowerShell en open hem opnieuw vanuit je projectmap. Doet de Store helemaal niets, dan is hij waarschijnlijk geblokkeerd op je computer; installeer Python dan van [python.org/downloads](https://www.python.org/downloads/) en vink **Add Python to PATH** aan.

Meer uitleg: [Stap 3: Python installeren](site:editor/python/stap-3-installeren).

## `Openen in Terminal` staat niet in het rechtsklikmenu

**Oorzaak:** op Windows 10 zit die keuze verstopt achter de Shift-toets, en op een beheerde computer kan de beheerder hem hebben weggehaald.

**Oplossing:** houd Shift ingedrukt terwijl je rechtsklikt; dan heet het **PowerShell-venster hier openen**. Staat hij er dan nog niet, klik dan in de adresbalk bovenin de Verkenner, typ `powershell` over het pad heen en druk op Enter.

Meer uitleg: [Stap 2: PowerShell openen vanuit je map](site:editor/python/stap-2-powershell).

## Er verschijnt geen map `.venv`

**Oorzaak:** `python -m venv .venv` maakt de map aan op de plek waar PowerShell staat. Staat het venster in een andere map, dan is de omgeving daar terechtgekomen.

**Oplossing:** kijk naar het pad vóór de `>` in PowerShell. Klopt dat niet met je projectmap, sluit het venster dan en open PowerShell opnieuw vanuit de goede map. De map `.venv` die op de verkeerde plek staat mag je weggooien.

Meer uitleg: [Stap 4: een virtual environment aanmaken](site:editor/python/stap-4-venv).

## `code : The term 'code' is not recognized`

**Oorzaak:** VS Code is geïnstalleerd zonder het vakje **Add to PATH**. Zonder dat vakje bestaat het commando `code` niet.

**Oplossing:** installeer VS Code opnieuw en laat dat vakje aangevinkt staan. Wil je dat nu niet, open VS Code dan met de hand en kies **File** → **Open Folder...**; kies je projectmap.

Meer uitleg: [Installatie VS Code](site:editor/installatie-vscode) en [Stap 5: je project openen in VS Code](site:editor/python/stap-5-vscode).

## Er staat geen `(.venv)` voor de prompt

**Oorzaak:** VS Code zet je virtual environment aan in elke terminal die hij daarna opent. Een terminal die al open stond toen je de map opende, of toen je de Python-extensie installeerde, weet er nog niets van.

**Oplossing:** sluit die terminal met het prullenbak-icoon rechtsboven in het terminal-paneel en open een nieuwe via **Terminal** → **New Terminal**. Helpt dat niet, sluit VS Code dan helemaal af en open je project opnieuw met `code .`.

Meer uitleg: [Stap 5: je project openen in VS Code](site:editor/python/stap-5-vscode).

## `No module named pip` of `ModuleNotFoundError` na een geslaagde installatie

**Oorzaak:** je hebt geïnstalleerd in een terminal zonder `(.venv)`, bijvoorbeeld in het losse PowerShell-venster waarin je de omgeving aanmaakte. Het package staat dan buiten je project, en de Python die je code draait kent het niet.

**Oplossing:** open een terminal in VS Code, controleer dat `(.venv)` voor de prompt staat en installeer het package daar opnieuw met `python -m pip install`.

Meer uitleg: [Stap 7: packages installeren met pip](site:editor/python/stap-7-pip).

## `running scripts is disabled on this system`

**Oorzaak:** je probeert de omgeving met de hand aan te zetten via `.venv\Scripts\Activate.ps1`, en PowerShell mag standaard geen scripts uitvoeren.

**Oplossing:** je hebt dat commando niet nodig. Open je project met `code .` en werk in de terminal van VS Code; die zet de omgeving zelf aan.

Meer uitleg: [Stap 7: packages installeren met pip](site:editor/python/stap-7-pip).

## `python --version` begint niet met `Python 3.14`

**Oorzaak:** er stond al een andere Python op je computer, of de Store installeerde een nieuwere versie. Met een andere versie lukt het installeren van packages niet altijd: op 3.15 liet FastAPI zich niet installeren.

**Oplossing:** zet Python 3.14 neer en maak daarna je virtual environment opnieuw. Een `.venv` die je met de andere versie maakte, blijft die versie gebruiken.

Meer uitleg: [Van Python-versie wisselen](site:editor/python/andere-versie).

## `Cargo, the Rust package manager, is not installed or is not on PATH`

**Oorzaak:** voor een nieuwe Python staan nog niet alle packages kant-en-klaar. pip probeert ze dan zelf te bouwen, en dat lukt alleen met de programmeertaal Rust erbij. FastAPI liep zo vast op Python 3.15. De melding kan ook beginnen met `error: metadata-generation-failed`.

**Oplossing:** installeer geen Rust, maar gebruik Python 3.14. Kijk in de terminal van VS Code met `python --version` welke versie je omgeving heeft. Staat daar niet `Python 3.14`, zet dan 3.14 neer, gooi `.venv` weg, maak hem opnieuw en installeer je packages nog een keer.

Meer uitleg: [Van Python-versie wisselen](site:editor/python/andere-versie).

## `No Python at '…'`

**Oorzaak:** je virtual environment hoort bij de Python waarmee je hem maakte. Heb je die Python verwijderd, dan wijst `.venv` naar een plek die niet meer bestaat.

**Oplossing:** gooi `.venv` weg en maak hem opnieuw met de Python die er nu staat. Je code blijft staan, die zit niet in `.venv`. Daarna installeer je je packages opnieuw.

Meer uitleg: [Van Python-versie wisselen](site:editor/python/andere-versie#de-oude-omgeving-weggooien).
