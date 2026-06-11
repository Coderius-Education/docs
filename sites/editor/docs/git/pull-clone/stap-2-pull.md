---
sidebar_position: 2
sidebar_label: "Stap 2: Git: Pull"
title: "Stap 2: pull-only via het Command Palette"
hide_table_of_contents: true
---

# Stap 2: pull-only via het Command Palette

Soms wil je alleen pullen, zonder te pushen — bijvoorbeeld als je nog niets te pushen hebt, of als je gewoon wil controleren of er nieuwe commits zijn.

1. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
2. Typ `Git: Pull` en druk **Enter**
3. VS Code haalt de nieuwste commits binnen

**Wat gebeurt er onder de motorkap?**

```bash
git pull
```

Dit haalt alle nieuwe commits van `origin` op en plaatst ze achter jouw eigen commits.
