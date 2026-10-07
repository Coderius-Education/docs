---
sidebar_position: 3
sidebar_label: "Stap 3: commits per branch"
title: "Stap 3: commits zitten op één branch"
---

# Stap 3: commits zitten op één branch

Zorg dat je op `feature/welkomsbericht` zit (statusbalk linksonder).

## Maak een wijziging op je feature-branch

1. Open `hello.txt`
2. Voeg onderaan een regel toe, bijvoorbeeld:

```
Welkom op mijn feature-branch!
```

3. Sla op
4. Ga naar **Source Control** (Ctrl+Shift+G)
5. Stage (`+`), typ een commit-boodschap (`welkomsbericht toegevoegd`) en commit

## Wissel terug naar main en kijk wat er gebeurt

1. Klik linksonder op `feature/welkomsbericht` → kies **main**
2. Open `hello.txt`

De regel `Welkom op mijn feature-branch!` is **weg**. Niet verwijderd — hij staat nog op de andere branch. `main` weet niets van die commit.

3. Wissel weer naar `feature/welkomsbericht` → de regel is terug.

## Wat je nu ziet

Linksonder staat de naam van de branch waar je op zit. Wissel je, dan verandert de inhoud van `hello.txt` in je editor mee — zonder dat je iets opslaat of ongedaan maakt. Dat is git die je bestanden terugzet naar hoe ze op die branch staan.

## Wat dit betekent

Branches zijn **echt gescheiden tijdlijnen**. Wat je op de ene branch doet, beïnvloedt de andere niet — totdat je ze samenvoegt. In de volgende stap voeg je je feature in `main` samen.
