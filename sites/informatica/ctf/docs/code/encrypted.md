---
sidebar_position: 6
title: "Code - Encrypted"
description: "Een onleesbare tekst, en de vraag hoe hij onleesbaar is gemaakt."
pagination_prev: code/rotate
pagination_next: forensics/niet-gevonden
---

# Code - Encrypted

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Encrypted"* onder Code.

De data is versleuteld. Kun je de oorspronkelijke tekst terugvinden?

- **Moeilijkheid:** Moeilijk
- **Onderwerp:** Versleuteling en codering

**Wat je oefent**

- Aan een onleesbare tekst zien hoe hij onleesbaar is gemaakt
- De oorspronkelijke tekst terughalen

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Bekijk de tekst goed. Welke tekens komen erin voor, en hoe eindigt hij? Kijk ook of er aanwijzingen in de challenge staan.

</details>

<details>
<summary>Hint 2</summary>

Zo wordt tekst in CTF's vaak onleesbaar gemaakt. De eerste drie zijn coderingen, de laatste twee versleutelingen:
- **Base64** (tekst eindigt vaak op = of ==)
- **Hex** (alleen de tekens 0-9 en a-f)
- **Binair** (alleen 0 en 1)
- **Caesar/ROT** (verschoven letters)
- **Vigenere** (een ingewikkelder vervanging van letters)

</details>

<details>
<summary>Hint 3</summary>

Probeer de methodes uit in [CyberChef](https://gchq.github.io/CyberChef/). De functie **Magic** probeert zelf te ontdekken welke codering is gebruikt.

</details>
