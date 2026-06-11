# Licenties

Deze repository combineert eigen materiaal met een afgeleide bewerking
van extern materiaal. Daarom gelden twee verschillende Creative Commons-
licenties — afhankelijk van de map.

## Standaard: CC BY-NC 4.0

Tenzij anders vermeld, is al het materiaal in deze repository
gelicenseerd onder
[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

**Je mag**:

- **Delen** — het materiaal kopiëren en herverspreiden in elke vorm.
- **Aanpassen** — bewerken, transformeren en erop voortbouwen.

**Onder de volgende voorwaarden**:

- **Naamsvermelding** — geef de bron correct vermeld, geef een link
  naar de licentie, en geef aan welke wijzigingen je hebt gemaakt.
- **Niet-commercieel** — gebruik het materiaal **niet** voor
  commerciële doeleinden.

Hieronder vallen onder andere de tracks:

- `docs/lineair-zoeken/`
- `docs/vind-maximum/`
- `docs/max-en-min/`
- `docs/binair-zoeken/`
- `docs/selection-sort/`
- `docs/bubble-sort/`
- `docs/big-o/`
- `docs/dijkstra/`
- alle source code in `src/` en de site-configuratie

## Uitzondering: `docs/minimax/` — CC BY-NC-SA 4.0

De track in [`docs/minimax/`](docs/minimax/) is een **afgeleide
bewerking** van [CS50 AI Project 0: Tic-Tac-Toe](https://cs50.harvard.edu/ai/projects/0/tictactoe/)
van Harvard University. Het CS50-origineel is gelicenseerd onder
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).

Conform de **ShareAlike**-eis wordt deze track onder **dezelfde
licentie** verspreid:
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Bronvermelding

> *"Based on CS50 AI Project 0: Tic-Tac-Toe by Harvard University,
> available at https://cs50.harvard.edu/ai/projects/0/tictactoe/,
> licensed under CC BY-NC-SA 4.0."*

### Wijzigingen

- Volledige vertaling van het Engels naar het Nederlands.
- Restructurering in 15 PRIMM-stappen (concept → pen-en-papier →
  bouwstenen → tests → fouten → cheatsheet).
- Toegevoegde conceptuele uitleg over game trees, MIN/MAX-spelers en
  recursie.
- Inline assertion-tests per functie, draaiend in een browser-Pyodide
  PyRunner.
- Geen wijzigingen aan de **specificaties** van de 8 te implementeren
  functies (`initial_state`, `player`, `actions`, `result`, `winner`,
  `terminal`, `utility`, `minimax`); deze zijn één-op-één overgenomen
  uit het CS50-project.

### Implicaties

Als jij op je beurt deze minimax-track herverspreid of erop voortbouwt,
moet die afgeleide eveneens onder
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
worden uitgebracht. ShareAlike is overdraagbaar.

## Uitzondering: `docs/cfg/` — CC BY-NC-SA 4.0

De track in [`docs/cfg/`](docs/cfg/) is een **afgeleide bewerking** van
[CS50 AI Project 6: Parser](https://cs50.harvard.edu/ai/projects/6/parser/)
van Harvard University. Het CS50-origineel is gelicenseerd onder
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).

Conform de **ShareAlike**-eis wordt deze track onder **dezelfde
licentie** verspreid:
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Bronvermelding

> *"Based on CS50 AI Project 6: Parser by Harvard University,
> available at https://cs50.harvard.edu/ai/projects/6/parser/,
> licensed under CC BY-NC-SA 4.0."*

### Wijzigingen

- Volledige vertaling van het Engels naar het Nederlands.
- Restructurering in PRIMM-stappen (concept → stellingen → zin-voor-zin
  bouwen → compleet → aanpassen → zelf-bouwen → fouten → cheatsheet).
- De **NLTK-parser** uit het origineel is vervangen door een eigen,
  compacte pure-Python parser-motor die zonder installatie in de browser
  draait (Pyodide); de woordenlijst (lexicon) is overgenomen uit het
  CS50-materiaal.
- Bewust **geen oplossings-grammatica gepubliceerd**: de leerling
  ontwerpt de regels zelf. Dit respecteert CS50's academic-honesty-beleid.

### Implicaties

Als jij op je beurt deze CFG-track herverspreid of erop voortbouwt, moet
die afgeleide eveneens onder
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
worden uitgebracht. ShareAlike is overdraagbaar.

## Verantwoording

Het gebruik van CS50-materiaal is een bewuste pedagogische keuze: de
minimax-functies geven een prachtige opbouw van compositie en recursie,
en de parser-opdracht laat leerlingen een context-vrije grammatica zélf
ontwerpen en testen. We respecteren de licentievoorwaarden van Harvard
volledig.
