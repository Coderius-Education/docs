---
sidebar_position: 4
sidebar_label: "Stap 4: virtual environment"
title: "Stap 4: virtual environment aanmaken"
hide_table_of_contents: true
---

# Stap 4: virtual environment aanmaken

Een **virtual environment** (venv) is een afgesloten omgeving voor je project. Hiermee voorkom je dat packages van verschillende projecten met elkaar in conflict komen.

1. Klik op **View** → **Command Palette...**
2. Typ `Python: Create Environment` en klik erop
3. Kies **Venv**
4. Selecteer de Python-versie die je in stap 1 hebt geïnstalleerd
5. VS Code maakt nu automatisch een `.venv` map aan in je project

Na een paar seconden zie je linksonder in de statusbalk `('.venv')` staan. Dit betekent dat de virtual environment actief is. VS Code activeert de environment voortaan automatisch wanneer je dit project opent.

Nu moet je de terminal opnieuw opstarten zodat de virtual environment ook in de terminal actief wordt:

1. Als er al een terminal open staat, klik dan op het **prullenbak-icoon** rechtsboven in het terminal-paneel om de terminal te sluiten
2. Open een nieuwe terminal via **Terminal** → **New Terminal**
3. Controleer of er `(venv)` of `(.venv)` voor je terminal-prompt staat — dit betekent dat de virtual environment actief is in de terminal

**Let op:** Als er **geen** `(venv)` voor de prompt staat, is de virtual environment niet actief in je terminal. Sluit de terminal opnieuw en open er een nieuwe. Werkt het nog steeds niet? Herstart VS Code volledig.
