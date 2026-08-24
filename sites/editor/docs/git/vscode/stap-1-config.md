---
sidebar_position: 1
sidebar_label: "Stap 1: git config"
title: "Stap 1: vertel git wie je bent"
---

# Stap 1: vertel git wie je bent

Eenmalig moet je git twee dingen vertellen: wie commits maakt, en hoe je eerste branch moet heten. Open in VS Code een terminal via **Terminal** → **New Terminal** en typ:

```bash
git config --global user.name "Jouw Naam"
git config --global user.email "jouw@email.nl"
git config --global init.defaultBranch main
```

Vervang de naam en het e-mailadres door je eigen gegevens. Git slaat dit op voor al je toekomstige projecten.

## Waarom die derde regel

Zonder die regel noemt git je eerste branch `master`. GitHub en de rest van deze cursus gaan uit van `main`, en dan loopt het mis op het moment dat je gaat pushen:

```
error: src refspec main does not match any
```

Git zegt daar: "je vraagt me `main` te versturen, maar die branch bestaat hier niet." Met de regel hierboven heten al je nieuwe repositories meteen `main` en kom je die fout niet tegen.

**Heb je al een map met `git init` gemaakt?** Dan staat die nog op `master`. Open een terminal in die map en hernoem hem:

```bash
git branch -m main
```

## Controleer of het gelukt is

```bash
git config --global --list
```

Je ziet je naam, je e-mailadres en `init.defaultBranch=main` in de lijst staan.
