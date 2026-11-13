---
sidebar_position: 5
sidebar_label: "Stap 5: lokaal bijwerken"
title: "Stap 5: lokaal bijwerken en opruimen"
---

# Stap 5: lokaal bijwerken en opruimen

Online is alles netjes: je commits zitten in `main`, je feature-branch is weg. Lokaal weet je computer dat nog niet.

## Haal de merge binnen op main

1. Open VS Code in je `git-oefenen`-map
2. Wissel via de statusbalk linksonder naar **main**
3. Ga naar **Source Control**, klik op de **`...`** bovenaan het paneel en kies **Pull**

   Dat doet `git pull`: de merge-commit komt binnen. Open `hello.txt`: je afscheidsregel staat erin, ook lokaal op `main`.

## Ruim de oude branch op

1. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
2. Typ `Git: Delete Branch...` en druk **Enter**
3. Kies `feature/afscheid`
4. Open het Command Palette opnieuw, typ `Git: Fetch (Prune)` en druk op Enter

Dat laatste doet `git fetch --prune`. Je computer hield een kopie bij van de branch op GitHub, `origin/feature/afscheid`, en die blijft staan als de branch online weg is, ook na een pull. Met **Fetch (Prune)** ruimt VS Code zo'n kopie op.

Klaar — je werkmap is opgeruimd, `main` is up-to-date, en je hebt je eerste pull-request-cyclus voltooid.

## Wat je nu ziet

Linksonder staat `main`, `hello.txt` bevat je afscheidsregel, en het menu achter de branchnaam bevat geen `feature/afscheid` meer, ook niet als `origin/feature/afscheid`. In **Source Control Graph** staat bovenaan de merge-commit die GitHub maakte.

## De complete cyclus, kort

Voor elke nieuwe feature herhaal je voortaan:

1. Vanaf `main`: maak een nieuwe branch (`feature/...`)
2. Werk, commit, push (`Publish Branch`)
3. Op GitHub: open een pull request
4. Bekijk Files changed, merge, delete branch (online)
5. Lokaal: wissel naar `main`, pull, verwijder lokale branch, Fetch (Prune)

Dit is hoe miljoenen ontwikkelaars elke dag werken.
