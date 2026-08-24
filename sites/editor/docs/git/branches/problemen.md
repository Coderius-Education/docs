---
sidebar_position: 7
title: "Er gaat iets mis"
---

# Er gaat iets mis

## Ik kan niet wisselen: `Your local changes would be overwritten`

**Oorzaak:** je hebt iets aangepast maar nog niet gecommit, en op de andere branch staat dat bestand anders. Git weigert, want dan zou je werk verdwijnen.

**Oplossing:** commit je wijziging eerst op de branch waar je nu op zit. Wissel daarna pas. Dit is de reden dat [Stap 2](./stap-2-wisselen) zegt: eerst committen, dan wisselen.

## Mijn wijziging is weg na het wisselen

**Oorzaak:** niets is weg. Je hebt de wijziging gecommit op de andere branch, en git heeft je bestanden teruggezet naar hoe ze op déze branch staan.

**Oplossing:** wissel terug via de knop linksonder in de statusbalk. Je regel staat er weer. Dat branches echt gescheiden tijdlijnen zijn is precies wat [Stap 3](./stap-3-commits) laat zien.

## `The branch 'feature/...' is not fully merged`

**Oorzaak:** je probeert een branch te verwijderen die commits bevat die nergens anders staan. Git beschermt je tegen het weggooien van werk.

**Oplossing:** merge de branch eerst in `main` (zie [Stap 4](./stap-4-mergen)). Wil je het werk juist wél weggooien, bevestig dan de waarschuwing die VS Code toont — dat is `git branch -D` met een hoofdletter.

## Ik zie `<<<<<<<` en `>>>>>>>` in mijn bestand

**Oorzaak:** een merge conflict. Dezelfde regel is op allebei de branches aangepast en git weet niet welke versie moet blijven.

**Oplossing:** VS Code zet knoppen boven het conflict: **Accept Current Change**, **Accept Incoming Change**, **Accept Both Changes**. Kies er een, of bewerk het stuk met de hand tot er staat wat je wilt. Haal daarna de regels met `<<<<<<<`, `=======` en `>>>>>>>` weg, sla op, stage het bestand en commit.

## Volgende tutorial

- **[Pull Requests](/git/pull-request/)** — merge je feature-branch via GitHub.
