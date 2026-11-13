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

- Herkennen in welke programmeertaal code geschreven is
- Code uitvoeren zonder iets te installeren

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Kopieer de code en plak hem in een omgeving die de taal van de code kan uitvoeren. In welke taal is de code geschreven?

</details>

<details>
<summary>Hint 2</summary>

Bepaal eerst de programmeertaal. Daarna weet je waar je de code uitvoert:
- **Python**: de editor op het tabblad Probeer het hier
- **JavaScript**: de browserconsole (F12 > Console)

</details>

<details>
<summary>Hint 3</summary>

Voer de code uit en bekijk de uitvoer. Daar zou de flag in moeten staan.

</details>

## Probeer het hier

Is de code Python? Plak hem dan in de editor hieronder en klik op Uitvoeren. Je hoeft niets te installeren.

<InlineEditor
  runner="python"
  title="Python-editor"
  code={'# Plak hier de code van de challenge\n'}
  persistKey="ctf-plakken"
/>
