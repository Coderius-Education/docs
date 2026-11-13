---
sidebar_position: 5
title: "Er gaat iets mis"
# Hier zoek je je melding: geen tabbladen, want zoeken vindt niets in een tabblad dat dicht is.
les_tabs: false
---

# Er gaat iets mis

## VS Code meldt dat de repository al bestaat

**Oorzaak:** je klikte op **Publish Branch** zonder eerst een remote toe te voegen. Zonder remote kiest VS Code "Publish to GitHub", en dat maakt altijd een nieuwe repository. Die heet net als je map, `git-oefenen`, en die naam heb je op GitHub al.

**Oplossing:** maak geen tweede repository. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS), kies `Git: Add Remote...`, plak de URL van je repository en noem de remote `origin`. Klik daarna opnieuw op **Publish Branch**.

Meer uitleg: [Stap 1: eerste publish vanuit VS Code](site:editor/git/push/stap-1-publish).

## `Updates were rejected because the remote contains work that you do not have locally`

**Oorzaak:** er staan commits op GitHub die jij nog niet hebt. Dit kan komen doordat iemand anders gepusht heeft, of doordat je bij het aanmaken van de repo per ongeluk een README hebt aangevinkt.

**Oplossing:** haal eerst de nieuwe commits op met **Sync Changes** (dat doet eerst een pull). Daarna probeer je opnieuw te pushen.

Meer uitleg: [Pull en clone](site:editor/git/pull-clone).

## Volgende tutorial

- **[Pull en clone](site:editor/git/pull-clone)** — leer hoe je code van GitHub naar je computer haalt.
