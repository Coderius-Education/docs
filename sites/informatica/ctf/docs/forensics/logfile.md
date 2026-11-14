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
- In veel regels de paar vinden die ertoe doen

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Elke regel in het logbestand is één verzoek aan de webserver. Zoek in een regel het getal van drie cijfers: dat is de statuscode, en die zegt hoe het verzoek afliep.

</details>

<details>
<summary>Hint 2</summary>

De codes vallen in groepen: 1xx (informatie), 2xx (gelukt), 3xx (doorverwezen), 4xx (fout van de client) en 5xx (fout van de server). Wat elke code betekent, staat bij [W3Schools HTTP Messages](https://www.w3schools.com/tags/ref_httpmessages.asp).

</details>

<details>
<summary>Hint 3</summary>

Zoek de codes die maar één of twee keer in het logbestand staan, en lees die regels helemaal: ook de tijd en het pad dat werd opgevraagd. Zoek de betekenis van zo'n zeldzame code op.

</details>
