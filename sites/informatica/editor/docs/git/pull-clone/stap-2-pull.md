---
sidebar_position: 2
sidebar_label: "Stap 2: Git: Pull"
title: "Stap 2: pull-only via het Command Palette"
---

# Stap 2: pull-only via het Command Palette

Soms wil je alleen pullen, zonder te pushen: bijvoorbeeld als je nog niets te pushen hebt, of als je wilt controleren of er nieuwe commits zijn.

1. Verander op GitHub nog een regel in `hello.txt`, met het potlood en **Commit changes...** zoals in [stap 1](site:editor/git/pull-clone/stap-1-sync)
2. Open in VS Code het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
3. Typ `Git: Pull` en druk **Enter**

## Wat je nu ziet

`hello.txt` verandert voor je ogen, en de commit van GitHub staat bovenaan in **Source Control Graph**.

Pull je terwijl er online niets nieuws staat, dan gebeurt er niets zichtbaars: geen melding, geen vinkje. Dat voelt alsof het mislukt is, maar het is de normale uitkomst.

**Wat gebeurt er onder de motorkap?**

```bash
git pull
```

Dit haalt alle nieuwe commits van `origin` op en plaatst ze achter jouw eigen commits.
