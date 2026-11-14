---
sidebar_position: 2
title: "Hacking - Eentje erbij"
description: "De oplossing is hier simpeler dan je denkt: je hebt alleen je browser nodig."
pagination_prev: hacking/standaard
pagination_next: hacking/robots
---

# Hacking - Eentje erbij

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Eentje erbij"* onder Hacking.

Soms is de oplossing simpeler dan je denkt. Voor deze challenge heb je alleen je browser nodig.

- **Moeilijkheid:** Makkelijk
- **Onderwerp:** Gegevens opvragen bij een website

**Wat je oefent**

- Goed kijken naar alles wat je browser laat zien
- Uitproberen wat een website doet als je iets verandert
- Zien waarom een server moet controleren wat een bezoeker opvraagt

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Bekijk de **URL** in de adresbalk goed. Valt je iets op aan de structuur?

</details>

<details>
<summary>Hint 2</summary>

Probeer een waarde in de URL te veranderen. Wat gebeurt er als je een getal of **parameter** aanpast?

</details>

<details>
<summary>Hint 3</summary>

Verander alleen het getal in de URL en laat de rest staan. Kom je zo bij gegevens die niet voor jou bedoeld zijn, dan heet dat **IDOR** (Insecure Direct Object Reference): een veelvoorkomende kwetsbaarheid.

</details>
