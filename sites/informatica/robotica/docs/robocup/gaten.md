---
sidebar_position: 4
description: Op een gat in de lijn rijdt je robot rechtdoor tot hij de lijn terugvindt; zo onderscheid je een gat van een bocht.
---

# Gaten in de lijn

Op sommige tegels houdt de lijn even op en gaat hij verderop door: een **gat**.
Je robot moet dan rechtdoor rijden tot hij de lijn weer ziet. Kom je aan de
overkant, dan krijg je 5 punten.

## Wat de spelregels zeggen

- Een gat is nooit langer dan **20 cm**.
- Voor en na een gat ligt op de tegel minstens **5 cm** lijn.
- Na een gat gaat de lijn rechtdoor verder. Je hoeft dus niet te zoeken.

## Het probleem

Een lijnvolger die beide sensoren wit ziet, rijdt rechtdoor. Dat lijkt precies
goed voor een gat. Maar je robot ziet ook allebei wit als hij in een bocht de
lijn kwijt is, en dan moet hij juist terugzoeken.

<details>
<summary>Denk eerst zelf na: hoe weet je robot of het een gat is of een bocht?</summary>

Kijk naar wat er vlak daarvoor gebeurde. Zag een van de sensoren net nog zwart,
dan is de robot van de lijn afgedwaald in een bocht. Zagen beide sensoren al een
tijdje wit terwijl de robot recht reed, dan is het een gat.

</details>

## Een aanpak

1. Houd bij hoe lang beide sensoren al wit zien, bijvoorbeeld met een teller die
   in elke ronde van je `while`-lus één omhoog gaat.
2. Rijd zolang rechtdoor op dezelfde snelheid.
3. Ziet een sensor weer zwart, zet de teller dan op 0 en volg de lijn weer.
4. Loopt de teller te ver op, dan is er geen gat meer: je robot is de lijn echt
   kwijt. Stop, of draai terug.

Hoe ver "te ver" is, meet je zelf: hoeveel rondes van je lus rijdt de robot over
20 cm?

## Er gaat iets mis

**De robot draait na een gat de verkeerde kant op.** Vlak voor het gat zag één
sensor nog zwart, en je code stuurde bij. Rijd na een gat eerst een stukje
rechtdoor voordat je weer bijstuurt.

**De robot rijdt in een scherpe bocht rechtdoor de tegel af.** Je teller denkt
dat het een gat is. Kijk of de robot in een bocht een sensor op zwart ziet
voordat hij de lijn kwijt is, en zet de teller alleen aan als hij recht reed.

Door naar [Drempels en troep](site:robotica/docs/robocup/drempels).
