---
sidebar_position: 5
title: "Code - Rotate"
description: "Een tekst is onleesbaar gemaakt, en de naam van de challenge zegt hoe."
pagination_prev: hacking/hallo
pagination_next: code/encrypted
---

# Code - Rotate

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Rotate"* onder Code.

De tekst is geroteerd, oftewel verschoven. Kun je de originele tekst terugvinden?

- **Moeilijkheid:** Moeilijk
- **Onderwerp:** Versleutelde tekst

**Wat je oefent**

- Een patroon herkennen in tekst die onleesbaar is gemaakt
- Versleutelde tekst terugzetten naar het origineel

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Elke letter is een paar plekken in het alfabet opgeschoven: schuif je drie plekken, dan wordt een A een D. Zoek in de tekst een kort woord en probeer uit hoeveel plekken je het terug moet schuiven.

</details>

<details>
<summary>Hint 2</summary>

Dit type versleuteling heet een **Caesar cipher**: elke letter is een vast aantal posities verschoven in het alfabet. De meest voorkomende variant, **ROT13**, verschuift 13 posities.

</details>

<details>
<summary>Hint 3</summary>

Probeer de verschillende rotaties (1 t/m 25). Een online tool zoals [CyberChef](https://gchq.github.io/CyberChef/) kan alle rotaties tegelijk tonen.

</details>
