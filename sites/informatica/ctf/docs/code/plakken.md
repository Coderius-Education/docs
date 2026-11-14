---
sidebar_position: 1
title: "Code - Plakken"
description: "Je krijgt een stuk code, en de flag verschijnt pas als je die code uitvoert."
pagination_prev: hacking/robots
pagination_next: code/broncode
---

import InlineEditor from '@coderius/editor/InlineEditor';

# Code - Plakken

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Plakken"* onder Code.

Je krijgt een stuk code te zien. Voer de code uit om de flag te vinden.

- **Moeilijkheid:** Makkelijk
- **Onderwerp:** Code uitvoeren

**Wat je oefent**

- Code van een ander draaien zonder hem helemaal te begrijpen

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Je hoeft de code niet te begrijpen, wel te weten in welke **programmeertaal** hij is geschreven. Kijk naar de woorden: `print(` wijst op Python, `console.log(` op JavaScript.

</details>

<details>
<summary>Hint 2</summary>

Elke taal heeft zijn eigen plek om code uit te voeren:
- Python: de editor op het tabblad Probeer het hier
- JavaScript: de **browserconsole** (F12 > Console)

</details>

<details>
<summary>Hint 3</summary>

Kopieer de hele code, van de eerste tot de laatste regel, en plak hem in één keer. Krijg je een foutmelding, kijk dan of de inspringing is meegekomen: in Python telt die mee. De flag staat in de uitvoer.

</details>

## Probeer het hier

Is de code Python? Plak hem dan in de editor hieronder en klik op Uitvoeren. Je hoeft niets te installeren.

<InlineEditor
  runner="python"
  title="Python-editor"
  code={'# Plak hier de code van de challenge\n'}
  persistKey="ctf-plakken"
/>
