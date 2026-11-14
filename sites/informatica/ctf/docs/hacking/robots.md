---
sidebar_position: 3
title: "Hacking - Robots"
description: "Een website vertelt zoekmachines waar ze niet mogen kijken, en jij leest mee."
pagination_prev: hacking/eentje-erbij
pagination_next: code/plakken
---

# Hacking - Robots

## De challenge

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Robots"* onder Hacking.

Websites gebruiken een speciaal bestand om zoekmachines te vertellen welke pagina's ze wel en niet mogen indexeren. Dit bestand is publiek toegankelijk.

- **Moeilijkheid:** Makkelijk
- **Onderwerp:** Zoekmachines en websites

**Wat je oefent**

- Uitzoeken hoe zoekmachines een website lezen
- Zien wat een website over zichzelf verraadt

Probeer het eerst zelf. Loop je vast, dan staan er op het tabblad Hints drie hints: open ze een voor een.

## Hints

<details>
<summary>Hint 1</summary>

Dat bestand heeft op elke website dezelfde naam en staat direct achter de basis-URL, dus niet in een submap. Zoek op internet hoe het heet.

</details>

<details>
<summary>Hint 2</summary>

Het bestand heet **robots.txt**. Open het door die naam achter de basis-URL van de website te plaatsen.

</details>

<details>
<summary>Hint 3</summary>

Bekijk de regels in het bestand goed. Een **Disallow**-regel verwijst naar een pad dat "verborgen" moet blijven, maar in je browser kun je er zo naartoe.

</details>
