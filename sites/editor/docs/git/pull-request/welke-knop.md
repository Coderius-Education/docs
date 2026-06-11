---
sidebar_position: 6
title: "Welke knop is welk commando?"
hide_table_of_contents: true
---

# Welke knop is welk commando?

## In VS Code

| In VS Code | Doet hetzelfde als |
|:---|:---|
| **Publish Branch** (op een feature-branch) | `git push -u origin <branch>` |
| Statusbalk → naar `main` wisselen | `git checkout main` |
| **Sync Changes** op `main` (na merge online) | `git pull` |
| **Command Palette** → **Git: Delete Branch...** | `git branch -d <branch>` |

## Op github.com

| Op github.com | Wat het doet |
|:---|:---|
| Banner **Compare & pull request** | Opent de "nieuwe PR"-pagina voor je laatst gepushte branch |
| **Pull requests** tab → **New pull request** | Hetzelfde, maar je kiest zelf bron- en doel-branch |
| **Merge pull request** + **Confirm merge** | Voegt de feature-branch samen met `main` op de server |
| **Delete branch** (na merge) | Verwijdert de feature-branch op GitHub |

## Wat je nu kunt

Je beheerst nu de volledige feature-branch + pull-request workflow:

- Branches lokaal maken, wisselen, mergen en verwijderen
- Een branch pushen naar GitHub
- Een PR openen, bekijken en mergen
- Lokaal weer up-to-date raken met `main` en je oude branch opruimen

Dit is exact hoe professionele teams werken — alleen met meer mensen die op de PR-pagina meekijken.
