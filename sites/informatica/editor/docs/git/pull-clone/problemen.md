---
sidebar_position: 6
title: "Er gaat iets mis"
# Hier zoek je je melding: geen tabbladen, want zoeken vindt niets in een tabblad dat dicht is.
les_tabs: false
---

# Er gaat iets mis

## Er staat geen knop Sync Changes

**Oorzaak:** **Sync Changes** staat er alleen als VS Code weet dat je branch voor- of achterloopt op GitHub. Heb je net een commit op GitHub gemaakt, dan weet VS Code dat nog niet.

**Oplossing:** klik op de **`...`** bovenaan het Source Control-paneel en kies **Pull**. Staat er online niets nieuws, dan gebeurt er niets zichtbaars, en dat is de normale uitkomst.

Meer uitleg: [Stap 1: een wijziging van GitHub binnenhalen](site:editor/git/pull-clone/stap-1-sync).

## `Please commit your changes or stash them before you merge`

**Oorzaak:** je hebt wijzigingen in je werkmap die nog niet gecommit zijn, en de commits die binnenkomen raken dezelfde bestanden. Git wil je werk niet overschrijven.

**Oplossing:** commit je eigen wijziging eerst, en pull daarna opnieuw. Is je wijziging nog niet af, commit hem dan toch: je kunt altijd nog een tweede commit maken die hem afmaakt.

## `destination path 'git-oefenen' already exists and is not an empty directory`

**Oorzaak:** in de map die je bij **Git: Clone** koos, staat al een map `git-oefenen`: je eigen project uit de vorige tutorials. Git zet een kloon in een nieuwe map met de naam van de repository, en overschrijft geen map die al bestaat.

**Oplossing:** kloon opnieuw en kies een andere map, bijvoorbeeld een nieuwe map `kloon` in je Documenten. Je eigen `git-oefenen` blijft dan staan.

Meer uitleg: [Stap 3: een bestaand project klonen](site:editor/git/pull-clone/stap-3-clone).

## De gekloonde map is leeg

**Oorzaak:** je hebt bij **Git: Clone** een map gekozen, en VS Code heeft de repository *daarin* gezet als submap. De map die je open hebt is de bovenliggende.

**Oplossing:** **File** → **Open Folder...** en kies de map met de naam van je repository. In het Explorer-paneel moet de naam van je project bovenaan staan, niet de naam van de map waar je hem in zette.

## `Authentication failed` bij het clonen

**Oorzaak:** de repository is privé en VS Code weet nog niet wie je bent.

**Oplossing:** VS Code opent een venster om in te loggen bij GitHub — klik **Allow** en log in via je browser. Kwam dat venster niet, open dan het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS) en typ `GitHub: Sign in`.

## Volgende tutorial

- **[Branches](site:editor/git/branches)** — werk parallel zonder je `main`-versie te breken.
