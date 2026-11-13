---
sidebar_position: 6
title: "Forensics - Logfile"
description: "Je leest het logbestand van een webserver en zoekt uit wat de statuscodes betekenen."
pagination_prev: forensics/plaats-delict
pagination_next: hacking/dubbel
---

# Forensics - Logfile

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Logfile"* onder Forensics.

Je krijgt een logbestand te zien. Wat betekenen de verschillende HTTP-statuscodes die je tegenkomt?

- **Moeilijkheid:** Expert
- **Onderwerp:** HTTP-statuscodes

**Wat je oefent**

- Het logbestand van een webserver lezen
- Opzoeken wat een HTTP-statuscode betekent

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Een HTTP-statuscode zegt wat er gebeurde bij een verzoek aan een webserver. Elke code heeft een eigen betekenis. Zoek op internet naar een overzicht.

</details>

<details>
<summary>Hint 2</summary>

De codes vallen in groepen: 1xx (informatie), 2xx (gelukt), 3xx (doorverwezen), 4xx (fout van de client) en 5xx (fout van de server). Wat elke code betekent, staat bij [W3Schools HTTP Messages](https://www.w3schools.com/tags/ref_httpmessages.asp).

</details>

<details>
<summary>Hint 3</summary>

Welke codes vallen op in het logbestand? Zoek naar ongebruikelijke codes of naar een patroon.

</details>
