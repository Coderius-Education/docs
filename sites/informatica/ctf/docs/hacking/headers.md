---
sidebar_position: 7
title: "Hacking - Headers"
description: "Je browser en een server sturen elkaar meer dan je op het scherm ziet."
pagination_prev: hacking/koekjes-1
pagination_next: code/obfuscated
---

# Hacking - Headers

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Headers"* onder Hacking.

Elke keer dat je browser een pagina opvraagt, sturen browser en server HTTP-headers mee: extra informatie over het verzoek en het antwoord.

- **Moeilijkheid:** Gemiddeld
- **Onderwerp:** HTTP-headers

**Wat je oefent**

- Het verkeer tussen je browser en een server bekijken
- HTTP-headers opzoeken en lezen

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Bij elk verzoek verstuurt je browser achter de schermen meer informatie dan je ziet. Open de **Developer Tools** (F12) en zoek waar je netwerkverkeer kunt bekijken.

</details>

<details>
<summary>Hint 2</summary>

Laad de pagina opnieuw terwijl **Network** in de Developer Tools open staat. Klik op een verzoek en bekijk de details: wat er is verzonden en wat er is teruggestuurd.

</details>

<details>
<summary>Hint 3</summary>

Bekijk de **response headers** goed. Naast de standaard headers kan de server ook eigen headers meesturen, met extra informatie.

</details>
