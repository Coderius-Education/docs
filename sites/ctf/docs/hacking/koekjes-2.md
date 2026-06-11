---
sidebar_position: 8
title: "Hacking - Koekjes 2"
---

# Hacking - Koekjes 2

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Koekjes 2"* onder Hacking.

**Moeilijkheid:** ⭐⭐⭐ Moeilijk

## Onderwerp
**Cookies (wijzigen)**

## Beschrijving
Je kunt cookies niet alleen bekijken, maar ook **wijzigen**. Wat gebeurt er als je de waarde van een cookie aanpast?

## Wat je leert
- Hoe je cookies kunt wijzigen via de Developer Tools
- Waarom je nooit alleen op client-side cookies moet vertrouwen voor beveiliging
- Het gevaar van het opslaan van autorisatie-informatie in cookies

## Hints

<details>
<summary>Hint 1</summary>

Open de **Developer Tools** (F12) en ga naar **Application** > **Cookies**. Bekijk welke cookies de website heeft opgeslagen.

Lees meer: [Chrome DevTools - Cookies](https://developer.chrome.com/docs/devtools/application/cookies?hl=nl)

</details>

<details>
<summary>Hint 2</summary>

Je kunt op een cookie-waarde **dubbelklikken** om deze te wijzigen. Probeer de waarde aan te passen en laad de pagina opnieuw.

</details>

<details>
<summary>Hint 3</summary>

De naam van een cookie geeft vaak een aanwijzing over wat de verwachte waarde is. Experimenteer met logische waarden.

</details>
