---
sidebar_position: 1
sidebar_label: "Stap 1: Publish Branch"
title: "Stap 1: eerste publish vanuit VS Code"
hide_table_of_contents: true
---

# Stap 1: eerste publish vanuit VS Code

Open in VS Code je map `git-oefenen` uit de vorige tutorial. Zorg dat je daar al **minstens één commit** hebt gemaakt — anders is er niets om te pushen.

1. Klik op **Source Control** (Ctrl+Shift+G)
2. Klik op de knop **Publish Branch**
3. VS Code vraagt of je wilt inloggen bij GitHub — klik **Allow** en log in via je browser
4. VS Code vraagt of de repo **public** of **private** moet zijn. **Belangrijk:** kies hetzelfde als wat je op github.com hebt gekozen, anders maakt VS Code een tweede nieuwe repo aan.

   **Tip:** als je al een lege repo op GitHub hebt gemaakt (in de vorige stap), kies dan de optie die naar die bestaande repo verwijst.
5. Wacht tot VS Code klaar is — bovenaan zie je kort een voortgangsbalk

Ververs nu je github.com-pagina (`https://github.com/<gebruiker>/git-oefenen`). Je bestanden staan online.

**Wat gebeurde er onder de motorkap?**

```bash
git remote add origin https://github.com/<gebruiker>/git-oefenen.git
git push -u origin main
```

- `git remote add origin <url>` — koppelt je lokale repo aan de online repo onder de bijnaam `origin`.
- `git push -u origin main` — uploadt de branch `main` naar `origin`. De `-u` betekent "onthoud deze koppeling", zodat je voortaan kort `git push` kunt typen.
