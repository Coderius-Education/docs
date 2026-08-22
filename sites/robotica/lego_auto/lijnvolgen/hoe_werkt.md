---
sidebar_position: 2
slug: /lijnvolgen/hoe-werkt-het
title: Hoe werkt lijnvolgen?
---

# Hoe werkt lijnvolgen?

Alles staat klaar: twee sensoren die zwart en wit zien, een scherm dat meekijkt, en twee motoren in je script. De truc van lijnvolgen is één zin: **laat de motoren reageren op wat de sensoren zien.** Voordat je gaat programmeren, denk je hem zelf uit.

![voorbeelden van tegels met zwarte lijnen](@site/static/img/mogelijke_tegels.png)

## Denk eerst zelf na

De robot rijdt met de lijn **tussen** de twee sensoren. Vier situaties — wat moeten de motoren in elk geval doen?

1. **Beide sensoren zien wit** (de lijn zit er netjes tussenin).
2. **Alleen de linkersensor ziet zwart.**
3. **Alleen de rechtersensor ziet zwart.**
4. **Beide sensoren zien zwart.**

<details>
<summary>Tip</summary>

Dwaalt de robot naar links af, dan schuift de lijn onder de línkersensor. Hij moet dan terug naar rechts. Dat doe je niet met een stuur — dat heeft hij niet — maar door de twee motoren **verschillend hard** te laten draaien.

</details>

<details>
<summary>Antwoord</summary>

1. **Beide wit**: rechtdoor, beide motoren even hard vooruit.
2. **Alleen links zwart**: hij is naar links afgedwaald. De linkermotor zachter, dan draait hij terug naar rechts.
3. **Alleen rechts zwart**: precies andersom.
4. **Beide zwart**: meestal een kruising of het einde van het parcours. Wat je dan doet is een ontwerpkeuze — daarover meer in Deel 8.

</details>

Situatie 1 bouw je in [Deel 7](./deel7_rechtdoor.md). Situatie 2 en 3 zijn in [Deel 8](./nu_jij.md) aan jou.

<details>
<summary>Controlevraag</summary>

Waarom stuurt "de linkermotor zachter" de robot naar réchts?

</details>

<details>
<summary>Antwoord</summary>

Het rechterwiel legt dan meer afstand af dan het linker. Het snelle wiel draait als het ware om het langzame heen — de robot buigt af naar de kant van de langzame motor.

</details>
