---
sidebar_position: 11
title: "Er gaat iets mis"
---

# Er gaat iets mis

De meest voorkomende dingen die je tegenkomt bij de vorige stappen.

## Ik zie geen Initialize Repository, maar "Open Folder"

**Oorzaak:** er staat geen map open in VS Code. Git werkt altijd op een map, dus zonder map is er niets te initialiseren.

**Oplossing:** **File** → **Open Folder...** en kies je `git-oefenen`-map. Zie [Stap 2](./stap-2-projectmap).

## De Source Control-knop doet niets, of ik zie een melding over git

```
Git not found. Install it or configure it using the 'git.path' setting.
```

**Oorzaak:** git staat niet op je computer, of VS Code stond al open toen je het installeerde.

**Oplossing:** installeer git (zie [de voorbereiding](./)), sluit VS Code helemaal af en open het opnieuw. VS Code zoekt alleen bij het opstarten naar git.

## Linksonder staat `master` in plaats van `main`

**Oorzaak:** je hebt de map geïnitialiseerd voordat je `init.defaultBranch` had ingesteld. Git noemt zijn eerste branch dan `master`.

**Oplossing:** open een terminal (**Terminal** → **New Terminal**) en hernoem hem:

```bash
git branch -m main
```

Meer uitleg: [Stap 1: vertel git wie je bent](./stap-1-config).

## Bij het committen: "Make sure you configure your user.name and user.email in git"

**Oorzaak:** git weet niet wie je bent, dus kan hij geen commit ondertekenen.

**Oplossing:** de twee `git config`-regels uit [Stap 1](./stap-1-config). Daarna commit je opnieuw; je hoeft niets over te doen.

## Ik klik op Commit en er gebeurt niets

**Oorzaak:** het commitboodschap-veld is leeg. Zonder boodschap weigert git.

**Oplossing:** typ eerst iets in het tekstveld bovenaan het Source Control-paneel, dan pas Commit.

## VS Code vraagt of hij "periodically run git fetch" mag

**Oorzaak:** je repository heeft een remote, en VS Code biedt aan regelmatig te kijken of daar iets nieuws staat.

**Oplossing:** **Yes** is prima. Het verandert niets aan je eigen commits — het haalt alleen op wat er online staat, zodat je het ziet. Je kunt het altijd terugzetten in de instellingen onder `git.autofetch`.

## Mijn bestand staat er grijs bij en verdwijnt uit Source Control

**Oorzaak:** het staat in je `.gitignore`. Dat is precies de bedoeling van dat bestand.

**Oplossing:** hoort het er wél in? Haal die regel dan uit `.gitignore`. Zie [Stap 9](./stap-9-gitignore).

## Volgende tutorial

- **[Code online zetten met push](/git/push/)** — koppel je `git-oefenen`-map aan de repository die je op GitHub hebt gemaakt.
