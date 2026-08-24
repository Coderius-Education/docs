---
sidebar_position: 6
sidebar_label: "Stap 6: commit"
title: "Stap 6: een commit maken"
---

# Stap 6: een commit maken

Bovenaan het Source Control-paneel zie je een tekstveld. Typ daar je commitboodschap, bijvoorbeeld:

```
eerste versie
```

Klik op de blauwe knop **Commit** (of druk **Ctrl+Enter**, op macOS **Cmd+Enter**).

## Wat je nu ziet

**Staged Changes** is verdwenen en het tekstveld is leeg. Het Source Control-paneel is helemaal leeg — precies wat `nothing to commit, working tree clean` betekende in de simulator.

## "There are no staged changes to commit"

Klik je op **Commit** terwijl er niets in **Staged Changes** staat, dan vraagt VS Code:

> There are no staged changes to commit. Would you like to stage all your changes and commit them directly?

Dat is VS Code die aanbiedt om `git add .` en `git commit` in één keer te doen. Handig, maar sla het nu over: klik **Cancel**, stage eerst zelf met de `+` en commit daarna. Zolang je git aan het leren bent, wil je de twee stappen los zien.
