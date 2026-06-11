---
sidebar_position: 4
sidebar_label: "Stap 4: mergen"
title: "Stap 4: branches samenvoegen (merge)"
hide_table_of_contents: true
---

# Stap 4: branches samenvoegen (merge)

Je feature werkt en je wil hem in `main` hebben. Dat heet **mergen**.

## Wissel eerst naar de doel-branch

Mergen werkt zo: je staat op de branch die de nieuwe commits moet **ontvangen**, en je geeft aan welke branch ze **levert**.

1. Klik linksonder op `feature/welkomsbericht` → kies **main**

Je staat nu op `main`.

## Voer de merge uit

1. Ga naar **Source Control** (Ctrl+Shift+G)
2. Klik op de **`...`** rechtsboven in het Source Control-paneel
3. Kies **Branch** → **Merge Branch...**
4. Kies **feature/welkomsbericht** uit de lijst

VS Code voegt de commits van je feature-branch samen met `main`. Open `hello.txt` — je welkomsbericht staat er weer, ditmaal op `main`.

**Wat gebeurde er onder de motorkap?**

```bash
git merge feature/welkomsbericht
```

## En als er een conflict is?

Als je dezelfde regel op `main` én op de feature-branch hebt aangepast, weet git niet welke versie het moet kiezen. Dat heet een **merge conflict**. VS Code toont dan het bestand met markers `<<<<<<<` en `>>>>>>>` waar je zelf moet kiezen welke regel blijft.

Voor deze tutorial werken we alleen op de feature-branch, dus je krijgt geen conflict. Conflicten oplossen leer je later — voor nu: weet dat ze bestaan en dat ze met rust en lezen prima op te lossen zijn.
