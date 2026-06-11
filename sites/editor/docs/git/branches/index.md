---
sidebar_position: 0
title: Branches
hide_table_of_contents: true
---

# Branches

Tot nu toe heb je al je commits op één **branch** gemaakt: `main`. Een branch is een soort tijdlijn van commits. Met meerdere branches kun je **parallel** werken: één tijdlijn voor je werkende versie, een andere tijdlijn waar je experimenteert.

## Waarom branches?

Stel: je website werkt en je wil een groot nieuw stuk toevoegen — een contactformulier bijvoorbeeld. Halverwege blijkt het niet goed te werken. Als je dat allemaal direct op `main` doet, is je werkende website nu kapot.

Met een **feature-branch** los je dit op:

1. Je maakt een nieuwe branch (`feature/contactformulier`) vanaf `main`.
2. Op die branch experimenteer je vrij — al je commits staan apart.
3. Werkt het? Dan voeg je de branch samen met `main` (**mergen**).
4. Werkt het niet? Dan gooi je de branch gewoon weg. `main` is niet veranderd.

Branches zijn vooral handig als je samenwerkt met anderen, maar ook solo zijn ze nuttig om experimenten en stabiele versies gescheiden te houden.

## Aan de slag

Begin met **[Stap 1: een branch aanmaken](./stap-1-aanmaken)**.

Werk in dezelfde `git-oefenen`-map die je in de vorige tutorials hebt gemaakt.
