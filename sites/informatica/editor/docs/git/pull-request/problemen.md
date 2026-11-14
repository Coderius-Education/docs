---
sidebar_position: 7
title: "Er gaat iets mis"
# Hier zoek je je melding: geen tabbladen, want zoeken vindt niets in een tabblad dat dicht is.
les_tabs: false
---

# Er gaat iets mis

## `feature/welkomsbericht` staat niet meer in de lijst met branches

**Oorzaak:** die branch heb je in [Branches](site:editor/git/branches) gemerged en verwijderd. Hij is dus terecht weg.

**Oplossing:** maak een nieuwe branch met een nieuwe wijziging, zoals in [Stap 1](site:editor/git/pull-request/stap-1-branch-pushen).

## Ik zie geen gele banner "Compare & pull request"

**Oorzaak:** die banner verschijnt alleen kort na een push, en verdwijnt daarna.

**Oplossing:** klik op GitHub op het tabblad **Pull requests** → **New pull request**, en kies bij **compare** je feature-branch. Zie [Stap 2](site:editor/git/pull-request/stap-2-pr-openen).

## Mijn branch staat niet in de lijst bij `compare`

**Oorzaak:** je hebt hem nog niet gepusht. GitHub kent alleen branches die online staan.

**Oplossing:** ga terug naar VS Code, wissel naar je feature-branch en klik **Publish Branch**. Zie [Stap 1](site:editor/git/pull-request/stap-1-branch-pushen).

## `This branch has no changes` — de PR-knop is grijs

**Oorzaak:** je feature-branch heeft geen commits die `main` nog niet heeft. Meestal ben je vergeten te committen, of heb je op `main` gewerkt in plaats van op je branch.

**Oplossing:** controleer linksonder in VS Code op welke branch je zat toen je commit maakte. Stond daar `main`, dan zit je commit daar en niet op je feature-branch.

## `Can't automatically merge` op de PR-pagina

**Oorzaak:** een merge conflict. Op `main` is dezelfde regel aangepast als op jouw branch, nadat jij je branch maakte.

**Oplossing:** haal `main` binnen op je feature-branch en los het conflict lokaal op, zoals in [Branches: Er gaat iets mis](site:editor/git/branches/problemen). Push daarna opnieuw; de PR werkt zichzelf bij en de knop wordt weer groen.

## Onder Files changed staan meer regels dan mijn afscheidsregel

**Oorzaak:** er zijn twee mogelijkheden.

- Staat de regel erboven één keer rood en één keer groen, met dezelfde tekst, dan eindigde `hello.txt` zonder regeleinde. VS Code zet er standaard geen neer, dus toen je onderaan een regel toevoegde, kreeg de regel erboven er een bij. Dat telt git als een veranderde regel.
- Staan er regels uit de vorige tutorial bij, dan stonden die commits nog niet op GitHub. Je nieuwe branch nam ze mee, en GitHub toont ze nu als nieuw.

**Oplossing:** je hoeft niets te herstellen: merge de pull request. Voor de tweede oorzaak: klik de volgende keer eerst op **Sync Changes** op `main`, zoals in [Stap 1](site:editor/git/pull-request/stap-1-branch-pushen), en maak daarna pas je branch.

## Na de merge staat mijn nieuwe regel niet in mijn lokale main

**Oorzaak:** de merge gebeurde op GitHub's server. Je eigen computer weet daar nog niets van.

**Oplossing:** wissel naar `main`, klik op de **`...`** bovenaan het Source Control-paneel en kies **Pull**. Zie [Stap 5](site:editor/git/pull-request/stap-5-lokaal-bijwerken).
