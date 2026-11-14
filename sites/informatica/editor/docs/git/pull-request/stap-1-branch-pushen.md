---
sidebar_position: 1
sidebar_label: "Stap 1: branch pushen"
title: "Stap 1: een nieuwe branch pushen"
---

# Stap 1: een nieuwe branch pushen

Voor een pull request maak je een nieuwe branch met een nieuwe wijziging, en die push je naar GitHub.

## Een nieuwe branch met een wijziging

1. Open je `git-oefenen`-map in VS Code en kijk of linksonder `main` staat
2. Ga naar **Source Control** (Ctrl+Shift+G). Staat er een knop **Sync Changes**, klik er dan op: zo staat ook je werk uit de vorige tutorial op GitHub
3. Klik linksonder op `main`, kies **+ Create new branch from...**, kies **main** en noem de branch `feature/afscheid`
4. Open `hello.txt`, voeg onderaan de regel `Tot de volgende keer.` toe en sla op
5. Stage (`+`), typ de commit-boodschap `afscheid toegevoegd` en commit

## De branch pushen

GitHub kent `feature/afscheid` nog niet: die branch staat alleen op je eigen computer.

1. Kijk of linksonder `feature/afscheid` staat
2. Klik in **Source Control** op **Publish Branch**

Voor een branch die nog niet op GitHub bestaat, heet de knop **Publish Branch**. Staat de branch er al en heb je commits die GitHub nog niet heeft, dan heet hij **Sync Changes**.

**Wat gebeurde er onder de motorkap?**

```bash
git push -u origin feature/afscheid
```

## Controleer op GitHub

1. Open je repository-pagina op github.com
2. Bovenaan zie je een gele banner: **"feature/afscheid had recent pushes — Compare & pull request"**
3. Boven het bestandenlijstje staat een dropdown waar standaard `main` in staat. Klik erop: je nieuwe branch staat in de lijst.

Die gele banner is je toegangskaartje voor de volgende stap.
