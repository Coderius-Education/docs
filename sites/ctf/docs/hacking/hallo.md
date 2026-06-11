---
sidebar_position: 9
title: "Hacking - Hallo"
---

# Hacking - Hallo

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Hallo"* onder Hacking.

**Moeilijkheid:** ⭐⭐⭐ Moeilijk

## Onderwerp
**Cross-Site Scripting (XSS)**

## Beschrijving
Wat mag wel en wat mag niet? Soms accepteert een website invoer die het eigenlijk niet zou moeten accepteren.

## Wat je leert
- Wat Cross-Site Scripting (XSS) is
- Waarom input-validatie cruciaal is
- Hoe aanvallers onveilige invoervelden kunnen misbruiken

## Hints

<details>
<summary>Hint 1</summary>

Deze challenge gaat over **input validatie**. Probeer onverwachte invoer — wat accepteert het invoerveld allemaal?

</details>

<details>
<summary>Hint 2</summary>

Wat gebeurt er als je speciale tekens of HTML-tags invoert? Probeer of de website jouw invoer filtert of gewoon overneemt.

</details>

<details>
<summary>Hint 3</summary>

Als je HTML-code kunt invoeren die op de pagina verschijnt, kan de website kwetsbaar zijn voor **XSS**. Probeer JavaScript-code te injecteren via het invoerveld.

</details>
