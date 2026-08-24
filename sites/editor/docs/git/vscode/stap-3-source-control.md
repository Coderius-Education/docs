---
sidebar_position: 3
sidebar_label: "Stap 3: Source Control"
title: "Stap 3: de Source Control-knop"
---

# Stap 3: de Source Control-knop

Aan de linkerkant van VS Code zie je een rij iconen. Het derde icoon van boven (een vertakkende lijn) heet **Source Control**. Je kunt het ook openen met **Ctrl+Shift+G**.

**Let op, Mac-gebruikers:** dit is de uitzondering. Bijna elke sneltoets in VS Code gebruikt op macOS Cmd in plaats van Ctrl, maar Source Control houdt **Ctrl**+Shift+G — ook op een Mac. Cmd+Shift+G doet daar iets anders (zoek vorige).

Klik erop. Je ziet een knop **Initialize Repository**.

**Wat doet die knop?** Hetzelfde als `git init` in de simulator: het maakt van je map een git-repository.

Klik op **Initialize Repository**.

## Wat je nu ziet

De knop verdwijnt en er verschijnt een lijst **Changes** met `hello.txt` erin. Linksonder in de blauwe balk staat nu ook een branchnaam: **main**.

Staat er `master` in plaats van `main`? Dan is stap 1 overgeslagen of pas daarna gedaan. Open een terminal (**Terminal** → **New Terminal**) en typ:

```bash
git branch -m main
```
