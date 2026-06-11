---
sidebar_position: 4
sidebar_label: "Stap 4: mergen op GitHub"
title: "Stap 4: de pull request mergen"
hide_table_of_contents: true
---

# Stap 4: de pull request mergen

Op je PR-pagina, onderaan de **Conversation**-tab, staat een groene knop **Merge pull request** (zolang er geen conflicten zijn).

1. Klik op **Merge pull request**
2. GitHub vraagt om bevestiging — klik op **Confirm merge**
3. Je krijgt een paarse banner: **"Pull request successfully merged and closed"**
4. Eronder verschijnt een knop **Delete branch** — klik erop om de feature-branch op GitHub op te ruimen.

   Dit verwijdert alleen de **online** branch. Je lokale branch op je eigen computer blijft staan; die ruim je in de volgende stap op.

## Wat staat er nu op GitHub?

Ga naar het tabblad **`<> Code`** bovenaan en kijk in `hello.txt`. Je welkomsbericht staat erin — gemerged in `main`.

Klik op het kloktje-icoon (**commits**). Je ziet een nieuwe commit met een boodschap als:

```
Merge pull request #1 from <gebruiker>/feature/welkomsbericht
```

Dat is de **merge-commit**: het officiële markeringspunt waarop deze PR in `main` is opgenomen.

**Wat gebeurde er onder de motorkap?**

```bash
# op GitHub's server:
git checkout main
git merge --no-ff feature/welkomsbericht
git branch -d feature/welkomsbericht   # (alleen als je "Delete branch" klikte)
```
