---
sidebar_position: 4
title: "Forensics - Niet gevonden"
---

# Forensics - Niet gevonden

> **[Open deze challenge op ctf.hackchallenges.nl](https://ctf.hackchallenges.nl/)** - zoek naar *"Niet gevonden"* onder Forensics.

**Moeilijkheid:** ⭐⭐⭐ Moeilijk

## Onderwerp
**Bestandstypes**

## Beschrijving
Je downloadt een bestand, maar het lijkt niet te openen. Misschien is de bestandsextensie niet correct?

## Wat je leert
- Dat bestandsextensies slechts een label zijn en niet het werkelijke bestandstype bepalen
- Hoe je het werkelijke type van een bestand kunt achterhalen
- Wat magic bytes / file signatures zijn

## Hints

<details>
<summary>Hint 1</summary>

Download het bestand en bekijk het. Wat klopt er niet? De extensie is niet altijd wat het lijkt.

</details>

<details>
<summary>Hint 2</summary>

Een bestandsextensie is slechts een label — het bepaalt niet het werkelijke type. Probeer de extensie te veranderen naar andere veelvoorkomende types en open het bestand opnieuw.

</details>

<details>
<summary>Hint 3</summary>

Je kunt ook de eerste bytes van een bestand bekijken (de "magic bytes" of "file signature") om te bepalen welk type bestand het is. Een hex editor kan hierbij helpen.

</details>
