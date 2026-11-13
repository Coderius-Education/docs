---
sidebar_position: 3
sidebar_label: "Stap 3: clone"
title: "Stap 3: een bestaand project klonen"
---

# Stap 3: een bestaand project klonen

**Clonen** is een complete kopie maken van een online repository op je computer. Dat doe je als je je eigen project op een nieuwe computer wilt zetten (thuis je werk van school ophalen), een project van iemand anders wilt hebben of samenwerkt aan een schoolproject.

## Zo kloon je

1. Ga naar github.com en open de repository die je wilt klonen
2. Klik op de groene **Code**-knop
3. Kopieer de URL die verschijnt (kies **HTTPS**)
4. Open VS Code
5. Open het **Command Palette** met **Ctrl+Shift+P** (Windows/Linux) of **Cmd+Shift+P** (macOS)
6. Typ `Git: Clone` en druk **Enter**
7. Plak de URL en druk **Enter**
8. Kies een map waar de kopie moet komen. Kloon je je eigen `git-oefenen`, kies dan niet de map waar die al staat, maar maak een nieuwe map, bijvoorbeeld `kloon`
9. Klik op **Open** om de gekloonde map in VS Code te openen

## Wat je nu ziet

Bovenaan het Explorer-paneel staat de naam van je repository, met de bestanden eronder. Linksonder staat de branchnaam. Open de terminal (**Terminal** → **New Terminal**) en typ `git log`: de hele geschiedenis staat er, ook de commits die je op een andere computer maakte.

Je hebt nu een complete kopie van de repository, **inclusief alle commits**. In de volgende tutorials werk je verder in je eigen `git-oefenen`, niet in de kloon. De kloon mag je weggooien.

**Wat gebeurde er onder de motorkap?**

```bash
git clone https://github.com/<gebruiker>/git-oefenen.git
```

Clonen doet in één keer wat je bij je eigen project in stappen deed: het maakt de map, zet er een repository in, haalt alle commits op en koppelt `origin` alvast aan de URL. Je hoeft dus geen `git init` en geen `git remote add` meer te doen.
