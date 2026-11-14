---
sidebar_position: 1
sidebar_label: "Stap 1: Publish Branch"
title: "Stap 1: eerste publish vanuit VS Code"
---

# Stap 1: eerste publish vanuit VS Code

Open in VS Code je map `git-oefenen` uit de vorige tutorial. Zorg dat je daar al **minstens één commit** hebt gemaakt, anders is er niets om te pushen. Houd de URL van je repository bij de hand: die van [GitHub: account en repo](site:editor/git/github/stap-2-repo), zoals `https://github.com/<gebruikersnaam>/git-oefenen`.

## Koppel je map aan je repository

1. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
2. Typ `Git: Add Remote...` en druk **Enter**
3. Plak de URL van je repository en druk **Enter**
4. VS Code vraagt een naam voor de remote. Typ `origin` en druk **Enter**

Sla dit niet over. Zonder remote biedt **Publish Branch** "Publish to GitHub" aan, en dat maakt altijd een nieuwe repository. Omdat `git-oefenen` op GitHub al bestaat, krijg je dan een melding dat die naam al in gebruik is.

## Push je branch

1. Klik op **Source Control** (Ctrl+Shift+G)
2. Klik op de knop **Publish Branch**. VS Code pusht `main` naar `origin`
3. Vraagt VS Code of je wilt inloggen bij GitHub, klik dan **Allow** en log in via je browser
4. Wacht tot VS Code klaar is: bovenaan zie je kort een voortgangsbalk

## Wat je nu ziet

Ververs je github.com-pagina (`https://github.com/<gebruikersnaam>/git-oefenen`). Waar eerst instructies stonden, staat nu je bestandenlijst met `hello.txt` erin. Linksboven staat een keuzemenu met de branchnaam `main`, dat was er nog niet toen de repository leeg was.

In VS Code is de knop **Publish Branch** weg: `main` staat nu ook op GitHub.

**Wat gebeurde er onder de motorkap?**

```bash
git remote add origin https://github.com/<gebruikersnaam>/git-oefenen.git
git push -u origin main
```

- `git remote add origin <url>`: koppelt je lokale repo aan de online repo onder de bijnaam `origin`. Dat deed **Git: Add Remote...**.
- `git push -u origin main`: uploadt de branch `main` naar `origin`. De `-u` betekent "onthoud deze koppeling", zodat je voortaan kort `git push` kunt typen. Dat deed **Publish Branch**.
