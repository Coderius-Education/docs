---
sidebar_position: 1
sidebar_label: "Stap 1: pull"
title: "Stap 1: een wijziging van GitHub binnenhalen"
---

# Stap 1: een wijziging van GitHub binnenhalen

Pullen zie je alleen als er online iets nieuws staat. Dat maak je eerst zelf, op GitHub.

## Verander iets op GitHub

1. Open je repository `git-oefenen` op github.com en klik op `hello.txt`
2. Klik rechtsboven het bestand op het potlood (**Edit this file**)
3. Zet onderaan een regel bij, bijvoorbeeld `Deze regel komt van GitHub.`
4. Klik op **Commit changes...** en bevestig

Op GitHub staat nu een commit die je computer nog niet heeft.

## Haal hem binnen in VS Code

1. Open je project `git-oefenen` in VS Code
2. Klik op **Source Control** (Ctrl+Shift+G)
3. Staat er een knop **Sync Changes**, klik erop. Staat hij er niet, klik dan op de **`...`** bovenaan het Source Control-paneel en kies **Pull**

**Sync Changes** staat er alleen als VS Code al weet dat je branch achterloopt. Weet hij dat nog niet, dan doet **Pull** in het menu hetzelfde werk.

## Wat je nu ziet

Open `hello.txt` in VS Code: de regel die je op GitHub schreef, staat er nu ook. In **Source Control Graph** staat bovenaan de commit die je op GitHub maakte.
