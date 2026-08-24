---
sidebar_position: 2
sidebar_label: "Stap 2: PR openen"
title: "Stap 2: een pull request openen"
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

## Wat je nu ziet

GitHub maakt PR **#1** aan (als dit je eerste is) en stuurt je naar de PR-pagina. Bovenaan staat je titel met een groen **Open**-label ernaast, en onderaan een groene knop **Merge pull request**. Staat daar in plaats daarvan een grijze knop met "Can't automatically merge", dan is er een conflict — zie [Er gaat iets mis](./problemen).
