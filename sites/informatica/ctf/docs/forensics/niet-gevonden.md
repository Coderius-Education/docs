---
sidebar_position: 4
title: "Forensics - Niet gevonden"
description: "Je downloadt een bestand dat niet wil openen, en zoekt uit waarom."
pagination_prev: code/encrypted
pagination_next: forensics/plaats-delict
---

# Forensics - Niet gevonden

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Niet gevonden"* onder Forensics.

Je downloadt een bestand, maar het lijkt niet te openen. Wat is er mis mee?

- **Moeilijkheid:** Moeilijk
- **Onderwerp:** Bestandstypes

**Wat je oefent**

- Uitzoeken waarom een bestand niet opent
- Achterhalen wat voor bestand je echt voor je hebt

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Download het bestand en bekijk de naam. De **extensie** is niet altijd wat hij lijkt.

</details>

<details>
<summary>Hint 2</summary>

Een extensie is alleen een label: hij bepaalt niet wat voor bestand het echt is. Verander de extensie in die van andere veelvoorkomende bestandstypes en open het bestand opnieuw.

</details>

<details>
<summary>Hint 3</summary>

Je kunt het echte type ook aflezen aan de eerste bytes van het bestand, de **magic bytes** of file signature. Open het bestand daarvoor in een hex-editor (zie de [Toolbox](site:ctf/toolbox)).

</details>
