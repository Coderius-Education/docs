---
sidebar_position: 2
title: "Hacking - Eentje erbij"
---

# Hacking - Eentje erbij

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Eentje erbij"* onder Hacking.

**Moeilijkheid:** ⭐ Makkelijk

## Onderwerp
**URL-manipulatie**

## Beschrijving
Soms is de oplossing zo simpel als het aanpassen van de URL in je browser.

## Wat je leert
- Wat IDOR (Insecure Direct Object Reference) is
- Hoe URL-parameters werken
- Waarom input-validatie belangrijk is aan de serverzijde

## Hints

<details>
<summary>Hint 1</summary>

Bekijk de **URL** in de adresbalk goed. Valt je iets op aan de structuur?

</details>

<details>
<summary>Hint 2</summary>

Probeer de waarde in de URL te **veranderen**. Wat gebeurt er als je een getal of parameter aanpast?

</details>

<details>
<summary>Hint 3</summary>

Dit heet **IDOR** (Insecure Direct Object Reference) — een veelvoorkomende kwetsbaarheid waarbij je door het aanpassen van een parameter in de URL toegang krijgt tot andere gegevens.

</details>
