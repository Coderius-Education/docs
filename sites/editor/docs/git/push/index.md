---
sidebar_position: 0
title: Code online zetten met push
hide_table_of_contents: true
---

# Code online zetten met push

In [GitHub: account en repo](/git/github/) heb je een lege online repository gemaakt. Nu ga je je lokale `git-oefenen`-project eraan koppelen en je commits naar GitHub **pushen**.

## Wat is een remote?

Een **remote** is een online kopie van je repository. Tot nu toe had je alleen een lokale repository — alle commits stonden op jouw computer. Met een remote staan je commits ook op een server (in dit geval github.com).

De standaardnaam voor je belangrijkste remote is **`origin`**. Je kunt het zien als een bijnaam: in plaats van elke keer de hele URL te typen, schrijf je `origin`.

```
[jouw computer]  ←→  [origin = github.com/jouw-naam/git-oefenen]
   commits A,B          commits A,B
```

**Pushen** is het uploaden van jouw lokale commits naar de remote. **Pullen** is het omgekeerde: nieuwe commits van de remote ophalen.

## Aan de slag

Begin met **[Stap 1: eerste publish vanuit VS Code](./stap-1-publish)**.
