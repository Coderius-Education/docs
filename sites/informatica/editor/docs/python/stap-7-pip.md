---
sidebar_position: 7
sidebar_label: "Stap 7: packages installeren"
title: "Stap 7: packages installeren met pip"
---

# Stap 7: packages installeren met pip

**pip** haalt code van anderen op en zet die in je project. Zo hoef je een webserver of een grafiek niet zelf te schrijven.

Doe dit in de terminal ván VS Code, niet in het PowerShell-venster waarin je de omgeving aanmaakte. VS Code zet je virtual environment daar automatisch aan; het losse venster doet dat niet, en dan belandt het package buiten je project.

1. Open in VS Code een terminal via **Terminal** → **New Terminal**
2. Kijk of er `(.venv)` voor de prompt staat
3. Installeer een package, bijvoorbeeld:

```bash
python -m pip install "fastapi[standard]"
```

De aanhalingstekens horen erbij: zonder die tekens leest PowerShell de blokhaken zelf.

<details>
<summary>Op een Mac of Linux</summary>

Overal `python3 -m pip` in plaats van `python -m pip`, ook verderop in deze stap. De aanhalingstekens rond `"fastapi[standard]"` blijven nodig.

</details>

## Wat je nu ziet

Een aantal regels die met `Collecting` en `Downloading` beginnen, en tot slot `Successfully installed` met de namen van de packages erachter.

Staat er `(.venv)` níét voor de prompt, sluit de terminal dan met het prullenbak-icoon rechtsboven in het terminal-paneel en open een nieuwe. Helpt dat niet, sluit VS Code helemaal af en open je project opnieuw met `code .`. Andere meldingen staan bij [Er gaat iets mis](site:editor/python/problemen).

## Je packages vastleggen

Welke packages er in je omgeving staan, zie je in dezelfde terminal met:

```bash
python -m pip list
```

Wie jouw project later opent, moet dezelfde packages installeren. Die lijst schrijf je weg in een bestand `requirements.txt`:

```bash
python -m pip freeze > requirements.txt
```

Op een andere computer installeer je alles in één keer terug:

```bash
python -m pip install -r requirements.txt
```
