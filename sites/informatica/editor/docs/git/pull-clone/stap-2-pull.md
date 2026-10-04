---
sidebar_position: 2
sidebar_label: "Stap 2: Git: Pull"
title: "Stap 2: pull-only via het Command Palette"
---

# Stap 2: pull-only via het Command Palette

Soms wil je alleen pullen, zonder te pushen — bijvoorbeeld als je nog niets te pushen hebt, of als je gewoon wil controleren of er nieuwe commits zijn.

1. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
2. Typ `Git: Pull` en druk **Enter**
3. VS Code haalt de nieuwste commits binnen

## Wat je nu ziet

Waren er nieuwe commits, dan veranderen je bestanden voor je ogen en verschijnen de commits in **Source Control Graph**. Was er niets nieuws, dan gebeurt er niets zichtbaars — geen melding, geen vinkje. Dat voelt alsof het mislukt is, maar het is de normale uitkomst.

**Wat gebeurt er onder de motorkap?**

```bash
git pull
```

Dit haalt alle nieuwe commits van `origin` op en plaatst ze achter jouw eigen commits.
