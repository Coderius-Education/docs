---
sidebar_position: 5
sidebar_label: "Stap 5: branch verwijderen"
title: "Stap 5: een branch verwijderen"
hide_table_of_contents: true
---

# Stap 5: een branch verwijderen

Na een geslaagde merge heb je de feature-branch niet meer nodig. Zijn commits zitten nu ook in `main`. De branch kun je opruimen.

## Verwijder de branch

1. Zorg dat je **niet** op `feature/welkomsbericht` staat (je kunt geen branch verwijderen waar je zelf op zit). Wissel naar `main` als dat nog niet zo is.
2. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
3. Typ `Git: Delete Branch...` en druk **Enter**
4. Kies `feature/welkomsbericht`

De branch is weg uit je statusbalk-menu.

**Wat gebeurde er onder de motorkap?**

```bash
git branch -d feature/welkomsbericht
```

De `-d` (delete) werkt alleen als de branch al gemerged is. Niet-gemergede branches verwijder je met `-D` (hoofdletter, "ik weet het zeker, gooi maar weg"). VS Code waarschuwt je vóórdat hij wist.
