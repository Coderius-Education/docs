---
sidebar_position: 7
title: "Er gaat iets mis"
---

# Er gaat iets mis

## Ik zie geen gele banner "Compare & pull request"

**Oorzaak:** die banner verschijnt alleen kort na een push, en verdwijnt daarna.

**Oplossing:** klik op het tabblad **Pull requests** bovenaan → **New pull request**, en kies bij **compare** je feature-branch. Zie [Stap 2](./stap-2-pr-openen).

## Mijn branch staat niet in de lijst bij `compare`

**Oorzaak:** je hebt hem nog niet gepusht. GitHub kent alleen branches die online staan.

**Oplossing:** ga terug naar VS Code, wissel naar je feature-branch en klik **Publish Branch**. Zie [Stap 1](./stap-1-branch-pushen).

## `This branch has no changes` — de PR-knop is grijs

**Oorzaak:** je feature-branch heeft geen commits die `main` nog niet heeft. Meestal ben je vergeten te committen, of heb je op `main` gewerkt in plaats van op je branch.

**Oplossing:** controleer linksonder in VS Code op welke branch je zat toen je commit maakte. Stond daar `main`, dan zit je commit daar en niet op je feature-branch.

## `Can't automatically merge` op de PR-pagina

**Oorzaak:** een merge conflict. Op `main` is dezelfde regel aangepast als op jouw branch, nadat jij je branch maakte.

**Oplossing:** haal `main` binnen op je feature-branch en los het conflict lokaal op, zoals in [Branches: Er gaat iets mis](/git/branches/problemen). Push daarna opnieuw; de PR werkt zichzelf bij en de knop wordt weer groen.

## Na de merge staat mijn welkomsbericht niet in mijn lokale main

**Oorzaak:** de merge gebeurde op GitHub's server. Je eigen computer weet daar nog niets van.

**Oplossing:** wissel naar `main` en klik **Sync Changes**. Zie [Stap 5](./stap-5-lokaal-bijwerken).
