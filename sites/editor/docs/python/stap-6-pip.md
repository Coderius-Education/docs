---
sidebar_position: 6
sidebar_label: "Stap 6: pip (optioneel)"
title: "Stap 6 (optioneel): packages installeren met pip"
hide_table_of_contents: true
---

# Stap 6 (optioneel): packages installeren met pip

**pip** is de package manager van Python. Hiermee installeer je extra bibliotheken die niet standaard bij Python zitten.

Zorg dat je virtual environment actief is (je ziet `(venv)` in de terminal) en typ in de terminal:

```bash
pip install pakketnaam
```

## Voorbeeld: de requests bibliotheek

```bash
pip install requests
```

Nu kun je `requests` gebruiken in je code:

```python
import requests

reactie = requests.get("https://api.github.com")
print(reactie.status_code)
```

## Geïnstalleerde packages bekijken

```bash
pip list
```

## Packages opslaan in een bestand

Het is handig om bij te houden welke packages je project nodig heeft. Dit doe je met een `requirements.txt` bestand:

```bash
pip freeze > requirements.txt
```

Iemand anders (of jijzelf op een andere computer) kan dan alle packages in één keer installeren met:

```bash
pip install -r requirements.txt
```
