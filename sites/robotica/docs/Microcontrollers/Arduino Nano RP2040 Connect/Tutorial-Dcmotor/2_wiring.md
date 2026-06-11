---
sidebar_position: 2
hide_table_of_contents: true
---

# 13.2 Aansluiten

## Schema

![circuit](@site/static/fritzing/shield_with_motors_bb.png)

:::danger Pinnen D2, D3, D4 en D11 zijn bezet door het motor shield

Deze pinnen worden door het motor shield gebruikt om de motoren aan te sturen. Sluit hier **geen** andere sensoren of actuatoren op aan. Gebruik andere vrije pinnen voor je overige onderdelen.

:::

## Motor aansluiten op de schroefterminals

<details>
<summary>Hoe sluit ik een motor aan op het shield?</summary>

Elke motor heeft twee draden die in de **schroefterminals** van het motor shield gaan:

1. Pak een schroevendraaier.
2. Draai de kleine schroef op de terminal **los** (niet helemaal eruit!).
3. Steek de draad van de motor in het gaatje (rood bij `+`, zwart bij `-`).
4. Draai de schroef weer **vast** zodat de draad goed klemt.
5. Trek voorzichtig aan de draad om te checken of hij goed vastzit.

</details>

<details>
<summary>Vergeet de schakelaar niet</summary>

Op het motor shield zit een **zwarte schakelaar**. Die moet op **ON** staan, anders krijgen de motoren geen stroom.

**Tip:** zet de schakelaar op **OFF** terwijl je aan het programmeren bent. Dan kan de robot niet onverwacht wegrijden.

</details>

<details>
<summary>Controlevraag</summary>

Welke pinnen op de Nano kun je niet meer voor sensoren gebruiken zodra het motor shield erop zit?

</details>

<details>
<summary>Antwoord</summary>

**D2, D3, D4** en **D11**. Die zijn permanent bezet door het motor shield.

</details>
