---
sidebar_position: 2
sidebar_label: "Stap 2: wisselen"
title: "Stap 2: wisselen tussen branches"
hide_table_of_contents: true
---

# Stap 2: wisselen tussen branches

Wisselen tussen branches gaat via dezelfde knop in de statusbalk.

1. Klik linksonder op de huidige branch (`feature/welkomsbericht`)
2. Bovenaan opent een menu met al je branches
3. Kies **main**

Je zit nu weer op `main`. Je `hello.txt` ziet er nog net zo uit als voor je de branch maakte.

**Belangrijk:** je bestanden op je harde schijf **veranderen mee** met de branch. Als je op `feature/...` een wijziging committe en je wisselt naar `main`, dan zie je die wijziging niet meer in je editor — git heeft de bestanden teruggezet naar hoe ze op `main` staan.

Wissel nu terug naar `feature/welkomsbericht` voor de volgende stap.

**Wat gebeurde er onder de motorkap?**

```bash
git checkout main
git checkout feature/welkomsbericht
```

## Let op: niet-gecommitte wijzigingen

Heb je nog wijzigingen in je werkmap die je **niet** gecommit hebt? Dan kan git ze meenemen naar de andere branch, of weigeren te wisselen. Zorg dat je elke wijziging eerst commit voordat je wisselt — dat voorkomt verwarring.
