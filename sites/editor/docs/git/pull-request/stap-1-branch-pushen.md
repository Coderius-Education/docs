---
sidebar_position: 1
sidebar_label: "Stap 1: branch pushen"
title: "Stap 1: je feature-branch pushen"
hide_table_of_contents: true
---

# Stap 1: je feature-branch pushen

GitHub kent je feature-branch nog niet — die heb je alleen op je eigen computer. Je moet hem eerst pushen.

1. Open je `git-oefenen`-map in VS Code
2. Wissel naar je feature-branch via de statusbalk linksonder (bv. `feature/welkomsbericht`)
3. Zorg dat je minstens één commit op deze branch hebt staan (zo niet: maak er even één, zie [Branches Stap 3](/git/branches/stap-3-commits))
4. Ga naar **Source Control** (Ctrl+Shift+G)
5. Klik op **Publish Branch**

Voor een branch die nog niet op GitHub bestaat, heet de knop **Publish Branch**. Voor een branch die er al staat, heet hij gewoon **Sync Changes**.

**Wat gebeurde er onder de motorkap?**

```bash
git push -u origin feature/welkomsbericht
```

## Controleer op GitHub

1. Open je repository-pagina op github.com
2. Bovenaan zie je een gele banner: **"feature/welkomsbericht had recent pushes — Compare & pull request"**
3. Boven het bestandenlijstje staat een dropdown waar standaard `main` in staat. Klik erop — je nieuwe branch staat in de lijst.

Die gele banner is je toegangskaartje voor de volgende stap.
