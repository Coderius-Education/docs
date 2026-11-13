---
sidebar_position: 9
title: "Hacking - Hallo"
description: "Een website accepteert invoer die hij had moeten weigeren."
pagination_prev: hacking/koekjes-2
pagination_next: code/rotate
---

# Hacking - Hallo

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Hallo"* onder Hacking.

Wat mag wel en wat mag niet? Soms accepteert een website invoer die hij had moeten weigeren.

- **Moeilijkheid:** Moeilijk
- **Onderwerp:** Invoer op een website

**Wat je oefent**

- Uitproberen wat een invoerveld allemaal accepteert
- Zien waarom een website invoer moet controleren

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Deze challenge gaat over **input-validatie**: controleert de website wat je invult? Probeer onverwachte invoer.

</details>

<details>
<summary>Hint 2</summary>

Wat gebeurt er als je speciale tekens of **HTML-tags** invoert? Kijk of de website jouw invoer filtert of letterlijk overneemt.

</details>

<details>
<summary>Hint 3</summary>

Verschijnt jouw HTML op de pagina, dan kan de website kwetsbaar zijn voor **XSS** (Cross-Site Scripting). Probeer JavaScript-code te injecteren via het invoerveld.

</details>
