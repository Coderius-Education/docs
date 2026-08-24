---
sidebar_position: 6
title: "Er gaat iets mis"
---

# Er gaat iets mis

## Ik klik op Sync Changes en er gebeurt niets

**Oorzaak:** er is niets te synchroniseren. Geen nieuwe commits online, en geen van jou die nog moeten.

**Oplossing:** niets doen — dit is de normale uitkomst. Wil je zeker weten dat de verbinding werkt, kijk dan op github.com of de laatste commit die je ziet dezelfde is als bovenin je **Source Control Graph**.

## `Please commit your changes or stash them before you merge`

**Oorzaak:** je hebt wijzigingen in je werkmap die nog niet gecommit zijn, en de commits die binnenkomen raken dezelfde bestanden. Git wil je werk niet overschrijven.

**Oplossing:** commit je eigen wijziging eerst, en pull daarna opnieuw. Ben je die wijziging niet kwijt willen raken maar ook niet klaar om te committen? Commit hem dan toch — je kunt altijd nog een tweede commit maken die hem afmaakt.

## De gekloonde map is leeg

**Oorzaak:** je hebt bij **Git: Clone** een map gekozen, en VS Code heeft de repository *daarin* gezet als submap. De map die je open hebt is de bovenliggende.

**Oplossing:** **File** → **Open Folder...** en kies de map met de naam van je repository. In het Explorer-paneel moet de naam van je project bovenaan staan, niet de naam van de map waar je hem in zette.

## `Authentication failed` bij het clonen

**Oorzaak:** de repository is privé en VS Code weet nog niet wie je bent.

**Oplossing:** VS Code opent een venster om in te loggen bij GitHub — klik **Allow** en log in via je browser. Kwam dat venster niet, open dan het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS) en typ `GitHub: Sign in`.

## Volgende tutorial

- **[Branches](/git/branches/)** — werk parallel zonder je `main`-versie te breken.
