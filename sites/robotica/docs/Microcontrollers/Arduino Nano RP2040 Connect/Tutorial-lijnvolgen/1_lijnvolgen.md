---
sidebar_position: 1
hide_table_of_contents: true
---

# 12.1 Hoe werkt lijnvolgen?

Nu wordt het leuk. Je hebt twee IR-sensoren en twee motoren. De truc: laat de motoren reageren op wat de sensoren zien. Je gaat de tegels zien die hieronder staan.

![lijnvolgen](@site/static/img/mogelijke_tegels.png)

## Denk eerst zelf na

1. **Beide sensoren zien wit** (lijn zit tussen de sensoren in). Wat moeten de motoren doen?
2. **Alleen de linkersensor ziet zwart**. Welke motor moet bijsturen?
3. **Alleen de rechtersensor ziet zwart**. En nu?
4. **Beide sensoren zien zwart**. Wat betekent dat?

<details>
<summary>Tip</summary>

Stel je voor dat de robot tussen twee witte rails rijdt. Als hij naar links afdwaalt, ziet de linkersensor de lijn. Hij moet dus terug naar rechts. Dat doe je door de **rechter** motor harder te laten draaien dan de linker.

</details>

<details>
<summary>Antwoord</summary>

1. **Beide wit**: rechtdoor. Allebei de motoren even hard vooruit.
2. **Alleen links zwart**: de robot is naar links afgedwaald. Stuur naar rechts: rechter motor harder, linker motor zachter (of stil).
3. **Alleen rechts zwart**: omgekeerd. Linker motor harder, rechter motor zachter.
4. **Beide zwart**: meestal een **kruising** of het einde van het parcours. Wat je dan doet is een keuze: rechtdoor, stoppen of een kant op draaien.

</details>
