---
sidebar_position: 0
title: Pull Requests
hide_table_of_contents: true
---

# Pull Requests

In [Branches](/git/branches/) heb je geleerd hoe je een feature-branch maakt en mergt op je eigen computer. Een **pull request** (PR) is dezelfde stap — een feature-branch mergen in `main` — maar dan via GitHub. Met als voordeel: je hebt een online plek om de wijziging te bekijken voordat je hem accepteert.

## Wat is een pull request?

Een PR is letterlijk een **verzoek**: "ik heb commits op branch X, wil je ze in branch Y trekken (mergen)?" GitHub laat de wijziging zien, opent ruimte voor commentaar, en zet pas door op het moment dat iemand op **Merge** klikt.

De typische cyclus:

1. Maak een feature-branch lokaal (zie [Branches](/git/branches/)).
2. Push die branch naar GitHub.
3. Open een PR op github.com.
4. Bekijk de wijziging en geef eventueel commentaar.
5. Klik op **Merge pull request**.
6. Haal het resultaat lokaal binnen en ruim de branch op.

## Waarom doe je dit ook als je solo werkt?

- **Discipline:** je dwingt jezelf om vóór het mergen nog eens naar je eigen werk te kijken.
- **Online overzicht:** je krijgt een mooie pagina per feature met titel, omschrijving en alle commits bij elkaar.
- **Geschiedenis:** je `main` krijgt nette "Merge pull request #N"-commits, waarmee je later precies kunt zien wanneer welke feature is opgenomen.
- **Klaar voor samenwerken:** zodra je met klasgenoten gaat samenwerken, gebruik je exact dezelfde knoppen.

## Aan de slag

Zorg dat je een feature-branch hebt met minstens één commit (uit [Branches: Stap 3](/git/branches/stap-3-commits)). Begin daarna met **[Stap 1: je feature-branch pushen](./stap-1-branch-pushen)**.
