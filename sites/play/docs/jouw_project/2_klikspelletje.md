---
sidebar_position: 2
---

# Klikspelletje

Een compleet ander genre dan pong: een spel waarbij de gebruiker zo snel mogelijk op een bal moet klikken!

## Stap 1: De bal

Maak een cirkel die als doelwit dient. Kies zelf een kleur en grootte.

<details>
<summary>Klik hier voor een tip!</summary>

Gebruik `play.new_circle()` met een `radius` en `color` naar keuze.

</details>

## Stap 2: De bal laten verspringen

De bal moet elke seconde naar een willekeurige plek op het scherm springen. Hiervoor heb je twee dingen nodig:
- `play.random_number()` om willekeurige getallen te maken (of `play.random_position()` voor een willekeurige positie op het scherm)
- `async` en `await play.timer()` om te wachten (zie [5.2 Wachten met async en await](/docs/tijd/async))

<details>
<summary>Klik hier voor een tip!</summary>

Gebruik `@play.repeat_forever` met een `async` functie. Met `play.random_number(-400, 400)` krijg je een willekeurig getal voor de x-positie.

</details>

## Stap 3: Score bijhouden

Gebruik `@bal.when_clicked` om te detecteren of de speler op de bal klikt. Houd een score bij en toon die op het scherm.

<details>
<summary>Klik hier voor een tip!</summary>

Je hebt `global` nodig om de score binnen een functie te veranderen. Kijk bij [4.5 Een score bijhouden](/docs/gebeurtenissen/score_bijhouden) als je niet meer weet hoe dat werkt.

</details>

## Stap 4: Testen en finetunen

Draai je spel en stel de snelheid af. Verspringt de bal te snel of te langzaam? Pas de timer aan. Is de bal te groot of te klein? Pas de radius aan.

:::tip
Als je `hide()` gebruikt om een bal te verbergen, onthoud dan dat **de fysica ook op pauze gaat**. Een verborgen bal kan niet geraakt worden. Gebruik `show()` om de bal weer zichtbaar én klikbaar te maken.
:::

## Mogelijke uitbreidingen
- **Timer**: voeg een aftellende timer toe. Hoeveel punten haal je in 30 seconden?
- **Sneller worden**: laat de bal steeds sneller verspringen naarmate je meer punten hebt.
- **Kleiner worden**: maak de bal kleiner bij elke klik, zodat het steeds moeilijker wordt.
- **Meerdere ballen**: voeg extra ballen toe die ook punten opleveren.
- **Foute ballen**: voeg rode ballen toe die punten aftrekken als je erop klikt.
- **High score opslaan**: gebruik de [database](/docs/database/basis) om de hoogste score te bewaren.
- **Geluidssignaal**: verander de kleur van de bal als je erop klikt, zodat je feedback krijgt.
- **Levels**: na elke 10 punten wordt het spel moeilijker (sneller, kleinere bal, meer foute ballen).
- **Combo-systeem**: geef extra punten als je meerdere keren snel achter elkaar klikt.
