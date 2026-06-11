---
sidebar_position: 1
sidebar_label: "Stap 1: branch aanmaken"
title: "Stap 1: een branch aanmaken"
hide_table_of_contents: true
---

# Stap 1: een branch aanmaken

Open je `git-oefenen`-map in VS Code. Kijk linksonder in de **statusbalk**: je ziet een vertakkende lijn met de tekst **`main`** ernaast. Dat is je huidige branch.

## Een nieuwe branch maken

1. Klik in de statusbalk linksonder op **`main`**
2. Bovenaan opent een menu — kies **+ Create new branch from...**
3. Kies **main** als bron
4. Typ een naam voor je nieuwe branch, bijvoorbeeld:

```
feature/welkomsbericht
```

5. Druk op **Enter**

In de statusbalk zie je nu `feature/welkomsbericht` staan in plaats van `main`. Je werkt nu op de nieuwe branch.

**Waarom een `/` in de naam?** De `/` is geen submap, maar een conventie om branches te groeperen. Je ziet vaak `feature/...`, `fix/...`, `experiment/...`. Een naam zonder `/` mag ook prima.

**Wat gebeurde er onder de motorkap?**

```bash
git branch feature/welkomsbericht
git checkout feature/welkomsbericht
```

Of korter, in één keer:

```bash
git checkout -b feature/welkomsbericht
```
