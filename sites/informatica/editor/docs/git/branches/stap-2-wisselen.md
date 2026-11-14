---
sidebar_position: 2
sidebar_label: "Stap 2: wisselen"
title: "Stap 2: wisselen tussen branches"
---

# Stap 2: wisselen tussen branches

Wisselen tussen branches gaat via dezelfde knop in de statusbalk.

1. Klik linksonder op de huidige branch (`feature/welkomsbericht`)
2. Bovenaan opent een menu met al je branches
3. Kies **main** en kijk naar `hello.txt`
4. Wissel op dezelfde manier terug naar `feature/welkomsbericht`. Daar werk je in de volgende stap verder

**Let op:** heb je wijzigingen die je nog niet gecommit hebt? Dan kan git ze meenemen naar de andere branch, of weigeren te wisselen. Commit dus eerst, en wissel daarna.

## Wat je nu ziet

Linksonder stond eerst `main` en staat nu weer `feature/welkomsbericht`. Je `hello.txt` zag er op `main` net zo uit als op je branch: je hebt op de feature-branch nog niets gecommit.

**Belangrijk:** je bestanden op je harde schijf **veranderen mee** met de branch. Als je op `feature/...` een wijziging committe en je wisselt naar `main`, dan zie je die wijziging niet meer in je editor — git heeft de bestanden teruggezet naar hoe ze op `main` staan.

**Wat gebeurde er onder de motorkap?**

```bash
git checkout main
git checkout feature/welkomsbericht
```
