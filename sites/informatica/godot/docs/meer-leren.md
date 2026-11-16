---
sidebar_position: 91
slug: /meer-leren
les_tabs: false
---

# Wat nu?

Je hebt je eerste 2D-game gemaakt. Hier zijn de beste vervolgstappen, van makkelijk naar uitdagender. Kies wat jou aanspreekt — je hoeft ze niet allemaal te doen.

## Zelf een nieuwe node ontdekken

De cursus gebruikt zo'n twintig soorten nodes. Godot heeft er honderden, en de meeste vind je zonder tutorial:

1. Klik in het Scene-paneel op het plusje (Add Child Node) en typ in het zoekveld wat je zoekt, in het Engels: `light`, `sound`, `path`, `particles`.
2. Klik een node in de lijst aan. Onderaan het venster staat in een paar zinnen wat hij doet.
3. Wil je meer weten, druk dan op F1 en zoek de naam op. De documentatie zegt wat de node doet en welke eigenschappen hij heeft in de Inspector.
4. Probeer de node eerst uit in een lege testscène. Pas als hij doet wat je wilt, zet je hem in je level.

Bij een platformer passen bijvoorbeeld `PointLight2D` (een lamp), `AudioStreamPlayer2D` (geluid dat zachter klinkt als je verder weg loopt), `GPUParticles2D` (stof of vonken) en `Path2D` met `PathFollow2D` (een platform dat heen en weer beweegt).

## Godot for Beginners — deel 2

Een tutorial op YouTube die een platformer bouwt met een camera die de speler volgt, objecten om te verzamelen, een puntentelling en meerdere levels. Die onderwerpen ken je uit deze cursus. Hier zie je hoe een ander ze aanpakt, en dat is een goede manier om te merken wat je al begrijpt.

[Bekijk de tutorial op YouTube](https://www.youtube.com/watch?v=zL__a0Ei6Vs)

## Showcase: wat is er mogelijk met Godot?

Voordat je verder leert: kijk wat anderen met Godot hebben gemaakt. Van kleine indie-games tot grote titels.

[Bekijk de Godot Showcase](https://godotengine.org/showcase/)

## Pixel art maken

Je kunt zelf sprites tekenen voor je game, zonder papier. Er zijn gratis tools die rechtstreeks in je browser werken — handig voor karakters, muntjes, vijanden en achtergronden.

- [Piskel](https://www.piskelapp.com/) — gratis, werkt in de browser, exporteert als PNG
- [Pixilart](https://www.pixilart.com/) — iets uitgebreider, ook gratis

Sla je afbeelding op als PNG en kopieer hem naar je Godot-projectmap. Hoe je van losse plaatjes een animatie maakt, staat in [Je eigen animaties maken](site:godot/docs/eigen_animaties).

## Versiebeheer met git

Een Godot-project is een map vol tekstbestanden — scenes, scripts, instellingen. Eén verkeerde wijziging en je spel doet het niet meer, zonder dat je weet wat er anders is. Met git sla je elke werkende versie op en kun je altijd terug.

Wat je leert:

- Elke werkende versie vastleggen als commit
- Zien wat er precies veranderd is sinds de vorige versie
- Je project online zetten op GitHub

De leerlijn begint in een simulator waarin je niets kapot kunt maken: [Git basis](site:editor/git/basis).

## Tegenstanders laten volgen

Je vijand staat nu stil. Wat als hij je karakter achterna loopt? Godot heeft daarvoor een ingebouwde oplossing: `NavigationAgent2D`.

Wat je leert:

- Een navigatiemesh instellen
- De vijand een pad laten berekenen naar de speler
- Hoe je dit combineert met signals

[Navigatie in Godot (officiële documentatie)](https://docs.godotengine.org/en/stable/tutorials/navigation/navigation_introduction_2d.html)

## Het YouTube-kanaal van Godot

Op het officiële kanaal van Godot staan video's over de basisbegrippen: scènes, nodes, signals en resources. Een goede stap als je wat je tot nu toe hebt geleerd nog beter wilt begrijpen.

[Godot officieel YouTube-kanaal](https://www.youtube.com/@GodotEngineOfficial)
