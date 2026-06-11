---
sidebar_position: 5
sidebar_label: "Stap 5: lokaal bijwerken"
title: "Stap 5: lokaal bijwerken en opruimen"
hide_table_of_contents: true
---

# Stap 5: lokaal bijwerken en opruimen

Online is alles netjes: je commits zitten in `main`, je feature-branch is weg. Lokaal weet je computer dat nog niet.

## Haal de merge binnen op main

1. Open VS Code in je `git-oefenen`-map
2. Wissel via de statusbalk linksonder naar **main**
3. Ga naar **Source Control** en klik **Sync Changes**

   Dat doet `git pull` — de merge-commit komt binnen. Open `hello.txt`: je welkomsbericht staat erin, ook lokaal op `main`.

## Verwijder de lokale feature-branch

1. Open het **Command Palette** met **Ctrl+Shift+P**
2. Typ `Git: Delete Branch...` en druk **Enter**
3. Kies `feature/welkomsbericht`

Klaar — je werkmap is opgeruimd, `main` is up-to-date, en je hebt je eerste pull-request-cyclus voltooid.

## De complete cyclus, kort

Voor elke nieuwe feature herhaal je voortaan:

1. Vanaf `main`: maak een nieuwe branch (`feature/...`)
2. Werk, commit, push (`Publish Branch`)
3. Op GitHub: open een pull request
4. Bekijk Files changed, merge, delete branch (online)
5. Lokaal: wissel naar `main`, sync, verwijder lokale branch

Dit is hoe miljoenen ontwikkelaars elke dag werken.
