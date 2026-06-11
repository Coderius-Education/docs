---
sidebar_position: 2
sidebar_label: "Stap 2: PR openen"
title: "Stap 2: een pull request openen"
hide_table_of_contents: true
---

# Stap 2: een pull request openen

Op je repository-pagina op github.com:

1. Klik op de groene knop **Compare & pull request** in de gele banner

   Geen banner meer? Klik op het tabblad **Pull requests** bovenaan → **New pull request** → kies bij **compare** je feature-branch.

2. Je komt op een pagina **Open a pull request**. Controleer bovenaan:
   - **base:** `main` — dit is de doel-branch waar je commits in wil mergen
   - **compare:** `feature/welkomsbericht` — dit is de bron-branch met je nieuwe commits

3. Vul een duidelijke **titel** in, bijvoorbeeld:

```
Welkomsbericht onderaan hello.txt toevoegen
```

4. In het beschrijvings-veld kun je extra uitleg geven. Voor een kleine wijziging mag het leeg, maar het is een goede gewoonte om kort uit te leggen *waarom* je het doet.

5. Klik op de groene knop **Create pull request**

GitHub maakt nu PR **#1** aan (als dit je eerste PR is) en stuurt je naar de PR-pagina.
