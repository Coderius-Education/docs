---
sidebar_position: 5
title: "Forensics - Plaats delict"
description: "Bij een afbeelding hoort meer informatie dan je op het eerste gezicht ziet."
pagination_prev: forensics/niet-gevonden
pagination_next: forensics/logfile
---

# Forensics - Plaats delict

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Plaats delict"* onder Forensics.

Een afbeelding kan meer informatie bevatten dan je op het eerste gezicht ziet. Hoe kom je in de "code" van een plaatje?

- **Moeilijkheid:** Moeilijk
- **Onderwerp:** Verborgen informatie bij een afbeelding

**Wat je oefent**

- Zoeken naar informatie die bij een afbeelding hoort maar niet in beeld staat
- Verder kijken dan wat een pagina toont

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Bij een afbeelding hoort data die je niet ziet als je hem alleen bekijkt. Denk aan **metadata** en aan de **broncode** van de pagina.

</details>

<details>
<summary>Hint 2</summary>

Bekijk de paginabron: klik met de rechtermuisknop op een lege plek van de pagina en kies de optie om de paginabron te bekijken (in het Engels *View page source*), of druk op Ctrl+U. Zoek daarin naar de naam van de afbeelding: misschien staat er iets verborgen in de HTML.

</details>

<details>
<summary>Hint 3</summary>

Klik met de rechtermuisknop op de afbeelding en kies **Inspecteren** (*Inspect*): de Developer Tools tonen dan de tag `<img>` van die afbeelding. Lees al zijn attributen, zoals `alt`, `title` en `src`, ook de naam van het bestand in `src`.

</details>
