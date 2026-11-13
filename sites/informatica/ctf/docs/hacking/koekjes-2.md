---
sidebar_position: 8
title: "Hacking - Koekjes 2"
description: "Een cookie kun je niet alleen bekijken: je kunt de waarde ook veranderen."
pagination_prev: code/obfuscated
pagination_next: hacking/hallo
---

# Hacking - Koekjes 2

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Koekjes 2"* onder Hacking.

Je kunt cookies niet alleen bekijken, maar ook **wijzigen**. Wat gebeurt er als je de waarde van een cookie aanpast?

- **Moeilijkheid:** Moeilijk
- **Onderwerp:** Cookies wijzigen

**Wat je oefent**

- De waarde van een cookie veranderen in je browser
- Zien waarom een website niet mag vertrouwen op wat er in een cookie staat

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Open de **Developer Tools** (F12) en zoek de cookies van de website op: onder **Application** > Cookies (Chrome) of **Storage** > Cookies (Firefox).

Lees meer: [Chrome DevTools - Cookies](https://developer.chrome.com/docs/devtools/application/cookies?hl=nl)

</details>

<details>
<summary>Hint 2</summary>

Dubbelklik op de waarde van een cookie om hem te wijzigen. Pas de waarde aan en laad de pagina opnieuw.

</details>

<details>
<summary>Hint 3</summary>

De naam van een cookie geeft vaak een aanwijzing over de waarde die de website verwacht. Experimenteer met logische waarden.

</details>
